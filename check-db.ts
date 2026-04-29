import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const employees = await prisma.employee.findMany();
  console.log('Employees count:', employees.length);
  console.log('Employees:', JSON.stringify(employees, null, 2));

  const absences = await prisma.absence.findMany();
  console.log('Absences count:', absences.length);
  
  const sectors = await prisma.sector.findMany();
  console.log('Sectors count:', sectors.length);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
