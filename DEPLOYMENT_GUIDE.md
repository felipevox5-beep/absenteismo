# Guia de Deployment - CapRover + PostgreSQL + Hetzner

## 📋 Pré-requisitos

- CapRover instalado e configurado na Hetzner
- PostgreSQL + Adminer rodando na VPS
- Repositório GitHub: https://github.com/felipevox5-beep/controleabsenteismo

## 🚀 Passo 1: Preparar o Banco de Dados

### 1.1 Acessar Adminer
- URL: `https://seu-servidor.com/adminer`
- Selecione PostgreSQL
- Use as credenciais do seu PostgreSQL

### 1.2 Criar Banco de Dados
```sql
CREATE DATABASE controleabsenteismo;
```

### 1.3 Executar o Script SQL
1. No Adminer, selecione o banco `controleabsenteismo`
2. Vá para "SQL command"
3. Copie todo o conteúdo do arquivo `database.sql`
4. Cole e execute

## 🛠️ Passo 2: Configurar CapRover

### 2.1 Acessar CapRover
- URL: `https://seu-servidor.com:3000`
- Login com suas credenciais

### 2.2 Criar Nova Aplicação
1. **Apps** → **One-Click Apps** ou **New App**
2. **App Name**: `controleabsenteismo`
3. **Instance Count**: 1-2 (conforme sua infraestrutura)

### 2.3 Conectar ao GitHub
1. Em **Deployment**, escolha **GitHub**
2. Autorize o GitHub (se não autorizado)
3. Selecione: `felipevox5-beep/controleabsenteismo`
4. Branch: `main`
5. **Enable Push to Deploy**

### 2.4 Configurar Variáveis de Ambiente
Em **App Configs** → **Environmental Variables**, adicione:

```
DB_HOST=seu-postgres-host
DB_PORT=5432
DB_NAME=controleabsenteismo
DB_USER=seu-usuario-postgres
DB_PASSWORD=sua_senha_super_segura
GEMINI_API_KEY=sua_chave_gemini
JWT_SECRET=gere_uma_string_aleatoria_de_32_caracteres
SESSION_SECRET=outra_string_aleatoria_de_32_caracteres
CORS_ORIGIN=https://seu-dominio.com.br
NODE_ENV=production
PORT=3000
STORAGE_TYPE=local
UPLOAD_DIR=/app/uploads/atestados
MAX_FILE_SIZE=5242880
LOG_LEVEL=info
```

### 2.5 Configurar Build e Deploy
1. **Build** → Marque "Use Default Captain"
2. **Ports**: HTTP/80 → 3000
3. **Enable HTTPS**
4. **Forced HTTPS Redirect**: Sim

### 2.6 Persistent Volumes (para uploads)
Se quiser persistir os uploads de atestados:
1. **Volumes** → **Add Mount**
2. **Container Path**: `/app/uploads`
3. **Volume Name**: `controleabsenteismo-uploads`
4. **Host Path**: `/var/lib/docker/volumes/controleabsenteismo-uploads/_data`

## 🔐 Passo 3: Criar Usuário PostgreSQL Específico (Recomendado)

No seu PostgreSQL, execute:

```sql
-- Criar usuário específico
CREATE USER controleabsenteismo_user WITH PASSWORD 'sua_senha_super_segura_aqui';

-- Conceder permissões ao banco
GRANT ALL PRIVILEGES ON DATABASE controleabsenteismo TO controleabsenteismo_user;

-- Conectar ao banco e conceder permissões nas tabelas
\c controleabsenteismo
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO controleabsenteismo_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO controleabsenteismo_user;
```

## 📝 Passo 4: Deploy

### 4.1 Via GitHub (Push to Deploy)
```bash
git add .
git commit -m "Deploy to CapRover"
git push origin main
```
CapRover detectará a mudança automaticamente

### 4.2 Manual via CapRover CLI
```bash
caprover deploy
```

## ✅ Passo 5: Verificar Deploy

1. Acesse: `https://seu-dominio.com.br`
2. Verifique nos **Logs** do CapRover se há erros
3. Teste a API: `https://seu-dominio.com.br/api/employees`

## 🔧 Troubleshooting

### Erro de Conexão com DB
- Verifique se o PostgreSQL está acessível da VPS
- Teste: `psql -h seu-postgres-host -U controleabsenteismo_user -d controleabsenteismo`

### Erro de Port Already in Use
- Use `netstat -tulpn | grep 3000` para encontrar o processo
- Verifique configuração de porta no CapRover

### Erro de Permission Denied em Uploads
- Verifique permissões da pasta: `chmod 755 /var/lib/docker/volumes/controleabsenteismo-uploads/_data`
- Confirme se o volume está montado corretamente

### Erro de CORS
- Verifique se `CORS_ORIGIN` corresponde ao seu domínio
- Adicione protocolo completo: `https://seu-dominio.com.br`

## 📊 Backup do Banco

### Backup Manual
```bash
pg_dump -h seu-postgres-host -U controleabsenteismo_user -d controleabsenteismo > backup_$(date +%Y%m%d_%H%M%S).sql
```

### Restore
```bash
psql -h seu-postgres-host -U controleabsenteismo_user -d controleabsenteismo < seu_backup.sql
```

## 🔄 Atualizações

Para atualizar a aplicação:
1. Faça alterações no repositório
2. Commit e push para `main`
3. CapRover detectará automaticamente
4. Se houver mudanças no banco, rode manualmente via Adminer

## 📞 Suporte

- Documentação CapRover: https://caprover.com
- PostgreSQL: https://www.postgresql.org/docs/
