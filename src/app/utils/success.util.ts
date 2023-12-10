type TSuccessArgs = {
	message?: string
	result?: unknown
}

type TSuccessResponse = {
	code: number
	message: string
	result: unknown
}

export const SuccessOk = (payload?: TSuccessArgs): TSuccessResponse => {
	return {
		code: 200,
		message: payload?.message || 'OK',
		result: payload?.result || null
	}
}

export const SuccessCreated = (payload?: TSuccessArgs): TSuccessResponse => {
	return {
		code: 201,
		message: payload?.message || 'Created',
		result: payload?.result || null
	}
}
