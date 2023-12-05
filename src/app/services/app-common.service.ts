// Types
import {
	TAppCommonService,
	TPagination,
	TPaginationArgsReturn,
	TGetAuthenticatedUserActiveRole
} from './app-common.service.type'

// Bcrypt
import bcrypt from 'bcryptjs'

// Prisma
import { PrismaClient } from '@prisma/client'
import type { User } from '@prisma/client'

// Errors
import { ErrorNotFound } from '@/app/errors'

// Express
import { Request } from 'express'

// Init Prisma
const prisma = new PrismaClient()

export class AppCommonService implements TAppCommonService {
	/**
	 * @description Hash password
	 *
	 *
	 */
	hashPassword = async (password: string) => {
		// Hash password
		const salt = await bcrypt.genSalt(10)
		const hashedPassword = await bcrypt.hash(password, salt)

		return hashedPassword
	}

	/**
	 * @description Generate OTP
	 *
	 */
	generateOtp = () => {
		// Declare a digits variable
		// which stores all digits
		const digits = '0123456789'

		let OTP = ''

		for (let i = 0; i < 6; i++) {
			OTP += digits[Math.floor(Math.random() * 10)]
		}

		return OTP
	}

	/**
	 * @description Get pagination page
	 *
	 * @param {string} _page
	 *
	 * @return {number} number
	 */
	private _paginationPage = (_page?: string): number => {
		const currentPage = Number(_page || 0) as number
		const page = currentPage < 1 || currentPage === 1 ? 0 : currentPage - 1

		return page
	}

	/**
	 * @description Pagination argument for prisma
	 *
	 * @param {Request['query']} Request['query']
	 *
	 * @return {T} T
	 */
	paginateArgs = (args: Request['query']): TPaginationArgsReturn => {
		const page = this._paginationPage(args?.page as string)
		const take = Number(args?.limit || 10)
		const skip = take * page

		return {
			take,
			skip,
			orderBy: {
				createdAt: 'desc'
			}
		}
	}

	/**
	 * @description Paginate any result
	 *
	 * @param {object} options
	 * @param {TPaginationArgsReturn<TPaginationArgsPrisma>} args
	 *
	 * @return {TPagination<T>} TPagination<T>
	 */
	paginate = <T>(
		{ result, total }: { result: T[]; total: number },
		args: Request['query']
	): TPagination<T> => {
		const page = this._paginationPage(args?.page as string)
		const { take } = this.paginateArgs(args)
		const sort = (args?.sort || 'desc') as string
		const totalRows = total
		const totalPages = Math.ceil(totalRows / (take as number))

		const paginatedResponse = {
			limit: take as number,
			totalPages,
			totalRows,
			page: page + 1,
			rows: result as T[],
			sort
		}

		return paginatedResponse
	}

	/**
	 * @description Get authenticated user
	 *
	 * @param {string} userId
	 *
	 * @return {Prisma.Prisma__UserClient<User | null, null>} Prisma.Prisma__UserClient<User | null, null>
	 */
	getAuthenticatedUser = async (userId: string): Promise<User> => {
		const user = await prisma.user.findFirst({ where: { id: userId } })

		if (!user) throw new ErrorNotFound('User not found')

		return user
	}

	/**
	 * @description Get active role of user
	 *
	 * @param {string} userId
	 *
	 * @return {TGetAuthenticatedUserActiveRole} TGetAuthenticatedUserActiveRole
	 */
	getAuthenticatedUserActiveRole = async (
		userId: string
	): Promise<TGetAuthenticatedUserActiveRole> => {
		const user = await prisma.roleUser.findFirst({
			where: { userId, isActive: true },
			select: { role: { select: { id: true, name: true } } }
		})

		if (!user) throw new ErrorNotFound('User not found')

		return user.role
	}

	/**
	 * @description Get active role is admin
	 *
	 * @param {string} userId
	 *
	 * @return {Promise<boolean>} Promise<boolean>
	 */
	isAuthenticatedUserAdmin = async (userId: string): Promise<boolean> => {
		const user = await prisma.roleUser.findFirst({
			where: { userId, isActive: true },
			select: { role: { select: { id: true, name: true } } }
		})

		if (!user) throw new ErrorNotFound('User not found')

		return user.role.name.toLowerCase() === 'admin'
	}
}
