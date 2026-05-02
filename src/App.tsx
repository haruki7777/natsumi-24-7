import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Activity, 
  Terminal, 
  Settings, 
  ShieldCheck, 
  AlertCircle, 
  Clock, 
  Zap, 
  Bot,
  ExternalLink,
  RefreshCcw,
  GitBranch
} from 'lucide-react';

interface BotStatus {
  status: string;
  ping: number;
  uptime: number;
  messageCount: number;
  lastError: string;
  logs: string[];
  tag: string;
}

export default function App() {
  const [data, setData] = useState<BotStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchStatus = async () => {
    try {
      setIsRefreshing(true);
      const res = await fetch('/api/status');
      if (!res.ok) throw new Error('Status service unavailable');
      const json = await res.json();
      setData(json);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'online': return 'text-emerald-400';
      case 'offline': return 'text-gray-400';
      case 'error':
      case 'login failed': return 'text-red-400';
      default: return 'text-yellow-400';
    }
  };

  const formatUptime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h}h ${m}m ${s}s`;
  };

  return (
    <div className="min-h-screen p-4 md:p-8 max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-indigo-500/10 rounded-xl border border-indigo-500/20">
            <Bot className="w-8 h-8 text-indigo-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Natsumi 24/7 <span className="text-xs font-mono bg-white/5 px-2 py-0.5 rounded ml-2 uppercase opacity-50">v2.0.0</span></h1>
            <p className="text-gray-400 text-sm flex items-center gap-2">
              {data?.tag || 'System Standby'}
              {data?.status === 'Online' ? (
                <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
              ) : (
                <span className="flex h-2 w-2 rounded-full bg-red-500" />
              )}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={fetchStatus}
            disabled={isRefreshing}
            className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors text-sm font-medium border border-white/10 cursor-pointer"
          >
            <RefreshCcw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            Manual Sync
          </button>
          <a 
            href="#" 
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg transition-colors text-sm font-medium text-white cursor-pointer"
          >
            <ExternalLink className="w-4 h-4" />
            Control Portal
          </a>
        </div>
      </header>

      {/* Main Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          label="System Status" 
          value={data?.status || 'Unknown'} 
          icon={<Activity className="w-5 h-5" />}
          color={getStatusColor(data?.status || '')}
        />
        <StatCard 
          label="Processed Msgs" 
          value={data?.messageCount !== undefined ? data.messageCount.toString() : '0'} 
          icon={<Zap className="w-5 h-5" />}
          color="text-amber-400"
        />
        <StatCard 
          label="Current Uptime" 
          value={data ? formatUptime(data.uptime) : '0h 0m 0s'} 
          icon={<Clock className="w-5 h-5" />}
          color="text-indigo-400"
        />
        <StatCard 
          label="Health Check" 
          value="Healthy" 
          icon={<ShieldCheck className="w-5 h-5" />}
          color="text-emerald-400"
          subValue="Auto-repair active"
        />
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Logs Console */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-gray-500">
              <Terminal className="w-4 h-4" />
              Live Deployment Logs
            </h2>
          </div>
          <div className="h-[400px] bg-black/40 border border-white/10 rounded-xl overflow-hidden flex flex-col font-mono text-xs shadow-2xl">
            <div className="flex items-center gap-2 px-3 py-2 border-b border-white/10 bg-white/5">
              <div className="flex gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-red-500/50" />
                <div className="w-2.5 h-2.5 rounded-full bg-amber-500/50" />
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/50" />
              </div>
              <span className="text-gray-500 text-[10px] uppercase font-bold tracking-tight">Console Output</span>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-1.5 scrollbar-thin scrollbar-thumb-white/10">
              <AnimatePresence initial={false}>
                {data?.logs.map((log, i) => (
                  <motion.div
                    key={log + i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex gap-3"
                  >
                    <span className="opacity-30 whitespace-nowrap">{data.logs.length - i}</span>
                    <span className="text-gray-300 break-all">{log}</span>
                  </motion.div>
                ))}
              </AnimatePresence>
              {data?.logs.length === 0 && (
                <div className="h-full flex items-center justify-center text-gray-600 py-20 italic">
                  Waiting for system events...
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar Controls */}
        <div className="space-y-6">
          {/* GitHub Integration Card */}
          <div className="p-6 bg-[#24292e]/10 border border-[#24292e]/30 rounded-xl space-y-4 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
              <Bot className="w-24 h-24" />
            </div>
            <h3 className="flex items-center gap-2 font-bold text-gray-200">
              <Bot className="w-4 h-4" />
              GitHub Repository Sync
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs font-medium">
                <span className="text-gray-400">Target Repo:</span>
                <span className="text-indigo-400 font-mono">natsumi-24-7</span>
              </div>
              <p className="text-xs text-gray-400 leading-relaxed">
                GitHub 리포지토리의 코드를 실시간으로 반영하려면 AI Studio 메뉴의 <strong>Settings &gt; Export to GitHub</strong>를 사용하여 <code>haruki7777/natsumi-24-7</code> 리포지토리를 연결하세요.
              </p>
              <div className="flex gap-2">
                <button className="flex-1 py-2 bg-[#24292e] hover:bg-[#2f363d] text-white text-[10px] font-bold rounded-lg transition-colors flex items-center justify-center gap-2 border border-white/5 uppercase tracking-wider">
                  <GitBranch className="w-3 h-3" />
                  Link Repo
                </button>
                <a 
                  href="https://github.com/haruki7777/natsumi-24-7" 
                  target="_blank" 
                  rel="noreferrer"
                  className="px-3 py-2 bg-white/5 hover:bg-white/10 text-white rounded-lg transition-colors border border-white/10"
                >
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          </div>

          <div className="p-6 bg-white/5 border border-white/10 rounded-xl space-y-4">
            <h3 className="flex items-center gap-2 font-bold">
              <Settings className="w-4 h-4" />
              Management
            </h3>
            <div className="space-y-2">
              <ActionButton label="Flush Node Cache" disabled />
              <ActionButton label="Clear Console History" disabled />
              <ActionButton label="Hard Cluster Restart" disabled />
            </div>
          </div>

          <div className={`p-6 border rounded-xl space-y-4 transition-colors ${data?.status === 'No Token' ? 'bg-amber-500/10 border-amber-500/20' : 'bg-white/5 border-white/10'}`}>
            <h3 className="flex items-center gap-2 font-bold">
              <AlertCircle className="w-4 h-4" />
              System Alert
            </h3>
            <div className="text-sm text-gray-400 space-y-3 font-sans">
              <p>
                Discord 봇 토큰이 설정되지 않았습니다. AI Studio 우측 상단의 <strong>Secrets</strong> 패널에서 <code className="text-indigo-300 bg-indigo-500/10 px-1 rounded font-mono">TOKEN</code>을 추가해 주세요.
              </p>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="fixed bottom-8 right-8 p-4 bg-red-500 text-white rounded-lg shadow-xl flex items-center gap-3 animate-pulse z-50">
          <AlertCircle />
          {error}
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, icon, color, subValue }: { label: string, value: string, icon: React.ReactNode, color: string, subValue?: string }) {
  return (
    <div className="p-5 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/[0.08] transition-all group">
      <div className="flex items-center justify-between mb-3">
        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.1em]">{label}</span>
        <div className={`p-2 rounded-lg bg-white/5 group-hover:scale-110 transition-transform ${color.replace('text-', 'bg-').replace('-400', '-400/10')}`}>
          {icon}
        </div>
      </div>
      <div className={`text-2xl font-bold tracking-tight ${color}`}>{value}</div>
      {subValue && <div className="text-[10px] text-gray-500 mt-1 uppercase font-semibold tracking-wide">{subValue}</div>}
    </div>
  );
}

function ActionButton({ label, disabled }: { label: string, disabled?: boolean }) {
  return (
    <button 
      disabled={disabled}
      className={`w-full text-left px-4 py-3 rounded-lg text-[11px] uppercase tracking-widest font-bold border transition-all ${
        disabled 
          ? 'bg-transparent border-white/5 text-gray-600 cursor-not-allowed' 
          : 'bg-white/5 border-white/10 hover:bg-white/10 text-gray-200 cursor-pointer'
      }`}
    >
      {label}
    </button>
  );
}

