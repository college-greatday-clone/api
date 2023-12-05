interface ISerializeErrorResponse {
	message: string
	field?: string
}

abstract class ErrorBase extends Error {
	abstract statusCode: number

	constructor(message?: string) {
		super(message)

		Object.setPrototypeOf(this, ErrorBase.prototype)
	}

	/**
	 * @description Serialize errors
	 *
	 */
	abstract serializeErrors(): ISerializeErrorResponse[]
}

export { ErrorBase, ISerializeErrorResponse }
