// Express
import { Request, Response } from 'express'

// Responses
import { SuccessOk } from '@/app/utils/success.util'

// Prisma
import {
	AttendanceApprovalStatusType,
	AttendanceType,
	PrismaClient
} from '@prisma/client'
import * as runtime from '@prisma/client/runtime/library'

// Errors
import {
	ErrorBadRequest,
	ErrorNotFound,
	ErrorUnauthorized,
	ErrorValidation
} from '@/app/errors'

// Dayjs
import dayjs from 'dayjs'

// Utils
import { getToday, isPastHour } from '@/app/utils/common.util'

// Express Validator
import { body } from 'express-validator'

// Init Prisma
const prisma = new PrismaClient()

export class AttendanceControllerV1 {
	approvalList = {
		config: async (req: Request, res: Response) => {
			const authenticatedUser = await prisma.companyUser.findFirst({
				where: {
					userId: req.currentUser?.id as string,
					company: { name: 'PT GITS Indonesia' }
				},
				include: { companyUserControls: true }
			})
			if (!authenticatedUser) throw new ErrorUnauthorized('Account not found!')

			const attendanceApprovalList = await prisma.attendanceApproval.findMany({
				where: {
					attendance: {
						createdBy: {
							companyPersonInCharges: {
								some: {
									companyUserPersonInChargeId: authenticatedUser.id
								}
							}
						}
					}
				},
				include: {
					attendance: {
						select: {
							id: true,
							clockIn: true,
							clockOut: true,
							isLateClockIn: true,
							clockInPhoto: true,
							isLateClockOut: true,
							clockOutPhoto: true,
							createdBy: {
								select: {
									id: true,
									workingHour: true,
									workType: true,
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
											email: true,
											role: true
										}
									}
								}
							}
						}
					}
				}
			})

			const { code, ...restResponse } = SuccessOk({
				message: `You successfully get attendance approval list`,
				result: attendanceApprovalList
			})

