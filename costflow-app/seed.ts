import { prisma } from './lib/db/prisma';

async function main() {
  const user = await prisma.user.upsert({
    where: { email: 'mock@example.com' },
    update: {},
    create: {
      email: 'mock@example.com',
      name: 'Mock User',
    },
  });

  const workspace = await prisma.workspace.create({
    data: {
      name: 'Default Workspace',
      members: {
        create: {
          role: 'OWNER',
          userId: user.id,
        },
      },
    },
  });

  console.log({ user, workspace });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
