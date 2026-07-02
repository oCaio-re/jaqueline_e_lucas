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
  Calendar, 
  MessageSquare,
  RefreshCw,
  Sparkles,
  Trash2,
  Plus,
  Edit,
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
    <div className="pointer-events-none fixed inset-0 z-[999] w-full h-full opacity-[0.08] mix-blend-multiply">
      <svg className="w-full h-full">
        <filter id="paper-texture">
          <feTurbulence type="fractalNoise" baseFrequency="0.04 0.6" numOctaves="3" result="noise-h" />
          <feDiffuseLighting in="noise-h" lightingColor="#fff" surfaceScale="1.5" result="light-h">
            <feDistantLight azimuth="45" elevation="60" />
          </feDiffuseLighting>
          <feTurbulence type="fractalNoise" baseFrequency="0.6 0.04" numOctaves="3" result="noise-v" />
          <feDiffuseLighting in="noise-v" lightingColor="#fff" surfaceScale="1.5" result="light-v">
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
    </div>
  );
}

function GlobalBackground() {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10 bg-[#f7f4ee]">
      <div className="absolute inset-0 bg-[radial-gradient(#c2a878_1.2px,transparent_1.2px)] [background-size:20px_20px] opacity-15" />
      <div className="absolute inset-0 bg-gradient-to-tr from-navy/5 via-white to-gold/5" />
    </div>
  );
}

