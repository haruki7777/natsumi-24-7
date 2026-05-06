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
  isCooling?: boolean;
  guilds?: number;
  eventLoopLagMs?: number;
  eventLoopMaxMs?: number;
  memoryMb?: number;
  engine?: string;
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
    <div className="min-h-screen bg-[#fffafd] p-4 md:p-8 max-w-6xl mx-auto space-y-8 text-gray-800">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-pink-100 pb-6">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-pink-50 rounded-xl border border-pink-100 shadow-sm">
            <Bot className="w-8 h-8 text-pink-500" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">Natsumi Dashboard <span className="text-xs font-mono bg-pink-50 text-pink-500 px-2 py-0.5 rounded ml-2 uppercase font-bold">Damping Core v6.4.0</span></h1>
            <p className="text-gray-500 text-sm flex items-center gap-2 font-medium">
              {data?.tag || 'System Standby'}
              {data?.status === 'Online' ? (
                <span className="flex h-2.5 w-2.5 rounded-full bg-pink-500 shadow-[0_0_8px_rgba(236,72,153,0.5)] animate-pulse" />
              ) : (
                <span className="flex h-2.5 w-2.5 rounded-full bg-gray-300" />
              )}
              {data?.isCooling && (
                <span className="text-[10px] font-bold bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded animate-bounce">API COOLING</span>
              )}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={fetchStatus}
            disabled={isRefreshing}
            className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-pink-50 text-pink-600 rounded-full transition-all text-sm font-bold border border-pink-100 shadow-sm cursor-pointer disabled:opacity-50"
          >
            <RefreshCcw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            새로고침
          </button>
          <a 
            href="#" 
            className="flex items-center gap-2 px-5 py-2 bg-pink-500 hover:bg-pink-600 rounded-full transition-all text-sm font-bold text-white shadow-md hover:shadow-lg cursor-pointer transform hover:-translate-y-0.5"
          >
            <ExternalLink className="w-4 h-4" />
            컨트롤 포털
          </a>
        </div>
      </header>

      {/* Main Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          label="시스템 상태" 
          value={data?.status || 'Unknown'} 
          icon={<Activity className="w-5 h-5" />}
          color={data?.status === 'Online' ? 'text-emerald-500' : 'text-pink-500'}
          bg="bg-white"
        />
        <StatCard 
          label="처리된 메시지" 
          value={data?.messageCount !== undefined ? data.messageCount.toLocaleString() : '0'} 
          icon={<Zap className="w-5 h-5" />}
          color="text-amber-500"
          bg="bg-white"
        />
        <StatCard 
          label="현재 가동 시간" 
          value={data ? formatUptime(data.uptime) : '0h 0m 0s'} 
          icon={<Clock className="w-5 h-5" />}
          color="text-pink-500"
          bg="bg-white"
        />
        <StatCard 
          label="헬스 체크" 
          value={data?.lastError ? "문제 발생" : "정상 작동"} 
          icon={<ShieldCheck className="w-5 h-5" />}
          color={data?.lastError ? "text-red-500" : "text-emerald-500"}
          subValue={data?.lastError ? data.lastError : "최적화 필터 가동 중"}
          bg="bg-white"
        />
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Logs Console */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-sm font-black uppercase tracking-widest text-pink-400">
              <Terminal className="w-4 h-4" />
              실시간 시스템 로그
            </h2>
          </div>
          <div className="h-[450px] bg-white border border-pink-100 rounded-2xl overflow-hidden flex flex-col font-mono text-xs shadow-xl ring-1 ring-black/5">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-pink-50 bg-pink-50/30">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-pink-200" />
                <div className="w-3 h-3 rounded-full bg-pink-300" />
                <div className="w-3 h-3 rounded-full bg-pink-400" />
              </div>
              <span className="text-pink-400 text-[10px] uppercase font-black tracking-widest ml-2">Console v2.5</span>
            </div>
            <div className="flex-1 overflow-y-auto p-5 space-y-2 scrollbar-thin scrollbar-thumb-pink-100">
              <AnimatePresence initial={false}>
                {data?.logs.map((log, i) => (
                  <motion.div
                    key={log + i}
                    initial={{ opacity: 0, x: -5 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex gap-4 border-l-2 border-pink-50 pl-3 py-0.5 hover:bg-pink-50/50 transition-colors"
                  >
                    <span className="text-pink-200 font-bold select-none whitespace-nowrap min-w-[20px]">{(data.logs.length - i).toString().padStart(2, '0')}</span>
                    <span className="text-gray-600 break-all leading-relaxed">{log}</span>
                  </motion.div>
                ))}
              </AnimatePresence>
              {data?.logs.length === 0 && (
                <div className="h-full flex items-center justify-center text-pink-200 py-20 italic font-sans font-medium">
                  시스템 이벤트를 대기 중입니다...
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar Controls */}
        <div className="space-y-6">
          {/* Status Card */}
          <div className="p-6 bg-gradient-to-br from-pink-500 to-rose-400 border border-pink-400 rounded-2xl space-y-4 relative overflow-hidden group shadow-lg shadow-pink-200/50">
            <div className="absolute -top-4 -right-4 p-4 opacity-10 rotate-12">
              <Zap className="w-32 h-32 text-white" />
            </div>
            <h3 className="flex items-center gap-2 font-black text-white uppercase tracking-wider">
              <Zap className="w-4 h-4" />
              나츠미 최적화 엔진
            </h3>
            <div className="space-y-3 relative z-10">
              <div className="flex items-center justify-between text-xs font-bold text-white/90">
                <span>지연시간:</span>
                <span className="bg-white/20 px-2 py-0.5 rounded">{data?.ping || '--'}ms</span>
              </div>
              <div className="flex items-center justify-between text-xs font-bold text-white/90">
                <span>엔진 버전:</span>
                <span className="bg-white/20 px-2 py-0.5 rounded">v6.4.0 (Damping Core Edition)</span>
              </div>
              <p className="text-[11px] text-white/80 leading-relaxed font-medium">
                나츠미의 혁신적인 Damping Core v6.4.0 엔진이 가동 중입니다. 하이-트래픽 환경에서의 'WS & REST 쿨다운 시스템'이 탑재되어, 과도한 API 요청을 자동으로 감지하고 분산시킵니다. 0.05초의 정밀 오프셋 조정과 공격적인 캐시 스위퍼를 통해 대규모 서버에서도 끊김 없는 쾌적한 봇 응답 속도를 유지합니다.
              </p>
            </div>
          </div>

          <div className="p-6 bg-white border border-pink-100 rounded-2xl space-y-4 shadow-lg shadow-pink-100/20">
            <h3 className="flex items-center gap-2 font-bold text-gray-800">
              <Settings className="w-4 h-4 text-pink-500" />
              시스템 관리
            </h3>
            <div className="space-y-2">
              <ActionButton 
                label="시스템 완전 재시작" 
                onClick={async () => {
                   if(confirm('봇을 재시작하면 서비스가 잠시 중단됩니다. 진행하시겠습니까?')) {
                     await fetch('/api/flush', { method: 'POST' });
                     fetchStatus();
                   }
                }}
              />
              <ActionButton label="로그 기록 초기화" disabled />
            </div>
          </div>

          <div className={`p-6 border rounded-2xl space-y-4 transition-all shadow-lg ${data?.status === 'Login Failed' || data?.status === 'No Token' ? 'bg-orange-50 border-orange-200' : 'bg-white border-pink-100'}`}>
            <h3 className="flex items-center gap-2 font-bold">
              <AlertCircle className={`w-4 h-4 ${data?.status === 'Login Failed' || data?.status === 'No Token' ? 'text-orange-500' : 'text-pink-500'}`} />
              시스템 알림
            </h3>
            <div className="text-sm text-gray-600 space-y-3 font-sans">
              {data?.status === 'Login Failed' ? (
                <div className="space-y-2">
                   <p className="text-red-500 font-bold underline">봇 로그인 실패!</p>
                   <p className="text-xs">원인: <code className="bg-red-50 text-red-600 p-1 rounded break-all">{data.lastError}</code></p>
                   <p className="text-xs font-bold text-orange-600">안전 부팅(Safe-Boot) 가이드:</p>
                   <ul className="text-[10px] list-disc pl-4 space-y-1">
                     <li>Secrets에서 <strong>TOKEN</strong>이 정확한지 다시 확인하세요.</li>
                     <li>봇이 여전히 응답하지 않는다면 <strong>MESSAGE CONTENT INTENT</strong>를 켜야 합니다.</li>
                     <li>[Discord Developer Portal] &rarr; [Bot] &rarr; [Privileged Gateway Intents] 항목을 모두 활성화하는 것을 권장합니다.</li>
                   </ul>
                </div>
              ) : data?.status === 'No Token' ? (
                <p className="text-xs font-medium">
                  Discord 봇 토큰이 설정되지 않았습니다. <strong>Secrets</strong> 패널에서 <code className="text-pink-600 bg-pink-50 px-1 rounded font-mono">TOKEN</code>을 추가해 주세요.
                </p>
              ) : (
                <p className="text-xs font-medium leading-relaxed">현재 모든 시스템이 정상적으로 작동 중입니다. 최상의 응답 속도를 위해 주기적인 메모리 청소가 진행되고 있습니다.</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="fixed bottom-8 right-8 p-4 bg-rose-500 text-white rounded-2xl shadow-2xl flex items-center gap-3 animate-bounce z-50 border-2 border-white/20">
          <AlertCircle className="w-6 h-6" />
          <span className="font-bold">{error}</span>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, icon, color, subValue, bg }: { label: string, value: string, icon: React.ReactNode, color: string, subValue?: string, bg: string }) {
  return (
    <div className={`p-6 ${bg} border border-pink-50 rounded-3xl hover:border-pink-200 transition-all group shadow-sm hover:shadow-md transform hover:-translate-y-1`}>
      <div className="flex items-center justify-between mb-4">
        <span className="text-[11px] font-black text-pink-200 uppercase tracking-[0.2em]">{label}</span>
        <div className={`p-2.5 rounded-2xl bg-pink-50 group-hover:scale-110 transition-transform ${color.replace('text-', 'text-')}`}>
          {icon}
        </div>
      </div>
      <div className={`text-2xl font-black tracking-tighter ${color}`}>{value}</div>
      {subValue && <div className="text-[10px] text-gray-400 mt-2 font-bold uppercase tracking-tight">{subValue}</div>}
    </div>
  );
}

function ActionButton({ label, disabled, onClick }: { label: string, disabled?: boolean, onClick?: () => void }) {
  return (
    <button 
      disabled={disabled}
      onClick={onClick}
      className={`w-full text-left px-5 py-4 rounded-2xl text-[11px] uppercase tracking-widest font-black transition-all border-2 ${
        disabled 
          ? 'bg-gray-50 border-gray-100 text-gray-300 cursor-not-allowed opacity-50' 
          : 'bg-white border-pink-50 hover:border-pink-500 hover:bg-pink-500 hover:text-white text-pink-500 cursor-pointer shadow-sm hover:shadow-md active:scale-95'
      }`}
    >
      {label}
    </button>
  );
}

