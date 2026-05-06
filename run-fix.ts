import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Iniciando script de reparação do banco de dados...');

  try {
    const sqlPath = path.join(__dirname, 'fix-production.sql');
    
    if (!fs.existsSync(sqlPath)) {
      throw new Error('Arquivo fix-production.sql não encontrado na raiz do projeto.');
    }

    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    // O Prisma não suporta múltiplos comandos em um único executeRaw via driver de alguns DBs
    // Mas no PostgreSQL via executeRawUnsafe geralmente funciona se não houver transações conflitantes
    // Vamos dividir por ponto e vírgula para garantir maior compatibilidade
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    console.log(`📊 Executando ${statements.length} comandos SQL...`);

    for (const statement of statements) {
      try {
        await prisma.$executeRawUnsafe(statement);
      } catch (err: any) {
        // Ignorar erros de "já existe" para permitir re-execução
        if (err.message.includes('already exists') || err.message.includes('already a column')) {
          console.log(`ℹ️ Pulando: ${statement.substring(0, 50)}... (Já existe)`);
        } else {
          console.error(`❌ Erro no comando: ${statement.substring(0, 50)}...`);
          console.error(err.message);
        }
      }
    }

    console.log('✅ Banco de dados atualizado com sucesso!');
  } catch (error) {
    console.error('💥 Erro fatal ao executar migração:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
