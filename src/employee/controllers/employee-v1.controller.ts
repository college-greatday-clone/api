// Express
import { Request, Response } from 'express'

// Utils
import { SuccessOk } from '@/app/utils/success.util'

// Prisma
import { PrismaClient, RoleType, Prisma } from '@prisma/client'

// Errors
import {
	ErrorBadRequest,
	ErrorForbidden,
	ErrorUnauthorized
} from '@/app/errors'

// Express Validator
import { body } from 'express-validator'

// Bcrypt
import bcrypt from 'bcryptjs'

// Lodash
import omit from 'lodash.omit'

// Init Prisma
const prisma = new PrismaClient()

export class EmployeeControllerV1 {
	_getAuthenticatedUser = async (currentUserId: string) => {
		const authenticatedUser = await prisma.companyUser.findFirst({
			where: {
				userId: currentUserId,
				position: {
					name: 'Human Resource'
				}
			},
			include: {
				position: true
			}
		})
		if (!authenticatedUser)
			throw new ErrorForbidden('You are not Human Resource!')
		if (
			authenticatedUser &&
			authenticatedUser.position.name !== 'Human Resource'
		)
			throw new ErrorForbidden(
				'You are not Human Resource, you cannot do this action!'
			)

		return Promise.resolve(authenticatedUser)
	}

