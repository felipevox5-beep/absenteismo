import 'dotenv/config';
import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import multer from 'multer';
import { fileURLToPath } from 'url';
import fs from 'fs/promises';
import { PrismaClient } from '@prisma/client';
import { generateToken, comparePassword, hashPassword, authenticateToken, authorize, AuthUser, checkLoginAttempts, resetLoginAttempts } from './auth.js';
import { GoogleGenAI } from "@google/genai";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const prisma = new PrismaClient();

// =====================================================
// AUDIT LOG HELPER
// =====================================================
async function logAudit(userId: number | null, action: string, tableName?: string, recordId?: number, oldValues?: any, newValues?: any, req?: any) {
  try {
    await prisma.auditLog.create({
      data: {
        userId,
        action,
        tableName,
        recordId,
        oldValues: oldValues || null,
        newValues: newValues || null,
        ipAddress: req?.ip || req?.socket?.remoteAddress || 'unknown',
      }
    });
  } catch (error) {
    console.error('Erro ao salvar log de auditoria:', error);
  }
}

async function startServer() {
  const app = express();
  const PORT = process.env.PORT || 3000;

  app.use(express.json());

  // Logging middleware
  app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
      const duration = Date.now() - start;
      console.log(`[${new Date().toISOString()}] ${req.method} ${req.url} ${res.statusCode} - ${duration}ms`);
    });
    next();
  });

  // Configuração do multer para atestados (Disk Storage para evitar crash de RAM)
  const uploadDir = path.join(__dirname, 'uploads');
  fs.mkdir(uploadDir, { recursive: true }).catch(console.error);
  
  const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, uploadDir)
    },
    filename: function (req, file, cb) {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
      cb(null, file.fieldname + '-' + uniqueSuffix + '-' + file.originalname)
    }
  });
  const upload = multer({ storage: storage });
  
  // Rota estática para servir os uploads
  app.use('/uploads', express.static(uploadDir));

  // =====================================================
  // AUTH ROUTES
  // =====================================================

  app.post('/api/login', async (req, res) => {
    // Rate Limiting (Proteção contra Força Bruta)
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    if (!checkLoginAttempts(ip)) {
      return res.status(429).json({ error: 'Muitas tentativas falhas. Tente novamente em 15 minutos.' });
    }

    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email e senha são obrigatórios' });
    }

    try {
      // 1. Tenta encontrar na tabela SystemUser (Nativo/Novo) primeiro
      let systemUser = await prisma.systemUser.findUnique({ where: { email } });
      
      if (systemUser) {
        const isPasswordValid = systemUser.passwordHash ? await comparePassword(password, systemUser.passwordHash) : false;
        
        if (!isPasswordValid) {
          return res.status(401).json({ error: 'Credenciais inválidas' });
        }

        resetLoginAttempts(ip);

        // Update last login
        await prisma.systemUser.update({
          where: { id: systemUser.id },
          data: { lastLogin: new Date() }
        });

        await logAudit(systemUser.id, 'LOGIN', 'system_users', systemUser.id, null, null, req);

        const authUser: AuthUser = {
          id: systemUser.id,
          username: systemUser.username,
          email: systemUser.email,
          role: systemUser.role as any,
          employeeId: systemUser.employeeId || undefined
        };

        const token = generateToken(authUser);
        return res.json({ 
          token, 
          user: { 
            id: systemUser.id, 
            name: systemUser.username, 
            email: systemUser.email, 
            role: systemUser.role 
          } 
        });
      }

      // 2. Fallback para tabela User (Dump Compatibility) se não achar no SystemUser
      let legacyUser = await prisma.user.findUnique({ where: { email } });
      
      if (legacyUser) {
        // Tenta comparar com bcrypt, se falhar tenta texto plano
        let isPasswordValid = legacyUser.password ? await comparePassword(password, legacyUser.password) : false;
        
        if (!isPasswordValid && password !== legacyUser.password) {
          return res.status(401).json({ error: 'Credenciais inválidas' });
        }

        resetLoginAttempts(ip);

        const authUser: AuthUser = {
          id: 0,
          username: legacyUser.displayName || legacyUser.email,
          email: legacyUser.email,
          role: (legacyUser.role === 'Admin' || legacyUser.role === 'Administrador') ? 'admin' : 'user'
        };

        const token = generateToken(authUser);
        return res.json({ 
          token, 
          user: { 
            id: legacyUser.id, 
            name: legacyUser.displayName, 
            email: legacyUser.email, 
            role: legacyUser.role 
          } 
        });
      }

      return res.status(401).json({ error: 'Credenciais inválidas' });

    } catch (error) {
      console.error('Erro no login:', error);
      res.status(500).json({ error: 'Erro interno no servidor' });
    }
  });

  app.get('/api/me', authenticateToken, (req: any, res) => {
    res.json(req.user);
  });
  
  // =====================================================
  // ADMIN ROUTES (MASTER ONLY)
  // =====================================================
  
  app.get('/api/admin/users', authenticateToken, authorize('MASTER', 'admin'), async (req, res) => {
    try {
      const users = await prisma.systemUser.findMany({
        select: {
          id: true,
          username: true,
          email: true,
          role: true,
          status: true,
          lastLogin: true,
          createdAt: true,
          employeeId: true,
          employee: {
            select: { name: true }
          }
        }
      });
      res.json(users);
    } catch (error) {
      res.status(500).json({ error: 'Erro ao buscar usuários' });
    }
  });

  app.post('/api/admin/users', authenticateToken, authorize('MASTER', 'admin'), async (req: any, res) => {
    const { username, email, password, role, employeeId } = req.body;
    if (!username || !email || !password) {
      return res.status(400).json({ error: 'Dados obrigatórios ausentes' });
    }
    
    try {
      const hashedPassword = await hashPassword(password);
      const newUser = await prisma.systemUser.create({
        data: {
          username,
          email,
          passwordHash: hashedPassword,
          role: role || 'COMUM',
          status: 'ATIVO',
          employeeId: employeeId ? parseInt(employeeId) : null
        }
      });
      
      await logAudit(req.user.id, 'CREATE_USER', 'system_users', newUser.id, null, { username, email, role }, req);
      
      res.status(201).json(newUser);
    } catch (error: any) {
      if (error.code === 'P2002') {
        return res.status(400).json({ error: 'Email ou username já cadastrado' });
      }
      res.status(500).json({ error: 'Erro ao criar usuário' });
    }
  });

  app.patch('/api/admin/users/:id', authenticateToken, authorize('MASTER', 'admin'), async (req: any, res) => {
    const id = parseInt(req.params.id);
    const { role, status, password } = req.body;
    
    try {
      const oldUser = await prisma.systemUser.findUnique({ where: { id } });
      const updateData: any = {};
      if (role) updateData.role = role;
      if (status) updateData.status = status;
      if (password) updateData.passwordHash = await hashPassword(password);
      
      const updatedUser = await prisma.systemUser.update({
        where: { id },
        data: updateData
      });
      
      await logAudit(req.user.id, 'UPDATE_USER', 'system_users', id, oldUser, updateData, req);
      
      res.json(updatedUser);
    } catch (error) {
      res.status(500).json({ error: 'Erro ao atualizar usuário' });
    }
  });

  app.delete('/api/admin/users/:id', authenticateToken, authorize('MASTER', 'admin'), async (req: any, res) => {
    const id = parseInt(req.params.id);
    try {
      await prisma.systemUser.delete({ where: { id } });
      await logAudit(req.user.id, 'DELETE_USER', 'system_users', id, null, null, req);
      res.json({ message: 'Usuário removido com sucesso' });
    } catch (error) {
      res.status(500).json({ error: 'Erro ao remover usuário' });
    }
  });

  app.get('/api/admin/logs', authenticateToken, authorize('MASTER', 'admin'), async (req, res) => {
    try {
      const logs = await prisma.auditLog.findMany({
        take: 100,
        orderBy: { timestamp: 'desc' },
        include: {
          user: {
            select: { username: true }
          }
        }
      });
      
      // Convert BigInt IDs to Number for JSON
      const sanitizedLogs = logs.map(log => ({
        ...log,
        id: Number(log.id),
        recordId: log.recordId ? Number(log.recordId) : null
      }));
      
      res.json(sanitizedLogs);
    } catch (error) {
      res.status(500).json({ error: 'Erro ao buscar logs' });
    }
  });

  // =====================================================
  // PROTECTED API ROUTES
  // =====================================================

  app.get('/api/employees', authenticateToken, async (req, res) => {
    try {
      const employees = await prisma.employee.findMany({
        where: { status: 'ativo' },
        orderBy: { name: 'asc' }
      });
      res.json(employees);
    } catch (error) {
      res.status(500).json({ error: 'Erro ao buscar funcionários' });
    }
  });

  app.post('/api/employees', authenticateToken, async (req, res) => {
    const { name, sector } = req.body;
    if (!name || !sector) {
      return res.status(400).json({ error: 'Nome e setor são obrigatórios' });
    }
    try {
      const newEmployee = await prisma.employee.create({
        data: { name, sector, status: 'ativo' }
      });
      res.status(201).json(newEmployee);
    } catch (error) {
      res.status(500).json({ error: 'Erro ao criar funcionário' });
    }
  });

  app.delete('/api/employees/:id', authenticateToken, async (req, res) => {
    const id = parseInt(req.params.id);
    try {
      await prisma.employee.update({
        where: { id },
        data: { status: 'inativo' }
      });
      res.json({ message: 'Funcionário desativado com sucesso' });
    } catch (error) {
      res.status(500).json({ error: 'Erro ao remover funcionário' });
    }
  });

  app.get('/api/absences', authenticateToken, async (req, res) => {
    try {
      const absences = await prisma.absence.findMany({
        orderBy: { date: 'desc' },
        take: 100
      });
      // Convert BigInt to Number for JSON compatibility
      const sanitized = absences.map(a => ({
        ...a,
        id: Number(a.id)
      }));
      res.json(sanitized);
    } catch (error) {
      res.status(500).json({ error: 'Erro ao buscar ausências' });
    }
  });

  app.post('/api/absences', authenticateToken, upload.single('atestado'), async (req: any, res) => {
    try {
      const { employeeId, type, reason, date, cid, time } = req.body;
      const file = req.file;

      if (!employeeId || !type || !date) {
        return res.status(400).json({ error: 'Dados obrigatórios ausentes' });
      }

      const empIdInt = parseInt(employeeId);
      
      // Check for recurrence if CID is provided
      let recurrenceWarning = false;
      if (type === 'atestado' && cid) {
        const count = await prisma.absence.count({
          where: { employeeId: empIdInt, cid: cid }
        });
        if (count >= 2) recurrenceWarning = true;
      }

      const newAbsence = await prisma.absence.create({
        data: {
          employeeId: empIdInt,
          type,
          reason: reason || '',
          cid: cid || null,
          date: new Date(date),
          time: time || null,
          atestadoFilename: file ? file.filename : null,
          status: 'registrado'
        }
      });

      res.status(201).json({ ...newAbsence, id: Number(newAbsence.id), recurrenceWarning });
    } catch (error) {
      console.error('Erro ao salvar ausência:', error);
      res.status(500).json({ error: 'Erro interno ao salvar ausência' });
    }
  });

  app.delete('/api/absences/:id', authenticateToken, async (req, res) => {
    const id = parseInt(req.params.id);
    try {
      await prisma.absence.delete({
        where: { id }
      });
      res.json({ message: 'Registro removido com sucesso' });
    } catch (error) {
      console.error('Erro ao excluir ausência:', error);
      res.status(500).json({ error: 'Erro ao remover registro' });
    }
  });

  app.get('/api/reports', authenticateToken, async (req, res) => {
    try {
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const employees = await prisma.employee.findMany({
        where: { status: 'ativo' },
        include: {
          absences: {
            where: {
              date: {
                gte: startOfMonth
              }
            }
          }
        }
      });

      const report = employees.map(emp => ({
        id: emp.id,
        name: emp.name,
        sector: emp.sector,
        totalAbsences: emp.absences.length,
        atestados: emp.absences.filter(a => a.type === 'atestado').length,
        motivosPessoais: emp.absences.filter(a => a.type === 'motivo_pessoal').length
      }));
      res.json(report);
    } catch (error) {
      res.status(500).json({ error: 'Erro ao gerar relatório' });
    }
  // =====================================================
  // AI ROUTES
  // =====================================================
  app.post('/api/ai/cid-lookup', authenticateToken, async (req, res) => {
    try {
      const { cid } = req.body;
      if (!cid) return res.status(400).json({ error: 'CID é obrigatório' });

      // Local fallback dictionary for common CIDs
      const localCids: Record<string, string> = {
        'J01': 'Sinusite aguda',
        'J06': 'Infecções agudas das vias aéreas superiores',
        'M54': 'Dorsalgia (Dor nas costas)',
        'B34': 'Doença por vírus, localização não especificada',
        'Z00': 'Exame geral e investigação de pessoas sem queixas',
        'A09': 'Diarreia e gastroenterite de origem infecciosa',
        'J11': 'Influenza [gripe]',
        'K29': 'Gastrite e duodenite'
      };

      const normalizedCid = cid.toUpperCase().trim();
      if (localCids[normalizedCid]) {
        return res.json({ description: localCids[normalizedCid] });
      }

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey || apiKey === '') {
        return res.json({ description: 'CID não encontrado na base local (IA offline)' });
      }
      
      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Analise o código CID-10: ${cid}. Qual é o nome ou descrição curta da doença?`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: "object",
            properties: {
              description: { type: "string" }
            },
            required: ["description"]
          }
        }
      });
      
      const result = JSON.parse(response.text || '{}');
      res.json({ description: result.description || 'CID não identificado' });
    } catch (error) {
      console.error('Erro na IA:', error);
      res.status(500).json({ error: 'Erro ao consultar IA' });
    }
  });

  app.post('/api/ai/verify-attachment', authenticateToken, upload.single('file'), async (req: any, res) => {
    try {
      const file = req.file;
      const { employeeName, cid } = req.body;

      if (!file) return res.status(400).json({ error: 'Arquivo é obrigatório' });
      
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) throw new Error("Chave do Gemini não configurada.");

      const ai = new GoogleGenAI({ apiKey });
      
      // Converte o arquivo lido do disco para base64 para enviar ao Gemini
      const fileBuffer = await fs.readFile(file.path);
      const base64Data = fileBuffer.toString('base64');
      
      const prompt = `Analise este atestado médico de forma rigorosa. 
        Dados do Sistema:
        - Nome do Colaborador: "${employeeName}"
        - CID Informado: "${cid || 'NÃO INFORMADO'}"
 
        Sua tarefa:
        1. O nome no documento é o mesmo ou muito similar ao do sistema?
        2. O diagnóstico ou CID no papel confere com o informado? 
        3. O documento parece ser um atestado médico legítimo?
 
        Responda em formato JSON conforme o schema. No campo "message", seja curto e técnico em português.`;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: {
          parts: [
            { text: prompt },
            { inlineData: { data: base64Data, mimeType: file.mimetype } }
          ]
        },
        config: { 
          responseMimeType: "application/json",
          responseSchema: {
            type: "object",
            properties: {
              nameOk: { type: "boolean" },
              cidOk: { type: "boolean" },
              isLegit: { type: "boolean" },
              message: { type: "string" }
            },
            required: ["nameOk", "cidOk", "isLegit", "message"]
          }
        }
      });

      const result = JSON.parse(response.text || '{}');
      res.json(result);
    } catch (error) {
      console.error('Erro na verificação de IA:', error);
      res.status(500).json({ error: 'Erro na análise de IA' });
    } finally {
      if (req.file && req.file.path) {
         await fs.unlink(req.file.path).catch(e => console.error("Erro ao limpar arquivo tmp", e));
      }
    }
  });


  // Vite middleware setup
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT} [POSTGRES_MODE]`);
  });
}

startServer();
