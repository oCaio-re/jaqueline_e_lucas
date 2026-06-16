'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Search, 
  Lock, 
  Download, 
  Check, 
  X, 
  Loader2, 
  ArrowLeft, 
  CheckCircle, 
  AlertCircle, 
  Calendar, 
  RefreshCw,
  Sparkles,
  Trash2,
  Plus,
  MessageSquare,
  ChevronDown
} from 'lucide-react';
import { Toaster, toast } from 'sonner';

interface Convidado {
  id: string;
  nome_convite: string;
  membros: string;
  telefone: string;
  confirmado: boolean;
  data_confirmacao: string | null;
  mensagem: string | null;
}

function NoiseOverlay() {
  return (
    <svg className="pointer-events-none fixed inset-0 z-[999] w-full h-full opacity-[0.10] mix-blend-multiply">
      <filter id="paper-texture">
        <feTurbulence type="fractalNoise" baseFrequency="0.04 0.6" numOctaves="3" result="noise-h" />
        <feDiffuseLighting in="noise-h" lightingColor="#fff" surfaceScale="1.5" result="light-h">
          <feDistantLight azimuth="45" elevation="60" />
        </feDiffuseLighting>
        <feTurbulence type="fractalNoise" baseFrequency="0.6 0.04" numOctaves="3" result="noise-v" />
        <feDiffuseLighting in="light-v" lightingColor="#fff" surfaceScale="1.5" result="light-v">
          <feDistantLight azimuth="135" elevation="60" />
        </feDiffuseLighting>
        <feBlend in="light-h" in2="light-v" mode="multiply" result="linen" />
        <feTurbulence type="turbulence" baseFrequency="0.005" numOctaves="2" result="botanical-noise" />
        <feColorMatrix type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  1 0 0 0 -0.5" result="leaf-veins" />
        <feMorphology operator="dilate" radius="1" in="leaf-veins" result="spread-veins" />
        <feGaussianBlur stdDeviation="3" in="spread-veins" result="soft-leaf" />
        <feComposite in="linen" in2="soft-leaf" operator="arithmetic" k1="0" k2="1" k3="0.1" k4="0" result="botanical-paper" />
        <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="4" result="grain" />
        <feComposite in="botanical-paper" in2="grain" operator="arithmetic" k1="0.5" k2="0.6" />
      </filter>
      <rect width="100%" height="100%" filter="url(#paper-texture)" />
    </svg>
  );
}

function GlobalBackground() {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10 bg-[#f7f4ee]">
      <div className="absolute inset-0 bg-[radial-gradient(#ece6da_1px,transparent_1px)] [background-size:16px_16px] opacity-20" />
      <div className="absolute inset-0 bg-gradient-to-tr from-[#1f3b5c]/5 via-white to-[#c2a878]/5" />
    </div>
  );
}

