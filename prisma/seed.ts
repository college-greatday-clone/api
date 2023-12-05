// Logger
import { appLogger } from '../src/app/logger/app-logger'

// Prisma
import { PrismaClient } from '@prisma/client'

// Bcrypt
import bcrypt from 'bcryptjs'

// Seeder Data
import { users } from './seeders/seed-user'

// Init Prisma
const prisma = new PrismaClient()

/**
 * @description Seed user
 *
 */
const userSeeder = async () => {
	const salt = await bcrypt.genSalt(10)
	const password = await bcrypt.hash('password', salt)

	await prisma.$transaction(
		users.map(user => {
			return prisma.user.upsert({
				where: { email: user.email },
				update: {},
				create: {
					...user,
					password
				}
			})
		})
	)
}

async function main() {
	await userSeeder()
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
