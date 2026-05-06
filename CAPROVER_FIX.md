# 🚨 RESOLUÇÃO - Erro Prisma no CapRover

## 📌 Seu Erro

```
Error: cannot drop table absences because other objects depend on it
DETAIL: view vw_absences_by_period depends on table absences
```

## ✅ Solução em 3 Passos

### Passo 1: Parar o Prisma de Fazer Schema Push

No CapRover, **remova ou comente** qualquer linha que rode:

```bash
prisma db push
prisma migrate deploy
prisma migrate reset
```

Se está no seu `Dockerfile` ou script de build, remova.

### Passo 2: Executar o Banco SQL Manualmente

**Via Adminer:**
1. Acesse: `https://seu-servidor.com/adminer`
2. Selecione PostgreSQL
3. Database: `db_absenteismo`
4. Vá para "SQL command"
5. Cole o conteúdo completo de `database.sql`
6. Execute

**Resultado esperado:** "Command OK" sem erros

### Passo 3: Inicializar Usuários

Mesmos passos que acima, mas execute `init-users.sql`

## 🔧 Configuração CapRover Correta

### Apps → seu-app → App Configs

**Aba: Build**
- ✅ Use Default Captain: SIM
- **Build Command:** (deixe vazio ou remova)

**Aba: Deploy**
- ✅ **Pre-deployment Script:** (deixe vazio)
- ✅ **Post-deployment Script:** (deixe vazio - não rodará Prisma)

**Aba: Environmental Variables**

Copie e cole EXATAMENTE:

```
DATABASE_URL=postgresql://postgres:9e6014c2d78f6c84@srv-captain--db-postgres:5432/db_absenteismo
NODE_ENV=production
PORT=3000
HOST=0.0.0.0
GEMINI_API_KEY=AIzaSyCfRfSyYNre3BdGCTpx4KHWVqZCF9qPy5Q
JWT_SECRET=gere-uma-string-segura-com-32-caracteres
SESSION_SECRET=outra-string-segura-com-32-caracteres
CORS_ORIGIN=https://seu-dominio.com.br
```

### Gerador de Strings Seguras

```bash
# Execute NO SEU COMPUTADOR
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Copie o resultado para `JWT_SECRET` e `SESSION_SECRET`

### Aba: HTTP Settings

- ✅ **Container Port:** 3000
- ✅ **Enable HTTPS:** ON
- ✅ **HTTP to HTTPS:** Redirect
- ✅ **Domain:** seu-dominio.com.br

### Aba: Volumes

Se quiser persistir uploads:

- **Container Path:** `/app/uploads`
- **Volume Name:** `controleabsenteismo-uploads`

## 🔍 Verificar Banco

Conecte ao banco via Adminer ou CLI:

```bash
# Verificar tabelas
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';

# Verificar views
SELECT table_name FROM information_schema.views WHERE table_schema = 'public';

# Verificar usuários
SELECT username, email, role FROM system_users;
```

## 🚀 Deploy Seguro

### Processo Correto:

1. **Editar banco (uma única vez):**
   - Execute `database.sql` via Adminer
   - Execute `init-users.sql` via Adminer

2. **Depois no CapRover:**
   - Adicionar variáveis de ambiente
   - Deploy a app
   - App conecta ao banco já pronto

3. **Atualizações futuras:**
   - Se mudar schema, execute SQL novo
   - Deploy da app (sem Prisma migrate)

## ⚡ Dockerfile Correto

O seu deve ser assim:

```dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./

RUN npm ci --omit=dev

COPY . .

RUN npm run build

EXPOSE 3000

CMD ["npm", "run", "dev"]
```

**NÃO inclua:** `RUN prisma db push` ou similar

## 🆘 Se Ainda Tiver Erro

### 1. Verificar Logs CapRover

```
Apps → seu-app → Logs → View Logs
```

Procure por:
- `Prisma` → Se aparecer, remova do Dockerfile/scripts
- `connection refused` → Verifique DATABASE_URL
- `Invalid user` → Verifique credenciais

### 2. Verificar Conectividade do Banco

No terminal do CapRover:

```bash
psql $DATABASE_URL -c "SELECT 1;"
```

Se conectar: ✅ Banco está ok
Se não conectar: ❌ Verifique DATABASE_URL

### 3. Limpar e Reiniciar

```bash
# No CapRover
Apps → seu-app → Settings → Force Re-Deploy
```

## 📚 Referência Rápida

| Problema | Solução |
|----------|---------|
| "cannot drop table" | Remova Prisma migrations |
| "connection refused" | Verifique DATABASE_URL |
| "permission denied" | Verifique credenciais |
| "port already in use" | Altere PORT em Environmental Vars |
| "CORS error" | Verifique CORS_ORIGIN |

## ✅ Checklist Final

- [ ] `database.sql` executado via Adminer
- [ ] `init-users.sql` executado via Adminer
- [ ] DATABASE_URL configurada no CapRover
- [ ] Nenhum `prisma db push` em scripts
- [ ] Variáveis de ambiente adicionadas
- [ ] Domínio e HTTPS configurados
- [ ] Deploy realizado sem erros

---

**Depois disso, seu sistema deve funcionar perfeitamente!** 🎉

Se precisar de mais ajuda: Veja [PRISMA_TROUBLESHOOTING.md](PRISMA_TROUBLESHOOTING.md)
