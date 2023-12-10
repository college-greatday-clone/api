// Express
import { Request, Response } from 'express'

// Responses
import { SuccessOk } from '@/app/utils/success.util'

// Prisma
import { PrismaClient } from '@prisma/client'

// Errors
import { ErrorNotFound } from '@/app/errors'

// Dayjs
import dayjs from 'dayjs'

// Utils
import { getToday, isPastHour } from '@/app/utils/common.util'

// Express Validator
import { body } from 'express-validator'

// Init Prisma
const prisma = new PrismaClient()

export class AttendanceControllerV1 {
	attend = {
		validateInput: [
			body('date').not().isEmpty().withMessage('Time is required')
		],
		config: async (req: Request, res: Response) => {
			const userId = req.currentUser?.id as string
			const { date } = req.body

			const transaction = prisma.$transaction(async db => {
				const companyUser = await db.companyUser.findFirst({
					where: { userId }
				})
				if (!companyUser) throw new ErrorNotFound(`User not registered!`)

				let attendance

				const firstAttendance = await db.attendance.findFirst({
					where: { companyUserId: companyUser.id, clockIn: undefined }
				})
				if (!firstAttendance) {
					attendance = await db.attendance.create({
						data: {
							isLateClockIn: isPastHour(date, companyUser.workingHour),
							clockIn: dayjs(date).toISOString(),
							companyUserId: companyUser.id
						}
					})
				}

				const existedAttendance = await db.attendance.findFirst({
					where: {
						companyUserId: companyUser.id,
						clockIn: {
							gte: getToday()
						},
						NOT: {
							clockIn: undefined
						},
						clockOut: undefined
					}
				})
				if (existedAttendance) {
					attendance = await db.attendance.update({
						where: { id: existedAttendance.id },
						data: {
							isLateClockOut: isPastHour(date, companyUser.workingHour),
							clockOut: dayjs().toISOString()
						}
					})
				}

				return { attendance, isClockIn: !existedAttendance }
			})

			const { attendance, isClockIn } = await transaction

			const { code, ...restResponse } = SuccessOk({
				message: `You successfully ${isClockIn ? 'Clock In' : 'Clock Out'}`,
				result: attendance
			})

			return res.status(code).json(restResponse)
		}
	}
}
