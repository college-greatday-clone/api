// Prisma
import { RoleType } from '@prisma/client'

export const users = [
	{
		name: 'Great Day',
		email: 'greatday@greatdayclone.com',
		role: RoleType.GreatDayAdmin
	}
]

export const positions = [
	{ name: 'Back-End' },
	{ name: 'Front-End' },
	{ name: 'Human Resource' },
	{ name: 'Product Owner' },
	{ name: 'Quality Assurance' }
]

export const companies = [
	{
		capacity: 100,
		city: 'Jakarta',
		code: 'C-Great-Day',
		name: 'PT Great Day',
		email: 'greatday.admin@greatday.com',
		phoneNumber: '555'
	}
]
