import React, { useState, useEffect } from 'react';
import { Clock, AlertCircle, CheckCircle2, ShieldAlert } from 'lucide-react';
import { SlotStatus } from '../../types';

interface GracePeriodCountdownProps {
  startTime: string;
  endTime: string;
  gracePeriodEnd: string;
  status: SlotStatus;
  checkedInAt?: string | null;
  onExpire?: () => void;
  compact?: boolean;
}

export const GracePeriodCountdown: React.FC<GracePeriodCountdownProps> = ({
  startTime,
  endTime,
  gracePeriodEnd,
  status,
  compact = false,
}) => {
  const [now, setNow] = useState<number>(Date.now());

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const startMs = new Date(startTime).getTime();
  const endMs = new Date(endTime).getTime();
  const graceEndMs = new Date(gracePeriodEnd).getTime();

  // If already checked in, show remaining cycle duration
  if (status === 'CHECKED_IN') {
    const remainingCycleSec = Math.max(0, Math.floor((endMs - now) / 1000));
    const mins = Math.floor(remainingCycleSec / 60);
    const secs = remainingCycleSec % 60;
    const isFinished = remainingCycleSec <= 0;

    return (
      <div className={`flex items-center gap-2 ${compact ? 'text-xs' : 'text-xs sm:text-sm'}`}>
        <div className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
        <span className="text-emerald-700 font-bold flex items-center gap-1.5">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
          {isFinished ? 'Cycle Complete - Please Collect' : (
            <span>
              Cycle Running (<span className="font-gentium font-bold">{mins}m {secs}s</span> left)
            </span>
          )}
        </span>
      </div>
    );
  }

  if (status === 'EXPIRED') {
    return (
      <div className="flex items-center gap-1.5 text-xs text-rose-600 font-semibold">
        <AlertCircle className="h-3.5 w-3.5 shrink-0" />
        <span>Forfeited (5-Min Grace Timeout)</span>
      </div>
    );
  }

  if (status === 'MISUSE_REPORTED') {
    return (
      <div className="flex items-center gap-1.5 text-xs text-amber-800 font-bold">
        <ShieldAlert className="h-3.5 w-3.5 shrink-0 text-amber-600" />
        <span>Under Misuse Inspection</span>
      </div>
    );
  }

  if (status === 'CANCELLED') {
    return (
      <span className="text-xs text-slate-400 font-medium">Booking Cancelled</span>
    );
  }

  // Status is BOOKED: Check whether slot has started or is within 5-min grace window
  const msUntilStart = startMs - now;
  const msUntilGraceExpiry = graceEndMs - now;

  if (msUntilStart > 0) {
    const minStart = Math.floor(msUntilStart / 60000);
    const secStart = Math.floor((msUntilStart % 60000) / 1000);
    return (
      <div className="flex items-center gap-1.5 text-xs text-slate-600">
        <Clock className="h-3.5 w-3.5 text-blue-600 shrink-0" />
        <span>Starts in <strong className="font-gentium text-slate-900 font-bold">{minStart}m {secStart}s</strong> (Scan physical QR when ready)</span>
      </div>
    );
  }

  if (msUntilGraceExpiry > 0) {
    const minGrace = Math.floor(msUntilGraceExpiry / 60000);
    const secGrace = Math.floor((msUntilGraceExpiry % 60000) / 1000);
    const isUrgent = msUntilGraceExpiry < 120000; // < 2 mins

    // Percentage of 5 mins remaining
    const totalGraceMs = 5 * 60 * 1000;
    const progressPercent = Math.min(100, Math.max(0, (msUntilGraceExpiry / totalGraceMs) * 100));

    return (
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5">
            <span className={`h-2 w-2 rounded-full ${isUrgent ? 'bg-rose-500 animate-ping' : 'bg-amber-500 animate-pulse'}`} />
            <span className={`font-bold ${isUrgent ? 'text-rose-600' : 'text-slate-900'}`}>
              Scan QR within <span className="font-gentium text-sm">{minGrace}:{secGrace.toString().padStart(2, '0')}</span>
            </span>
          </div>
          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">5-min Grace</span>
        </div>
        
        {/* Progress Bar */}
        <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden p-0.5">
          <div
            className={`h-full transition-all duration-1000 rounded-full ${
              isUrgent ? 'bg-rose-500' : 'bg-blue-600'
            }`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>
    );
  }

  // Grace period expired
  return (
    <div className="flex items-center gap-1.5 text-xs text-rose-600 font-bold">
      <AlertCircle className="h-3.5 w-3.5 shrink-0" />
      <span>Grace Period Expired (Auto-forfeit active)</span>
    </div>
  );
};
