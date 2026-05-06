# 🚀 GUIA PRÁTICO - Implantação no Hetzner via CapRover

## 📋 Arquivos Criados

| Arquivo | Descrição |
|---------|-----------|
| `database.sql` | Schema completo do PostgreSQL com todas as tabelas |
| `migrate-data.sql` | Script para migração de dados |
| `.env.example` | Todas as variáveis de ambiente necessárias |
| `DEPLOYMENT_GUIDE.md` | Guia detalhado de deployment |
| `Dockerfile` | Configuração para containerização |
| `captain-definition` | Configuração específica do CapRover |
| `README.md` | Documentação atualizada |

## ⚡ Passos Rápidos

### 1️⃣ PREPARAR BANCO DE DADOS (via Adminer)

```
1. Acesse: https://seu-servidor.com/adminer
2. Escolha "PostgreSQL"
3. Login com credenciais do PostgreSQL
4. Clique em "Create Database" → Nome: controleabsenteismo
5. Selecione o banco controleabsenteismo
6. Vá para "SQL command"
7. Copie todo o conteúdo de database.sql e execute
```

**Resultado esperado:** Será criado com sucesso todas as 16 tabelas + funções + triggers + views

### 2️⃣ CONFIGURAR CAPROVER

#### 2.1 Nova App
```
Apps → New App → Nome: controleabsenteismo
```

#### 2.2 Conectar GitHub
```
Deployment → GitHub
Selecione: felipevox5-beep/controleabsenteismo
Branch: main
Marque: Enable Push to Deploy
```

#### 2.3 Variáveis de Ambiente
Vá em **App Configs** → **Environmental Variables** e adicione EXATAMENTE:

```
DB_HOST=seu-postgres-hostname
DB_PORT=5432
DB_NAME=controleabsenteismo
DB_USER=seu-usuario-postgres
DB_PASSWORD=sua_senha_segura
GEMINI_API_KEY=sua_chave_gemini
JWT_SECRET=gere-uma-string-aleatoria-32-caracteres
SESSION_SECRET=outra-string-aleatoria-32-caracteres
CORS_ORIGIN=https://seu-dominio.com.br
NODE_ENV=production
PORT=3000
STORAGE_TYPE=local
UPLOAD_DIR=/app/uploads/atestados
```

#### 2.4 HTTPS e Domínio
```
HTTP Settings → Enable HTTPS
Domain: seu-dominio.com.br
Force HTTPS Redirect: ON
```

#### 2.5 Volumes (Persistência de Uploads)
```
Volumes → Add Mount
Container Path: /app/uploads
Volume Name: controleabsenteismo-uploads
```

### 3️⃣ DEPLOY

Duas opções:

**Opção A - Automático (Recomendado):**
```bash
git push origin main  # CapRover detecta automaticamente
```

**Opção B - Manual no CapRover:**
```
Apps → controleabsenteismo → Deploy
Clique em "Re-Deploy"
```

### 4️⃣ VERIFICAR

```
1. Acesse: https://seu-dominio.com.br
2. Deve aparecer a interface do sistema
3. Teste a API: https://seu-dominio.com.br/api/employees
4. Verifique os logs em: Apps → controleabsenteismo → Logs
```

## 🔑 Gerador de Strings Aleatórias (para JWT e SESSION)

No seu terminal (Windows PowerShell):
```powershell
-join ((1..32) | ForEach-Object { [char][byte]@(33..126) | Get-Random })
```

Ou online: https://www.random.org/strings/

## ⚠️ Erros Comuns

### ❌ "Connection refused" no PostgreSQL
**Solução:**
- Verifique se PostgreSQL está rodando
- Teste: `telnet seu-postgres-host 5432`
- Confirme `DB_HOST` e credenciais

### ❌ "Port already in use"
**Solução:**
- Verifique se outra app está usando porta 3000
- Mude em CapRover: **Ports** → HTTP/80 → 3000

### ❌ "Permission denied" nos uploads
**Solução:**
```bash
# SSH na VPS
chmod 755 /var/lib/docker/volumes/controleabsenteismo-uploads/_data
```

### ❌ "CORs error"
**Solução:**
- Verifique `CORS_ORIGIN` com `https://` + seu domínio exato
- Não use barra no final: ❌ `https://seu-dominio.com.br/` → ✅ `https://seu-dominio.com.br`

## 📊 Estrutura do Banco de Dados

**Tabelas Principais:**
- `employees` - Funcionários (4 registros padrão)
- `absences` - Ausências (registros de faltas)
- `sectors` - Setores (6 setores padrão)
- `absence_types` - Tipos de ausência
- `cids` - Doenças (CID-10)

**Recursos Automáticos:**
- ✅ Triggers que atualizam estatísticas
- ✅ Detecção automática de recorrência de CID
- ✅ Views para relatórios
- ✅ Funções de cálculo

## 🔒 Segurança

1. **Mude as senhas padrão:**
   ```sql
   ALTER USER seu-usuario-postgres WITH PASSWORD 'nova_senha_segura';
   ```

2. **Crie usuário específico para a app:**
   ```sql
   CREATE USER controleabsenteismo_app WITH PASSWORD 'senha_super_segura';
   GRANT ALL PRIVILEGES ON DATABASE controleabsenteismo TO controleabsenteismo_app;
   ```

3. **Gere novas strings para JWT e SESSION** (nunca use as padrões)

4. **Ative firewall** na Hetzner restringindo acesso ao PostgreSQL

## 📈 Escalabilidade Futura

Se a app crescer, considere:
- PostgreSQL em container separado (banco externo)
- Redis para cache
- Load balancer
- CDN para assets estáticos

## 📞 Suporte Rápido

**Documentação:**
- CapRover: https://caprover.com/docs/
- PostgreSQL: https://www.postgresql.org/docs/
- Este projeto: Veja `DEPLOYMENT_GUIDE.md`

**Verificar Logs:**
```
CapRover → Apps → controleabsenteismo → Logs → View Logs
```

## ✅ Checklist Final

- [ ] Banco de dados criado via Adminer
- [ ] Script `database.sql` executado com sucesso
- [ ] App criada no CapRover
- [ ] GitHub conectado
- [ ] Todas as variáveis de ambiente adicionadas
- [ ] Domínio e HTTPS configurados
- [ ] Volumes criados para uploads
- [ ] Deploy concluído sem erros
- [ ] Interface carregando em `https://seu-dominio.com.br`
- [ ] API respondendo em `/api/employees`

---

**Última atualização:** Abril 2026
**Versão:** 1.0
