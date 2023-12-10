// Express
import { Request, Response } from 'express'

// Utils
import { SuccessOk } from '@/app/utils/success.util'

// Prisma
import { PrismaClient, RoleType, Prisma } from '@prisma/client'

// Errors
import { ErrorBadRequest, ErrorForbidden, ErrorNotFound } from '@/app/errors'

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
		if (!authenticatedUser) throw new ErrorNotFound('Account cannot be found')
		if (
			authenticatedUser &&
			authenticatedUser.position.name !== 'Human Resource'
		)
			throw new ErrorForbidden(
				'You are not Human Resource, you cannot do this action!'
			)

		return Promise.resolve(authenticatedUser)
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
						workType
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
}
