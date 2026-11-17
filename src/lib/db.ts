import { PrismaClient } from '@prisma/client'

// Reuse one client during development, where Next.js hot reload would otherwise open new connections
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient }

export const prisma = globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
