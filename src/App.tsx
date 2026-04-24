import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI } from "@google/genai";
import { 
  Users, 
  FileText, 
  AlertCircle, 
  Plus, 
  BarChart3, 
  Calendar, 
  Paperclip,
  User as UserIcon,
  Info,
  CheckCircle2,
  X,
  ChevronRight,
  Activity,
  Terminal,
  ShieldCheck,
  Cpu,
  Search,
  Stethoscope,
  TrendingUp,
  Award,
  BarChart,
  ShieldAlert,
  FileSearch,
  Trash2,
  Download,
  Lock,
  Mail,
  Eye,
  EyeOff,
  LogOut
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface Employee {
  id: number;
  name: string;
  sector: string;
}

interface Absence {
  id: number;
  employeeId: number;
  type: 'atestado' | 'motivo_pessoal';
  reason: string;
  cid?: string;
  date: string;
  atestadoName?: string;
  createdAt: string;
}

interface ReportItem extends Employee {
  totalAbsences: number;
  atestados: number;
  motivosPessoais: number;
}

// =====================================================
// COMPONENTE DE LOGIN (PREMIUM)
// =====================================================

function LoginView({ onLogin }: { onLogin: (token: string, user: any) => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 10000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Falha na autenticação');
      
      onLogin(data.token, data.user);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0F1115] flex items-center justify-center p-4 relative overflow-hidden tech-grid">
      {/* Background elements */}
      <div className="absolute top-1/4 -left-20 w-96 h-96 bg-green-500/10 blur-[120px] rounded-full"></div>
      <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-blue-500/10 blur-[120px] rounded-full"></div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-[420px] bg-white border border-slate-200 rounded-3xl p-10 shadow-[0_30px_60px_rgba(0,0,0,0.3)] relative z-10"
      >
        <div className="flex flex-col items-center mb-10">
          <img src="/logos/gestorprologo.png" alt="Gestor Pro" className="h-20" />
        </div>

        {error && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-6 p-3 bg-rose-500/10 border border-rose-500/50 rounded-lg flex items-center gap-3 text-rose-500 text-xs font-mono"
          >
            <ShieldAlert size={16} />
            {error}
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <Mail size={12} className="text-slate-300" />
              Email
            </label>
            <input 
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="seu@email.com"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-slate-900 font-mono text-sm outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500/10 transition-all placeholder:text-slate-300"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <Lock size={12} className="text-slate-300" />
              Senha
            </label>
            <div className="relative">
              <input 
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-slate-900 font-mono text-sm outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500/10 transition-all placeholder:text-slate-300"
              />
              <button 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500 transition-colors"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button 
            type="submit"
            disabled={isLoading}
            className="w-full bg-slate-900 hover:bg-black disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-[0.98] shadow-lg mt-8"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <>
                <ShieldCheck size={20} />
                <span>ENTRAR NO SISTEMA</span>
              </>
            )}
          </button>
        </form>


      </motion.div>
    </div>
  );
}

