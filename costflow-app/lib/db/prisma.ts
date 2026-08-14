// @ts-ignore
import * as PrismaModule from '@prisma/client';
import { PrismaLibSql } from '@prisma/adapter-libsql';

const PrismaClientClass = (PrismaModule as any).PrismaClient || class DummyPrismaClient {};

const globalForPrisma = globalThis as unknown as {
  prisma: any;
};

const adapter = new PrismaLibSql({
  url: 'file:./dev.db',
});

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClientClass({
    adapter,
    log: ['query'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
