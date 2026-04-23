import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import multer from 'multer';
import { fileURLToPath } from 'url';
import fs from 'fs/promises';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_PATH = path.join(__dirname, 'db.json');

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Data persistence helpers
  const loadData = async () => {
    try {
      const data = await fs.readFile(DB_PATH, 'utf-8');
      return JSON.parse(data);
    } catch (e) {
      return {
        absences: [],
        employees: [
          { id: 1, name: 'Alice Silva', sector: 'Produção' },
          { id: 2, name: 'Bob Oliveira', sector: 'Logística' },
          { id: 3, name: 'Carol Santos', sector: 'Produção' },
          { id: 4, name: 'David Lima', sector: 'RH' }
        ]
      };
    }
  };

  const saveData = async (data: any) => {
    await fs.writeFile(DB_PATH, JSON.stringify(data, null, 2));
  };

  let { absences, employees } = await loadData();

  // Configuração do multer para atestados
  const storage = multer.memoryStorage();
  const upload = multer({ storage: storage });

  // API Routes
  app.get('/api/employees', (req, res) => {
    res.json(employees);
  });

  app.delete('/api/employees/:id', async (req, res) => {
    const id = parseInt(req.params.id);
    const employeeIndex = employees.findIndex((e: any) => e.id === id);
    
    if (employeeIndex === -1) {
      return res.status(404).json({ error: 'Funcionário não encontrado' });
    }

    // Remove employee
    employees.splice(employeeIndex, 1);
    
    // Optional: Remove associated absences or keep them orphaned. 
    // For this app, let's remove associated absences to keep data clean.
    absences = absences.filter((a: any) => a.employeeId !== id);

    await saveData({ absences, employees });
    res.json({ message: 'Funcionário e registros associados removidos com sucesso' });
  });

  app.post('/api/employees', async (req, res) => {
    const { name, sector } = req.body;
    if (!name || !sector) {
      return res.status(400).json({ error: 'Nome e setor são obrigatórios' });
    }
    const newEmployee = {
      id: employees.length > 0 ? Math.max(...employees.map((e: any) => e.id)) + 1 : 1,
      name,
      sector
    };
    employees.push(newEmployee);
    await saveData({ absences, employees });
    res.status(201).json(newEmployee);
  });

  app.get('/api/absences', (req, res) => {
    res.json(absences);
  });

  app.post('/api/absences', upload.single('atestado'), async (req, res) => {
    console.log('[DEBUG] Receiving POST /api/absences', req.body);
    try {
      const { employeeId, type, reason, date, cid } = req.body;
      const file = req.file;

      if (!employeeId || !type || !date) {
        return res.status(400).json({ error: 'Dados obrigatórios ausentes (ID, Tipo ou Data)' });
      }

      const empIdInt = parseInt(employeeId);
      if (isNaN(empIdInt)) {
        return res.status(400).json({ error: 'ID do colaborador inválido' });
      }
      
      // Check for recurrence if CID is provided
      let recurrenceWarning = false;
      if (type === 'atestado' && cid) {
        const existingSameCid = absences.filter((a: any) => a.employeeId === empIdInt && a.cid === cid);
        if (existingSameCid.length >= 2) { // 2 existing + 1 new = 3 entries
          recurrenceWarning = true;
        }
      }

      const newAbsence = {
        id: Date.now(),
        employeeId: empIdInt,
        type, // 'atestado' ou 'motivo_pessoal'
        reason: reason || '',
        cid: cid || null,
        date: date || new Date().toISOString(),
        atestadoName: file ? file.originalname : null,
        createdAt: new Date().toISOString()
      };

      absences.push(newAbsence);
      await saveData({ absences, employees });
      
      // Alerta ao gestor
      console.log(`[SISTEMA] Registro salvo: Colaborador ${empIdInt} - Tipo: ${type}`);
      
      res.status(201).json({ ...newAbsence, recurrenceWarning });
    } catch (error) {
      console.error('[ERRO_SERVIDOR] Falha ao processar ausência:', error);
      res.status(500).json({ error: 'Erro interno no Kernel do Servidor' });
    }
  });

  app.delete('/api/absences/:id', async (req, res) => {
    const id = parseInt(req.params.id);
    const absenceIndex = absences.findIndex((a: any) => a.id === id);
    
    if (absenceIndex === -1) {
      return res.status(404).json({ error: 'Registro não encontrado' });
    }

    absences.splice(absenceIndex, 1);
    await saveData({ absences, employees });
    res.json({ message: 'Registro removido com sucesso' });
  });

  app.get('/api/reports', (req, res) => {
    // Relatório completo simplificado
    const report = employees.map((emp: any) => {
      const empAbsences = absences.filter((a: any) => a.employeeId === emp.id);
      return {
        ...emp,
        totalAbsences: empAbsences.length,
        atestados: empAbsences.filter((a: any) => a.type === 'atestado').length,
        motivosPessoais: empAbsences.filter((a: any) => a.type === 'motivo_pessoal').length
      };
    });
    res.json(report);
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
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
