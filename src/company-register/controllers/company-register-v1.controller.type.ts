// Prisma
import { CompanyApprovalStatusType } from '@prisma/client'

export type THandleCompanyApproval = {
	companyId: string
	status: CompanyApprovalStatusType
	userId: string
}