	employeePicList = async (req: Request, res: Response) => {
		const authenticatedUser = await prisma.companyUser.findFirst({
			where: {
				userId: req.currentUser?.id as string,
				isActive: true
			}
		})
		if (!authenticatedUser) throw new ErrorUnauthorized('Account not found!')

		const picList = await prisma.companyUser.findMany({
			where: { isPic: true, companyId: authenticatedUser.companyId },
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
						name: true,
						email: true
					}
				},
				company: {
					select: {
						id: true,
						name: true,
						email: true,
						code: true
					}
				}
			}
		})

		const { code, ...restResponse } = SuccessOk({
			message: 'Successfully get pic list',
			result: picList
		})
		return res.status(code).json(restResponse)
	}

	index = {
		config: async (req: Request, res: Response) => {
			const authenticatedUser = await this._getAuthenticatedUser(
				req.currentUser?.id as string
			)
			const companyUserList = await prisma.companyUser.findMany({
				where: {
					companyId: authenticatedUser.companyId
				},
				select: {
					id: true,
					workType: true,
					workingHour: true,
					phoneNumber: true,
					address: true,
					isPic: true,
					position: {
						select: {
							id: true,
							name: true
						}
					},
					user: {
						select: {
							id: true,
							name: true,
							email: true
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
			})

			const { code, ...restResponse } = SuccessOk({
				message: 'Successfully get company user list',
				result: companyUserList
			})
			return res.status(code).json(restResponse)
		}
	}

	store = {
		validateInput: [
			body('name').not().isEmpty().withMessage('Name is required'),
			body('email').not().isEmpty().withMessage('Email is required'),
			body('password').not().isEmpty().withMessage('Password is required'),
			body('workType').not().isEmpty().withMessage('Work Type is required'),
			body('workingHour')
				.not()
				.isEmpty()
				.withMessage('Working Hour is required'),
			body('positionId').not().isEmpty().withMessage('Position is required'),
			body('picList').custom((value, { req }) => {
				if (req.body?.picList && req.body.picList.length === 0) {
					throw new Error('PIC List is required')
				}

				return true
			})
		],
		config: async (req: Request, res: Response) => {
			const {
				name,
				password,
				workType,
				workingHour,
				positionId,
				isPic,
				picList
			} = req.body
			let { email } = req.body

			const authenticatedUser = await this._getAuthenticatedUser(
				req.currentUser?.id as string
			)
			const transaction = prisma.$transaction(async db => {
				email = email.replace(/\s+/, '').trim().toLowerCase()

				// Check if user exists before
				const existedUser = await prisma.user.findFirst({
					where: { email }
				})
				if (existedUser) throw new ErrorBadRequest('Email currently in used')

				// Hash password
				const salt = await bcrypt.genSalt(10)
				const hashedPassword = await bcrypt.hash(password, salt)

				const user = await db.user.create({
					data: {
						name,
						email,
						password: hashedPassword,
						role: RoleType.User
					}
				})

				const position = await db.position.findFirst({
					where: { id: positionId }
				})
				if (!position) throw new Error('Position not found!')

				const companyUser = await db.companyUser.create({
					data: {
						address: 'Widyatama University',
						companyId: authenticatedUser.companyId,
						isPic,
						positionId,
						userId: user.id,
						workingHour,
						workType,
						isActive: true
					}
				})

				const mappedPicList = (picList as string[]).map(
					(pic): Prisma.CompanyUserPersonInChargeCreateManyInput => {
						return {
							companyUserId: companyUser.id,
							companyUserPersonInChargeId: pic
						}
					}
				)

				const companyUserPicList = await db.companyUser.findMany({
					where: {
						id: {
							in: mappedPicList.map(pic => pic.companyUserPersonInChargeId)
						}
					},
					include: { user: true }
				})

				const notPicList = companyUserPicList.filter(
					companyUser => !companyUser.isPic
				)
				if (notPicList.length > 0)
					throw new ErrorBadRequest(
						`${notPicList.map(pic => pic.user.name).toString()} is not PIC`
					)

				await db.companyUserPersonInCharge.createMany({
					data: mappedPicList
				})

				return {
					user: omit(user, ['password']),
					companyUser
				}
			})
			const transactionResponse = await transaction

			const { code, ...restResponse } = SuccessOk({
				message: 'Successfully register employee',
				result: transactionResponse
			})
			return res.status(code).json(restResponse)
		}
	}

	update = {
		validateInput: [
			body('workType').not().isEmpty().withMessage('Work Type is required'),
			body('workingHour')
				.not()
				.isEmpty()
				.withMessage('Working Hour is required'),
			body('positionId').not().isEmpty().withMessage('Position is required'),
			body('picList').custom((value, { req }) => {
				if (req.body?.picList && req.body.picList.length === 0) {
					throw new Error('PIC List is required')
				}

				return true
			})
		],
		config: async (req: Request, res: Response) => {
			const { id } = req.params
			const { workType, workingHour, positionId, isPic, picList } = req.body

			await this._getAuthenticatedUser(req.currentUser?.id as string)
			const transaction = prisma.$transaction(async db => {
				const position = await db.position.findFirst({
					where: { id: positionId }
				})
				if (!position) throw new ErrorBadRequest('Position not found!')

				const companyUser = await db.companyUser.findFirst({
					where: { id: id, isActive: true }
				})
				if (!companyUser)
					throw new ErrorBadRequest('You not registered to this company!')

				await db.companyUser.update({
					where: { id: id },
					data: {
						isPic,
						positionId,
						workingHour,
						workType,
						isActive: false
					}
				})

				// Remove PIC from company user
				await db.companyUserPersonInCharge.deleteMany({
					where: { companyUserId: id }
				})

				// Re-assign pic to company user
				const mappedPicList = (picList as string[]).map(
					(pic): Prisma.CompanyUserPersonInChargeCreateManyInput => {
						return {
							companyUserId: companyUser.id,
							companyUserPersonInChargeId: pic
						}
					}
				)

				const companyUserPicList = await db.companyUser.findMany({
					where: {
						id: {
							in: mappedPicList.map(pic => pic.companyUserPersonInChargeId)
						}
					},
					include: { user: true }
				})

				if (companyUserPicList.length === 0)
					throw new ErrorBadRequest(
						'PIC selected is not registered in the system!'
					)

				const notPicList = companyUserPicList.filter(
					companyUser => !companyUser.isPic
				)
				if (notPicList.length > 0)
					throw new ErrorBadRequest(
						`${notPicList.map(pic => pic.user.name).toString()} is not PIC`
					)

				await db.companyUserPersonInCharge.createMany({
					data: mappedPicList
				})
			})
			const transactionResponse = await transaction

			const { code, ...restResponse } = SuccessOk({
				message: 'Successfully update employee',
				result: transactionResponse
			})
			return res.status(code).json(restResponse)
		}
	}
}
