import React, { useState } from 'react';
import {
  ShieldAlert,
  CheckCircle2,
  Zap,
  Camera,
  Info,
  AlertTriangle,
} from 'lucide-react';
import { Machine, MisuseReport } from '../../types';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

interface MisuseReportingViewProps {
  machines: Machine[];
  onReportSuccess: (report: MisuseReport) => void;
  onBookFreedMachine: (machine: Machine) => void;
  onOpenQRScanner: () => void;
}

const COMMON_REASONS = [
  'Washer is idle & empty past the 5-minute grace period (No-show)',
  'Wash cycle ended but laundry remains left inside unattended',
  'Physical machine reserved but no person is present',
  'Equipment defect or leak',
];

export const MisuseReportingView: React.FC<MisuseReportingViewProps> = ({
  machines,
  onReportSuccess,
  onBookFreedMachine,
  onOpenQRScanner,
}) => {
  const { user, isAuthenticated, refreshUser } = useAuth();
  const [selectedMachineId, setSelectedMachineId] = useState<number>(machines[0]?.id || 1);
  const [qrTokenInput, setQrTokenInput] = useState<string>('');
  const [selectedReason, setSelectedReason] = useState<string>(COMMON_REASONS[0]);
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [latestReport, setLatestReport] = useState<MisuseReport | null>(null);

  const targetMachine = machines.find((m) => m.id === selectedMachineId);
  const effectiveToken = qrTokenInput.trim() || targetMachine?.qr_code_token || '';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated || !user) {
      setErrorMessage('Please sign in or select a demo user before filing a bystander report.');
      return;
    }

    if (!effectiveToken) {
      setErrorMessage('Please specify a washing machine QR code.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);
    setLatestReport(null);

    try {
      const fullReason = notes.trim() ? `${selectedReason} [${notes.trim()}]` : selectedReason;
      const report = await api.reportMisuse(effectiveToken, fullReason);
      setLatestReport(report);
      await refreshUser();
      onReportSuccess(report);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to submit report');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFreed =
    latestReport &&
    (latestReport.action_taken.toLowerCase().includes('freed') ||
      latestReport.action_taken.toLowerCase().includes('expired'));

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      
      {/* Header Banner */}
      <div className="rounded-3xl bg-white border border-slate-200 p-6 sm:p-8 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 shrink-0">
            <ShieldAlert className="h-7 w-7 text-amber-600" />
          </div>
          <div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold uppercase tracking-wider">
              Hostel Integrity System
            </span>
            <h1 className="text-2xl sm:text-3xl font-bold font-bebas tracking-wide text-slate-900 uppercase mt-2">
              Report Machine Issue or No-Show
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 mt-1 leading-relaxed">
              Found a machine marked booked but unattended past the 5-minute grace arrival window? Submit a report to verify timeout, update machine status, and release it for other residents.
            </p>
          </div>
        </div>
      </div>

      {/* Result Card if Submitted */}
      {latestReport && (
        <div
          className={`p-6 rounded-3xl border text-sm space-y-3 animate-scale-up ${
            isFreed
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900 shadow-sm'
              : 'bg-white border-slate-200 text-slate-900 shadow-sm'
          }`}
        >
          <div className="flex items-center gap-2.5 text-base font-bold font-bebas tracking-wide uppercase">
            <CheckCircle2 className="h-6 w-6 text-emerald-600 shrink-0" />
            <span>Misuse Report Processed by System</span>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-slate-200 text-slate-900 leading-relaxed font-gentium text-xs">
            {latestReport.action_taken}
          </div>

          {isFreed && targetMachine && (
            <div className="pt-2">
              <button
                type="button"
                onClick={() => onBookFreedMachine(targetMachine)}
                className="w-full py-3.5 px-5 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 transition-all flex items-center justify-center gap-2 micro-scale"
              >
                <Zap className="h-4 w-4 text-amber-400" />
                <span>Reserve {targetMachine.name} Right Now</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* Main Reporting Form */}
      <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
        
        {errorMessage && (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-700 flex items-start gap-2.5">
            <AlertTriangle className="h-4 w-4 text-rose-500 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Step 1: Target Washer */}
        <div className="space-y-3">
          <label className="text-xs font-bold uppercase tracking-widest text-slate-500">
            1. Select Washer or Scan Sticker QR
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {machines.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => {
                  setSelectedMachineId(m.id);
                  setQrTokenInput('');
                }}
                className={`p-4 rounded-2xl border text-left transition-all micro-scale ${
                  selectedMachineId === m.id && !qrTokenInput
                    ? 'bg-blue-50 border-2 border-blue-600 text-blue-900 shadow-sm'
                    : 'bg-slate-50 border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold font-bebas text-sm uppercase text-slate-900">#{m.id} {m.name}</span>
                  <span className="text-[9px] px-2 py-0.5 rounded-full bg-white border border-slate-200 text-slate-600 font-mono">{m.status}</span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1 truncate">{m.location}</p>
              </button>
            ))}
          </div>

          <div className="pt-2 flex items-center justify-between">
            <span className="text-xs text-slate-500 font-medium">
              Or scan directly with mobile camera:
            </span>
            <button
              type="button"
              onClick={onOpenQRScanner}
              className="px-4 py-2 rounded-full bg-slate-50 hover:bg-slate-100 text-xs font-bold text-blue-700 border border-slate-200 flex items-center gap-1.5 transition-all micro-scale"
            >
              <Camera className="h-3.5 w-3.5 text-blue-600" />
              <span>Open Camera Scanner</span>
            </button>
          </div>
        </div>

        {/* Step 2: Reason */}
        <div className="space-y-3 pt-3 border-t border-slate-100">
          <label className="text-xs font-bold uppercase tracking-widest text-slate-500">
            2. Misuse Reason
          </label>
          <div className="space-y-2">
            {COMMON_REASONS.map((reason) => (
              <label
                key={reason}
                className={`flex items-start gap-3 p-4 rounded-2xl border text-xs cursor-pointer transition-all micro-scale ${
                  selectedReason === reason
                    ? 'bg-blue-50 border-2 border-blue-600 text-slate-900 shadow-sm'
                    : 'bg-slate-50 border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <input
                  type="radio"
                  name="reason"
                  checked={selectedReason === reason}
                  onChange={() => setSelectedReason(reason)}
                  className="mt-0.5 text-blue-600 focus:ring-0"
                />
                <span className="font-semibold text-slate-900">{reason}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Step 3: Optional Notes */}
        <div className="space-y-2 pt-3 border-t border-slate-100">
          <label className="text-xs font-bold uppercase tracking-widest text-slate-500">
            3. Optional details / remarks:
          </label>
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. Arrived at 2:35 PM, washer is completely empty and idle..."
            className="w-full px-4 py-3 rounded-full bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
          />
        </div>

        {/* Policy Info */}
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-600 flex items-start gap-3">
          <Info className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
          <p className="leading-relaxed font-medium">
            The backend scheduler checks the exact slot start time. If the booking user failed to check in via physical QR code within the 5-minute grace window, their slot is cancelled immediately and transferred.
          </p>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-3.5 rounded-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-xs shadow-md shadow-blue-500/20 transition-all micro-scale flex items-center justify-center gap-2"
        >
          {isSubmitting ? 'Evaluating Slot in Backend...' : 'Submit Bystander Report & Free Washer'}
        </button>

      </form>

    </div>
  );
};
