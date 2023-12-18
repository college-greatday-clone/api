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
