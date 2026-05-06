import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const names = [
  'Lucas Pereira', 'Ana Souza', 'Mateus Lima', 'Juliana Costa', 'Rodrigo Alves',
  'Beatriz Rocha', 'Gustavo Santos', 'Camila Martins', 'Felipe Oliveira', 'Larissa Ferreira',
  'Thiago Rodrigues', 'Isabela Silva', 'Bruno Carvalho', 'Fernanda Almeida', 'Diego Barbosa',
  'Amanda Cardoso', 'Rafael Ribeiro', 'Letícia Gomes', 'Gabriel Melo', 'Vanessa Castro',
  'Ricardo Pinto', 'Natália Mendes', 'Vitor Freitas', 'Sofia Cunha', 'André Machado',
  'Carolina Teixeira', 'Marcos Morais', 'Daniela Nascimento', 'Hugo Correia', 'Tatiana Borges',
  'Sandro Antunes', 'Bianca Ramos', 'Paulo Vieira', 'Débora Fontes', 'Igor Leal',
  'Priscila Matos', 'Vinícius Ramos', 'Elaine Guimarães', 'Renato Neves', 'Clara Duarte'
];

const sectors = ['Operações', 'Logística', 'TI', 'Administrativo', 'Vendas', 'RH'];
const cids = ['J01', 'J06', 'M54', 'B34', 'Z00', 'A09', 'J11', 'K29'];
const reasons = ['Problemas Familiares', 'Consulta Médica', 'Assunto Particular', 'Trânsito', 'Saída Antecipada'];

async function main() {
  console.log('🌱 Iniciando seed em massa (40 funcionários)...');

  for (const name of names) {
    const sector = sectors[Math.floor(Math.random() * sectors.length)];
    const employee = await prisma.employee.create({
      data: {
        name: name,
        email: `${name.toLowerCase().replace(' ', '.')}@exemplo.com`,
        sector: sector,
        status: 'ativo'
      }
    });

    // Criar entre 1 e 12 ausências por funcionário para testar os níveis de risco (Mensal)
    const numAbsences = Math.floor(Math.random() * 12) + 1;
    
    for (let i = 0; i < numAbsences; i++) {
      const type = Math.random() > 0.4 ? 'atestado' : 'motivo_pessoal';
      const isAtestado = type === 'atestado';
      
      // Datas no mês atual para validar o relatório mensal e os riscos
      const date = new Date();
      date.setDate(Math.floor(Math.random() * 28) + 1);

      await prisma.absence.create({
        data: {
          employeeId: employee.id,
          type: type,
          reason: isAtestado ? 'Atestado Médico' : reasons[Math.floor(Math.random() * reasons.length)],
          cid: isAtestado ? cids[Math.floor(Math.random() * cids.length)] : null,
          date: date,
          time: !isAtestado ? `${String(Math.floor(Math.random() * 10) + 8).padStart(2, '0')}:${Math.random() > 0.5 ? '00' : '30'}` : null,
          status: 'registrado'
        }
      });
    }
  }

  console.log('✅ Seed finalizado! 40 funcionários e centenas de registros criados.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
