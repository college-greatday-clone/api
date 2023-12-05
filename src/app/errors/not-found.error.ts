// Error
import { ErrorBase, ISerializeErrorResponse } from './base.error'

class ErrorNotFound extends ErrorBase {
	statusCode = 404

	constructor(message?: string) {
		super(message)

		Object.setPrototypeOf(this, ErrorNotFound.prototype)
	}

	serializeErrors(): ISerializeErrorResponse[] {
		return [{ message: this.message || 'Not Found' }]
	}
}

export { ErrorNotFound }
