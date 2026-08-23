import React, { useState } from 'react';
import {
  Zap,
  Shield,
  AlertTriangle,
  ChevronUp,
  ChevronDown,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Machine, SlotBooking } from '../../types';
import { ActiveTab } from '../common/Navbar';

interface HackathonDemoBarProps {
  machines: Machine[];
  slots: SlotBooking[];
  setActiveTab: (tab: ActiveTab) => void;
  onBookMachine: (machine: Machine) => void;
  onOpenScanner: () => void;
  onOpenMisuse: (machine: Machine) => void;
}

export const HackathonDemoBar: React.FC<HackathonDemoBarProps> = ({
  machines,
  setActiveTab,
  onBookMachine,
  onOpenMisuse,
}) => {
  const { user, backendOnline, quickLogin } = useAuth();
  const [isExpanded, setIsExpanded] = useState<boolean>(false);

  const m1 = machines[0];
  const m2 = machines[1] || machines[0];

  return (
    <aside aria-label="Interactive Demo Scenarios" className="fixed bottom-4 right-4 sm:right-6 z-40 max-w-lg w-[calc(100vw-32px)] sm:w-auto">
      {!isExpanded ? (
        <button
          onClick={() => setIsExpanded(true)}
          className="flex items-center gap-2.5 px-4 py-2.5 rounded-full bg-slate-900 hover:bg-slate-800 text-white shadow-xl shadow-slate-900/20 border border-slate-700 transition-all hover:scale-105 active:scale-95 group micro-scale"
        >
          <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
          <Zap className="h-4 w-4 text-amber-400 group-hover:scale-110 transition-transform" />
          <span className="text-xs font-bold tracking-wide uppercase font-bebas text-white">Interactive Test Scenarios</span>
          <span className="px-1.5 py-0.5 rounded-full bg-blue-600 text-white text-[10px] font-bold">3</span>
          <ChevronUp className="h-3.5 w-3.5 text-slate-400 group-hover:text-white transition-transform" />
        </button>
      ) : (
        <div className="rounded-3xl border border-slate-200 bg-white/95 backdrop-blur-xl shadow-2xl p-4 text-xs text-slate-700 space-y-3 animate-scale-up">
          
          {/* Header Bar */}
          <div className="flex items-center justify-between gap-4 pb-2.5 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-700">
                <Sparkles className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <span className="font-bold font-bebas text-sm uppercase text-slate-900 block tracking-wide">Interactive Demo Scenarios</span>
                <span className="text-[10px] text-slate-500 font-medium">1-click test simulation for judging & testing</span>
              </div>
            </div>

            <button
              onClick={() => setIsExpanded(false)}
              className="p-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-900 transition-colors"
              title="Minimize panel"
            >
              <ChevronDown className="h-4 w-4" />
            </button>
          </div>

          {/* Expanded Quick Scenario Triggers */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            
            {/* Scenario 1 */}
            <button
              type="button"
              onClick={async () => {
                await quickLogin('john');
                setActiveTab('washers');
                if (m1) onBookMachine(m1);
              }}
              className="p-3 rounded-2xl bg-slate-50 hover:bg-emerald-50 border border-slate-200 hover:border-emerald-300 text-left transition-all group flex flex-col justify-between micro-scale"
            >
              <div>
                <div className="flex items-center gap-1.5 text-emerald-700 font-bold text-xs">
                  <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-600" />
                  <span className="font-bebas tracking-wide text-sm uppercase">1. Reserve & Check In</span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1 leading-snug">
                  John books Washer #1 & simulates QR arrival scan within 5m
                </p>
              </div>
            </button>

            {/* Scenario 2 */}
            <button
              type="button"
              onClick={async () => {
                await quickLogin('alice');
                setActiveTab('report');
                if (m2) onOpenMisuse(m2);
              }}
              className="p-3 rounded-2xl bg-slate-50 hover:bg-amber-50 border border-slate-200 hover:border-amber-300 text-left transition-all group flex flex-col justify-between micro-scale"
            >
              <div>
                <div className="flex items-center gap-1.5 text-amber-800 font-bold text-xs">
                  <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-amber-600" />
                  <span className="font-bebas tracking-wide text-sm uppercase">2. Report No-Show</span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1 leading-snug">
                  Alice reports timed-out washer & liberates it immediately
                </p>
              </div>
            </button>

            {/* Scenario 3 */}
            <button
              type="button"
              onClick={async () => {
                await quickLogin('admin');
                setActiveTab('admin');
              }}
              className="p-3 rounded-2xl bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-300 text-left transition-all group flex flex-col justify-between micro-scale"
            >
              <div>
                <div className="flex items-center gap-1.5 text-blue-800 font-bold text-xs">
                  <Shield className="h-3.5 w-3.5 shrink-0 text-blue-600" />
                  <span className="font-bebas tracking-wide text-sm uppercase">3. Facility Hub</span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1 leading-snug">
                  Print physical QR placards & view incident audit logs
                </p>
              </div>
            </button>

          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1.5 border-t border-slate-100">
            <span className="flex items-center gap-1">
              Active User: <strong className="text-slate-900 font-semibold">{user?.full_name || 'Guest'}</strong>
              {user?.role && (
                <span className="px-1.5 py-0.2 rounded-md bg-slate-100 border border-slate-200 text-slate-700 text-[9px] uppercase font-mono font-bold">
                  {user.role}
                </span>
              )}
            </span>
            <span className="font-mono text-[10px] text-slate-600 flex items-center gap-1.5">
              <span className={`h-1.5 w-1.5 rounded-full ${backendOnline ? 'bg-emerald-500' : 'bg-rose-500'}`} />
              {backendOnline ? 'Express API Online' : 'Backend Offline'}
            </span>
          </div>

        </div>
      )}
    </aside>
  );
};
