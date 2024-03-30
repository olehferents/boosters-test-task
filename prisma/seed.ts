import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const user = await prisma.user.upsert({
    where: { email: 'john@example.com' },
    update: {},
    create: {
      name: 'John Doe',
      email: 'john@example.com',
      password: 'password',
    },
  });

  await prisma.paymentsMethod.upsert({
    where: { id: 1 },
    update: {},
    create: {
      userId: user.id,
      type: 'card',
      cardNumber: '4242424242424242',
      expirationDate: new Date('2023-12-01'),
    },
  });
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
