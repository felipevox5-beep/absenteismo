import React, { useState, useEffect } from 'react';
import { 
  Users, 
  ShieldCheck, 
  ShieldAlert, 
  UserPlus, 
  Search, 
  Trash2, 
  RefreshCw, 
  Lock, 
  Mail, 
  User as UserIcon,
  ChevronRight,
  Activity,
  CheckCircle2,
  X,
  History
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface User {
  id: number;
  username: string;
  email: string;
  role: string;
  status: string;
  lastLogin?: string;
  createdAt: string;
  employee?: { name: string };
}

interface AuditLog {
  id: number;
  action: string;
  tableName: string;
  timestamp: string;
  ipAddress: string;
  user?: { username: string };
  details?: string;
}

export function UserManagement({ token, onNotification }: { token: string, onNotification: (text: string) => void }) {
  const [users, setUsers] = useState<User[]>([]);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'users' | 'logs'>('users');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    role: 'COMUM'
  });

  const apiFetch = async (url: string, options: any = {}) => {
    const res = await fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        'Authorization': `Bearer ${token}`
      }
    });
    if (!res.ok) throw new Error('Falha na requisição');
    return res;
  };

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [usersRes, logsRes] = await Promise.all([
        apiFetch('/api/admin/users'),
        apiFetch('/api/admin/logs')
      ]);
      setUsers(await usersRes.json());
      setLogs(await logsRes.json());
    } catch (error) {
      onNotification('ERRO: Falha ao carregar dados administrativos.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await apiFetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        onNotification(`[SISTEMA] Usuário ${formData.username} criado com sucesso.`);
        setIsModalOpen(false);
        setFormData({ username: '', email: '', password: '', role: 'COMUM' });
        fetchData();
      }
    } catch (error) {
      onNotification('ERRO: Falha ao criar usuário.');
    }
  };

  const handleToggleStatus = async (user: User) => {
    const newStatus = user.status === 'ATIVO' ? 'INATIVO' : 'ATIVO';
    try {
      await apiFetch(`/api/admin/users/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      onNotification(`[SISTEMA] Status de ${user.username} alterado para ${newStatus}.`);
      fetchData();
    } catch (error) {
      onNotification('ERRO: Falha ao alterar status.');
    }
  };

  const handleDeleteUser = async (id: number) => {
    if (!confirm('Tem certeza que deseja remover este usuário permanentemente?')) return;
    try {
      await apiFetch(`/api/admin/users/${id}`, { method: 'DELETE' });
      onNotification(`[SISTEMA] Usuário removido do Kernel.`);
      fetchData();
    } catch (error) {
      onNotification('ERRO: Falha ao remover usuário.');
    }
  };

  const filteredUsers = users.filter(u => 
    u.username.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-[#1A1D23] p-6 rounded-lg border border-slate-800 shadow-xl">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-3">
            <ShieldCheck className="text-blue-500" />
            Central de Controle Administrativo
          </h2>
          <p className="text-slate-500 text-xs font-mono mt-1 uppercase tracking-wider">Kernel // Segurança // Usuários</p>
        </div>
        
        <div className="flex gap-2">
          <button 
            onClick={() => setActiveTab('users')}
            className={`px-4 py-2 rounded-md font-mono text-xs uppercase tracking-widest transition-all ${activeTab === 'users' ? 'bg-blue-500 text-white shadow-[0_0_15px_rgba(59,130,246,0.4)]' : 'bg-slate-800 text-slate-400 hover:text-white'}`}
          >
            Usuários
          </button>
          <button 
            onClick={() => setActiveTab('logs')}
            className={`px-4 py-2 rounded-md font-mono text-xs uppercase tracking-widest transition-all ${activeTab === 'logs' ? 'bg-orange-500 text-white shadow-[0_0_15px_rgba(249,115,22,0.4)]' : 'bg-slate-800 text-slate-400 hover:text-white'}`}
          >
            Logs Auditoria
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'users' ? (
          <motion.div 
            key="users-tab"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="space-y-4"
          >
            <div className="flex justify-between items-center gap-4">
              <div className="relative flex-grow max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                <input 
                  type="text" 
                  placeholder="Pesquisar usuários..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-[#1A1D23] border border-slate-800 rounded-lg py-2.5 pl-10 pr-4 text-sm text-white focus:border-blue-500 outline-none transition-all"
                />
              </div>
              <button 
                onClick={() => setIsModalOpen(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg flex items-center gap-2 font-bold text-sm transition-all active:scale-95 shadow-lg"
              >
                <UserPlus size={18} />
                <span className="hidden sm:inline">Novo Usuário</span>
              </button>
            </div>

            <div className="bg-[#1A1D23] rounded-lg border border-slate-800 overflow-hidden shadow-2xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left font-mono">
                  <thead>
                    <tr className="bg-slate-900/50 text-slate-500 text-[10px] font-bold uppercase tracking-widest">
                      <th className="px-6 py-4 border-b border-slate-800">Identificação</th>
                      <th className="px-6 py-4 border-b border-slate-800">Email</th>
                      <th className="px-6 py-4 border-b border-slate-800 text-center">Nível</th>
                      <th className="px-6 py-4 border-b border-slate-800 text-center">Status</th>
                      <th className="px-6 py-4 border-b border-slate-800 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map(user => (
                      <tr key={user.id} className="border-b border-slate-800 hover:bg-white/5 transition-colors group">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400">
                              <UserIcon size={16} />
                            </div>
                            <div>
                              <div className="text-sm font-bold text-white uppercase">{user.username}</div>
                              <div className="text-[10px] text-slate-500">{user.employee?.name || 'Sistema'}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-xs text-slate-300">{user.email}</td>
                        <td className="px-6 py-4 text-center">
                          <span className={`text-[10px] px-2 py-1 rounded font-bold ${user.role === 'MASTER' ? 'bg-blue-500/10 text-blue-500 border border-blue-500/30' : 'bg-slate-700/50 text-slate-400 border border-slate-600/30'}`}>
                            {user.role}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <button 
                            onClick={() => handleToggleStatus(user)}
                            className={`text-[10px] px-2 py-1 rounded font-bold transition-all ${user.status === 'ATIVO' ? 'bg-green-500/10 text-green-500 border border-green-500/30' : 'bg-rose-500/10 text-rose-500 border border-rose-500/30'}`}
                          >
                            {user.status}
                          </button>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button 
                            onClick={() => handleDeleteUser(user.id)}
                            className="p-2 text-slate-500 hover:text-rose-500 transition-colors"
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div 
            key="logs-tab"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="bg-[#1A1D23] rounded-lg border border-slate-800 overflow-hidden shadow-2xl"
          >
            <div className="overflow-x-auto">
              <table className="w-full text-left font-mono">
                <thead>
                  <tr className="bg-slate-900/50 text-slate-500 text-[10px] font-bold uppercase tracking-widest">
                    <th className="px-6 py-4 border-b border-slate-800">Timestamp</th>
                    <th className="px-6 py-4 border-b border-slate-800">Usuário</th>
                    <th className="px-6 py-4 border-b border-slate-800">Ação</th>
                    <th className="px-6 py-4 border-b border-slate-800">Objeto</th>
                    <th className="px-6 py-4 border-b border-slate-800">IP Address</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map(log => (
                    <tr key={log.id} className="border-b border-slate-800 hover:bg-white/5 transition-colors">
                      <td className="px-6 py-3 text-[10px] text-slate-500">
                        {new Date(log.timestamp).toLocaleString('pt-BR')}
                      </td>
                      <td className="px-6 py-3 text-xs font-bold text-slate-300">
                        {log.user?.username || 'Sistema'}
                      </td>
                      <td className="px-6 py-3">
                        <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold border ${
                          log.action.includes('CREATE') ? 'bg-green-500/10 text-green-500 border-green-500/30' :
                          log.action.includes('DELETE') ? 'bg-rose-500/10 text-rose-500 border-rose-500/30' :
                          'bg-blue-500/10 text-blue-500 border-blue-500/30'
                        }`}>
                          {log.action}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-xs text-slate-400">{log.tableName}</td>
                      <td className="px-6 py-3 text-[10px] text-slate-600">{log.ipAddress}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal Novo Usuário */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-[#1A1D23] border border-slate-800 rounded-2xl w-full max-w-md overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)]"
          >
            <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-800/30">
              <h3 className="text-lg font-bold text-white flex items-center gap-2 uppercase tracking-tighter">
                <UserPlus className="text-blue-500" />
                Registrar Novo Acesso
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-500 hover:text-white">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleCreateUser} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest">Username</label>
                <div className="relative">
                  <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" size={14} />
                  <input 
                    type="text" 
                    required
                    value={formData.username}
                    onChange={e => setFormData({...formData, username: e.target.value})}
                    className="w-full bg-slate-900/50 border border-slate-800 rounded-lg py-2 pl-10 pr-4 text-sm text-white focus:border-blue-500 outline-none"
                    placeholder="ex: joao.silva"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest">Email Corporativo</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" size={14} />
                  <input 
                    type="email" 
                    required
                    value={formData.email}
                    onChange={e => setFormData({...formData, email: e.target.value})}
                    className="w-full bg-slate-900/50 border border-slate-800 rounded-lg py-2 pl-10 pr-4 text-sm text-white focus:border-blue-500 outline-none"
                    placeholder="email@empresa.com"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest">Senha Temporária</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" size={14} />
                  <input 
                    type="password" 
                    required
                    value={formData.password}
                    onChange={e => setFormData({...formData, password: e.target.value})}
                    className="w-full bg-slate-900/50 border border-slate-800 rounded-lg py-2 pl-10 pr-4 text-sm text-white focus:border-blue-500 outline-none"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest">Nível de Acesso</label>
                <select 
                  value={formData.role}
                  onChange={e => setFormData({...formData, role: e.target.value})}
                  className="w-full bg-slate-900/50 border border-slate-800 rounded-lg py-2 px-4 text-sm text-white focus:border-blue-500 outline-none"
                >
                  <option value="COMUM">USUÁRIO COMUM</option>
                  <option value="MASTER">ADMINISTRADOR MASTER</option>
                </select>
              </div>

              <div className="pt-4 flex gap-3">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-grow bg-slate-800 hover:bg-slate-700 text-slate-400 font-bold py-3 rounded-xl text-sm transition-all"
                >
                  CANCELAR
                </button>
                <button 
                  type="submit"
                  className="flex-grow bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl text-sm transition-all shadow-lg"
                >
                  CRIAR ACESSO
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
}
