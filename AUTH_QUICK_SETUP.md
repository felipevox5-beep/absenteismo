# 🔐 AUTENTICAÇÃO - GUIA RÁPIDO

## 📋 Resumo Executivo

Seu sistema agora tem autenticação segura com:
- **Bcrypt** para hash de senhas (10 salt rounds)
- **JWT** tokens com 24 horas de validade
- **Rate limiting** contra força bruta
- **4 níveis de acesso**: admin, manager, user, viewer

## 🚀 Credenciais Padrão

| Usuário | Senha | Role |
|---------|-------|------|
| `admin` | `Admin@123456` | ✅ Admin |
| `manager` | `Manager@12345` | 📊 Manager |
| `user` | `User@123456` | 👤 User |
| `viewer` | `Viewer@123456` | 👁️ Viewer |

## ⚠️ IMPORTANTE

**Altere essas senhas imediatamente após o primeiro acesso!**

```sql
-- Alterar no banco
UPDATE system_users SET password_hash = (nova_hash) WHERE username = 'admin';
```

## 🔧 Setup Inicial

### 1. Instalar dependências
```bash
npm install
```

### 2. Executar SQL para criar usuários
- Via Adminer: Copie `init-users.sql` e execute
- Ou via CLI:
  ```bash
  psql -U seu_usuario -d controleabsenteismo -f init-users.sql
  ```

### 3. Instale dependências atualizadas
```bash
npm install
```

## 🔑 Gerar Nova Senha Segura

```bash
npm run generate-password-hash "SuaSenh@NovaAqui"
```

**Resultado:**
```
✅ Hash gerado com sucesso!
📋 Hash (copie para usar no SQL):
   $2a$10$xxxxx...
```

Então use em um SQL:
```sql
UPDATE system_users 
SET password_hash = '$2a$10$xxxxx...'
WHERE username = 'seu_usuario';
```

## 📝 Requisitos de Senha

Toda senha deve ter:
- ✅ Mínimo **8 caracteres**
- ✅ **Letras maiúsculas** (A-Z)
- ✅ **Letras minúsculas** (a-z)
- ✅ **Números** (0-9)
- ✅ **Caracteres especiais** (!@#$%^&*)

## 🌐 API de Login

### Fazer Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "Admin@123456"
  }'
```

**Resposta:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "username": "admin",
    "role": "admin"
  }
}
```

### Usar Token em Requisições
```bash
curl -X GET http://localhost:3000/api/employees \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

## 👥 Permissões por Role

### 🔴 Admin
- ✅ Tudo

### 🟠 Manager
- ✅ Gerenciar funcionários e ausências
- ✅ Ver relatórios

### 🟡 User
- ✅ Registrar próprias ausências
- ✅ Ver relatórios

### 🟢 Viewer
- ✅ Apenas visualizar relatórios

## 🛡️ Segurança

### Antes de Deploy

1. **Gere novo JWT_SECRET:**
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```
   Adicione em variáveis de ambiente (CapRover)

2. **Altere todas as senhas padrão:**
   ```bash
   npm run generate-password-hash "NovaSenh@ForteAqui"
   ```

3. **Ative HTTPS** (CapRover faz automaticamente)

4. **Monitore logins:**
   ```sql
   SELECT * FROM audit_logs WHERE action = 'login' ORDER BY timestamp DESC;
   ```

## 🆘 Problemas Comuns

### Erro: "Credenciais inválidas"
- Verifique username e senha
- Senhas são **case-sensitive**

### Erro: "Muitas tentativas"
- Máximo 5 tentativas em 15 minutos
- Aguarde 15 minutos

### Erro: "Token inválido"
- Token expirou (24 horas)
- Faça login novamente

## 📚 Documentação Completa

Veja [AUTHENTICATION.md](AUTHENTICATION.md) para documentação detalhada.

## ✅ Checklist

- [ ] Dependências instaladas (`npm install`)
- [ ] SQL `init-users.sql` executado
- [ ] Login funcionando
- [ ] Senhas padrão foram alteradas
- [ ] JWT_SECRET configurado em produção
- [ ] HTTPS ativado
- [ ] Testes de acesso finalizados

---

Agora seu sistema está **seguro e pronto para produção**! 🚀
