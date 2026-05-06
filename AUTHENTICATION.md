# 🔐 Autenticação e Segurança - Guia Completo

## 📋 Visão Geral

O sistema de controle de absenteísmo possui um sistema robusto de autenticação com:

- ✅ Criptografia de senha com **bcrypt** (10 salt rounds)
- ✅ JWT tokens com expiração de **24 horas**
- ✅ Rate limiting (máximo 5 tentativas em 15 minutos)
- ✅ Validação de força de senha
- ✅ Controle de acesso por roles (admin, manager, user, viewer)
- ✅ Auditoria completa de acessos

## 🔐 Usuários Padrão

### Admin (Administrador)
```
Usuário: admin
Senha: Admin@123456
Email: admin@empresa.com
Role: admin
Permissões: Acesso total ao sistema
```

### Manager (Gerente)
```
Usuário: manager
Senha: Manager@12345
Email: manager@empresa.com
Role: manager
Permissões: Gerenciar funcionários e ausências
```

### User (Usuário)
```
Usuário: user
Senha: User@123456
Email: user@empresa.com
Role: user
Permissões: Visualizar e registrar próprias ausências
```

### Viewer (Visualizador)
```
Usuário: viewer
Senha: Viewer@123456
Email: viewer@empresa.com
Role: viewer
Permissões: Apenas visualizar relatórios
```

## 🚀 Endpoints de Autenticação

### 1. Login

**Endpoint:**
```
POST /api/auth/login
Content-Type: application/json

{
  "username": "admin",
  "password": "Admin@123456"
}
```

**Resposta (200 OK):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "username": "admin",
    "email": "admin@empresa.com",
    "role": "admin",
    "employeeId": 1
  },
  "expiresIn": "24h"
}
```

**Resposta (401 Unauthorized):**
```json
{
  "error": "Credenciais inválidas"
}
```

### 2. Logout

**Endpoint:**
```
POST /api/auth/logout
Authorization: Bearer TOKEN
```

**Resposta (200 OK):**
```json
{
  "message": "Desconectado com sucesso"
}
```

### 3. Validar Token

**Endpoint:**
```
GET /api/auth/validate
Authorization: Bearer TOKEN
```

**Resposta (200 OK):**
```json
{
  "valid": true,
  "user": {
    "id": 1,
    "username": "admin",
    "email": "admin@empresa.com",
    "role": "admin"
  }
}
```

### 4. Alterar Senha

**Endpoint:**
```
POST /api/auth/change-password
Authorization: Bearer TOKEN
Content-Type: application/json

{
  "currentPassword": "Admin@123456",
  "newPassword": "NovaSenh@2024"
}
```

### 5. Criar Novo Usuário (Admin Only)

**Endpoint:**
```
POST /api/auth/users
Authorization: Bearer TOKEN
Content-Type: application/json

{
  "username": "novo_usuario",
  "email": "novo@empresa.com",
  "password": "Senh@Forte123",
  "role": "user",
  "employeeId": 5
}
```

## 🔑 Como Usar o Token JWT

### Frontend (JavaScript/React)

```typescript
// 1. Fazer login
const response = await fetch('/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    username: 'admin',
    password: 'Admin@123456'
  })
});

const data = await response.json();
const token = data.token;

// 2. Guardar token (localStorage ou sessionStorage)
localStorage.setItem('auth_token', token);

