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

type TGenerateCompanyUser = {
	companyId: string
	positionId: string
	userId: string
	isPic: boolean
	pic?: string[]
}

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
		const hrGitsUser = createdUsers.find(
			user => user.name === 'GITS HR'
		) as User
		const hudaGitsUser = createdUsers.find(
			user => user.name === 'GITS Huda'
		) as User

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
		const gitsCompany = createdCompanies.find(
			company => company.name === 'PT GITS Indonesia'
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
		const frontEndPosition = createdPositions.find(
			position => position.name === 'Front-End'
		) as Position

		const companyUsers: TGenerateCompanyUser[] = [
			{
				companyId: greatDayCompany.id,
				positionId: hrPosition.id,
				userId: hrUser.id,
				isPic: true
			},
			{
				companyId: gitsCompany.id,
				positionId: hrPosition.id,
				userId: hrGitsUser.id,
				isPic: true
			},
			{
				companyId: gitsCompany.id,
				positionId: frontEndPosition.id,
				userId: hudaGitsUser.id,
				isPic: false
			}
		]

		for (const companyUser of companyUsers) {
			await transaction.companyUser.create({
				data: {
					address: 'Bandung',
					companyId: companyUser.companyId,
					isPic: companyUser.isPic,
					phoneNumber: '555',
					positionId: companyUser.positionId,
					userId: companyUser.userId,
					workingHour: WorkingHourType.EightToFive,
					workType: WorkType.WorkFromOffice,
					isActive: true
				}
			})
		}
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
