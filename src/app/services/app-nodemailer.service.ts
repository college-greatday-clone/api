// Types
import { TAppNodemailer } from './app-nodemailer.service.type'

// Logger
import { appLogger } from '@/app/logger/app-logger'

// Nodemailer
import { Transporter, SendMailOptions } from 'nodemailer'

export class AppNodemailerService implements TAppNodemailer {
	transporter: Transporter

	constructor(transporter: Transporter) {
		this.transporter = transporter
	}

	/**
	 * @description Render mail
	 *
	 * @param {SendMailOptions} mailOptions
	 *
	 * @return {SendMailOptions} mailOptions
	 */
	renderMail = (mailOptions: SendMailOptions) => {
		return {
			from: process.env.SMTP_TO_EMAIL || mailOptions?.from,
			...mailOptions
		}
	}

	/**
	 * @description Send mail
	 *
	 * @param {SendMailOptions} mailOptions
	 *
	 * @return {SendMailOptions} mailOptions
	 */
	sendMail = (mailOptions: SendMailOptions): Promise<void> => {
		return new Promise((resolve, reject) => {
			this.transporter.sendMail(
				{
					from: process.env.SMTP_TO_EMAIL || mailOptions?.from,
					...mailOptions
				},
				(err, success) => {
					if (err) {
						appLogger.error(
							`App Nodemailer Service: Something went wrong when sending email ${err.message}`
						)
						reject(err)
					} else {
						appLogger.info('App Nodemailer Service: Successfully send email!')
						resolve(success)
					}
				}
			)
		})
	}
}
