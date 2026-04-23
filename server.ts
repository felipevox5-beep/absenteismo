import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import multer from 'multer';
import { fileURLToPath } from 'url';
import fs from 'fs/promises';
import { PrismaClient } from '@prisma/client';
import { generateToken, comparePassword, authenticateToken, AuthUser } from './auth.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const prisma = new PrismaClient();

async function startServer() {
  const app = express();
  const PORT = process.env.PORT || 3000;

  app.use(express.json());

  // Configuração do multer para atestados
  const storage = multer.memoryStorage();
  const upload = multer({ storage: storage });

  // =====================================================
  // AUTH ROUTES
  // =====================================================

  app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email e senha são obrigatórios' });
    }

    try {
      // Tenta encontrar na tabela User (dump compatibility) ou SystemUser (nativo)
      let foundUser = await prisma.user.findUnique({ where: { email } });
      
      if (!foundUser) {
        return res.status(401).json({ error: 'Credenciais inválidas' });
      }

      // Verificação de senha
      const isPasswordValid = foundUser.password ? await comparePassword(password, foundUser.password) : false;
      
      // Fallback para senha em texto plano se o hash falhar (apenas para compatibilidade inicial do dump se necessário)
      if (!isPasswordValid && password !== foundUser.password) {
        return res.status(401).json({ error: 'Credenciais inválidas' });
      }

      const authUser: AuthUser = {
        id: 0, // Prisma User table uses string IDs
        username: foundUser.displayName || foundUser.email,
        email: foundUser.email,
        role: (foundUser.role === 'Admin' || foundUser.role === 'Administrador') ? 'admin' : 'user'
      };

      const token = generateToken(authUser);
      res.json({ 
        token, 
        user: { 
          id: foundUser.id, 
          name: foundUser.displayName, 
          email: foundUser.email, 
          role: foundUser.role 
        } 
      });
    } catch (error) {
      console.error('Erro no login:', error);
      res.status(500).json({ error: 'Erro interno no servidor' });
    }
  });

  app.get('/api/me', authenticateToken, (req: any, res) => {
    res.json(req.user);
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
      const { employeeId, type, reason, date, cid } = req.body;
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
          atestadoFilename: file ? file.originalname : null,
          status: 'registrado'
        }
      });

      res.status(201).json({ ...newAbsence, id: Number(newAbsence.id), recurrenceWarning });
    } catch (error) {
      console.error('Erro ao salvar ausência:', error);
      res.status(500).json({ error: 'Erro interno ao salvar ausência' });
    }
  });

  app.get('/api/reports', authenticateToken, async (req, res) => {
    try {
      const employees = await prisma.employee.findMany({
        where: { status: 'ativo' },
        include: {
          absences: true
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
