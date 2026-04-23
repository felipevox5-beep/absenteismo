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
  User,
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
  Download
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

export default function App() {
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
    }, 5000);
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

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    setVerificationError(null);
    setVerificationSuccess(null);
  }, [formData.employeeId, formData.cid, selectedFile]);

  const fetchData = async () => {
    try {
      const emps = await fetch('/api/employees').then(r => r.json());
      const abs = await fetch('/api/absences').then(r => r.json());
      const rep = await fetch('/api/reports').then(r => r.json());
      setEmployees(emps);
      setAbsences(abs);
      setReport(rep);
    } catch (error) {
      console.error('Erro ao buscar dados:', error);
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
      const res = await fetch('/api/employees', {
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
      const response = await fetch(`/api/employees/${id}`, {
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
      const response = await fetch(`/api/absences/${id}`, {
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
      const res = await fetch('/api/absences', {
        method: 'POST',
        body: data
      });

      if (!res.ok) {
        let errorMessage = 'Falha ao salvar registro';
        try {
          const errorData = await res.json();
          errorMessage = errorData.error || errorMessage;
        } catch (e) {
          // Fallback if not JSON
        }
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

  return (
    <div className="min-h-screen bg-[#0F1115] text-slate-100 font-sans tech-grid p-6 md:p-12 relative overflow-x-hidden">
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
        <div>
          <div className="flex items-center gap-2 text-green-500 mb-1">
            <Activity size={18} className="animate-pulse" />
            <span className="text-[10px] font-mono font-bold tracking-[0.2em] uppercase">Control Unit // Absenteísmo</span>
          </div>
          <h1 className="text-4xl font-bold tracking-tighter text-white">GESTOR PRO <span className="text-green-500">v2.0</span></h1>
          <p className="text-slate-400 mt-1 font-mono text-xs uppercase tracking-wider">Terminal de Monitoramento de Frequência</p>
        </div>

        <div className="flex flex-wrap gap-4">
          <button 
            onClick={() => setIsInsightsOpen(true)}
            className="bg-transparent border border-orange-500/50 hover:bg-orange-500/10 text-orange-500 px-6 py-3 rounded-md flex items-center gap-2 font-mono text-sm uppercase tracking-widest transition-all shadow-[0_0_15px_rgba(249,115,22,0.1)] active:scale-95"
          >
            <TrendingUp size={18} />
            [ Dashboard_Insights ]
          </button>
          <button 
            onClick={() => setIsEmployeeModalOpen(true)}
            className="bg-transparent border border-blue-500/50 hover:bg-blue-500/10 text-blue-500 px-6 py-3 rounded-md flex items-center gap-2 font-mono text-sm uppercase tracking-widest transition-all shadow-[0_0_15px_rgba(59,130,246,0.1)] active:scale-95"
          >
            <Users size={18} />
            [ Registar_Colaborador ]
          </button>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-transparent border border-green-500/50 hover:bg-green-500/10 text-green-500 px-6 py-3 rounded-md flex items-center gap-2 font-mono text-sm uppercase tracking-widest transition-all shadow-[0_0_15px_rgba(34,197,94,0.1)] active:scale-95"
            id="btn-registar-falta"
          >
            <Plus size={18} />
            [ Registrar_Entrada ]
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

          <div className="space-y-4 overflow-y-auto max-h-[500px] pr-2 custom-scrollbar">
            {absences
              .filter(abs => {
                const absDate = new Date(abs.date).getTime();
                const start = logFilterStart ? new Date(logFilterStart + 'T00:00:00').getTime() : 0;
                const end = logFilterEnd ? new Date(logFilterEnd + 'T23:59:59').getTime() : Infinity;
                return absDate >= start && absDate <= end;
              })
              .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
              .slice(0, 50)
              .map(abs => (
              <div key={abs.id} className="relative pl-6 border-l border-slate-800 py-1">
                <div className={`absolute top-2 -left-[4.5px] w-2 h-2 rounded-full ${abs.type === 'atestado' ? 'bg-rose-500' : 'bg-orange-500'}`}></div>
                <div className="text-[10px] font-mono text-slate-500 mb-1 flex justify-between uppercase">
                  <span>{new Date(abs.date).toLocaleDateString()}</span>
                  <span className={abs.type === 'atestado' ? 'text-rose-500' : 'text-orange-500'}>[{abs.type}]</span>
                </div>
                <div className="font-bold text-xs uppercase text-white mb-0.5 flex justify-between items-center group/log">
                  <span>
                    {employees.find(e => e.id === abs.employeeId)?.name} {abs.cid && <span className="text-green-500 ml-1">[{abs.cid}]</span>}
                  </span>
                  
                  <div className="flex items-center gap-1">
                    {deletingLogId === abs.id ? (
                      <div className="flex items-center gap-1">
                        <button 
                          onClick={() => handleDeleteAbsence(abs.id)}
                          className="text-[7px] bg-rose-600 text-white px-1 py-0.5 rounded font-bold"
                        >
                          OK
                        </button>
                        <button 
                          onClick={() => setDeletingLogId(null)}
                          className="text-[7px] bg-slate-700 text-white px-1 py-0.5 rounded font-bold"
                        >
                          X
                        </button>
                      </div>
                    ) : (
                      <button 
                        onClick={() => setDeletingLogId(abs.id)}
                        className="opacity-0 group-hover/log:opacity-100 transition-opacity text-slate-600 hover:text-rose-500"
                      >
                        <Trash2 size={10} />
                      </button>
                    )}
                  </div>
                </div>
                <div className="text-[10px] font-mono text-slate-400 italic line-clamp-1">{abs.reason || 'S/ Descr'}</div>
              </div>
            ))}
            {absences.filter(abs => {
                const absDate = new Date(abs.date).getTime();
                const start = logFilterStart ? new Date(logFilterStart + 'T00:00:00').getTime() : 0;
                const end = logFilterEnd ? new Date(logFilterEnd + 'T23:59:59').getTime() : Infinity;
                return absDate >= start && absDate <= end;
              }).length === 0 && (
              <div className="text-center py-10 opacity-20">
                <Terminal size={32} className="mx-auto mb-2" />
                <div className="text-[10px] font-mono uppercase tracking-widest">Sem logs no período</div>
              </div>
            )}
          </div>
        </aside>
      </main>

      {/* Modal de Insights */}
      {isInsightsOpen && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-xl z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-[#0F1115] rounded-lg w-full max-w-4xl border border-slate-700 shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden max-h-[90vh] flex flex-col"
          >
            <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900/50 shrink-0">
              <div className="flex items-center gap-3">
                <BarChart className="text-orange-500" />
                <div>
                  <h3 className="text-sm font-mono font-bold uppercase tracking-widest text-white">Advanced_Analytics // Insights</h3>
                  <p className="text-slate-500 text-[10px] font-mono mt-1 uppercase">Processamento de Padrões e Ofensores</p>
                </div>
              </div>
              <button 
                onClick={() => setIsInsightsOpen(false)}
                className="text-slate-500 hover:text-white transition-colors"
                id="close-insights"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-8 overflow-y-auto grow custom-scrollbar">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                
                {/* Maidres Ofensores - Atestados */}
                <div className="bg-[#1A1D23] p-6 rounded border border-slate-800 relative">
                  <div className="absolute top-4 right-4 text-rose-500/20"><Award size={32} /></div>
                  <h4 className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest mb-6 border-l-2 border-rose-500 pl-2">Top_Ofensores: Atestados_Medicos</h4>
                  <div className="space-y-4">
                    {insights.atestadoCounts.map((item, i) => (
                      <div key={i} className="flex items-center justify-between group">
                        <div className="flex items-center gap-3">
                          <span className="text-slate-600 font-mono text-xs">0{i+1}.</span>
                          <span className="text-white font-mono text-xs uppercase font-bold">{item.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-rose-500 font-mono text-xs font-bold">{item.count}</span>
                          <div className="w-20 bg-slate-800 h-1 rounded-full overflow-hidden">
                            <div className="bg-rose-500 h-full" style={{ width: `${Math.min((item.count / 10) * 100, 100)}%` }}></div>
                          </div>
                        </div>
                      </div>
                    ))}
                    {insights.atestadoCounts.length === 0 && <p className="text-slate-600 font-mono text-[10px] uppercase">Nenhum dado processado</p>}
                  </div>
                </div>

                {/* Maidres Ofensores - Justificativas */}
                <div className="bg-[#1A1D23] p-6 rounded border border-slate-800 relative">
                  <div className="absolute top-4 right-4 text-orange-500/20"><Award size={32} /></div>
                  <h4 className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest mb-6 border-l-2 border-orange-500 pl-2">Top_Ofensores: Motivo_Pessoal</h4>
                  <div className="space-y-4">
                    {insights.justificativaCounts.map((item, i) => (
                      <div key={i} className="flex items-center justify-between group">
                        <div className="flex items-center gap-3">
                          <span className="text-slate-600 font-mono text-xs">0{i+1}.</span>
                          <span className="text-white font-mono text-xs uppercase font-bold">{item.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-orange-500 font-mono text-xs font-bold">{item.count}</span>
                          <div className="w-20 bg-slate-800 h-1 rounded-full overflow-hidden">
                            <div className="bg-orange-500 h-full" style={{ width: `${Math.min((item.count / 10) * 100, 100)}%` }}></div>
                          </div>
                        </div>
                      </div>
                    ))}
                    {insights.justificativaCounts.length === 0 && <p className="text-slate-600 font-mono text-[10px] uppercase">Nenhum dado processado</p>}
                  </div>
                </div>

                {/* Top CIDs */}
                <div className="bg-[#1A1D23] p-6 rounded border border-slate-800">
                  <h4 className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest mb-6 border-l-2 border-green-500 pl-2">Classificações_Frequentes: CID-10</h4>
                  <div className="space-y-4">
                    {insights.topCids.map((item, i) => (
                      <div key={i} className="flex items-center justify-between">
                        <span className="text-white font-mono text-xs font-bold bg-slate-800 px-2 py-1 border border-slate-700">{item.cid}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-green-500 font-mono text-xs font-bold">{item.count} INCIDÊNCIAS</span>
                        </div>
                      </div>
                    ))}
                    {insights.topCids.length === 0 && <p className="text-slate-600 font-mono text-[10px] uppercase">Nenhum CID registrado</p>}
                  </div>
                </div>

                {/* Top Justificativas */}
                <div className="bg-[#1A1D23] p-6 rounded border border-slate-800">
                  <h4 className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest mb-6 border-l-2 border-blue-500 pl-2">Justificativas_Recorrentes: Motivos</h4>
                  <div className="space-y-4">
                    {insights.topReasons.map((item, i) => (
                      <div key={i} className="flex flex-col gap-1">
                        <div className="flex justify-between items-center text-[10px] font-mono font-bold text-white uppercase">
                          <span className="truncate max-w-[200px]">{item.reason}</span>
                          <span className="text-blue-500">{item.count}X</span>
                        </div>
                        <div className="w-full bg-slate-800 h-1 rounded-full overflow-hidden">
                          <div className="bg-blue-500 h-full shadow-[0_0_8px_rgba(59,130,246,0.5)]" style={{ width: `${Math.min((item.count / 10) * 100, 100)}%` }}></div>
                        </div>
                      </div>
                    ))}
                    {insights.topReasons.length === 0 && <p className="text-slate-600 font-mono text-[10px] uppercase">Nenhum motivo registrado</p>}
                  </div>
                </div>

              </div>
            </div>
            <div className="p-4 bg-slate-900 border-t border-slate-800 text-center shrink-0">
              <span className="text-[9px] font-mono text-slate-600 uppercase tracking-[0.3em]">IA_Analytics // Gerado em Tempo Real via Kernel</span>
            </div>
          </motion.div>
        </div>
      )}

      {/* Modal de Colaborador */}
      {isEmployeeModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="bg-[#1A1D23] rounded-lg w-full max-w-md border border-slate-700 shadow-2xl overflow-hidden"
          >
            <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
              <div>
                <h3 className="text-sm font-mono font-bold uppercase tracking-widest text-white">Novo_Colaborador</h3>
                <p className="text-slate-500 text-[10px] font-mono mt-1 uppercase">Registro no Kernel...</p>
              </div>
              <button 
                onClick={() => setIsEmployeeModalOpen(false)}
                className="text-slate-500 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAddEmployee} className="p-6 space-y-6">
              <div>
                <label className="block text-[10px] font-mono font-bold text-slate-500 mb-2 uppercase tracking-widest">Nome_Completo</label>
                <input 
                  type="text"
                  className="w-full bg-slate-900 border border-slate-700 rounded p-3 text-white font-mono text-xs focus:ring-1 focus:ring-blue-500 transition-all outline-none"
                  placeholder="EX: JOÃO DA SILVA"
                  value={employeeFormData.name}
                  onChange={(e) => setEmployeeFormData({...employeeFormData, name: e.target.value.toUpperCase()})}
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono font-bold text-slate-500 mb-2 uppercase tracking-widest">Setor / Area_Atuação</label>
                <input 
                  type="text"
                  className="w-full bg-slate-900 border border-slate-700 rounded p-3 text-white font-mono text-xs focus:ring-1 focus:ring-blue-500 transition-all outline-none"
                  placeholder="EX: LOGÍSTICA, PRODUÇÃO, RH..."
                  value={employeeFormData.sector}
                  onChange={(e) => setEmployeeFormData({...employeeFormData, sector: e.target.value.toUpperCase()})}
                  required
                />
              </div>

              <div className="pt-4 flex flex-col gap-3">
                <button 
                  type="submit"
                  className="w-full bg-blue-500 hover:bg-blue-600 text-white font-mono font-bold py-3 text-xs uppercase tracking-[0.2em] transition-all active:scale-95 shadow-[0_0_20px_rgba(59,130,246,0.3)]"
                >
                  Confirmar_Registro
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Modal de Registro */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="bg-[#1A1D23] rounded-lg w-full max-w-md border border-slate-700 shadow-2xl overflow-hidden"
          >
            <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
              <div>
                <h3 className="text-sm font-mono font-bold uppercase tracking-widest text-white">Nova_Entrada_Sistema</h3>
                <p className="text-slate-500 text-[10px] font-mono mt-1 uppercase">Aguardando Parâmetros...</p>
              </div>
              <button 
                onClick={() => {
                  setIsModalOpen(false);
                  resetForm();
                }}
                className="text-slate-500 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAddAbsence} className="p-6 space-y-6">
              <div>
                <label className="block text-[10px] font-mono font-bold text-slate-500 mb-2 uppercase tracking-widest">Identificacao_Funcionario</label>
                <select 
                  className="w-full bg-slate-900 border border-slate-700 rounded p-3 text-white font-mono text-xs focus:ring-1 focus:ring-green-500 transition-all outline-none"
                  value={formData.employeeId}
                  onChange={(e) => setFormData({...formData, employeeId: e.target.value})}
                  required
                >
                  <option value="">-- SELECIONAR --</option>
                  {employees.map(e => <option key={e.id} value={e.id}>{e.name} [{e.sector}]</option>)}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-mono font-bold text-slate-500 mb-2 uppercase tracking-widest">Parametro_Tipo</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setFormData({...formData, type: 'atestado'})}
                    className={`flex items-center justify-center gap-2 py-2.5 rounded border font-mono text-[10px] uppercase tracking-widest transition-all ${formData.type === 'atestado' ? 'bg-rose-500/10 border-rose-500 text-rose-500' : 'bg-slate-900 border-slate-700 text-slate-500'}`}
                  >
                    <FileText size={14} />
                    Atestado
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({...formData, type: 'motivo_pessoal'})}
                    className={`flex items-center justify-center gap-2 py-2.5 rounded border font-mono text-[10px] uppercase tracking-widest transition-all ${formData.type === 'motivo_pessoal' ? 'bg-orange-500/10 border-orange-500 text-orange-500' : 'bg-slate-900 border-slate-700 text-slate-500'}`}
                  >
                    <Info size={14} />
                    Pessoais
                  </button>
                </div>
              </div>

              {formData.type === 'atestado' ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-mono font-bold text-slate-500 mb-2 uppercase tracking-widest">Código CID (Classificação de Doença)</label>
                    <div className="flex gap-2">
                      <input 
                        type="text"
                        className="flex-1 bg-slate-900 border border-slate-700 rounded p-3 text-white font-mono text-xs focus:ring-1 focus:ring-green-500 transition-all outline-none"
                        placeholder="Ex: J11, B20..."
                        value={formData.cid}
                        onChange={(e) => setFormData({...formData, cid: e.target.value.toUpperCase()})}
                      />
                      <button 
                        type="button"
                        onClick={lookupCid}
                        disabled={isAiLoading}
                        className="bg-slate-800 border border-slate-700 p-3 rounded text-green-500 hover:bg-slate-700 transition-all flex items-center gap-2"
                      >
                        {isAiLoading ? <Activity size={16} className="animate-spin" /> : <Search size={16} />}
                        <span className="text-[10px] font-mono font-bold uppercase tracking-widest">AI_Identify</span>
                      </button>
                    </div>
                    {cidDescription && (
                      <motion.div 
                        initial={{ opacity: 0 }} 
                        animate={{ opacity: 1 }}
                        className="mt-2 p-2 bg-slate-800/50 border border-slate-700 rounded flex items-start gap-2"
                      >
                        <Stethoscope size={14} className="text-green-500 mt-0.5" />
                        <span className="text-[10px] font-mono text-slate-300 italic">{cidDescription}</span>
                      </motion.div>
                    )}
                  </div>

                  <div>
                    <label className="block text-[10px] font-mono font-bold text-slate-500 mb-2 uppercase tracking-widest">Input_Binary // Arquivo</label>
                    <div className="flex gap-2">
                      <div 
                        onClick={() => fileInputRef.current?.click()}
                        className="flex-1 border border-slate-700 bg-slate-900/50 rounded flex items-center gap-4 px-4 py-3 cursor-pointer hover:bg-slate-800 transition-all group"
                      >
                        <input 
                          type="file" 
                          className="hidden" 
                          ref={fileInputRef} 
                          onChange={(e) => setSelectedFile(e.target.files ? e.target.files[0] : null)}
                          accept="image/*,.pdf"
                        />
                        <Paperclip size={18} className="text-slate-600 group-hover:text-green-500" />
                        <span className="text-[10px] font-mono uppercase text-slate-400 group-hover:text-white truncate">
                          {selectedFile ? selectedFile.name : 'Selecionar Anexo'}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={verifyAttachment}
                        disabled={!selectedFile || !formData.employeeId || isVerifyingFile}
                        className="bg-slate-800 border border-slate-700 p-3 rounded text-blue-500 hover:bg-slate-700 transition-all flex items-center gap-2"
                        title="Validar dados do arquivo com o sistema"
                      >
                        {isVerifyingFile ? <Activity size={16} className="animate-spin" /> : <FileSearch size={16} />}
                        <span className="text-[10px] font-mono font-bold uppercase tracking-widest">Scan_Doc</span>
                      </button>
                    </div>

                    <AnimatePresence mode="wait">
                      {verificationError && (
                        <motion.div 
                          key="error"
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="mt-3 p-3 bg-rose-500/10 border border-rose-500/50 rounded flex gap-3 text-rose-500"
                        >
                          <ShieldAlert size={18} className="shrink-0" />
                          <p className="text-[10px] font-mono font-bold uppercase leading-relaxed">{verificationError}</p>
                        </motion.div>
                      )}
                      {verificationSuccess && (
                        <motion.div 
                          key="success"
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="mt-3 p-3 bg-green-500/10 border border-green-500/50 rounded flex gap-3 text-green-500"
                        >
                          <CheckCircle2 size={18} className="shrink-0" />
                          <p className="text-[10px] font-mono font-bold uppercase leading-relaxed">{verificationSuccess}</p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
              </div>
            ) : (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <label className="block text-[10px] font-mono font-bold text-slate-500 mb-2 uppercase tracking-widest">Input_Text // Justificativa</label>
                  <textarea 
                    className="w-full bg-slate-900 border border-slate-700 rounded p-3 text-white font-mono text-xs focus:ring-1 focus:ring-green-500 transition-all outline-none min-h-[100px]"
                    placeholder="DIGITE O MOTIVO AQUI..."
                    value={formData.reason}
                    onChange={(e) => setFormData({...formData, reason: e.target.value})}
                    required
                  ></textarea>
                </motion.div>
              )}

              <div>
                <label className="block text-[10px] font-mono font-bold text-slate-500 mb-2 uppercase tracking-widest">Timestamp_Evento</label>
                <input 
                  type="date"
                  className="w-full bg-slate-900 border border-slate-700 rounded p-3 text-white font-mono text-xs focus:ring-1 focus:ring-green-500 transition-all outline-none"
                  value={formData.date}
                  onChange={(e) => setFormData({...formData, date: e.target.value})}
                  required
                />
              </div>

              <div className="pt-4 flex flex-col gap-3">
                <button 
                  type="submit"
                  disabled={isSubmitting}
                  className={`w-full font-mono font-bold py-3 text-xs uppercase tracking-[0.2em] transition-all active:scale-95 shadow-[0_0_20px_rgba(34,197,94,0.3)] ${isSubmitting ? 'bg-slate-700 text-slate-500 cursor-not-allowed' : 'bg-green-500 hover:bg-green-600 text-black'}`}
                >
                  {isSubmitting ? (
                    <span className="flex items-center justify-center gap-2">
                      <Activity size={14} className="animate-spin" />
                      Processando_Dados...
                    </span>
                  ) : (
                    'Executar_Registro'
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      <AnimatePresence>
        {viewingDetails && (
          <div className="fixed inset-0 bg-black/90 backdrop-blur-xl z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[#0F1115] rounded-lg w-full max-w-2xl border border-slate-700 shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden max-h-[90vh] flex flex-col"
            >
              <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900/50 shrink-0">
                <div className="flex items-center gap-3">
                  <Cpu className={viewingDetails === 'employees' ? 'text-blue-500' : viewingDetails === 'atestados' ? 'text-rose-500' : 'text-orange-500'} size={20} />
                  <div>
                    <h3 className="text-sm font-mono font-bold uppercase tracking-widest text-white">
                      {viewingDetails === 'employees' ? 'Kernel_Query // Colaboradores_Ativos' : 
                       viewingDetails === 'atestados' ? 'Kernel_Query // Registros_Medicos' : 
                       'Kernel_Query // Motivos_Pessoais'}
                    </h3>
                    <p className="text-slate-500 text-[10px] font-mono mt-1 uppercase">Exibindo dump de dados do banco central</p>
                  </div>
                </div>
                <button 
                  onClick={() => setViewingDetails(null)} 
                  className="text-slate-500 hover:text-white transition-colors"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="p-6 overflow-y-auto custom-scrollbar">
                {viewingDetails === 'employees' && (
                  <div className="space-y-2">
                    {employees.map(emp => (
                      <div key={emp.id} className="bg-slate-900/50 border border-slate-800 p-4 rounded flex justify-between items-center group hover:border-blue-500/30 transition-all">
                        <div>
                          <div className="font-bold text-white uppercase text-sm mb-1">{emp.name}</div>
                          <div className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">Setor: {emp.sector}</div>
                        </div>
                        <div className="text-blue-500/50 group-hover:text-blue-500 transition-colors">
                          <User size={18} />
                        </div>
                      </div>
                    ))}
                    {employees.length === 0 && <p className="text-center text-slate-500 font-mono text-xs py-10 uppercase">Sem registros localizados</p>}
                  </div>
                )}

                {(viewingDetails === 'atestados' || viewingDetails === 'pessoais') && (
                  <div className="space-y-3">
                    {absences.filter(a => a.type === (viewingDetails === 'atestados' ? 'atestado' : 'motivo_pessoal')).map(abs => {
                      const emp = employees.find(e => e.id === abs.employeeId);
                      return (
                        <div key={abs.id} className="bg-slate-900/50 border border-slate-800 p-4 rounded group hover:border-slate-700 transition-all">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <div className="font-bold text-white uppercase text-sm">{emp?.name || 'ID: ' + abs.employeeId}</div>
                              <div className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">{new Date(abs.date).toLocaleDateString('pt-BR')}</div>
                            </div>
                            {abs.cid && <span className="text-[10px] font-mono bg-green-500/10 text-green-500 px-2 py-0.5 rounded border border-green-500/30 font-bold tracking-widest uppercase">CID: {abs.cid}</span>}
                          </div>
                          <div className="text-[10px] font-mono text-slate-400 bg-black/20 p-2 rounded border border-slate-800/50 italic">
                            {abs.reason || 'Sem justificativa detalhada registrada'}
                          </div>
                        </div>
                      );
                    })}
                    {absences.filter(a => a.type === (viewingDetails === 'atestados' ? 'atestado' : 'motivo_pessoal')).length === 0 && 
                      <p className="text-center text-slate-500 font-mono text-xs py-10 uppercase">Sem entradas detectadas no sistema</p>}
                  </div>
                )}
              </div>
              <div className="p-4 bg-slate-900/30 border-t border-slate-800 text-center">
                <p className="text-[8px] font-mono text-slate-600 uppercase tracking-[0.3em]">Acesso_Auditado // Protocolo_{Date.now().toString().slice(-6)}</p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal de Histórico do Colaborador */}
      {isHistoryModalOpen && historyEmployee && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-xl z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-[#0F1115] rounded-lg w-full max-w-2xl border border-slate-700 shadow-2xl flex flex-col h-[80vh]"
          >
            <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/10 rounded-full">
                  <User className="text-blue-500" size={20} />
                </div>
                <div>
                  <h3 className="text-sm font-mono font-bold uppercase tracking-widest text-white">Prontuário_Histórico // {historyEmployee.name}</h3>
                  <p className="text-slate-500 text-[10px] font-mono mt-1 uppercase">Setor: {historyEmployee.sector} // ID_Kernel: {historyEmployee.id}</p>
                </div>
              </div>
              <button 
                onClick={() => setIsHistoryModalOpen(false)}
                className="text-slate-500 hover:text-white transition-colors p-1 rounded-full hover:bg-white/5"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto grow custom-scrollbar bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]">
              <div className="grid grid-cols-1 gap-4">
                {absences
                  .filter(a => a.employeeId === historyEmployee.id)
                  .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                  .map(abs => (
                  <div key={abs.id} className="bg-[#1A1D23] border border-slate-800 p-4 rounded relative group hover:border-slate-600 transition-all">
                    <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-100 transition-opacity">
                       {abs.type === 'atestado' ? <Stethoscope className="text-rose-500" size={16} /> : <AlertCircle className="text-orange-500" size={16} />}
                    </div>
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest">{new Date(abs.date).toLocaleDateString('pt-BR')}</span>
                        <span className={`text-[8px] font-mono font-bold px-2 py-0.5 rounded border uppercase ${abs.type === 'atestado' ? 'bg-rose-500/10 text-rose-500 border-rose-500/50' : 'bg-orange-500/10 text-orange-500 border-orange-500/50'}`}>
                          {abs.type.replace('_', ' ')}
                        </span>
                        {abs.cid && <span className="text-[8px] font-mono font-bold px-2 py-0.5 rounded border bg-green-500/10 text-green-500 border-green-500/50 uppercase">CID: {abs.cid}</span>}
                      </div>
                    </div>
                    <p className="text-xs text-slate-300 font-mono leading-relaxed mb-2">
                      {abs.reason || 'Sem descrição fornecida.'}
                    </p>
                    <div className="flex items-center justify-between mt-4 text-[9px] font-mono text-slate-600 uppercase border-t border-slate-800 pt-2">
                      <span>Registrado em {new Date(abs.createdAt).toLocaleString('pt-BR')}</span>
                      {abs.atestadoName && <span className="text-blue-500 italic flex items-center gap-1"><Paperclip size={10} /> {abs.atestadoName}</span>}
                    </div>
                  </div>
                ))}

                {absences.filter(a => a.employeeId === historyEmployee.id).length === 0 && (
                  <div className="text-center py-20 opacity-30 flex flex-col items-center gap-4">
                    <FileSearch size={48} className="text-slate-600" />
                    <span className="text-sm font-mono uppercase tracking-[0.3em]">Nenhum registro localizado no prontuário</span>
                  </div>
                )}
              </div>
            </div>

            <div className="p-4 bg-slate-900 border-t border-slate-800 text-center flex justify-between items-center">
              <div className="flex gap-4">
                <div className="flex flex-col items-start">
                   <span className="text-[8px] text-slate-600 uppercase font-mono">Total_Eventos</span>
                   <span className="text-lg font-mono font-bold text-white leading-none">{absences.filter(a => a.employeeId === historyEmployee.id).length}</span>
                </div>
                <div className="flex flex-col items-start border-l border-slate-800 pl-4 text-center">
                   <span className="text-[8px] text-slate-600 uppercase font-mono">Atestados</span>
                   <span className="text-lg font-mono font-bold text-rose-500 leading-none">{absences.filter(a => a.employeeId === historyEmployee.id && a.type === 'atestado').length}</span>
                </div>
              </div>
              <button 
                onClick={() => setIsHistoryModalOpen(false)}
                className="bg-slate-800 hover:bg-slate-700 text-white px-6 py-2 rounded font-mono text-[10px] uppercase tracking-widest transition-all"
              >
                Retornar_ao_Menu
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Footer Branding */}
      <footer className="max-w-7xl mx-auto mt-20 pt-10 border-t border-slate-800 flex flex-col md:flex-row justify-between items-center text-slate-600 font-mono text-[10px] gap-4 pb-10 uppercase tracking-widest">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1"><ShieldCheck size={12} className="text-green-500" /> Kernel_Encrypted</span>
          <span className="flex items-center gap-1"><Cpu size={12} className="text-green-500" /> System_Online</span>
        </div>
        <div className="opacity-40">
          © 2026 GESTOR_PRO // BUILD_44.92.1
        </div>
      </footer>
    </div>
  );
}
