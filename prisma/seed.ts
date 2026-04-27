import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed...');

  // 1. Criar Usuário Admin
  const adminPasswordHash = await bcrypt.hash('Admin123!', 10);
  await prisma.systemUser.upsert({
    where: { email: 'admin@admin.com' },
    update: {},
    create: {
      username: 'Administrador',
      email: 'admin@admin.com',
      passwordHash: adminPasswordHash,
      role: 'admin',
      status: 'ativo',
    },
  });
  console.log('✅ Usuário admin criado: admin@admin.com / Admin123!');

  // 1.1 Criar Usuário Personalizado para o Usuário
  const felipePasswordHash = await bcrypt.hash('vox123', 10);
  await prisma.systemUser.upsert({
    where: { email: 'felipe@vox.com' },
    update: {},
    create: {
      username: 'Felipe',
      email: 'felipe@vox.com',
      passwordHash: felipePasswordHash,
      role: 'admin',
      status: 'ativo',
    },
  });
  console.log('✅ Usuário felipe criado: felipe@vox.com / vox123');

  // 2. Criar Setores
  const setores = ['TI', 'Recursos Humanos', 'Operações', 'Vendas'];
  for (const nome of setores) {
    await prisma.sector.upsert({
      where: { name: nome },
      update: {},
      create: { name: nome, description: `Setor de ${nome}` },
    });
  }
  console.log('✅ Setores criados');

  // 3. Criar Funcionários
  const employee1 = await prisma.employee.create({
    data: {
      name: 'João Silva',
      email: 'joao.silva@empresa.com',
      sector: 'TI',
      status: 'ativo',
    },
  });

  const employee2 = await prisma.employee.create({
    data: {
      name: 'Maria Oliveira',
      email: 'maria.oliveira@empresa.com',
      sector: 'Operações',
      status: 'ativo',
    },
  });
  console.log('✅ Funcionários criados');

  // 4. Criar Ausências
  await prisma.absence.createMany({
    data: [
      {
        employeeId: employee1.id,
        type: 'atestado',
        reason: 'Gripe Forte',
        cid: 'J11',
        date: new Date(),
        status: 'registrado',
      },
      {
        employeeId: employee2.id,
        type: 'motivo_pessoal',
        reason: 'Problemas familiares',
        date: new Date(Date.now() - 86400000), // Ontem
        status: 'registrado',
      },
    ],
  });
  console.log('✅ Ausências criadas');

  console.log('🌱 Seed finalizado com sucesso!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