// 3. Usar token em requisições subsequentes
const apiResponse = await fetch('/api/employees', {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

// 4. Fazer logout
localStorage.removeItem('auth_token');
```

### Backend/Postman

Use o header `Authorization` com o token:

```
GET /api/employees
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## 🔐 Requisitos de Senha Forte

Toda senha deve ter:

- ✅ **Mínimo 8 caracteres**
- ✅ **Letras maiúsculas** (A-Z)
- ✅ **Letras minúsculas** (a-z)
- ✅ **Números** (0-9)
- ✅ **Caracteres especiais** (!@#$%^&*)

**Exemplo de senhas válidas:**
- ✅ `Admin@123456`
- ✅ `Senh@Forte2024`
- ✅ `MyP@ssw0rd!`

**Exemplo de senhas inválidas:**
- ❌ `12345678` (sem letras/caracteres especiais)
- ❌ `abcdef` (sem maiúsculas/números/especiais)
- ❌ `Admin123` (sem caracteres especiais)

## 🔧 Gerar Hash de Senha

Para criar um novo usuário ou alterar senha no banco manualmente:

```bash
# Usar o script disponível
npm run generate-password-hash "SuaSenh@123"
```

**Saída:**
```
✅ Hash gerado com sucesso!

📋 Hash (copie para usar no SQL):
   $2a$10$N9qo8uLOickgx2ZMRZoMye6YD8EfvwbQZxKA4I5Y0WqjpU.FRB.vq

📝 Exemplo de INSERT SQL:
   INSERT INTO system_users (username, email, password_hash, role, status)
   VALUES ('seu_usuario', 'seu_email@empresa.com', '$2a$10$N9qo...', 'user', 'ativo');
```

### Alternativa com Node.js

```bash
node -e "require('bcryptjs').hash('SuaSenh@123', 10).then(h => console.log(h))"
```

## 👥 Controle de Acesso (Roles)

| Função | Admin | Manager | User | Viewer |
|--------|-------|---------|------|--------|
| Ver funcionários | ✅ | ✅ | ✅ | ✅ |
| Criar funcionário | ✅ | ✅ | ❌ | ❌ |
| Editar funcionário | ✅ | ✅ | ❌ | ❌ |
| Deletar funcionário | ✅ | ❌ | ❌ | ❌ |
| Registrar ausência | ✅ | ✅ | ✅ | ❌ |
| Editar ausência | ✅ | ✅ | Própria | ❌ |
| Deletar ausência | ✅ | ✅ | ❌ | ❌ |
| Ver relatórios | ✅ | ✅ | ✅ | ✅ |
| Gerenciar usuários | ✅ | ❌ | ❌ | ❌ |
| Configurações sistema | ✅ | ❌ | ❌ | ❌ |

## 🛡️ Segurança - Boas Práticas

### ✅ Faça

1. **Altere as senhas padrão** imediatamente após o deploy
   ```sql
   -- Alterar senha do admin
   UPDATE system_users 
   SET password_hash = (SELECT crypt('NovaSenh@ForteAqui', gen_salt('bf')))
   WHERE username = 'admin';
   ```

2. **Use HTTPS em produção**
   - CapRover ativa automaticamente com Let's Encrypt

3. **Mantenha JWT_SECRET forte**
   - Mude em produção (no `.env` do CapRover)
   - Não commite no Git

4. **Revise acessos regularmente**
   ```sql
   SELECT username, role, last_login FROM system_users ORDER BY last_login;
   ```

5. **Monitore login attempts**
   ```sql
   SELECT * FROM audit_logs WHERE action = 'login' ORDER BY timestamp DESC LIMIT 50;
   ```

### ❌ Não Faça

1. ❌ Enviar senhas via email
2. ❌ Guardar tokens em localStorage sem HTTPS
3. ❌ Reutilizar JWT_SECRET entre ambientes
4. ❌ Logar senhas nos logs
5. ❌ Deixar senhas padrão em produção

## 📊 Auditoria de Acesso

Todos os logins são registrados em `audit_logs`:

```sql
SELECT 
  u.username,
  a.action,
  a.timestamp,
  a.ip_address
FROM audit_logs a
JOIN system_users u ON a.user_id = u.id
WHERE a.action = 'login'
ORDER BY a.timestamp DESC
LIMIT 10;
```

## 🔄 Renovar Token

Tokens JWT expiram em **24 horas**. Para renovar:

```typescript
// Fazer login novamente
const response = await fetch('/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    username: 'seu_usuario',
    password: 'sua_senha'
  })
});

const { token } = await response.json();
localStorage.setItem('auth_token', token);
```

## 🆘 Recuperação de Acesso

Se perder acesso (esquecer senha):

1. **Acesso ao banco de dados (Admin):**
   ```sql
   -- Resetar senha para Admin@123456
   UPDATE system_users 
   SET password_hash = '$2a$10$N9qo8uLOickgx2ZMRZoMye6YD8EfvwbQZxKA4I5Y0WqjpU.FRB.vq'
   WHERE username = 'seu_usuario';
   ```

2. **Via terminal (com Node.js):**
   ```bash
   npm run generate-password-hash "NovaSenh@123"
   # Copiar o hash
   # UPDATE no banco com novo hash
   ```

## 📞 Troubleshooting

### ❌ "Token inválido"
- Token expirou (24 horas)
- **Solução:** Fazer login novamente

### ❌ "Acesso negado"
- Role insuficiente para a ação
- **Solução:** Contatar admin para elevar permissão

### ❌ "Muitas tentativas de login"
- Bloqueio por rate limiting (5 tentativas em 15 min)
- **Solução:** Aguardar 15 minutos e tentar novamente

### ❌ "Email já registrado"
- Usuário já existe
- **Solução:** Usar email diferente ou alterar no banco

## 📚 Referências

- [bcryptjs - NPM](https://www.npmjs.com/package/bcryptjs)
- [jsonwebtoken - NPM](https://www.npmjs.com/package/jsonwebtoken)
- [OWASP Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)

---

**Última atualização:** Abril 2026
**Versão:** 1.0
