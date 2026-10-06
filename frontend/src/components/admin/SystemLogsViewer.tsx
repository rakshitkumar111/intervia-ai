import React from 'react';
import { Terminal, Shield, AlertCircle, Info, AlertTriangle } from 'lucide-react';

interface SystemLogsViewerProps {
  logs: any[];
}

export const SystemLogsViewer: React.FC<SystemLogsViewerProps> = ({ logs }) => {
  const getLevelBadge = (level: string) => {
    switch (level) {
      case 'ERROR':
      case 'CRITICAL':
        return 'bg-rose-500/20 text-rose-400 border-rose-500/30';
      case 'WARNING':
        return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      case 'INFO':
      default:
        return 'bg-brand-500/20 text-brand-400 border-brand-500/30';
    }
  };

  return (
    <div className="bg-slate-900/80 backdrop-blur-md border border-slate-800 rounded-2xl p-6 shadow-lg">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <Terminal className="w-4 h-4 text-emerald-400" />
            <span>Security & Audit Event Stream</span>
          </h3>
          <p className="text-xs text-slate-400">Real-time system telemetry and transaction audit log</p>
        </div>
      </div>

      <div className="space-y-2 max-h-96 overflow-y-auto font-mono text-xs pr-1">
        {logs.map((log) => (
          <div
            key={log.id}
            className="p-3 bg-slate-950/70 rounded-xl border border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:border-slate-700 transition-colors"
          >
            <div className="flex items-center gap-2.5">
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getLevelBadge(log.level)}`}>
                {log.level}
              </span>
              <span className="font-semibold text-slate-200">{log.action}</span>
              {log.user_id && (
                <span className="text-slate-400 text-[11px]">User ID: #{log.user_id}</span>
              )}
            </div>

            <div className="flex items-center gap-3 text-slate-400 text-[11px]">
              {log.details && (
                <span className="text-slate-400 truncate max-w-xs">
                  {JSON.stringify(log.details)}
                </span>
              )}
              <span className="text-slate-400 text-[10px]">
                {log.timestamp ? new Date(log.timestamp).toLocaleTimeString() : ''}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
