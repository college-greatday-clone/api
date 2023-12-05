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
import { SuccessOk, SuccessCreated } from '@/app/success/success'

// Bcrypt
import bcrypt from 'bcryptjs'

// Errors
import { ErrorBadRequest } from '@/app/errors'

// Lodash
import omit from 'lodash.omit'

// Prisma
import { PrismaClient, RoleType } from '@prisma/client'

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
			body('name').not().isEmpty().withMessage('Name is required'),
			body('email').isEmail().withMessage('Email must be valid'),
			body('password')
				.isLength({ min: 8 })
				.withMessage('Password minimal length must 8')
		],
		config: async (req: Request, res: Response) => {
			const { name, password } = req.body
			let { email } = req.body

			email = email.replace(/\s+/, '').trim().toLowerCase()

			// Check if user exists before
			const existedUser = await prisma.user.findFirst({
				where: { email }
			})
			if (existedUser) throw new ErrorBadRequest('Email currently in used')

			// Hash password
			const salt = await bcrypt.genSalt(10)
			const hashedPassword = await bcrypt.hash(password, salt)

			// Create new user
			const user = await prisma.user.create({
				data: { name, email, password: hashedPassword, role: RoleType.Public }
			})

			const { code, ...restResponse } = SuccessCreated({
				message: 'You successfully registered',
				result: omit(user, ['password'])
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
			body('password').not().isEmpty().withMessage('Password is required')
		],
		config: async (req: Request, res: Response) => {
			const { email, password } = req.body

			// Find correct user
			const user = await prisma.user.findFirst({ where: { email } })
			if (!user) throw new ErrorBadRequest('Invalid credentials')

			// Verify user password
			const isPasswordCorrect = await bcrypt.compare(password, user.password)
			if (!isPasswordCorrect) throw new ErrorBadRequest('Invalid credentials')

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
			where: { id: req.currentUser?.id as string }
		})

		const { code, ...restResponse } = SuccessOk({
			result: omit(user, ['password'])
		})
		return res.status(code).json(restResponse)
	}
}
