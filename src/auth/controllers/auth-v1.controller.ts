// Types
import { TUserJwtPayload } from '@/auth/types/auth.type'

// Services
import { AppJwtService } from '@/app/services/app-jwt.service'
import { EAppJwtServiceSignType } from '@/app/services/app-jwt.service.type'

// Express
import { Request, Response } from 'express'

// Express Validator
import { body } from 'express-validator'

// Responses
import { SuccessOk, SuccessCreated } from '@/app/utils/success.util'

// Bcrypt
import bcrypt from 'bcryptjs'

// Errors
import { ErrorBadRequest } from '@/app/errors'

// Lodash
import omit from 'lodash.omit'

// Prisma
import {
	CompanyApprovalStatusType,
	CompanyUser,
	PrismaClient,
	RoleType
} from '@prisma/client'

// Init Prisma
const prisma = new PrismaClient()

// Services
const appJwtService = new AppJwtService()

export class AuthControllerV1 {
	/**
	 * @description Register a new user
	 *
	 */
	register = {
		validateInput: [
			body('user.name').not().isEmpty().withMessage('Name is required'),
			body('user.email').isEmail().withMessage('Email must be valid'),
			body('user.password')
				.isLength({ min: 8 })
				.withMessage('Password minimal length must 8'),
			body('company.name')
				.not()
				.isEmpty()
				.withMessage('Company name is required'),
			body('company.phoneNumber')
				.not()
				.isEmpty()
				.withMessage('Company phone number is required'),
			body('company.capacity')
				.not()
				.isEmpty()
				.withMessage('Company capacity is required'),
			body('company.city')
				.not()
				.isEmpty()
				.withMessage('Company city is required')
		],
		config: async (req: Request, res: Response) => {
			const {
				user: { name, password },
				company: { name: companyName, phoneNumber, capacity, city }
			} = req.body
			let {
				user: { email }
			} = req.body

			email = email.replace(/\s+/, '').trim().toLowerCase()

			// Check if user exists before
			const existedUser = await prisma.user.findFirst({
				where: { email }
			})
			if (existedUser) throw new ErrorBadRequest('Email currently in used')

			// Check if company exists
			const companyDetail = await prisma.company.findFirst({
				where: {
					name: {
						contains: companyName.toLowerCase().trim(),
						mode: 'insensitive'
					}
				}
			})

			if (companyDetail)
				throw new ErrorBadRequest(
					`${companyName} is already registered in our system, please use different company name`
				)

			// Hash password
			const salt = await bcrypt.genSalt(10)
			const hashedPassword = await bcrypt.hash(password, salt)

			/**
			 * @description Create user with company, and also approval
			 *
			 */
			const registerUserWithCompany = () => {
				return prisma.$transaction(async transaction => {
					const user = await transaction.user.create({
						data: {
							name,
							email,
							password: hashedPassword,
							role: RoleType.Public
						}
					})

					const company = await transaction.company.create({
						data: {
							name: companyName,
							phoneNumber,
							capacity,
							city,
							code: `C-${companyName}`,
							email,
							status: CompanyApprovalStatusType.Pending,
							requestorId: user.id
						}
					})

					const companyApproval = await transaction.companyApprovalLogs.create({
						data: {
							status: CompanyApprovalStatusType.Pending,
							companyId: company.id,
							createdById: user.id
						}
					})

					return {
						user: omit(user, ['password']),
						company,
						companyApproval
					}
				})
			}

			const registerUserWithCompanyResponse = await registerUserWithCompany()

			const { code, ...restResponse } = SuccessCreated({
				message: 'You successfully registered',
				result: omit(registerUserWithCompanyResponse, ['user.password'])
			})
			return res.status(code).json(restResponse)
		}
	}

