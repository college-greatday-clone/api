// Prisma
import { RoleType } from '@prisma/client'

export const users = [
	{
		name: 'Great Day',
		email: 'greatday@greatdayclone.com',
		role: RoleType.GreatDayAdmin
	},
	{
		name: 'John Doe',
		email: 'john@gits.id',
		role: RoleType.User
	},
	{
		name: 'GITS HR',
		email: 'gitshr@gits.id',
		role: RoleType.HRManager
	},
	{
		name: 'GITS Huda',
		email: 'huda@gits.id',
		role: RoleType.User
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
		capacity: '10-50',
		city: 'Jakarta',
		code: 'C-Great-Day',
		name: 'PT Great Day',
		email: 'greatday.admin@greatday.com',
		phoneNumber: '555'
	},
	{
		capacity: '10-50',
		city: 'Bandung',
		code: 'C-GITS',
		name: 'PT GITS Indonesia',
		email: 'gits.core@gits.id',
		phoneNumber: '123'
	}
]
