// Error
import { ErrorBase, ISerializeErrorResponse } from './base.error'

class ErrorBadRequest extends ErrorBase {
	statusCode = 400

	constructor(message?: string) {
		super(message)

		Object.setPrototypeOf(this, ErrorBadRequest.prototype)
	}

	serializeErrors(): ISerializeErrorResponse[] {
		return [{ message: this.message || 'Bad Request' }]
	}
}

export { ErrorBadRequest }
