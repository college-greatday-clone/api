// Express
import { Request, Response } from 'express'

// Responses
import { SuccessOk } from '@/app/utils/success.util'

// Prisma
import {
	CompanyApprovalStatusType,
	PrismaClient,
	RoleType,
	WorkType,
	WorkingHourType
} from '@prisma/client'

// Types
import { THandleCompanyApproval } from './company-register-v1.controller.type'

// Errors
import { ErrorNotFound } from '@/app/errors'

// Init Prisma
const prisma = new PrismaClient()

export class CompanyRegisterControllerV1 {
	_handleCompanyApproval = ({
		companyId,
		status,
		userId,
		requestorId
	}: THandleCompanyApproval) => {
		return prisma.$transaction(async transaction => {
			const company = await transaction.company.update({
				where: { id: companyId },
				data: { status }
			})

			const approvalLog = await transaction.companyApprovalLogs.create({
				data: {
					status,
					companyId: company.id,
					createdById: userId
				}
			})

			let companyUser

			const position = await transaction.position.findFirst({
				where: { name: 'Human Resource' }
			})
			if (!position)
				throw new ErrorNotFound(
					'Human resource position not found, please try other name'
				)

			if (status === CompanyApprovalStatusType.Approved) {
				companyUser = await transaction.companyUser.create({
					data: {
						address: 'Widyatama University',
						companyId,
						isPic: true,
						phoneNumber: '555',
						positionId: position.id,
						userId: requestorId,
						workingHour: WorkingHourType.EightToFive,
						workType: WorkType.WorkFromOffice,
						isActive: true
					}
				})

				await transaction.user.update({
					where: { id: requestorId },
					data: { role: RoleType.HRManager }
				})
			}

			return {
				company,
				approvalLog,
				companyUser
			}
		})
	}

	index = {
		config: async (req: Request, res: Response) => {
			const companyNeedApprovals = await prisma.company.findMany({
				where: { status: CompanyApprovalStatusType.Pending },
				include: {
					requestor: {
						select: {
							id: true,
							name: true,
							email: true
						}
					}
				}
			})

			const { code, ...restResponse } = SuccessOk({
				message: 'List of company that need approval',
				result: companyNeedApprovals
			})

			return res.status(code).json(restResponse)
		}
	}

	approve = {
		config: async (req: Request, res: Response) => {
			const { companyId } = req.params

			const company = await prisma.company.findFirst({
				where: { id: companyId }
			})
			if (!company) throw new ErrorNotFound('Company not found')

			const approvalResponse = await this._handleCompanyApproval({
				companyId,
				status: CompanyApprovalStatusType.Approved,
				userId: req.currentUser?.id as string,
				requestorId: company.requestorId
			})

			const { code, ...restResponse } = SuccessOk({
				message: `${approvalResponse.company.name} successfully approved`,
				result: approvalResponse
			})
			return res.status(code).json(restResponse)
		}
	}

	reject = {
		config: async (req: Request, res: Response) => {
			const { companyId } = req.params

			const company = await prisma.company.findFirst({
				where: { id: companyId }
			})
			if (!company) throw new ErrorNotFound('Company not found')

			const approvalResponse = await this._handleCompanyApproval({
				companyId,
				status: CompanyApprovalStatusType.Declined,
				userId: req.currentUser?.id as string,
				requestorId: company.requestorId
			})

			const { code, ...restResponse } = SuccessOk({
				message: `${approvalResponse.company.name} successfully declined`,
				result: approvalResponse
			})
			return res.status(code).json(restResponse)
		}
	}
}
