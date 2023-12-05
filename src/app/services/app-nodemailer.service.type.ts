// Nodemailer
import { SendMailOptions } from 'nodemailer'

export type TAppNodemailer = {
	renderMail: (options: SendMailOptions) => SendMailOptions
	sendMail: (mail: SendMailOptions) => Promise<void>
}
