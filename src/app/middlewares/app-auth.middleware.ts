// Express
import { Request, Response, NextFunction } from 'express'

// JWT
import jwt from 'jsonwebtoken'

// Utils
import { ErrorUnauthorized } from '@/app/errors'

// Types
import { TUserJwtPayload } from '@/auth/types/auth.type'

// Prisma
import { PrismaClient } from '@prisma/client'

// Init Prisma
const prisma = new PrismaClient()

const appAuthMiddleware = async (
	req: Request,
	res: Response,
	next: NextFunction
) => {
	try {
		// Check for authorization header
		const authorizationHeader = req.headers?.authorization

		if (!authorizationHeader) {
			throw new ErrorUnauthorized('Authorization header should be exists')
		}
		const token = authorizationHeader.split(' ')?.[1]
		if ([false, null, 'null'].includes(token)) {
			throw new ErrorUnauthorized(
				'Authorization header should have token, or maybe your token is null'
			)
		}

		const user = (await jwt.verify(
			token,
			process.env.JWT_KEY as string
		)) as TUserJwtPayload

		req.currentUser = user

		// Check current user
		const currentUser = await prisma.user.findFirst({
			where: { id: user.id }
		})
		if (!currentUser) {
			req.currentUser = undefined
			throw new ErrorUnauthorized('Your account not registered in our system')
		}
	} finally {
		//
	}

	return next()
}

export { appAuthMiddleware }
