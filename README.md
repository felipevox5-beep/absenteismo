<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# 📊 Sistema de Controle de Absenteísmo

Um sistema completo para gerenciar ausências de funcionários, com suporte a atestados médicos, detecção de recorrências de doenças e geração de relatórios.

## 🎯 Funcionalidades

- ✅ Gerenciamento de funcionários e setores
- 📋 Registro de ausências (atestados, motivos pessoais, etc)
- 🔍 Detecção automática de recorrência de CID (Classificação Internacional de Doenças)
- 📊 Relatórios de absenteísmo por período e departamento
- 🤖 Análise com IA (Google Gemini)
- 📁 Upload de atestados médicos
- 🔔 Alertas de recorrências

## 🗄️ Banco de Dados

O sistema utiliza **PostgreSQL** com as seguintes tabelas principais:

- `employees` - Funcionários
- `absences` - Registros de ausências
- `sectors` - Setores da empresa
- `absence_types` - Tipos de ausência
- `cids` - Classificação Internacional de Doenças
- `recurrence_alerts` - Alertas de recorrência
- `employee_statistics` - Estatísticas por funcionário
- `audit_logs` - Log de auditoria do sistema

## 🚀 Início Rápido

### Pré-requisitos
- Node.js 18+
- PostgreSQL 12+
- npm ou yarn

### Instalação Local

1. **Clone o repositório:**
   ```bash
   git clone https://github.com/felipevox5-beep/controleabsenteismo.git
   cd controleabsenteismo
   ```

2. **Instale as dependências:**
   ```bash
   npm install
   ```

3. **Configure as variáveis de ambiente:**
   ```bash
   cp .env.example .env.local
   ```
   
   Edite `.env.local` com suas configurações:
   ```
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=controleabsenteismo
   DB_USER=seu_usuario
   DB_PASSWORD=sua_senha
   GEMINI_API_KEY=sua_chave_gemini
   ```

4. **Configure o banco de dados:**
   
   **Opção A - Usar Adminer (se disponível):**
   - Acesse http://localhost/adminer (ou seu servidor)
   - Crie banco `controleabsenteismo`
   - Copie o conteúdo de `database.sql` em "SQL command"
   - Execute
   
   **Opção B - Linha de comando:**
   ```bash
   createdb controleabsenteismo
   psql -U seu_usuario -d controleabsenteismo -f database.sql
   ```

5. **Inicie o servidor:**
   ```bash
   npm run dev
   ```

6. **Acesse a aplicação:**
   - Frontend: http://localhost:3000
   - API: http://localhost:3000/api

## 📦 Deployment

### CapRover (Hetzner/VPS)

Para fazer deploy via CapRover, consulte [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md)

Resumo:
1. Configure as variáveis de ambiente no CapRover
2. Conecte o repositório GitHub
3. CapRover fará build e deploy automaticamente

### Docker

```bash
docker build -t controleabsenteismo .
docker run -p 3000:3000 \
  -e DB_HOST=seu_postgres \
  -e DB_NAME=controleabsenteismo \
  -e GEMINI_API_KEY=sua_chave \
  controleabsenteismo
```

## 📚 Arquivos Importantes

- `database.sql` - Schema completo do PostgreSQL
- `migrate-data.sql` - Script de migração de dados
- `.env.example` - Exemplo de variáveis de ambiente
- `DEPLOYMENT_GUIDE.md` - Guia completo de deployment
- `Dockerfile` - Configuração Docker
- `captain-definition` - Configuração CapRover

## 🔧 Configuração de Variáveis

Todas as variáveis de ambiente estão documentadas em `.env.example`:

- `DB_*` - Conexão PostgreSQL
- `GEMINI_API_KEY` - Chave da API Google Gemini
- `JWT_SECRET` - Chave para JWT tokens
- `STORAGE_TYPE` - Tipo de armazenamento (local/s3/azure)
- `MAX_ABSENCES_PER_MONTH` - Limite de ausências
- E muito mais...

## 📊 Scripts Disponíveis

```bash
npm run dev       # Inicia servidor de desenvolvimento
npm run build     # Build da aplicação
npm run preview   # Preview da build
npm run lint      # Verifica tipos TypeScript
npm run clean     # Remove pasta dist
```

## 🔐 Segurança

- Sempre use HTTPS em produção
- Mantenha `.env.local` seguro (nunca commitar)
- Use senhas fortes para PostgreSQL
- Ative CORS apenas para domínios confiáveis
- Altere `JWT_SECRET` em produção

## 📋 Requisitos de Banco de Dados

Para criar o banco manualmente (se não usar o script):

```sql
-- Criar banco
CREATE DATABASE controleabsenteismo ENCODING 'UTF8';

-- Criar usuário específico
CREATE USER controleabsenteismo_user WITH PASSWORD 'senha_segura';
GRANT ALL PRIVILEGES ON DATABASE controleabsenteismo TO controleabsenteismo_user;
```

Depois execute `database.sql` para criar todas as tabelas.

## 🤝 Contribuindo

1. Faça um Fork
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📝 Licença

Este projeto está sob a Licença MIT.

## 📞 Suporte

Para suporte ou dúvidas, abra uma issue no repositório.