export default function AdminPage() {
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  // Estados do Dashboard
  const [convidados, setConvidados] = useState<Convidado[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'todos' | 'confirmados' | 'pendentes' | 'rejeitados'>('todos');
  const [lastUpdated, setLastUpdated] = useState<string>('');

  // Adicionar convidado
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newGuestData, setNewGuestData] = useState({ nome_convite: '', membros: '', telefone: '' });

  // Garante carregamento no lado do cliente
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
        const now = new Date();
        const dateStr = now.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
        const timeStr = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        setLastUpdated(`${dateStr}, ${timeStr}`);
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

  const handleEditGuest = async (convidado: Convidado) => {
    const novoNome = window.prompt("Nome do Convite:", convidado.nome_convite);
    if (novoNome === null) return;
    const novosMembros = window.prompt("Membros (separados por vírgula):", convidado.membros);
    if (novosMembros === null) return;
    const novoTelefone = window.prompt("Telefone:", convidado.telefone || '');
    if (novoTelefone === null) return;

    const codigo = window.prompt("Digite o código secreto para confirmar a edição:");
    if (codigo !== '1111') {
      toast.error('Código incorreto. Ação cancelada.');
      return;
    }

    try {
      const res = await fetch('/api/admin', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: convidado.id, nome_convite: novoNome, membros: novosMembros, telefone: novoTelefone })
      });
      const data = await res.json();
      if (res.ok) {
        toast.success('Convidado atualizado com sucesso!');
        setConvidados(prev => prev.map(c => c.id === convidado.id ? { ...c, nome_convite: novoNome, membros: novosMembros, telefone: novoTelefone } : c));
      } else {
        toast.error(data.error || 'Erro ao atualizar convidado.');
      }
    } catch (err) {
      toast.error('Erro de conexão ao atualizar.');
    }
  };

  // Contagem dinâmica de pessoas (membros separados por vírgula)
  const countPessoas = (membros: string): number => {
    if (!membros) return 0;
    return membros.split(',').map(m => m.trim()).filter(Boolean).length;
  };

  // Métricas do Dashboard
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

  // Filtragem da Lista
  const filteredConvidados = convidados.filter(c => {
    const matchesSearch = 
      c.nome_convite.toLowerCase().includes(search.toLowerCase()) ||
      c.membros.toLowerCase().includes(search.toLowerCase()) ||
      (c.telefone && c.telefone.includes(search)) ||
      (c.mensagem && c.mensagem.toLowerCase().includes(search.toLowerCase()));
    
    if (filter === 'confirmados') return matchesSearch && c.confirmado;
    if (filter === 'pendentes') return matchesSearch && !c.confirmado && !c.data_confirmacao;
    if (filter === 'rejeitados') return matchesSearch && !c.confirmado && !!c.data_confirmacao;
    return matchesSearch;
  });

  // Exportação CSV
  const exportToCSV = () => {
    if (convidados.length === 0) {
      toast.warning('Nenhum dado para exportar.');
      return;
    }

    const headers = ['Nome do Convite', 'Membros', 'Telefone', 'Status', 'Data de Confirmacao', 'Mensagem'];
    const rows = filteredConvidados.map(c => [
      c.nome_convite,
      c.membros,
      c.telefone || '',
      c.confirmado ? 'Confirmado' : (c.data_confirmacao ? 'Rejeitado' : 'Pendente'),
      c.data_confirmacao ? new Date(c.data_confirmacao).toLocaleString('pt-PT') : 'N/A',
      c.mensagem || ''
    ]);

    // Usa UTF-8 com BOM para garantir que o Excel abra os acentos corretamente
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
    toast.success('Ficheiro CSV baixado com sucesso!');
  };

  const handleLogout = () => {
    sessionStorage.removeItem('admin_auth');
    setIsAuthenticated(false);
    setPassword('');
    toast.info('Sessão encerrada.');
  };

  if (!isMounted) return null;

  // 1. Tela de Login/Acesso por Código
  if (!isAuthenticated) {
    return (
      <main className="relative min-h-screen flex items-center justify-center font-sans overflow-x-hidden px-4 bg-[#f7f4ee]">
        <div className="w-full max-w-md bg-white/60 backdrop-blur-md p-8 rounded-2xl shadow-xl border border-gold/20 relative z-10 flex flex-col gap-6 text-center">
          <div className="flex flex-col items-center gap-2">
            <div className="w-12 h-12 rounded-full bg-gold/15 flex items-center justify-center text-gold-deep mb-2">
              <Lock className="w-6 h-6" />
            </div>
            <h1 className="text-2xl font-serif text-navy-dark font-medium">Acesso Administrativo</h1>
            <p className="text-sm text-ink-soft">Insira a senha secreta de acesso para gerenciar o RSVP do casamento de Jaqueline & Lucas.</p>
          </div>

          <form onSubmit={handleLogin} className="flex flex-col gap-4 text-left">
            <div>
              <label htmlFor="pass" className="block text-xs font-semibold text-gold-deep uppercase tracking-wider mb-2">Senha</label>
              <input
                id="pass"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-white/80 border border-gold/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-gold/30 text-center font-bold tracking-widest text-navy-dark placeholder:text-gold/20 transition-all"
                placeholder="••••"
              />
              {loginError && <p className="text-xs text-red-500 mt-2 text-center font-medium">{loginError}</p>}
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-navy hover:bg-navy-dark text-cream rounded-xl font-medium shadow-md shadow-navy/20 transition-all active:scale-[0.98] cursor-pointer"
            >
              Entrar no Painel
            </button>
          </form>

          <Link href="/" className="text-xs text-navy/70 hover:text-navy flex items-center justify-center gap-1 transition-colors mt-2">
            <ArrowLeft className="w-3.5 h-3.5" /> Voltar para a Página Inicial
          </Link>
        </div>
        <NoiseOverlay />
        <GlobalBackground />
        <Toaster position="top-right" richColors />
      </main>
    );
  }

  // 2. Tela Principal do Dashboard Administrativo
  return (
    <main className="relative min-h-screen font-sans bg-cream pb-16 pt-20">
      {/* Header */}
      <header className="w-full bg-navy-dark fixed inset-x-0 top-0 z-40 transition-all shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-script text-white font-light tracking-wide">J&amp;L Confirmações</h1>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={fetchConvidados}
              disabled={loading}
              className="flex items-center gap-1.5 px-4.5 py-2 bg-gold hover:bg-gold-deep text-navy-dark rounded-full text-xs font-bold uppercase tracking-wider transition-all disabled:opacity-50 cursor-pointer shadow-sm active:scale-95"
              title="Recarregar dados"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              Atualizar
            </button>
            <button 
              onClick={exportToCSV}
              className="flex items-center gap-1.5 px-4.5 py-2 bg-gold hover:bg-gold-deep text-navy-dark rounded-full text-xs font-bold uppercase tracking-wider transition-all cursor-pointer shadow-sm active:scale-95"
              title="Exportar dados para Excel"
            >
              <Download className="w-3.5 h-3.5" />
              Exportar CSV
            </button>
            <button 
              onClick={handleLogout}
              className="px-5 py-2 border border-white/30 hover:border-white text-white hover:bg-white/10 rounded-full text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer active:scale-95"
            >
              Sair
            </button>
          </div>
        </div>
      </header>

      {/* Conteúdo Principal */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 flex flex-col gap-6 relative z-10">
        
        {/* Painel de Métricas */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Card 1: Confirmados */}
          <div className="bg-white p-6 rounded-2xl shadow-[0_4px_20px_rgba(20,30,50,0.03)] border border-cream-deep/40 flex flex-col justify-between min-h-[120px] transition-all hover:shadow-[0_8px_30px_rgba(20,30,50,0.05)]">
            <span className="text-4xl sm:text-5xl font-serif text-navy font-light leading-none">{totalConfirmadosConvites}</span>
            <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-widest text-gold-deep mt-4 font-sans">Confirmados</span>
          </div>

          {/* Card 2: Total de Pessoas */}
          <div className="bg-white p-6 rounded-2xl shadow-[0_4px_20px_rgba(20,30,50,0.03)] border border-cream-deep/40 flex flex-col justify-between min-h-[120px] transition-all hover:shadow-[0_8px_30px_rgba(20,30,50,0.05)]">
            <span className="text-4xl sm:text-5xl font-serif text-navy font-light leading-none">{totalConvidadosConfirmados}</span>
            <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-widest text-gold-deep mt-4 font-sans">Total de Pessoas</span>
          </div>

          {/* Card 3: Não Poderão Ir */}
          <div className="bg-white p-6 rounded-2xl shadow-[0_4px_20px_rgba(20,30,50,0.03)] border border-cream-deep/40 flex flex-col justify-between min-h-[120px] transition-all hover:shadow-[0_8px_30px_rgba(20,30,50,0.05)]">
            <span className="text-4xl sm:text-5xl font-serif text-navy font-light leading-none">{totalRejeitadosConvites}</span>
            <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-widest text-gold-deep mt-4 font-sans">Não Poderão Ir</span>
          </div>

          {/* Card 4: Respostas */}
          <div className="bg-white p-6 rounded-2xl shadow-[0_4px_20px_rgba(20,30,50,0.03)] border border-cream-deep/40 flex flex-col justify-between min-h-[120px] transition-all hover:shadow-[0_8px_30px_rgba(20,30,50,0.05)]">
            <span className="text-4xl sm:text-5xl font-serif text-navy font-light leading-none">{totalConfirmadosConvites + totalRejeitadosConvites}</span>
            <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-widest text-gold-deep mt-4 font-sans">Respostas</span>
          </div>
        </div>

        {/* Busca e Ações */}
        <div className="flex flex-col sm:flex-row gap-4 max-w-4xl mx-auto w-full items-center justify-between mt-2">
          <div className="relative w-full flex-1">
            <Search className="w-4 h-4 text-gold-deep absolute left-5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-12 pr-6 py-3 bg-white border border-cream-deep/60 rounded-full shadow-sm focus:outline-none focus:ring-2 focus:ring-gold/30 text-sm text-navy-dark placeholder:text-ink-soft/40 transition-all"
              placeholder="Pesquisar por nome, telefone ou mensagem..."
            />
          </div>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-1.5 px-6 py-3 bg-navy hover:bg-navy-dark text-cream rounded-full text-xs font-semibold uppercase tracking-wider transition-all shadow-md active:scale-95 cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" />
            Adicionar Convidado
          </button>
        </div>

        {/* Seção da Tabela */}
        <div className="bg-white rounded-3xl shadow-[0_10px_40px_rgba(20,30,50,0.04)] border border-cream-deep/30 overflow-hidden flex flex-col mt-2">
          {/* Header da Tabela com Filtros Subtis */}
          <div className="flex flex-col sm:flex-row gap-4 px-6 py-4 border-b border-cream-deep/40 bg-white items-center justify-between">
            <h3 className="text-sm font-semibold text-navy-dark font-sans uppercase tracking-wider">Lista de Convidados</h3>
            <div className="flex gap-2 bg-[#fcfbf7] p-1 rounded-full border border-cream-deep/45">
              {(['todos', 'confirmados', 'rejeitados', 'pendentes'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setFilter(tab)}
                  className={`px-4 py-1.5 text-[10px] font-semibold uppercase tracking-wider rounded-full transition-all cursor-pointer ${
                    filter === tab
                      ? 'bg-navy text-cream shadow-sm'
                      : 'text-navy/70 hover:text-navy hover:bg-cream/40'
                  }`}
                >
                  {tab === 'todos' ? 'Todos' : tab === 'confirmados' ? 'Confirmados' : tab === 'rejeitados' ? 'Não vão' : 'Pendentes'}
                </button>
              ))}
            </div>
          </div>

          {/* Listagem */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3 text-gold-deep">
              <Loader2 className="w-8 h-8 animate-spin opacity-80" />
              <p className="text-sm font-medium animate-pulse text-navy-dark">Carregando dados da lista...</p>
            </div>
          ) : filteredConvidados.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3 text-center px-4">
              <X className="w-10 h-10 text-gold/40" />
              <h3 className="text-lg font-serif text-navy-dark font-medium">Nenhum convidado encontrado</h3>
              <p className="text-xs sm:text-sm text-ink-soft max-w-md">Não encontramos nenhum registo correspondente aos filtros de busca atuais.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#fcfbf7] border-b border-cream-deep/40 text-[10px] sm:text-xs font-semibold uppercase tracking-widest text-gold-deep">
                    <th className="py-4 px-6">Data</th>
                    <th className="py-4 px-6">Nome</th>
                    <th className="py-4 px-6 text-center">Presença</th>
                    <th className="py-4 px-6 text-center">Pessoas</th>
                    <th className="py-4 px-6">Telefone</th>
                    <th className="py-4 px-6 max-w-xs">Mensagem</th>
                    <th className="py-4 px-6 text-center">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-cream-deep/20 text-xs sm:text-sm bg-white">
                  {filteredConvidados.map((convidado) => {
                    const totalMembros = countPessoas(convidado.membros);
                    
                    return (
                      <tr 
                        key={convidado.id} 
                        className={`transition-colors hover:bg-cream/10 border-b border-cream-deep/20 last:border-b-0`}
                      >
                        {/* Data */}
                        <td className="py-4 px-6 text-ink-soft text-xs font-sans">
                          {convidado.data_confirmacao ? (
                            new Date(convidado.data_confirmacao).toLocaleString('pt-BR', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })
                          ) : (
                            <span className="text-ink-soft/40 italic">Pendente</span>
                          )}
                        </td>
                        
                        {/* Nome */}
                        <td className="py-4 px-6 font-serif text-navy-dark font-bold text-sm sm:text-base">
                          {convidado.nome_convite}
                        </td>
                        
                        {/* Presença */}
                        <td className="py-4 px-6 text-center">
                          {updatingId === convidado.id ? (
                            <Loader2 className="w-4 h-4 animate-spin text-gold mx-auto" />
                          ) : (
                            <div className="relative inline-block text-left">
                              <select
                                value={
                                  convidado.confirmado ? 'confirmado' 
                                  : (!convidado.confirmado && convidado.data_confirmacao ? 'rejeitado' : 'pendente')
                                }
                                onChange={(e) => changeStatus(convidado.id, e.target.value)}
                                className={`pl-4 pr-8 py-1 rounded-full text-xs font-semibold tracking-wide transition-all shadow-sm outline-none appearance-none cursor-pointer text-center ${
                                  convidado.confirmado ? 'bg-emerald-50 text-emerald-700 border border-emerald-100/80'
                                  : (!convidado.confirmado && convidado.data_confirmacao ? 'bg-rose-50 text-rose-700 border border-rose-100/80' : 'bg-gray-50 text-gray-500 border border-gray-200/80')
                                }`}
                                style={{ textAlignLast: 'center' }}
                              >
                                <option value="pendente">Pendente</option>
                                <option value="confirmado">Confirmado</option>
                                <option value="rejeitado">Rejeitado</option>
                              </select>
                              <ChevronDown className={`absolute right-2.5 top-1/2 -translate-y-1/2 w-3 h-3 pointer-events-none ${
                                convidado.confirmado ? 'text-emerald-700'
                                : (!convidado.confirmado && convidado.data_confirmacao ? 'text-rose-700' : 'text-gray-500')
                              }`} />
                            </div>
                          )}
                        </td>

                        {/* Pessoas */}
                        <td className="py-4 px-6 text-center text-navy font-serif font-medium text-sm">
                          {totalMembros}
                        </td>

                        {/* Telefone */}
                        <td className="py-4 px-6 text-ink-soft font-mono text-xs">
                          {convidado.telefone || <span className="text-ink-soft/30 italic">-</span>}
                        </td>

                        {/* Mensagem */}
                        <td className="py-4 px-6 text-xs text-ink-soft italic max-w-xs truncate" title={convidado.mensagem || ''}>
                          {convidado.mensagem ? (
                            <span className="line-clamp-1">{convidado.mensagem}</span>
                          ) : (
                            <span className="text-ink-soft/30 font-sans">Sem mensagem</span>
                          )}
                        </td>

                        {/* Ações */}
                        <td className="py-4 px-6 text-center space-x-2 whitespace-nowrap">
                          <button
                            onClick={() => handleEditGuest(convidado)}
                            title="Editar Convidado"
                            className="p-1 text-navy hover:text-gold transition-all cursor-pointer inline-flex"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleRemoveGuest(convidado.id, convidado.nome_convite)}
                            title="Remover Convidado"
                            className="p-1 text-destructive hover:text-red-600 transition-all cursor-pointer inline-flex"
                          >
                            <X className="w-4 h-4" />
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

        {/* Dynamic Last Updated time */}
        {lastUpdated && (
          <p className="text-center text-[10px] sm:text-xs text-ink-soft/60 mt-2">
            Atualizado em {lastUpdated}
          </p>
        )}
      </div>

      {/* Add Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fadeIn">
          <div className="bg-ivory rounded-3xl shadow-xl w-full max-w-md overflow-hidden border border-cream-deep">
            <div className="p-6 border-b border-cream-deep flex justify-between items-center bg-cream">
              <h3 className="font-serif text-2xl text-navy-dark font-medium">Adicionar Convidado</h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-gold-deep/60 hover:text-gold-deep cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAddGuest} className="p-6 flex flex-col gap-4 bg-cream">
              <div>
                <label className="block text-xs font-semibold text-gold-deep uppercase tracking-wider mb-1">Nome do Convite (ex: Família Silva)</label>
                <input
                  required
                  type="text"
                  value={newGuestData.nome_convite}
                  onChange={e => setNewGuestData({...newGuestData, nome_convite: e.target.value})}
                  className="w-full px-4 py-2 bg-ivory border border-cream-deep rounded-xl focus:outline-none focus:ring-2 focus:ring-gold/20 text-sm text-navy-dark"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gold-deep uppercase tracking-wider mb-1">Membros (separados por vírgula)</label>
                <input
                  required
                  type="text"
                  placeholder="João, Maria, Enzo"
                  value={newGuestData.membros}
                  onChange={e => setNewGuestData({...newGuestData, membros: e.target.value})}
                  className="w-full px-4 py-2 bg-ivory border border-cream-deep rounded-xl focus:outline-none focus:ring-2 focus:ring-gold/20 text-sm text-navy-dark"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gold-deep uppercase tracking-wider mb-1">Telefone (opcional)</label>
                <input
                  type="text"
                  value={newGuestData.telefone}
                  onChange={e => setNewGuestData({...newGuestData, telefone: e.target.value})}
                  className="w-full px-4 py-2 bg-ivory border border-cream-deep rounded-xl focus:outline-none focus:ring-2 focus:ring-gold/20 text-sm text-navy-dark"
                />
              </div>
              <button
                type="submit"
                className="w-full mt-2 py-3 bg-navy hover:bg-navy-dark text-cream rounded-xl font-medium shadow-sm transition-all cursor-pointer"
              >
                Salvar Convidado
              </button>
            </form>
          </div>
        </div>
      )}

      <NoiseOverlay />
      <GlobalBackground />
      <Toaster position="top-right" richColors />
    </main>
  );
}
