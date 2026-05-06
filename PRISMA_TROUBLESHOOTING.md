# 🔧 Troubleshooting - Problema Prisma com Views

## ❌ Erro: "cannot drop table absences because other objects depend on it"

Este erro ocorre quando Prisma tenta sincronizar o schema com o banco, mas há views dependentes da tabela.

### 🎯 Solução Rápida

O Prisma **NÃO gerencia views automaticamente**. Precisamos usar apenas a parte ORM do Prisma sem fazer schema push.

## 📋 O que aconteceu

1. Você executou `prisma db push` ou similar
2. Prisma detectou diferenças no schema
3. Prisma tentou dropar a tabela `absences`
4. Mas a view `vw_absences_by_period` depende dela
5. PostgreSQL bloqueou a operação

## ✅ Solução: Usar Banco Pré-Criado

### Passo 1: Desabilitar Schema Push Automático

Adicione ao seu `server.ts` ou arquivo de inicialização:

```typescript
// NÃO execute prisma db push
// NÃO execute prisma migrate deploy
// Apenas use o cliente Prisma para queries

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Use normalmente para ler/escrever dados
const users = await prisma.systemUser.findMany();
```

### Passo 2: Executar SQL Manualmente

As tabelas e views **já estão criadas** via `database.sql`.

Se precisar recriar:

```bash
# 1. Limpar banco (cuidado!)
psql DATABASE_URL -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"

# 2. Executar schema
psql DATABASE_URL -f database.sql

# 3. Inicializar usuários
psql DATABASE_URL -f init-users.sql
```

### Passo 3: Usar Script de Deploy

No CapRover, configure o comando pós-deploy:

```bash
#!/bin/bash
psql "$DATABASE_URL" -f init-users.sql
npm run build
npm start
```

## 🚀 No CapRover

1. **Apps** → **controleabsenteismo** → **Deployment**
2. **Pre-deployment Script:**
   ```bash
   # Apenas instalar dependências
   npm ci
   ```

3. **Post-deployment Script:**
   ```bash
   # Executar script de banco (se houver atualizações)
   psql "$DATABASE_URL" -f init-users.sql || echo "Usuários já inicializados"
   ```

4. **Build Command:**
   ```bash
   npm run build
   ```

5. **Start Command:**
   ```bash
   npm run dev
   ```

## 📝 Alternativa: Remover Prisma

Se quiser **remover totalmente o Prisma**:

```bash
npm uninstall @prisma/client prisma
rm -rf prisma/

# Usar apenas pg (node-postgres) ou client raw
```

Depois instale `pg`:

```bash
npm install pg @types/pg
```

## 🔄 Usando PrismaClient Corretamente

Se manter o Prisma, use apenas para queries (SEM migrations):

```typescript
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ✅ Use para queries
export async function getEmployees() {
  return prisma.employee.findMany();
}

export async function createAbsence(data) {
  return prisma.absence.create({ data });
}

// ❌ NÃO use para migrations
// ❌ NÃO execute: prisma db push
// ❌ NÃO execute: prisma migrate deploy
```

## 📊 Status Atual do Banco

✅ Tabelas criadas: `database.sql` já executado
✅ Views criadas: `vw_absence_report`, `vw_recurrence_detection`, `vw_absences_by_period`
✅ Funções criadas: `update_employee_statistics()`, `check_cid_recurrence()`
✅ Triggers criados: Ativando os triggers automáticos
✅ Usuários padrão: Execute `init-users.sql`

## 🔍 Verificar Estado

```bash
# Conectar ao banco
psql $DATABASE_URL

# Listar tabelas
\dt

# Listar views
\dv

# Listar funções
\df
```

## 🛑 Parar Erros de Schema

No `CapRover`, certifique-se de **NÃO** ter:

```bash
# ❌ REMOVA ESTAS LINHAS
prisma db push
prisma migrate deploy
prisma generate
```

Se estão em algum script, remova.

## ✨ Resultado Final

Seu banco está **totalmente pronto**:
- ✅ Todas as tabelas criadas
- ✅ Todas as views criadas
- ✅ Todas as funções criadas
- ✅ Todos os triggers ativos
- ✅ Usuários padrão podem ser inicializados

**Use apenas o Prisma como ORM para leitura/escrita de dados, não para gerenciar schema.**

---

Se ainda tiver problemas, consulte [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md)