	/**
	 * @description Log user in
	 *
	 */
	login = {
		validateInput: [
			body('email').isEmail().withMessage('Email must be valid'),
			body('password').not().isEmpty().withMessage('Password is required'),
			body('companyId').not().isEmpty().withMessage('Company is required')
		],
		config: async (req: Request, res: Response) => {
			const { email, password, companyId } = req.body

			// Find correct user
			const user = await prisma.user.findFirst({
				where: { email },
				include: { companyUsers: true }
			})
			if (!user) throw new ErrorBadRequest('Invalid credentials')

			// Verify user password
			const isPasswordCorrect = await bcrypt.compare(password, user.password)
			if (!isPasswordCorrect) throw new ErrorBadRequest('Invalid credentials')

			// Check if users have company
			if (user.companyUsers.length === 0)
				throw new ErrorBadRequest(
					`You not registered to company, please contact your HR!`
				)

			// Update specific user company
			await prisma.$transaction(async db => {
				const selectedCompany = user.companyUsers.find(
					companyUser =>
						companyUser.companyId === companyId &&
						companyUser.userId === user.id
				)
				const unSelectedCompany = user.companyUsers.filter(
					companyUser =>
						companyUser.companyId !== companyId &&
						companyUser.userId === user.id
				) as CompanyUser[]

				// Check if company not exists
				if (!selectedCompany)
					throw new ErrorBadRequest('You not registered to that company!')

				// Make selected company to be active
				if (selectedCompany) {
					await db.companyUser.update({
						where: { id: selectedCompany.id },
						data: {
							isActive: true
						}
					})
				}

				// Make unselected company to be inactive
				if (unSelectedCompany.length > 0) {
					await db.companyUser.updateMany({
						where: {
							id: { in: unSelectedCompany.map(companyUser => companyUser.id) }
						},
						data: { isActive: false }
					})
				}
			})

			// Generate JWT token
			const jwtPayload = { id: user.id }
			const token = appJwtService.generateToken(
				jwtPayload,
				EAppJwtServiceSignType.LOGIN
			)
			const refreshToken = appJwtService.generateToken(
				jwtPayload,
				EAppJwtServiceSignType.REFRESH_TOKEN
			)

			const { code, ...restResponse } = SuccessOk({
				result: { token, refreshToken }
			})
			return res.status(code).json(restResponse)
		}
	}

	/**
	 * @description Refresh token
	 *
	 */
	refreshToken = {
		validateInput: [
			body('refreshToken')
				.not()
				.isEmpty()
				.withMessage('Refresh Token is required')
		],
		config: async (req: Request, res: Response) => {
			const { refreshToken } = req.body

			// Verify the refresh token
			const user = (await appJwtService.verify(
				refreshToken,
				EAppJwtServiceSignType.REFRESH_TOKEN
			)) as TUserJwtPayload

			// Generate token again
			const jwtPayload = { id: user.id, email: user.email }
			const token = appJwtService.generateToken(
				jwtPayload,
				EAppJwtServiceSignType.LOGIN
			)
			const newRefreshToken = appJwtService.generateToken(
				jwtPayload,
				EAppJwtServiceSignType.REFRESH_TOKEN
			)

			const { code, ...restResponse } = SuccessOk({
				result: { token, refreshToken: newRefreshToken }
			})
			return res.status(code).json(restResponse)
		}
	}

	/**
	 * @description Forgot password
	 *
	 * @param {Request} req
	 * @param {Response} res
	 *
	 */
	me = async (req: Request, res: Response) => {
		// Find current user
		const user = await prisma.user.findFirst({
			where: { id: req.currentUser?.id as string },
			include: {
				companyUsers: {
					select: {
						id: true,
						workType: true,
						workingHour: true,
						phoneNumber: true,
						address: true,
						isPic: true,
						isActive: true,
						position: {
							select: {
								id: true,
								name: true
							}
						},
						company: {
							select: {
								id: true,
								name: true
							}
						},
						companyUserControls: {
							select: {
								companyUser: {
									select: {
										id: true,
										position: {
											select: {
												id: true,
												name: true
											}
										},
										user: {
											select: {
												id: true,
												name: true
											}
										}
									}
								}
							}
						},
						companyPersonInCharges: {
							select: {
								companyUserPersonInCharge: {
									select: {
										id: true,
										position: {
											select: {
												id: true,
												name: true
											}
										},
										user: {
											select: {
												id: true,
												name: true
											}
										}
									}
								}
							}
						}
					}
				}
			}
		})

		const { code, ...restResponse } = SuccessOk({
			result: omit(user, ['password'])
		})
		return res.status(code).json(restResponse)
	}

	/**
	 * @description Get company users
	 *
	 */
	companyUsers = async (req: Request, res: Response) => {
		const { email } = req.query

		if (!email) throw new ErrorBadRequest('Email is required')

		const userCompanies = (
			await prisma.companyUser.findMany({
				where: { user: { email: email as unknown as string } },
				include: { company: true }
			})
		).map(({ company: { id, name, code } }) => ({
			id,
			name,
			code
		}))

		const { code, ...restResponse } = SuccessCreated({
			message: `You successfully get company users for ${email}`,
			result: userCompanies
		})
		return res.status(code).json(restResponse)
	}
}