			return res.status(code).json(restResponse)
		}
	}

	_handleApprovalLog = async (
		db: Omit<PrismaClient, runtime.ITXClientDenyList>,
		type: AttendanceType,
		attendanceId: string
	) => {
		const attendanceApproval = await db.attendanceApproval.create({
			data: {
				status: AttendanceApprovalStatusType.Pending,
				type,
				attendanceId
			}
		})

		return Promise.resolve(attendanceApproval)
	}

	attend = {
		validateInput: [
			body('date').not().isEmpty().withMessage('Date is required'),
			body('photo').not().isEmpty().withMessage('Photo is required')
		],
		config: async (req: Request, res: Response) => {
			const userId = req.currentUser?.id as string
			const { date, photo, remark } = req.body

			const transaction = await prisma.$transaction(async db => {
				const companyUser = await db.companyUser.findFirst({
					where: { userId }
				})
				if (!companyUser) throw new ErrorNotFound(`User not registered!`)

				const fullAttendance = await db.attendance.findFirst({
					where: {
						AND: {
							companyUserId: companyUser.id,
							NOT: {
								clockIn: undefined,
								clockOut: null
							}
						}
					}
				})
				if (fullAttendance)
					throw new ErrorBadRequest(`You already fully attend!`)

				const firstAttendance = await db.attendance.findFirst({
					where: {
						companyUserId: companyUser.id,
						createdAt: {
							gte: getToday()
						}
					}
				})
				if (!firstAttendance) {
					const attendance = await db.attendance.create({
						data: {
							isLateClockIn: isPastHour(
								date,
								companyUser.workingHour,
								AttendanceType.ClockIn
							),
							clockIn: dayjs(date).toISOString(),
							companyUserId: companyUser.id,
							clockInPhoto: photo,
							userId
						}
					})
					await this._handleApprovalLog(
						db,
						AttendanceType.ClockIn,
						attendance.id
					)

					return { attendance, isClockIn: true }
				}

				const existedAttendance = await db.attendance.findFirst({
					where: {
						companyUserId: companyUser.id,
						createdAt: {
							gte: getToday()
						},
						NOT: {
							clockIn: undefined
						},
						clockOut: undefined
					}
				})
				if (existedAttendance) {
					if (!remark)
						throw new ErrorValidation([
							{
								msg: 'Clock Out Remark is required',
								type: 'field',
								path: 'remark',
								location: 'body',
								value: ''
							}
						])

					const attendance = await db.attendance.update({
						where: { id: existedAttendance.id },
						data: {
							isLateClockOut: isPastHour(
								date,
								companyUser.workingHour,
								AttendanceType.ClockOut
							),
							clockOut: dayjs(date).toISOString(),
							clockOutPhoto: photo,
							clockOutRemark: remark,
							userId
						}
					})
					await this._handleApprovalLog(
						db,
						AttendanceType.ClockOut,
						attendance.id
					)
					return { attendance, isClockOut: true }
				}
			})

			const { code, ...restResponse } = SuccessOk({
				message: `You successfully ${
					transaction?.isClockIn ? 'Clock In' : 'Clock Out'
				}`,
				result: transaction
			})

			return res.status(code).json(restResponse)
		}
	}

	approve = {
		validateInput: [
			body('remark')
				.not()
				.isEmpty()
				.withMessage('Remark for approve is required')
		],
		config: async (req: Request, res: Response) => {
			const { attendanceApprovalId } = req.params
			const { remark } = req.body

			const authenticatedUser = await prisma.companyUser.findFirst({
				where: {
					userId: req.currentUser?.id as string,
					company: { name: 'PT GITS Indonesia' }
				},
				include: { companyUserControls: true }
			})
			if (!authenticatedUser) throw new ErrorUnauthorized('Account not found!')

			const attendance = await prisma.attendanceApproval.findFirst({
				where: {
					id: attendanceApprovalId,
					status: {
						in: [
							AttendanceApprovalStatusType.Pending,
							AttendanceApprovalStatusType.Rejected
						]
					},
					attendance: {
						createdBy: {
							companyPersonInCharges: {
								some: {
									companyUserPersonInChargeId: authenticatedUser.id
								}
							}
						}
					}
				}
			})
			if (!attendance)
				throw new ErrorBadRequest(
					'Approved attendance cannot be updated or You are not the PIC!'
				)

			const approvedAttendance = await prisma.attendanceApproval.update({
				where: { id: attendanceApprovalId },
				data: { status: AttendanceApprovalStatusType.Approved, remark }
			})

			const { code, ...restResponse } = SuccessOk({
				message: `You successfully approve the attendance`,
				result: approvedAttendance
			})

			return res.status(code).json(restResponse)
		}
	}

	reject = {
		validateInput: [
			body('remark')
				.not()
				.isEmpty()
				.withMessage('Remark for reject is required')
		],
		config: async (req: Request, res: Response) => {
			const { attendanceApprovalId } = req.params
			const { remark } = req.body

			const authenticatedUser = await prisma.companyUser.findFirst({
				where: {
					userId: req.currentUser?.id as string,
					company: { name: 'PT GITS Indonesia' }
				},
				include: { companyUserControls: true }
			})
			if (!authenticatedUser) throw new ErrorUnauthorized('Account not found!')

			const attendance = await prisma.attendanceApproval.findFirst({
				where: {
					id: attendanceApprovalId,
					status: {
						not: {
							in: [
								AttendanceApprovalStatusType.Approved,
								AttendanceApprovalStatusType.Rejected
							]
						}
					},
					attendance: {
						createdBy: {
							companyPersonInCharges: {
								some: {
									companyUserPersonInChargeId: authenticatedUser.id
								}
							}
						}
					}
				}
			})
			if (!attendance)
				throw new ErrorBadRequest(
					'Cannot reject attendance that already Approved and Rejected state, or You are not the PIC!'
				)

			const approvedAttendance = await prisma.attendanceApproval.update({
				where: { id: attendanceApprovalId },
				data: { status: AttendanceApprovalStatusType.Rejected, remark }
			})

			const { code, ...restResponse } = SuccessOk({
				message: `You successfully rejected the attendance`,
				result: approvedAttendance
			})

			return res.status(code).json(restResponse)
		}
	}
}