// =====================================================
// APP PRINCIPAL
// =====================================================

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('auth_token'));
  
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [absences, setAbsences] = useState<Absence[]>([]);
  const [report, setReport] = useState<ReportItem[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEmployeeModalOpen, setIsEmployeeModalOpen] = useState(false);
  const [isInsightsOpen, setIsInsightsOpen] = useState(false);
  const [notifications, setNotifications] = useState<{id: string, text: string}[]>([]);

  const addNotification = (text: string) => {
    const id = Date.now().toString();
    setNotifications(prev => [{ id, text }, ...prev].slice(0, 5));
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 10000);
  };
  
  // Form state
  const [formData, setFormData] = useState({
    employeeId: '',
    type: 'atestado' as 'atestado' | 'motivo_pessoal',
    reason: '',
    cid: '',
    date: new Date().toISOString().split('T')[0]
  });

  const [employeeFormData, setEmployeeFormData] = useState({
    name: '',
    sector: ''
  });
  const [cidDescription, setCidDescription] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [isVerifyingFile, setIsVerifyingFile] = useState(false);
  const [verificationError, setVerificationError] = useState<string | null>(null);
  const [verificationSuccess, setVerificationSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (verificationError) {
      const timer = setTimeout(() => setVerificationError(null), 10000);
      return () => clearTimeout(timer);
    }
  }, [verificationError]);

  useEffect(() => {
    if (verificationSuccess) {
      const timer = setTimeout(() => setVerificationSuccess(null), 10000);
      return () => clearTimeout(timer);
    }
  }, [verificationSuccess]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [logFilterStart, setLogFilterStart] = useState('');
  const [logFilterEnd, setLogFilterEnd] = useState('');
  const [recurrenceInfo, setRecurrenceInfo] = useState<{empName: string, cid: string} | null>(null);
  const [historyEmployee, setHistoryEmployee] = useState<Employee | null>(null);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [viewingDetails, setViewingDetails] = useState<'employees' | 'atestados' | 'pessoais' | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [deletingLogId, setDeletingLogId] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auth check and persistence
  useEffect(() => {
    if (token) {
      checkAuth();
    }
  }, [token]);

  const checkAuth = async () => {
    try {
      const res = await fetch('/api/me', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const userData = await res.json();
        setUser(userData);
        setIsAuthenticated(true);
        fetchData();
      } else {
        handleLogout();
      }
    } catch (error) {
      handleLogout();
    }
  };

  const handleLogin = (newToken: string, userData: any) => {
    localStorage.setItem('auth_token', newToken);
    setToken(newToken);
    setUser(userData);
    setIsAuthenticated(true);
    addNotification(`[SESSÃO_INICIADA] Bem-vindo, ${userData.name || userData.email}`);
  };

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    setToken(null);
    setUser(null);
    setIsAuthenticated(false);
  };

  // API helper to include token
  const apiFetch = async (url: string, options: any = {}) => {
    const headers = {
      ...options.headers,
      'Authorization': `Bearer ${token}`
    };
    const res = await fetch(url, { ...options, headers });
    if (res.status === 401 || res.status === 403) {
      handleLogout();
      throw new Error('Sessão expirada');
    }
    return res;
  };

  const fetchData = async () => {
    if (!token) return;
    try {
      const [empsRes, absRes, repRes] = await Promise.all([
        apiFetch('/api/employees'),
        apiFetch('/api/absences'),
        apiFetch('/api/reports')
      ]);

      if (empsRes.ok) {
        const data = await empsRes.json();
        if (Array.isArray(data)) setEmployees(data);
      }
      if (absRes.ok) {
        const data = await absRes.json();
        if (Array.isArray(data)) setAbsences(data);
      }
      if (repRes.ok) {
        const data = await repRes.json();
        if (Array.isArray(data)) setReport(data);
      }
    } catch (error) {
      console.error('Erro ao buscar dados:', error);
      addNotification("ERRO: Falha ao sincronizar dados com o servidor.");
    }
  };

  const getInsights = () => {
    // Top Offenders - Atestados
    const atestadoCounts = report.map(r => ({ name: r.name, count: r.atestados }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 3);
    
    // Top Offenders - Justificativas
    const justificativaCounts = report.map(r => ({ name: r.name, count: r.motivosPessoais }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 3);

    // Common CIDs
    const cidMap: Record<string, number> = {};
    absences.forEach(a => {
      if (a.type === 'atestado' && a.cid) {
        cidMap[a.cid] = (cidMap[a.cid] || 0) + 1;
      }
    });
    const topCids = Object.entries(cidMap)
      .map(([cid, count]) => ({ cid, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 3);

    // Common Personal Reasons
    const reasonMap: Record<string, number> = {};
    absences.forEach(a => {
      if (a.type === 'motivo_pessoal' && a.reason) {
        const r = a.reason.toUpperCase().trim();
        reasonMap[r] = (reasonMap[r] || 0) + 1;
      }
    });
    const topReasons = Object.entries(reasonMap)
      .map(([reason, count]) => ({ reason, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 3);

    return { atestadoCounts, justificativaCounts, topCids, topReasons };
  };

  const insights = getInsights();

  const handleAddEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!employeeFormData.name || !employeeFormData.sector) return;

    try {
      const res = await apiFetch('/api/employees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(employeeFormData)
      });
      if (res.ok) {
        addNotification(`[SISTEMA] Novo colaborador registrado: ${employeeFormData.name}`);
        setIsEmployeeModalOpen(false);
        setEmployeeFormData({ name: '', sector: '' });
        fetchData();
      }
    } catch (error) {
      console.error('Erro ao adicionar colaborador:', error);
    }
  };

  const handleDeleteEmployee = async (id: number, name: string) => {
    try {
      const response = await apiFetch(`/api/employees/${id}`, {
        method: 'DELETE'
      });
      if (response.ok) {
        addNotification(`[SISTEMA] Colaborador ${name} removido do Kernel.`);
        setDeletingId(null);
        fetchData();
      }
    } catch (error) {
      console.error('Erro ao excluir funcionário:', error);
      addNotification("Erro ao conectar com o servidor para exclusão.");
    }
  };

  const handleDeleteAbsence = async (id: number) => {
    try {
      const response = await apiFetch(`/api/absences/${id}`, {
        method: 'DELETE'
      });
      if (response.ok) {
        addNotification("[SISTEMA] Log removido com sucesso.");
        setDeletingLogId(null);
        fetchData();
      }
    } catch (error) {
      console.error('Erro ao excluir registro:', error);
      addNotification("Erro ao conectar com o servidor para exclusão do log.");
    }
  };

  const lookupCid = async () => {
    if (!formData.cid || formData.cid.length < 3) return;
    setIsAiLoading(true);
    setCidDescription('Identificando...');
    
    try {
      const apiKey = (process.env as any).GEMINI_API_KEY;
      if (!apiKey || apiKey === 'undefined') {
         throw new Error("Chave do Gemini não configurada.");
      }
      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Analise o código CID-10: ${formData.cid}. Qual é o nome ou descrição curta da doença?`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: "object" as any,
            properties: {
              description: { type: "string" as any }
            },
            required: ["description"]
          }
        }
      });
      
      const result = JSON.parse(response.text || '{}');
      setCidDescription(result.description || 'CID não identificado');
    } catch (error) {
      console.error('Erro no lookup de AI:', error);
      setCidDescription('Erro ao identificar CID');
    } finally {
      setIsAiLoading(false);
    }
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve((reader.result as string).split(',')[1]);
      reader.onerror = error => reject(error);
    });
  };

  const verifyAttachment = async () => {
    if (!selectedFile || !formData.employeeId) {
      addNotification("ALERTA: Selecione um colaborador e um arquivo antes de escanear.");
      return;
    }

    setVerificationError(null);
    setVerificationSuccess(null);
    setIsVerifyingFile(true);
    addNotification("[SISTEMA] Iniciando análise de IA no documento...");

    const employee = employees.find(e => e.id === parseInt(formData.employeeId));
    if (!employee) {
      setVerificationError("ERRO: Colaborador não localizado no sistema.");
      setIsVerifyingFile(false);
      return;
    }

    // 1. Filename Correlation Check (Non-blocking warning)
    const fileName = selectedFile.name.toLowerCase();
    const employeeNameParts = employee.name.toLowerCase().split(' ').filter(p => p.length > 2);
    const nameMatches = employeeNameParts.some(part => fileName.includes(part));

    if (!nameMatches && !selectedFile.type.startsWith('image/')) {
      setVerificationError(`AVISO: O nome do arquivo ("${selectedFile.name}") não contém o nome do colaborador. Para uma análise profunda, use arquivos de imagem (JPG/PNG).`);
      setIsVerifyingFile(false);
      return;
    }

    // 2. AI Content Verification (Vision + CID match)
    if (selectedFile.type.startsWith('image/')) {
      try {
        const apiKey = (process.env as any).GEMINI_API_KEY;
        if (!apiKey || apiKey === 'undefined') {
           throw new Error("Chave do Gemini não configurada.");
        }
        const base64Data = await fileToBase64(selectedFile);
        const ai = new GoogleGenAI({ apiKey });
        
        const prompt = `Analise este atestado médico de forma rigorosa. 
        Dados do Sistema:
        - Nome do Colaborador: "${employee.name}"
        - CID Informado: "${formData.cid || 'NÃO INFORMADO'}"

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
              { inlineData: { data: base64Data, mimeType: selectedFile.type } }
            ]
          },
          config: { 
            responseMimeType: "application/json",
            responseSchema: {
              type: "object" as any,
              properties: {
                nameOk: { type: "boolean" as any },
                cidOk: { type: "boolean" as any },
                isLegit: { type: "boolean" as any },
                message: { type: "string" as any }
              },
              required: ["nameOk", "cidOk", "isLegit", "message"]
            }
          }
        });

        const result = JSON.parse(response.text || '{}');
        
        if (result.isLegit === false) {
          setVerificationError(`ALERTA_IA: O documento não parece ser um atestado médico válido. ${result.message || ''}`);
        } else if (result.nameOk === false) {
          setVerificationError(`ALERTA_IA: Nome no documento diverge do colaborador ${employee.name}.`);
        } else if (formData.cid && result.cidOk === false) {
          setVerificationError(`AVISO_IA: O CID ${formData.cid} não foi localizado ou não condiz com o diagnóstico no papel.`);
        } else {
          const successMsg = `Documento validado com sucesso: ${result.message || 'Identidade e CID conferem.'}`;
          addNotification(`[VERIFICAÇÃO_OK] ${successMsg}`);
          setVerificationSuccess(successMsg);
          setVerificationError(null);
        }
      } catch (error) {
        console.error('Erro na verificação de IA:', error);
        setVerificationError("FALHA_SISTEMA: Erro ao processar análise de IA via Kernel. Verifique sua conexão ou tente novamente.");
      }
    } else if (selectedFile.type === 'application/pdf') {
      // PDF handling (simple filename check for now as vision models prefer images)
      if (nameMatches) {
        const pdfMsg = "Nome do arquivo confere com o colaborador. PDFs requerem validação manual do CID.";
        addNotification(`[CHECK_PDF] ${pdfMsg}`);
        setVerificationSuccess(pdfMsg);
        setVerificationError(null);
      } else {
        setVerificationError(`ALERTA: O arquivo PDF "${selectedFile.name}" não contém o nome do colaborador.`);
      }
    }

    setIsVerifyingFile(false);
  };

  const handleAddAbsence = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.employeeId) {
      addNotification("Por favor, selecione um funcionário.");
      return;
    }

    setIsSubmitting(true);
    const data = new FormData();
    data.append('employeeId', formData.employeeId);
    data.append('type', formData.type);
    data.append('reason', formData.reason);
    data.append('cid', formData.cid);
    data.append('date', formData.date);
    if (selectedFile) {
      data.append('atestado', selectedFile);
    }

    try {
      const res = await apiFetch('/api/absences', {
        method: 'POST',
        body: data
      });

      if (!res.ok) {
        let errorMessage = 'Falha ao salvar registro';
        try {
          const errorData = await res.json();
          errorMessage = errorData.error || errorMessage;
        } catch (e) { }
        throw new Error(errorMessage);
      }

      const response = await res.json();
      const empName = employees.find(e => e.id === parseInt(formData.employeeId))?.name || "Funcionário";
      
      if (response.recurrenceWarning) {
        addNotification(`[ALERTA CRÍTICO] Recorrência de CID (${formData.cid}) detectada para ${empName}!`);
        setRecurrenceInfo({ empName, cid: formData.cid });
      }

      addNotification(`Nova entrada: ${empName} (${formData.type})`);
      setIsModalOpen(false);
      resetForm();
      fetchData();
    } catch (error) {
      console.error('Erro ao adicionar ausência:', error);
      const msg = error instanceof Error ? error.message : "Erro ao conectar com o servidor. Tente novamente.";
      addNotification(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      employeeId: '',
      type: 'atestado',
      reason: '',
      cid: '',
      date: new Date().toISOString().split('T')[0]
    });
    setCidDescription('');
    setSelectedFile(null);
    setVerificationError(null);
    setVerificationSuccess(null);
  };

  const exportToCSV = (data: any[], filename: string) => {
    if (data.length === 0) return;
    
    const headers = Object.keys(data[0]).join(',');
    const rows = data.map(obj => 
      Object.values(obj)
        .map(val => {
          const str = String(val).replace(/"/g, '""');
          return `"${str}"`;
        })
        .join(',')
    );
    
    const csvContent = [headers, ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addNotification(`[SISTEMA] Arquivo ${filename}.csv gerado com sucesso.`);
  };

  const exportReportCSV = () => {
    const dataToExport = report.map(item => ({
      ID: item.id,
      Nome: item.name,
      Setor: item.sector,
      Total_Entradas: item.totalAbsences,
      Atestados: item.atestados,
      Motivos_Pessoais: item.motivosPessoais,
      Nivel_Risco: item.totalAbsences > 3 ? 'CRITICO' : 'NORMAL'
    }));
    exportToCSV(dataToExport, 'relatorio_absenteismo');
  };

  const exportLogsCSV = () => {
    const start = logFilterStart ? new Date(logFilterStart + 'T00:00:00').getTime() : 0;
    const end = logFilterEnd ? new Date(logFilterEnd + 'T23:59:59').getTime() : Infinity;

    const filteredLogs = absences.filter(abs => {
      const absDate = new Date(abs.date).getTime();
      return absDate >= start && absDate <= end;
    });

    if (filteredLogs.length === 0) {
      addNotification("ALERTA: Não há dados para exportar no período selecionado.");
      return;
    }

    const dataToExport = filteredLogs.map(abs => {
      const person = employees.find(e => e.id === abs.employeeId);
      return {
        Data: abs.date,
        Colaborador: person?.name || 'N/I',
        Setor: person?.sector || 'N/I',
        Tipo: abs.type === 'atestado' ? 'ATESTADO' : 'PESSOAL',
        CID: abs.cid || '-',
        Justificativa: abs.reason || '',
        Protocolo_ID: abs.id
      };
    });
    exportToCSV(dataToExport, 'logs_absenteismo');
  };

  if (!isAuthenticated) {
    return <LoginView onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-[#0F1115] text-slate-100 font-sans tech-grid p-4 md:p-12 relative overflow-x-hidden">
      {/* Sistema de Toasts (Notificações Flutuantes) */}
      <div className="fixed top-6 right-6 z-[100] flex flex-col gap-3 w-full max-w-[320px] pointer-events-none">
        <AnimatePresence>
          {notifications.map((note) => (
            <motion.div 
              key={note.id}
              initial={{ opacity: 0, x: 50, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 20, scale: 0.95 }}
              className="pointer-events-auto bg-slate-900/90 border border-green-500/30 p-3 rounded shadow-[0_8px_30px_rgb(0,0,0,0.5)] backdrop-blur-md flex justify-between items-start gap-4 group"
            >
              <div className="flex items-start gap-2 pt-0.5">
                <Terminal className="text-green-500 shrink-0 mt-0.5" size={14} />
                <span className="font-mono text-[10px] text-green-500 uppercase tracking-tight leading-tight">{note.text}</span>
              </div>
              <button 
                onClick={() => setNotifications(prev => prev.filter(n => n.id !== note.id))}
                className="opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X size={12} className="text-slate-500 hover:text-white" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <header className="max-w-7xl mx-auto mb-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-800 pb-8">
        <div className="flex items-center gap-6">
          <img src="/logos/gestorprologo.png" alt="Logo" className="h-12 drop-shadow-[0_0_10px_rgba(34,197,94,0.2)]" />
          <div>
          </div>
        </div>

        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex items-center gap-3 mr-4 px-4 py-2 bg-slate-900/50 border border-slate-800 rounded-lg">
             <div className="w-8 h-8 rounded-full bg-green-500/10 flex items-center justify-center text-green-500">
                <UserIcon size={16} />
             </div>
             <div className="flex flex-col">
                <span className="text-[10px] text-white font-bold uppercase truncate max-w-[120px]">{user?.name || user?.email}</span>
                <span className="text-[8px] text-slate-500 font-mono uppercase">{user?.role || 'Usuário'}</span>
             </div>
             <button 
              onClick={handleLogout}
              className="ml-2 p-1.5 text-slate-500 hover:text-rose-500 transition-colors"
              title="Encerrar Sessão"
             >
                <LogOut size={16} />
             </button>
          </div>

          <button 
            onClick={() => setIsInsightsOpen(true)}
            className="bg-transparent border border-orange-500/50 hover:bg-orange-500/10 text-orange-500 px-6 py-3 rounded-md flex items-center gap-2 font-mono text-sm uppercase tracking-widest transition-all shadow-[0_0_15px_rgba(249,115,22,0.1)] active:scale-95"
          >
            <TrendingUp size={18} />
            <span className="hidden sm:inline">[ Dashboard_Insights ]</span>
            <span className="sm:hidden">[ Insights ]</span>
          </button>
          <button 
            onClick={() => setIsEmployeeModalOpen(true)}
            className="bg-transparent border border-blue-500/50 hover:bg-blue-500/10 text-blue-500 px-6 py-3 rounded-md flex items-center gap-2 font-mono text-sm uppercase tracking-widest transition-all shadow-[0_0_15px_rgba(59,130,246,0.1)] active:scale-95"
          >
            <Users size={18} />
            <span className="hidden sm:inline">[ Registar_Colaborador ]</span>
            <span className="sm:hidden">[ + Colab ]</span>
          </button>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-transparent border border-green-500/50 hover:bg-green-500/10 text-green-500 px-6 py-3 rounded-md flex items-center gap-2 font-mono text-sm uppercase tracking-widest transition-all shadow-[0_0_15px_rgba(34,197,94,0.1)] active:scale-95"
            id="btn-registar-falta"
          >
            <Plus size={18} />
            <span className="hidden sm:inline">[ Registrar_Entrada ]</span>
            <span className="sm:hidden">[ + Entrada ]</span>
          </button>
        </div>
      </header>

      {recurrenceInfo && (
        <motion.div 
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="max-w-7xl mx-auto mb-8 bg-rose-500/20 border-2 border-rose-500 p-6 rounded-lg flex items-center justify-between shadow-[0_0_30px_rgba(225,29,72,0.2)]"
        >
          <div className="flex items-center gap-4">
            <ShieldAlert size={32} className="text-rose-500" />
            <div>
              <h4 className="text-lg font-bold text-white uppercase tracking-tighter">Protocolo de Recorrência Ativado</h4>
              <p className="text-rose-400 font-mono text-sm">Detectado 3 ou mais atestados com o CID <span className="font-bold underline">{recurrenceInfo.cid}</span> para o colaborador <span className="font-bold underline">{recurrenceInfo.empName}</span>.</p>
            </div>
          </div>
          <button 
            onClick={() => setRecurrenceInfo(null)}
            className="bg-rose-500 hover:bg-rose-600 text-white px-4 py-2 rounded font-bold transition-colors uppercase text-xs"
          >
            Ciente
          </button>
        </motion.div>
      )}

      <main className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Dash Cards */}
        <div className="lg:col-span-12 grid grid-cols-1 md:grid-cols-3 gap-6 mb-4">
          <div 
            onClick={() => setViewingDetails('employees')}
            className="bg-[#1A1D23] p-6 rounded-lg border border-slate-800 relative overflow-hidden group cursor-pointer hover:border-blue-500/50 transition-all active:scale-[0.98]"
          >
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <Users size={64} />
            </div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
              <span className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider">Membro_Equipe_Ativos</span>
            </div>
            <div className="text-5xl font-mono font-bold tracking-tighter text-white">{employees.length.toString().padStart(2, '0')}</div>
            <div className="text-slate-500 text-[10px] font-mono mt-2 uppercase">Status: Operacional</div>
          </div>

          <div 
            onClick={() => setViewingDetails('atestados')}
            className="bg-[#1A1D23] p-6 rounded-lg border border-slate-800 relative overflow-hidden group cursor-pointer hover:border-rose-500/50 transition-all active:scale-[0.98]"
          >
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity text-rose-500">
              <FileText size={64} />
            </div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-1.5 h-1.5 rounded-full bg-rose-500"></div>
              <span className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider">Registros_Médicos_Mês</span>
            </div>
            <div className="text-5xl font-mono font-bold tracking-tighter text-rose-500">
              {absences.filter(a => a.type === 'atestado').length.toString().padStart(2, '0')}
            </div>
            <div className="text-slate-500 text-[10px] font-mono mt-2 uppercase">Tipo: Atestado</div>
          </div>

          <div 
            onClick={() => setViewingDetails('pessoais')}
            className="bg-[#1A1D23] p-6 rounded-lg border border-slate-800 relative overflow-hidden group cursor-pointer hover:border-orange-500/50 transition-all active:scale-[0.98]"
          >
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity text-orange-500">
              <Info size={64} />
            </div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse"></div>
              <span className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider">Justificativa_Administrativa</span>
            </div>
            <div className="text-5xl font-mono font-bold tracking-tighter text-orange-500">
              {absences.filter(a => a.type === 'motivo_pessoal').length.toString().padStart(2, '0')}
            </div>
            <div className="text-slate-500 text-[10px] font-mono mt-2 uppercase">Tipo: Motivo Pessoal</div>
          </div>
        </div>

        {/* Relatório e Comparativo */}
        <section className="lg:col-span-8 bg-[#1A1D23] rounded-lg border border-slate-800 overflow-hidden shadow-2xl">
          <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-800/20">
            <h2 className="text-sm font-mono font-bold flex items-center gap-2 uppercase tracking-widest text-slate-300">
              <ChevronRight size={14} className="text-green-500" />
              Relatório // Matriz_Comparativa
            </h2>
            <button 
              onClick={exportReportCSV}
              className="group flex items-center gap-2 bg-slate-800 border border-slate-700 hover:border-green-500/50 px-3 py-1.5 rounded text-[10px] font-mono font-bold text-slate-400 hover:text-green-500 transition-all active:scale-95"
              title="Exportar para CSV"
            >
              <Download size={14} />
              EXPORT_DATA
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono">
              <thead>
                <tr className="bg-slate-900/50 text-slate-500 text-[10px] font-bold uppercase tracking-widest">
                  <th className="px-6 py-4 border-b border-slate-800">Identificação</th>
                  <th className="px-6 py-4 border-b border-slate-800 text-center">Setor</th>
                  <th className="px-6 py-4 border-b border-slate-800 text-center">Entradas</th>
                  <th className="px-6 py-4 border-b border-slate-800 text-center">ATS</th>
                  <th className="px-6 py-4 border-b border-slate-800 text-center">MP</th>
                  <th className="px-6 py-4 border-b border-slate-800 ">Nível_Risco</th>
                </tr>
              </thead>
              <tbody>
                {[...report].sort((a, b) => a.sector.localeCompare(b.sector)).map(item => (
                  <tr 
                    key={item.id} 
                    onClick={() => {
                      setHistoryEmployee(item);
                      setIsHistoryModalOpen(true);
                    }}
                    className="border-b border-slate-800 hover:bg-white/5 transition-colors cursor-pointer group"
                  >
                    <td className="px-6 py-4 text-xs font-bold text-white uppercase flex items-center gap-2">
                      <div className="w-6 h-6 rounded border border-slate-700 bg-slate-800 flex items-center justify-center text-[10px] font-bold text-slate-400 shrink-0 group-hover:border-green-500/50 transition-colors">
                        {item.id.toString().padStart(2, '0')}
                      </div>
                      <span className="truncate group-hover:text-green-500 transition-colors">{item.name}</span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-1 rounded border border-slate-700 uppercase">{item.sector}</span>
                    </td>
                    <td className="px-6 py-4 text-center text-sm">{item.totalAbsences}</td>
                    <td className="px-6 py-4 text-center text-rose-500 text-sm">{item.atestados}</td>
                    <td className="px-6 py-4 text-center text-orange-500 text-sm">{item.motivosPessoais}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <div className="flex-1 flex items-center gap-2">
                          <div className="flex-1 bg-slate-800 h-1.5 rounded-full overflow-hidden">
                            <div 
                              className={`h-full ${item.totalAbsences > 3 ? 'bg-rose-600 shadow-[0_0_8px_rgba(225,29,72,0.4)]' : 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]'}`} 
                              style={{ width: `${Math.min(item.totalAbsences * 10, 100)}%` }}
                            />
                          </div>
                          <span className={`text-[10px] font-bold ${item.totalAbsences > 3 ? 'text-rose-500' : 'text-green-500'}`}>
                            {item.totalAbsences > 3 ? 'CRIT' : 'NORM'}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          {deletingId === item.id ? (
                            <div className="flex items-center gap-1">
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteEmployee(item.id, item.name);
                                }}
                                className="bg-rose-500 hover:bg-rose-600 text-[8px] text-white px-2 py-1 rounded font-bold uppercase"
                              >
                                CONFIRMAR
                              </button>
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setDeletingId(null);
                                }}
                                className="bg-slate-700 hover:bg-slate-600 text-[8px] text-white px-2 py-1 rounded font-bold uppercase"
                              >
                                CANCELAR
                              </button>
                            </div>
                          ) : (
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                setDeletingId(item.id);
                              }}
                              className="text-slate-600 hover:text-rose-500 transition-colors p-1"
                              title="Remover Colaborador"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Histórico Recente */}
        <aside className="lg:col-span-4 bg-[#1A1D23] rounded-lg border border-slate-800 p-6 shadow-2xl flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-sm font-mono font-bold flex items-center gap-2 uppercase tracking-widest text-slate-300">
              <Activity className="text-green-500" size={14} /> // Terminal_Logs
            </h2>
            <button 
              onClick={exportLogsCSV}
              className="text-slate-500 hover:text-green-500 transition-colors"
              title="Exportar Logs (respeita o filtro de data)"
            >
              <Download size={16} />
            </button>
          </div>

          {/* Filtros de Data */}
          <div className="grid grid-cols-2 gap-2 mb-6 p-3 bg-slate-900/50 border border-slate-800 rounded">
            <div>
              <label className="block text-[8px] font-mono font-bold text-slate-500 uppercase mb-1">Início</label>
              <input 
                type="date" 
                value={logFilterStart}
                onChange={(e) => setLogFilterStart(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded p-1.5 text-white font-mono text-[10px] outline-none focus:ring-1 focus:ring-green-500/50"
              />
            </div>
            <div>
              <label className="block text-[8px] font-mono font-bold text-slate-500 uppercase mb-1">Fim</label>
              <input 
                type="date" 
                value={logFilterEnd}
                onChange={(e) => setLogFilterEnd(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded p-1.5 text-white font-mono text-[10px] outline-none focus:ring-1 focus:ring-green-500/50"
              />
            </div>
            {(logFilterStart || logFilterEnd) && (
              <button 
                onClick={() => { setLogFilterStart(''); setLogFilterEnd(''); }}
                className="col-span-2 text-[8px] font-mono text-rose-500 uppercase mt-1 hover:underline text-right"
              >
                [ Resetar_Filtro ]
              </button>
            )}
          </div>

          <div className="flex-1 overflow-y-auto space-y-4 max-h-[600px] scrollbar-hide">
            {[...absences]
              .filter(abs => {
                const start = logFilterStart ? new Date(logFilterStart + 'T00:00:00').getTime() : 0;
                const end = logFilterEnd ? new Date(logFilterEnd + 'T23:59:59').getTime() : Infinity;
                const absDate = new Date(abs.date).getTime();
                return absDate >= start && absDate <= end;
              })
              .map((abs) => {
                const person = employees.find(e => e.id === abs.employeeId);
                return (
                  <div key={abs.id} className="relative pl-4 border-l border-slate-800 group hover:border-green-500/50 transition-colors">
                    <div className="flex justify-between items-start mb-1">
                      <span className="text-[10px] font-mono text-slate-500">{new Date(abs.date).toLocaleDateString('pt-BR')}</span>
                      <div className="flex items-center gap-2">
                        <span className={`text-[9px] font-mono px-1.5 rounded ${abs.type === 'atestado' ? 'text-rose-500 bg-rose-500/10' : 'text-orange-500 bg-orange-500/10'}`}>
                          {abs.type === 'atestado' ? 'ATS' : 'ADM'}
                        </span>
                        <button 
                          onClick={() => setDeletingLogId(abs.id)}
                          className="opacity-0 group-hover:opacity-100 text-slate-600 hover:text-rose-500 transition-all p-1"
                        >
                          <Trash2 size={10} />
                        </button>
                      </div>
                    </div>
                    <div className="text-xs font-bold text-white uppercase">{person?.name || '---'}</div>
                    <div className="text-[10px] text-slate-500 font-mono mt-1">
                      {abs.type === 'atestado' ? `CID: ${abs.cid || 'N/A'}` : `MOTIVO: ${abs.reason || '---'}`}
                    </div>

                    {/* Confirmação de exclusão do log */}
                    <AnimatePresence>
                      {deletingLogId === abs.id && (
                        <motion.div 
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.9 }}
                          className="absolute inset-0 bg-slate-900/95 backdrop-blur-sm z-10 flex flex-col items-center justify-center rounded border border-rose-500/30 p-2"
                        >
                          <span className="text-[8px] font-bold text-rose-500 uppercase mb-2">Excluir Log #{abs.id}?</span>
                          <div className="flex gap-2">
                            <button onClick={() => handleDeleteAbsence(abs.id)} className="text-[8px] font-bold bg-rose-500 text-white px-2 py-1 rounded">SIM</button>
                            <button onClick={() => setDeletingLogId(null)} className="text-[8px] font-bold bg-slate-700 text-white px-2 py-1 rounded">NÃO</button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
          </div>
        </aside>
      </main>

      {/* =====================================================
          SISTEMA DE MODAIS (RESPONSIVOS)
      ===================================================== */}
      <AnimatePresence>
        {/* Modal de Insights */}
        {isInsightsOpen && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[#1A1D23] rounded-2xl border border-slate-800 w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl p-6 md:p-10"
            >
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <BarChart3 className="text-orange-500" /> DASHBOARD_INSIGHTS
                </h3>
                <button onClick={() => setIsInsightsOpen(false)} className="text-slate-500 hover:text-white transition-colors">
                  <X size={24} />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Colaboradores com mais Atestados */}
                <div className="bg-slate-900/50 p-6 rounded-xl border border-slate-800">
                  <h4 className="text-xs font-mono font-bold text-rose-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <TrendingUp size={14} /> Top_Recorrência_Atestados
                  </h4>
                  <div className="space-y-4">
                    {insights.atestadoCounts.map((item, i) => (
                      <div key={i} className="flex justify-between items-end border-b border-slate-800 pb-2">
                        <span className="text-sm text-slate-300 truncate pr-4">{item.name}</span>
                        <span className="text-lg font-mono font-bold text-rose-500">{item.count}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Colaboradores com mais Justificativas */}
                <div className="bg-slate-900/50 p-6 rounded-xl border border-slate-800">
                  <h4 className="text-xs font-mono font-bold text-orange-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <Info size={14} /> Top_Motivos_Pessoais
                  </h4>
                  <div className="space-y-4">
                    {insights.justificativaCounts.map((item, i) => (
                      <div key={i} className="flex justify-between items-end border-b border-slate-800 pb-2">
                        <span className="text-sm text-slate-300 truncate pr-4">{item.name}</span>
                        <span className="text-lg font-mono font-bold text-orange-500">{item.count}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* CIDs mais frequentes */}
                <div className="bg-slate-900/50 p-6 rounded-xl border border-slate-800">
                  <h4 className="text-xs font-mono font-bold text-green-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <Stethoscope size={14} /> CIDs_Mais_Frequentes
                  </h4>
                  <div className="space-y-4">
                    {insights.topCids.map((item, i) => (
                      <div key={i} className="flex justify-between items-end border-b border-slate-800 pb-2">
                        <span className="text-sm text-slate-300 uppercase">CID: {item.cid}</span>
                        <span className="text-lg font-mono font-bold text-green-500">{item.count}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Motivos mais comuns */}
                <div className="bg-slate-900/50 p-6 rounded-xl border border-slate-800">
                  <h4 className="text-xs font-mono font-bold text-blue-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <AlertCircle size={14} /> Justificativas_Comuns
                  </h4>
                  <div className="space-y-4">
                    {insights.topReasons.map((item, i) => (
                      <div key={i} className="flex justify-between items-end border-b border-slate-800 pb-2">
                        <span className="text-sm text-slate-300 truncate pr-4">{item.reason}</span>
                        <span className="text-lg font-mono font-bold text-blue-500">{item.count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {/* Modal de Registro de Colaborador */}
        {isEmployeeModalOpen && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 20, opacity: 0 }}
              className="bg-[#1A1D23] rounded-2xl border border-slate-800 w-full max-w-md shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-slate-800 flex justify-between items-center">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Users className="text-blue-500" /> NOVO_COLABORADOR
                </h3>
                <button onClick={() => setIsEmployeeModalOpen(false)} className="text-slate-500 hover:text-white transition-colors">
                  <X size={24} />
                </button>
              </div>
              <form onSubmit={handleAddEmployee} className="p-6 space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest">Nome_Completo</label>
                  <input 
                    type="text" 
                    value={employeeFormData.name}
                    onChange={(e) => setEmployeeFormData({...employeeFormData, name: e.target.value})}
                    placeholder="DIGITE O NOME..."
                    className="w-full bg-slate-900 border border-slate-800 rounded p-3 text-white font-mono text-sm outline-none focus:border-blue-500/50"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest">Setor / Unidade</label>
                  <input 
                    type="text" 
                    value={employeeFormData.sector}
                    onChange={(e) => setEmployeeFormData({...employeeFormData, sector: e.target.value})}
                    placeholder="EX: LOGISTICA, PRODUÇÃO..."
                    className="w-full bg-slate-900 border border-slate-800 rounded p-3 text-white font-mono text-sm outline-none focus:border-blue-500/50"
                  />
                </div>
                <button 
                  type="submit"
                  className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-lg mt-4 transition-all active:scale-95"
                >
                  REGISTRAR_NO_SISTEMA
                </button>
              </form>
            </motion.div>
          </div>
        )}

        {/* Modal Principal (Registrar Falta/Atestado) */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 20, opacity: 0 }}
              className="bg-[#1A1D23] rounded-2xl border border-slate-800 w-full max-w-xl max-h-[90vh] overflow-y-auto shadow-2xl"
            >
              <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
                <h3 className="text-lg font-bold text-white flex items-center gap-2 uppercase tracking-tighter">
                  <Plus className="text-green-500" /> REGISTRAR_OCORRÊNCIA_ABSENTEÍSMO
                </h3>
                <button onClick={() => setIsModalOpen(false)} className="text-slate-500 hover:text-white transition-colors">
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleAddAbsence} className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Colaborador */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest">Colaborador</label>
                    <select 
                      value={formData.employeeId}
                      onChange={(e) => setFormData({...formData, employeeId: e.target.value})}
                      className="w-full bg-slate-900 border border-slate-800 rounded p-3 text-white font-mono text-sm outline-none focus:border-green-500/50"
                    >
                      <option value="">SELECIONE...</option>
                      {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                    </select>
                  </div>

                  {/* Tipo */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest">Tipo_Ocorrência</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button 
                        type="button"
                        onClick={() => setFormData({...formData, type: 'atestado'})}
                        className={`p-3 rounded border font-mono text-[10px] font-bold transition-all ${formData.type === 'atestado' ? 'bg-rose-500/20 border-rose-500 text-rose-500' : 'bg-slate-900 border-slate-800 text-slate-500 hover:border-slate-700'}`}
                      >
                        ATESTADO_MÉDICO
                      </button>
                      <button 
                        type="button"
                        onClick={() => setFormData({...formData, type: 'motivo_pessoal'})}
                        className={`p-3 rounded border font-mono text-[10px] font-bold transition-all ${formData.type === 'motivo_pessoal' ? 'bg-orange-500/20 border-orange-500 text-orange-500' : 'bg-slate-900 border-slate-800 text-slate-500 hover:border-slate-700'}`}
                      >
                        MOTIVO_PESSOAL
                      </button>
                    </div>
                  </div>
                </div>

                {/* Campos Dinâmicos */}
                <AnimatePresence mode="wait">
                  {formData.type === 'atestado' ? (
                    <motion.div 
                      key="atestado"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="space-y-6"
                    >
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest">Código_CID-10</label>
                          <div className="flex gap-2">
                            <input 
                              type="text" 
                              value={formData.cid}
                              onChange={(e) => setFormData({...formData, cid: e.target.value.toUpperCase()})}
                              onBlur={lookupCid}
                              placeholder="EX: Z00, M54..."
                              className="flex-1 bg-slate-900 border border-slate-800 rounded p-3 text-white font-mono text-sm outline-none focus:border-rose-500/50"
                            />
                            <div className="w-12 h-12 bg-slate-800 border border-slate-700 rounded flex items-center justify-center text-rose-500">
                              {isAiLoading ? <div className="w-4 h-4 border-2 border-rose-500 border-t-transparent rounded-full animate-spin"></div> : <Search size={18} />}
                            </div>
                          </div>
                          {cidDescription && <p className="text-[10px] font-mono text-green-500 italic uppercase tracking-tighter">{cidDescription}</p>}
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest">Data_Emissão</label>
                          <input 
                            type="date" 
                            value={formData.date}
                            onChange={(e) => setFormData({...formData, date: e.target.value})}
                            className="w-full bg-slate-900 border border-slate-800 rounded p-3 text-white font-mono text-sm outline-none"
                          />
                        </div>
                      </div>

                      {/* Upload de Atestado */}
                      <div className="space-y-2">
                        <label className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest">Anexo_Digital (IMAGEM/PDF)</label>
                        <div 
                          onClick={() => fileInputRef.current?.click()}
                          className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center transition-all cursor-pointer ${selectedFile ? 'border-green-500/50 bg-green-500/5' : 'border-slate-800 hover:border-slate-700 bg-slate-900/50'}`}
                        >
                          <input 
                            type="file" 
                            ref={fileInputRef} 
                            onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                            className="hidden" 
                            accept="image/*,application/pdf"
                          />
                          {selectedFile ? (
                            <>
                              <CheckCircle2 size={32} className="text-green-500 mb-2" />
                              <span className="text-xs text-white font-bold">{selectedFile.name}</span>
                              <button 
                                type="button"
                                onClick={verifyAttachment}
                                disabled={isVerifyingFile}
                                className="mt-4 bg-green-500 hover:bg-green-400 text-slate-950 px-4 py-1.5 rounded text-[10px] font-bold flex items-center gap-2"
                              >
                                {isVerifyingFile ? <div className="w-3 h-3 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></div> : <FileSearch size={14} />}
                                ESCANEAR_COM_IA
                              </button>
                            </>
                          ) : (
                            <>
                              <Paperclip size={32} className="text-slate-600 mb-2" />
                              <span className="text-xs text-slate-500 font-mono">ARRASTE OU CLIQUE PARA ANEXAR</span>
                            </>
                          )}
                        </div>

                        {verificationError && (
                          <div className="mt-2 p-3 bg-rose-500/10 border border-rose-500/50 rounded flex items-center gap-2 text-rose-500 text-[10px] font-mono">
                            <ShieldAlert size={14} /> {verificationError}
                          </div>
                        )}
                        {verificationSuccess && (
                          <div className="mt-2 p-3 bg-green-500/10 border border-green-500/50 rounded flex items-center gap-2 text-green-500 text-[10px] font-mono">
                            <ShieldCheck size={14} /> {verificationSuccess}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div 
                      key="pessoal"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="space-y-6"
                    >
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest">Justificativa_Principal</label>
                          <input 
                            type="text" 
                            value={formData.reason}
                            onChange={(e) => setFormData({...formData, reason: e.target.value})}
                            placeholder="EX: PROBLEMAS FAMILIARES..."
                            className="w-full bg-slate-900 border border-slate-800 rounded p-3 text-white font-mono text-sm outline-none focus:border-orange-500/50"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest">Data_Ocorrência</label>
                          <input 
                            type="date" 
                            value={formData.date}
                            onChange={(e) => setFormData({...formData, date: e.target.value})}
                            className="w-full bg-slate-900 border border-slate-800 rounded p-3 text-white font-mono text-sm outline-none"
                          />
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="pt-4 border-t border-slate-800 flex justify-end gap-4">
                  <button 
                    type="button" 
                    onClick={() => setIsModalOpen(false)}
                    className="px-6 py-3 text-slate-400 font-mono text-xs uppercase hover:text-white transition-colors"
                  >
                    CANCELAR
                  </button>
                  <button 
                    type="submit"
                    disabled={isSubmitting}
                    className="bg-green-600 hover:bg-green-500 disabled:bg-slate-800 disabled:text-slate-600 text-white font-bold px-8 py-3 rounded-lg flex items-center gap-2 transition-all active:scale-95 shadow-[0_0_20px_rgba(34,197,94,0.2)]"
                  >
                    {isSubmitting ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <CheckCircle2 size={18} />}
                    SALVAR_REGISTRO
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {/* Modal de Histórico do Colaborador */}
        {isHistoryModalOpen && historyEmployee && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#1A1D23] rounded-2xl w-full max-w-2xl border border-slate-800 shadow-2xl flex flex-col max-h-[85vh]"
            >
              <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-500/10 rounded-full text-blue-500">
                    <UserIcon size={20} />
                  </div>
                  <div>
                    <h3 className="text-sm font-mono font-bold uppercase tracking-widest text-white">{historyEmployee.name}</h3>
                    <p className="text-slate-500 text-[10px] font-mono mt-1 uppercase">Setor: {historyEmployee.sector}</p>
                  </div>
                </div>
                <button onClick={() => setIsHistoryModalOpen(false)} className="text-slate-500 hover:text-white transition-colors">
                  <X size={24} />
                </button>
              </div>

              <div className="p-6 overflow-y-auto space-y-4">
                {absences
                  .filter(a => a.employeeId === historyEmployee.id)
                  .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                  .map(abs => (
                  <div key={abs.id} className="bg-slate-900/50 border border-slate-800 p-4 rounded-xl group hover:border-slate-700 transition-all">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono font-bold text-slate-500">{new Date(abs.date).toLocaleDateString('pt-BR')}</span>
                        <span className={`text-[8px] font-mono font-bold px-2 py-0.5 rounded border uppercase ${abs.type === 'atestado' ? 'bg-rose-500/10 text-rose-500 border-rose-500/50' : 'bg-orange-500/10 text-orange-500 border-orange-500/50'}`}>
                          {abs.type.replace('_', ' ')}
                        </span>
                      </div>
                      {abs.cid && <span className="text-[8px] font-mono font-bold text-green-500 uppercase">CID: {abs.cid}</span>}
                    </div>
                    <p className="text-xs text-slate-300 font-mono leading-relaxed">
                      {abs.reason || 'SEM DESCRIÇÃO.'}
                    </p>
                  </div>
                ))}

                {absences.filter(a => a.employeeId === historyEmployee.id).length === 0 && (
                  <div className="text-center py-20 opacity-30 flex flex-col items-center gap-4">
                    <FileSearch size={48} className="text-slate-600" />
                    <span className="text-sm font-mono uppercase tracking-[0.3em]">SEM REGISTROS</span>
                  </div>
                )}
              </div>

              <div className="p-6 bg-slate-900/50 border-t border-slate-800 flex justify-between items-center">
                <div className="flex gap-6">
                  <div className="flex flex-col">
                    <span className="text-[8px] text-slate-500 uppercase font-mono tracking-widest">Total</span>
                    <span className="text-xl font-mono font-bold text-white">{absences.filter(a => a.employeeId === historyEmployee.id).length}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[8px] text-slate-500 uppercase font-mono tracking-widest">Atestados</span>
                    <span className="text-xl font-mono font-bold text-rose-500">{absences.filter(a => a.employeeId === historyEmployee.id && a.type === 'atestado').length}</span>
                  </div>
                </div>
                <button 
                  onClick={() => setIsHistoryModalOpen(false)}
                  className="bg-slate-800 hover:bg-slate-700 text-white px-6 py-2 rounded text-[10px] font-mono font-bold uppercase tracking-widest transition-all"
                >
                  FECHAR
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      
      {/* Footer */}
      <footer className="max-w-7xl mx-auto mt-12 pt-8 border-t border-slate-800 flex justify-center text-slate-600 font-mono text-[10px] uppercase tracking-widest">
        <div>SISTEMA DE GESTÃO DE ABSENTEÍSMO</div>
      </footer>
    </div>
  );
}
