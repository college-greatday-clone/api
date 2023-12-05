// Prisma
import type { User } from '@prisma/client'

// Express
import { Request } from 'express'

export type TPaginationArgsReturn = {
	take: number
	skip: number
	orderBy: {
		createdAt: 'desc'
	}
}

export type TPagination<T> = {
	limit: number
	totalPages: number
	totalRows: number
	page: number
	rows: T[]
	sort: string
}

export type TPaginateResult<T> = { result: T[]; total: number }

export type TGetAuthenticatedUserActiveRole = {
	id: string
	name: string
}

export type TAppCommonService = {
	generateOtp: () => string
	paginateArgs: (args: Request['query']) => TPaginationArgsReturn
	paginate: <T>(
		result: TPaginateResult<T>,
		args: Request['query']
	) => TPagination<T>
	hashPassword: (password: string) => Promise<string>
	getAuthenticatedUser: (userId: string) => Promise<User>
	getAuthenticatedUserActiveRole: (
		userId: string
	) => Promise<TGetAuthenticatedUserActiveRole>
	isAuthenticatedUserAdmin: (userId: string) => Promise<boolean>
}
