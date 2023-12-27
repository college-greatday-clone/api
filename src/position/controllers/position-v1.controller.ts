// Express
import { Request, Response } from 'express'

// Utils
import { SuccessOk } from '@/app/utils/success.util'

// Prisma
import { PrismaClient } from '@prisma/client'

// Init Prisma
const prisma = new PrismaClient()

export class PositionControllerV1 {
	index = {
		config: async (req: Request, res: Response) => {
			const response = await prisma.position.findMany()

			const { code, ...restResponse } = SuccessOk({
				message: 'Successfully get position list',
				result: response
			})
			return res.status(code).json(restResponse)
		}
	}
}
