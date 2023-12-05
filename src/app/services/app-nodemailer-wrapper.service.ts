// Nodemailer
import nodemailer, { Transporter } from 'nodemailer'

// Logger
import { appLogger } from '@/app/logger/app-logger'

export class AppNodeMailerWrapper {
	private _transporter?: Transporter
	private transport = {
		host: 'smtp.gmail.com',
		port: 465,
		secure: true,
		auth: {
			user: process.env.SMTP_TO_EMAIL,
			pass: process.env.SMTP_TO_PASSWORD
		}
	}

	constructor(transporter?: Transporter) {
		this._transporter = transporter
	}

	get transporter() {
		if (!this._transporter)
			throw new Error(
				'App Nodemailer Wrapper Service: nodemailer not successfully initiated!'
			)

		return this._transporter
	}

	connect(): Promise<void> {
		this._transporter = nodemailer.createTransport(this.transport)

		return new Promise((resolve, reject) => {
			this.transporter.verify(error => {
				if (error) {
					appLogger.error(`===app-nodemailer-wrapper.service.ts===: ${error}`)
					reject(error)
				} else {
					appLogger.info(
						'===app-nodemailer-wrapper.service.ts===: Ready to send mail!'
					)
					resolve()
				}
			})
		})
	}
}

const appNodeMailerWrapper = new AppNodeMailerWrapper()

export { appNodeMailerWrapper }