export default function AdminPage() {
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  // Dashboard State
  const [convidados, setConvidados] = useState<Convidado[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'todos' | 'confirmados' | 'pendentes' | 'rejeitados'>('todos');

  // Add guest modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newGuestData, setNewGuestData] = useState({ nome_convite: '', membros: '', telefone: '' });

  // Client-side mount check
  useEffect(() => {
    setIsMounted(true);
    const auth = sessionStorage.getItem('admin_auth');
    if (auth === '1111') {
      setIsAuthenticated(true);
      fetchConvidados();
    } else {
      setLoading(false);
    }
  }, []);

  const fetchConvidados = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin');
      const data = await res.json();
      if (res.ok) {
        setConvidados(data.convidados || []);
      } else {
        toast.error('Erro ao carregar lista de convidados.');
      }
    } catch (err) {
      toast.error('Falha ao conectar com o servidor.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === '1111') {
      sessionStorage.setItem('admin_auth', '1111');
      setIsAuthenticated(true);
      setLoginError('');
      fetchConvidados();
    } else {
      setLoginError('Senha incorreta. Tente novamente.');
      toast.error('Acesso negado!');
    }
  };

  const changeStatus = async (id: string, novoStatus: string) => {
    setUpdatingId(id);
    try {
      const res = await fetch('/api/admin', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: novoStatus })
      });
      const data = await res.json();

      if (res.ok) {
        setConvidados(prev => 
          prev.map(c => {
            if (c.id !== id) return c;
            let conf = false;
            let date = null;
            if (novoStatus === 'confirmado') { conf = true; date = new Date().toISOString(); }
            else if (novoStatus === 'rejeitado') { conf = false; date = new Date().toISOString(); }
            return { ...c, confirmado: conf, data_confirmacao: date };
          })
        );
        toast.success(`Status atualizado para ${novoStatus}!`);
      } else {
        toast.error(data.error || 'Erro ao atualizar status.');
      }
    } catch (err) {
      toast.error('Erro de conexão ao atualizar.');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleAddGuest = async (e: React.FormEvent) => {
    e.preventDefault();
    const codigo = window.prompt("Digite o código secreto para confirmar a adição:");
    if (codigo !== '1111') {
      toast.error('Código incorreto. Ação cancelada.');
      return;
    }

    try {
      const res = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...newGuestData, codigo })
      });
      const data = await res.json();
      if (res.ok) {
        toast.success('Convidado adicionado com sucesso!');
        setConvidados(prev => [...prev, data.convidado]);
        setIsAddModalOpen(false);
        setNewGuestData({ nome_convite: '', membros: '', telefone: '' });
      } else {
        toast.error(data.error || 'Erro ao adicionar convidado.');
      }
    } catch (err) {
      toast.error('Erro de conexão ao adicionar.');
    }
  };

  const handleRemoveGuest = async (id: string, nome: string) => {
    if (!window.confirm(`Tem certeza que deseja remover ${nome}?`)) return;
    
    const codigo = window.prompt("Digite o código secreto para confirmar a remoção:");
    if (codigo !== '1111') {
      toast.error('Código incorreto. Ação cancelada.');
      return;
    }

    try {
      const res = await fetch('/api/admin', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, codigo })
      });
      const data = await res.json();
      if (res.ok) {
        toast.success('Convidado removido com sucesso!');
        setConvidados(prev => prev.filter(c => c.id !== id));
      } else {
        toast.error(data.error || 'Erro ao remover convidado.');
      }
    } catch (err) {
      toast.error('Erro de conexão ao remover.');
    }
  };

  // count individuals in members string (comma separated)
  const countPessoas = (membros: string): number => {
    if (!membros) return 0;
    return membros.split(',').map(m => m.trim()).filter(Boolean).length;
  };

  // Metrics Dashboard
  const totalConvites = convidados.length;
  const totalConfirmadosConvites = convidados.filter(c => c.confirmado).length;
  const totalRejeitadosConvites = convidados.filter(c => !c.confirmado && c.data_confirmacao).length;
  const totalPendentesConvites = totalConvites - totalConfirmadosConvites - totalRejeitadosConvites;

  const totalConvidadosEstimados = convidados.reduce((acc, curr) => acc + countPessoas(curr.membros), 0);
  const totalConvidadosConfirmados = convidados
    .filter(c => c.confirmado)
    .reduce((acc, curr) => acc + countPessoas(curr.membros), 0);
  const totalConvidadosRejeitados = convidados
    .filter(c => !c.confirmado && c.data_confirmacao)
    .reduce((acc, curr) => acc + countPessoas(curr.membros), 0);
  const totalConvidadosPendentes = totalConvidadosEstimados - totalConvidadosConfirmados - totalConvidadosRejeitados;

  const porcentagemConfirmada = totalConvites > 0 
    ? Math.round((totalConfirmadosConvites / totalConvites) * 100) 
    : 0;

  // Filter list
  const filteredConvidados = convidados.filter(c => {
    const matchesSearch = 
      c.nome_convite.toLowerCase().includes(search.toLowerCase()) ||
      c.membros.toLowerCase().includes(search.toLowerCase()) ||
      c.telefone.includes(search);
    
    if (filter === 'confirmados') return matchesSearch && c.confirmado;
    if (filter === 'pendentes') return matchesSearch && !c.confirmado && !c.data_confirmacao;
    if (filter === 'rejeitados') return matchesSearch && !c.confirmado && !!c.data_confirmacao;
    return matchesSearch;
  });

  // CSV Export
  const exportToCSV = () => {
    if (convidados.length === 0) {
      toast.warning('Nenhum dado para exportar.');
      return;
    }

    const headers = ['Nome do Convite', 'Membros', 'Telefone', 'Status', 'Data de Confirmacao', 'Mensagem'];
    const rows = filteredConvidados.map(c => [
      c.nome_convite,
      c.membros,
      c.telefone,
      c.confirmado ? 'Confirmado' : (c.data_confirmacao ? 'Rejeitado' : 'Pendente'),
      c.data_confirmacao ? new Date(c.data_confirmacao).toLocaleString('pt-PT') : 'N/A',
      c.mensagem || ''
    ]);

    const csvContent = "\uFEFF" + [
      headers.join(';'),
      ...rows.map(row => row.map(val => `"${val.replace(/"/g, '""')}"`).join(';'))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `jaqueline_lucas_convidados_${filter}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Arquivo CSV descarregado com sucesso!');
  };

  const handleLogout = () => {
    sessionStorage.removeItem('admin_auth');
    setIsAuthenticated(false);
    setPassword('');
    toast.info('Sessão encerrada.');
  };

  if (!isMounted) return null;

  // 1. Password Login screen
  if (!isAuthenticated) {
    return (
      <main className="relative min-h-screen flex items-center justify-center font-sans overflow-x-hidden px-4 bg-[#f7f4ee]">
        <NoiseOverlay />
        <GlobalBackground />
        <Toaster position="top-right" richColors />
        
        <div className="w-full max-w-md bg-white/60 backdrop-blur-md p-8 rounded-2xl shadow-xl border border-white/50 relative z-10 flex flex-col gap-6 text-center">
          <div className="flex flex-col items-center gap-2">
            <div className="w-12 h-12 rounded-full bg-[#c2a878]/15 flex items-center justify-center text-[#a98c5b] mb-2">
              <Lock className="w-6 h-6" />
            </div>
            <h1 className="text-2xl font-serif text-[#142a44]">Acesso Administrativo</h1>
            <p className="text-sm text-[#5a6172]">Insira a senha secreta de acesso para gerir o RSVP do casamento.</p>
          </div>

          <form onSubmit={handleLogin} className="flex flex-col gap-4 text-left">
            <div>
              <label htmlFor="pass" className="block text-xs font-semibold text-[#a98c5b] uppercase tracking-wider mb-2">Senha</label>
              <input
                id="pass"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-white/80 border border-[#c2a878]/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1f3b5c]/30 text-center font-bold tracking-widest text-[#1f3b5c] placeholder:text-[#c2a878] transition-all"
                placeholder="••••"
              />
              {loginError && <p className="text-xs text-red-500 mt-2 text-center font-medium">{loginError}</p>}
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-[#1f3b5c] hover:bg-[#142a44] text-white rounded-xl font-medium shadow-md shadow-[#1f3b5c]/20 transition-all active:scale-[0.98] cursor-pointer"
            >
              Entrar no Painel
            </button>
          </form>

          <Link href="/" className="text-xs text-[#a98c5b]/70 hover:text-[#a98c5b] flex items-center justify-center gap-1 transition-colors mt-2">
            <ArrowLeft className="w-3.5 h-3.5" /> Voltar para o Site
          </Link>
        </div>
      </main>
    );
  }

  // 2. Main Dashboard panel
  return (
    <main className="relative min-h-screen font-sans bg-[#f7f4ee] pb-16">
      <NoiseOverlay />
      <GlobalBackground />
      <Toaster position="top-right" richColors />

      {/* Header */}
      <header className="w-full border-b border-[#c2a878]/20 bg-white/40 backdrop-blur-md sticky top-0 z-40 transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Sparkles className="w-5 h-5 text-[#c2a878] hidden sm:block animate-pulse" />
            <h1 className="text-lg sm:text-xl font-serif text-[#142a44] font-bold">Jaqueline & Lucas | Admin</h1>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={fetchConvidados}
              disabled={loading}
              className="p-2 text-[#5a6172]/80 hover:text-[#1f3b5c] hover:bg-white/50 rounded-full transition-all disabled:opacity-50 cursor-pointer"
              title="Recarregar dados"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button 
              onClick={handleLogout}
              className="text-xs font-semibold uppercase tracking-wider text-red-500 hover:text-red-700 px-3.5 py-1.5 hover:bg-red-50 rounded-lg transition-all cursor-pointer"
            >
              Sair
            </button>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 flex flex-col gap-8 relative z-10">
        
        {/* Welcome Banner */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-[#1f3b5c]/10 to-[#c2a878]/5 p-6 rounded-2xl border border-white shadow-sm">
          <div>
            <h2 className="text-2xl font-serif text-[#142a44] mb-1">Olá, Jaqueline & Lucas! 💍</h2>
            <p className="text-xs sm:text-sm text-[#5a6172]">Gerencie as presenças, mensagens e exportações de convidados em tempo real.</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center justify-center gap-2 px-4 py-2.5 bg-white hover:bg-white/90 text-[#1f3b5c] border border-[#1f3b5c]/30 rounded-xl text-xs sm:text-sm font-medium transition-all shadow-sm active:scale-95 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Adicionar Convidado
            </button>
            <button
              onClick={exportToCSV}
              className="flex items-center justify-center gap-2 px-4 py-2.5 bg-[#1f3b5c] hover:bg-[#142a44] text-white rounded-xl text-xs sm:text-sm font-medium transition-all shadow-md active:scale-95 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              Exportar Lista para Excel
            </button>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Invites */}
          <div className="bg-white/70 backdrop-blur-sm p-4 sm:p-5 rounded-2xl border border-white shadow-sm flex flex-col gap-2">
            <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-[#a98c5b]">Convites Gerais</span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-serif text-[#1f3b5c] font-bold">{totalConvites}</span>
              <span className="text-xs text-[#5a6172]">totais</span>
            </div>
            <div className="text-[10px] sm:text-xs text-[#5a6172]/80 mt-1 flex justify-between">
              <span>{totalConfirmadosConvites} Sim</span>
              <span>•</span>
              <span>{totalPendentesConvites} Pendentes</span>
            </div>
          </div>

          {/* Card 2: Confirmed Guests */}
          <div className="bg-white/70 backdrop-blur-sm p-4 sm:p-5 rounded-2xl border border-white shadow-sm flex flex-col gap-2">
            <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-emerald-800">Pessoas Confirmadas</span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-serif text-emerald-800 font-bold">{totalConvidadosConfirmados}</span>
              <span className="text-xs text-[#5a6172]">presenças</span>
            </div>
            <div className="text-[10px] sm:text-xs text-[#5a6172]/80 mt-1">
              De {totalConvidadosEstimados} pessoas previstas na lista
            </div>
          </div>

          {/* Card 3: Pending Guests */}
          <div className="bg-white/70 backdrop-blur-sm p-4 sm:p-5 rounded-2xl border border-white shadow-sm flex flex-col gap-2">
            <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-amber-700">Pessoas Pendentes</span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-serif text-amber-700 font-bold">{totalConvidadosPendentes}</span>
              <span className="text-xs text-[#5a6172]">aguardando</span>
            </div>
            <div className="text-[10px] sm:text-xs text-[#5a6172]/80 mt-1">
              Falta responder {totalPendentesConvites} convites
            </div>
          </div>

          {/* Card 4: Progress Confirmation rate */}
          <div className="bg-white/70 backdrop-blur-sm p-4 sm:p-5 rounded-2xl border border-white shadow-sm flex flex-col gap-2">
            <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-[#a98c5b]">Taxa de Confirmação</span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-serif text-[#1f3b5c] font-bold">{porcentagemConfirmada}%</span>
              <span className="text-xs text-[#5a6172]">concluído</span>
            </div>
            <div className="w-full bg-[#1f3b5c]/10 h-1.5 rounded-full mt-2 overflow-hidden">
              <div 
                className="bg-[#c2a878] h-full rounded-full transition-all duration-500" 
                style={{ width: `${porcentagemConfirmada}%` }}
              />
            </div>
          </div>
        </div>

        {/* Table wrapper */}
        <div className="bg-white/60 backdrop-blur-md rounded-2xl border border-white/60 shadow-xl overflow-hidden flex flex-col">
          
          {/* Search bar and tabs */}
          <div className="p-4 sm:p-6 border-b border-[#c2a878]/20 flex flex-col sm:flex-row gap-4 justify-between items-center bg-white/40">
            {/* Search Input */}
            <div className="relative w-full sm:max-w-md">
              <Search className="w-4 h-4 text-[#1f3b5c] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white/80 border border-[#c2a878]/40 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1f3b5c]/30 text-sm text-[#1f3b5c] placeholder:text-[#1f3b5c]/50 transition-all"
                placeholder="Buscar por nome do convite ou convidado..."
              />
            </div>

            {/* Filter tabs (with smooth horizontal scroll on mobile) */}
            <div className="flex p-1 bg-[#f7f4ee] border border-[#c2a878]/20 rounded-xl w-full sm:w-auto overflow-x-auto whitespace-nowrap scrollbar-none gap-1">
              {(['todos', 'confirmados', 'rejeitados', 'pendentes'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setFilter(tab)}
                  className={`flex-1 sm:flex-initial px-4 py-2 text-[10px] md:text-xs font-semibold uppercase tracking-wider rounded-lg transition-all flex-shrink-0 cursor-pointer ${
                    filter === tab
                      ? 'bg-[#1f3b5c] text-white shadow-sm'
                      : 'text-[#1f3b5c]/70 hover:text-[#1f3b5c] hover:bg-white/40'
                  }`}
                >
                  {tab === 'todos' ? 'Todos' : tab === 'confirmados' ? 'Confirmados' : tab === 'rejeitados' ? 'Rejeitados' : 'Pendentes'}
                </button>
              ))}
            </div>
          </div>

          {/* List display */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3 text-[#1f3b5c]">
              <Loader2 className="w-8 h-8 animate-spin opacity-80" />
              <p className="text-sm font-medium animate-pulse">Carregando dados da lista...</p>
            </div>
          ) : filteredConvidados.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3 text-center px-4">
              <AlertCircle className="w-10 h-10 text-[#1f3b5c]/50" />
              <h3 className="text-lg font-serif text-[#1f3b5c]">Nenhum convidado encontrado</h3>
              <p className="text-xs sm:text-sm text-[#5a6172]/80 max-w-md">Não encontramos nenhum registo correspondente aos filtros de busca atuais.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#c2a878]/10 text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-[#1f3b5c] bg-white/20 whitespace-nowrap">
                    <th className="py-4 px-4 sm:px-6">Convite / Família</th>
                    <th className="py-4 px-4 sm:px-6">Membros (Qtde)</th>
                    <th className="py-4 px-4 sm:px-6 hidden md:table-cell">Telefone</th>
                    <th className="py-4 px-4 sm:px-6 text-center">Status</th>
                    <th className="py-4 px-4 sm:px-6 hidden lg:table-cell">Data de Confirm.</th>
                    <th className="py-4 px-4 sm:px-6 max-w-[200px] sm:max-w-xs">Mensagem</th>
                    <th className="py-4 px-4 sm:px-6 text-center">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#c2a878]/10 text-xs sm:text-sm">
                  {filteredConvidados.map((convidado) => {
                    const totalMembros = countPessoas(convidado.membros);
                    
                    return (
                      <tr 
                        key={convidado.id} 
                        className={`transition-colors hover:bg-[#f7f4ee]/40 ${
                          convidado.confirmado ? 'bg-emerald-50/5' : ''
                        }`}
                      >
                        {/* Family / Invite name */}
                        <td className="py-4 px-4 sm:px-6 font-serif text-[#1f3b5c] font-semibold text-sm sm:text-base whitespace-nowrap">
                          {convidado.nome_convite}
                        </td>
                        
                        {/* Members names */}
                        <td className="py-4 px-4 sm:px-6 text-[#5a6172] whitespace-nowrap">
                          <div className="flex flex-col">
                            <span className="font-medium text-xs sm:text-sm">{convidado.membros}</span>
                            <span className="text-[10px] text-[#5a6172]/60 mt-0.5 font-sans">({totalMembros} {totalMembros === 1 ? 'pessoa' : 'pessoas'})</span>
                          </div>
                        </td>

                        {/* Phone */}
                        <td className="py-4 px-4 sm:px-6 text-[#5a6172] font-mono hidden md:table-cell whitespace-nowrap">
                          {convidado.telefone}
                        </td>

                        {/* Status Select with custom ChevronDown indicator */}
                        <td className="py-4 px-4 sm:px-6 text-center whitespace-nowrap">
                          {updatingId === convidado.id ? (
                            <Loader2 className="w-5 h-5 animate-spin text-[#1f3b5c] mx-auto" />
                          ) : (
                            <div className="relative inline-block text-left">
                              <select
                                value={
                                  convidado.confirmado ? 'confirmado' 
                                  : (!convidado.confirmado && convidado.data_confirmacao ? 'rejeitado' : 'pendente')
                                }
                                onChange={(e) => changeStatus(convidado.id, e.target.value)}
                                className={`pl-4 pr-8 py-1.5 rounded-full text-xs font-semibold tracking-wide transition-all shadow-sm outline-none appearance-none cursor-pointer text-center ${
                                  convidado.confirmado ? 'bg-emerald-100 text-emerald-800 focus:ring-2 focus:ring-emerald-300'
                                  : (!convidado.confirmado && convidado.data_confirmacao ? 'bg-rose-100 text-rose-800 focus:ring-2 focus:ring-rose-300' : 'bg-slate-100 text-slate-600 focus:ring-2 focus:ring-slate-300')
                                }`}
                                style={{ textAlignLast: 'center' }}
                              >
                                <option value="pendente">Pendente</option>
                                <option value="confirmado">Confirmado</option>
                                <option value="rejeitado">Rejeitado</option>
                              </select>
                              <ChevronDown className={`absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none ${
                                convidado.confirmado ? 'text-emerald-800'
                                : (!convidado.confirmado && convidado.data_confirmacao ? 'text-rose-800' : 'text-slate-500')
                              }`} />
                            </div>
                          )}
                        </td>

                        {/* Confirmation Date */}
                        <td className="py-4 px-4 sm:px-6 text-[#5a6172]/80 text-[10px] font-sans hidden lg:table-cell whitespace-nowrap">
                          {convidado.data_confirmacao ? (
                            <div className="flex items-center gap-1.5">
                              <Calendar className="w-3.5 h-3.5 text-[#1f3b5c]/60" />
                              {new Date(convidado.data_confirmacao).toLocaleString('pt-PT', {
                                day: '2-digit',
                                month: '2-digit',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </div>
                          ) : (
                            <span className="italic text-[#5a6172]/40">Aguardando</span>
                          )}
                        </td>

                        {/* Message */}
                        <td className="py-4 px-4 sm:px-6 max-w-[200px] sm:max-w-xs text-xs text-[#5a6172] break-words italic">
                          {convidado.mensagem ? (
                            <div className="flex gap-2 items-start bg-white/70 p-2 rounded-lg border border-[#c2a878]/10 shadow-sm">
                              <MessageSquare className="w-3.5 h-3.5 text-[#1f3b5c]/70 shrink-0 mt-0.5" />
                              <span className="line-clamp-2 hover:line-clamp-none transition-all">{convidado.mensagem}</span>
                            </div>
                          ) : (
                            <span className="text-[#5a6172]/30 font-sans">Sem mensagem</span>
                          )}
                        </td>

                        {/* Actions (Delete) */}
                        <td className="py-4 px-4 sm:px-6 text-center whitespace-nowrap">
                          <button
                            onClick={() => handleRemoveGuest(convidado.id, convidado.nome_convite)}
                            title="Remover Convidado"
                            className="p-1.5 text-rose-400 hover:text-white hover:bg-rose-500 rounded-lg transition-all cursor-pointer inline-flex"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Add Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-md overflow-hidden border border-[#c2a878]/20">
            <div className="p-6 border-b border-[#c2a878]/20 flex justify-between items-center bg-[#f7f4ee]">
              <h3 className="font-serif text-2xl text-[#142a44]">Adicionar Convidado</h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-[#1f3b5c]/60 hover:text-[#1f3b5c] cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAddGuest} className="p-6 flex flex-col gap-4 bg-[#f7f4ee]">
              <div>
                <label className="block text-xs font-semibold text-[#1f3b5c] uppercase tracking-wider mb-1">Nome do Convite (ex: Família Silva)</label>
                <input
                  required
                  type="text"
                  value={newGuestData.nome_convite}
                  onChange={e => setNewGuestData({...newGuestData, nome_convite: e.target.value})}
                  className="w-full px-4 py-2 bg-white border border-[#c2a878]/40 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1f3b5c]/30 text-sm text-[#1f3b5c]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#1f3b5c] uppercase tracking-wider mb-1">Membros (separados por vírgula)</label>
                <input
                  required
                  type="text"
                  placeholder="João, Maria, Enzo"
                  value={newGuestData.membros}
                  onChange={e => setNewGuestData({...newGuestData, membros: e.target.value})}
                  className="w-full px-4 py-2 bg-white border border-[#c2a878]/40 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1f3b5c]/30 text-sm text-[#1f3b5c]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#1f3b5c] uppercase tracking-wider mb-1">Telefone (opcional)</label>
                <input
                  type="text"
                  value={newGuestData.telefone}
                  onChange={e => setNewGuestData({...newGuestData, telefone: e.target.value})}
                  className="w-full px-4 py-2 bg-white border border-[#c2a878]/40 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1f3b5c]/30 text-sm text-[#1f3b5c]"
                />
              </div>
              <button
                type="submit"
                className="w-full mt-2 py-3 bg-[#1f3b5c] hover:bg-[#142a44] text-white rounded-xl font-medium shadow-sm transition-all cursor-pointer"
              >
                Salvar Convidado
              </button>
            </form>
          </div>
        </div>
      )}

    </main>
  );
}
