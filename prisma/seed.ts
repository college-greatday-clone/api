// Logger
import { appLogger } from '../src/app/logger/app-logger'

// Prisma
import {
	Company,
	CompanyApprovalStatusType,
	Position,
	PrismaClient,
	User,
	WorkType,
	WorkingHourType
} from '@prisma/client'

// Bcrypt
import bcrypt from 'bcryptjs'

// Seeder Data
import { companies, positions, users } from './seeders/seed.data'

// Init Prisma
const prisma = new PrismaClient()

async function main() {
	return prisma.$transaction(async transaction => {
		const salt = await bcrypt.genSalt(10)
		const password = await bcrypt.hash('password', salt)

		const createdUsers = []
		const createdCompanies = []
		const createdPositions = []

		for (const user of users) {
			const userResponse = await transaction.user.upsert({
				where: { email: user.email },
				update: {},
				create: {
					...user,
					password
				}
			})
			createdUsers.push(userResponse)
		}

		const hrUser = createdUsers.find(user => user.name === 'Great Day') as User

		for (const company of companies) {
			const companyResponse = await transaction.company.upsert({
				where: { name: company.name },
				update: {},
				create: {
					...company,
					status: CompanyApprovalStatusType.Approved,
					requestorId: hrUser.id
				}
			})

			createdCompanies.push(companyResponse)
		}

		const greatDayCompany = createdCompanies.find(
			company => company.name === 'PT Great Day'
		) as Company

		for (const position of positions) {
			const positionResponse = await transaction.position.upsert({
				where: { name: position.name },
				update: {},
				create: {
					name: position.name
				}
			})

			createdPositions.push(positionResponse)
		}

		const hrPosition = createdPositions.find(
			position => position.name === 'Human Resource'
		) as Position

		await transaction.companyUser.create({
			data: {
				address: 'Widyatama University',
				companyId: greatDayCompany.id,
				isPic: true,
				phoneNumber: '555',
				positionId: hrPosition.id,
				userId: hrUser.id,
				workingHour: WorkingHourType.EightToFive,
				workType: WorkType.WorkFromOffice
			}
		})
	})
}
main()
	.then(async () => {
		await prisma.$disconnect()
	})
	.catch(async e => {
		appLogger.error(`===prisma/seed.ts===:`, e)
		await prisma.$disconnect()
		process.exit(1)
	})
