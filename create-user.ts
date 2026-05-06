import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash('teste123', 10);
  await prisma.systemUser.upsert({
    where: { email: 'user@teste.com' },
    update: {},
    create: {
      username: 'Usuario Teste',
      email: 'user@teste.com',
      passwordHash: passwordHash,
      role: 'admin',
      status: 'ativo',
    },
  });
  console.log('✅ Usuário criado: user@teste.com / teste123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
