import React, { useState } from 'react';
import {
  X,
  AlertTriangle,
  ShieldAlert,
  CheckCircle2,
  HelpCircle,
  Zap,
} from 'lucide-react';
import { Machine, MisuseReport } from '../../types';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

interface MisuseReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  machines: Machine[];
  initialMachineId?: number | null;
  onReportSubmitted: (report: MisuseReport) => void;
  onBookFreedMachine?: (machine: Machine) => void;
}

const REPORT_REASONS = [
  'Washer is idle & empty past the 5-minute arrival grace window (No-show)',
  'Wash cycle ended but laundry remains left inside unattended',
  'Machine reserved/blocked but no student is physically present',
  'Mechanical defect, excessive vibration, or detergent leak',
  'Other operational misuse',
];

export const MisuseReportModal: React.FC<MisuseReportModalProps> = ({
  isOpen,
  onClose,
  machines,
  initialMachineId,
  onReportSubmitted,
  onBookFreedMachine,
}) => {
  const { isAuthenticated, user, refreshUser } = useAuth();
  const [selectedMachineId, setSelectedMachineId] = useState<number>(() => {
    return initialMachineId || (machines[0] ? machines[0].id : 1);
  });
  const [selectedReason, setSelectedReason] = useState<string>(REPORT_REASONS[0]);
  const [customComment, setCustomComment] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [reportResult, setReportResult] = useState<MisuseReport | null>(null);

  if (!isOpen) return null;

  const targetMachine = machines.find((m) => m.id === selectedMachineId);
  const effectiveToken = targetMachine?.qr_code_token || '';

  const handleSubmitReport = async () => {
    if (!isAuthenticated || !user) {
      setErrorMessage('Please sign in or select an account to file a bystander report.');
      return;
    }

    if (!effectiveToken) {
      setErrorMessage('Please select a valid washing machine.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);
    setReportResult(null);

    try {
      const fullReason = customComment.trim()
        ? `${selectedReason} - Note: ${customComment.trim()}`
        : selectedReason;

      const report = await api.reportMisuse(effectiveToken, fullReason);
      setReportResult(report);
      await refreshUser();
      onReportSubmitted(report);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to submit misuse report.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isMachineFreed =
    reportResult &&
    (reportResult.action_taken.toLowerCase().includes('freed') ||
      reportResult.action_taken.toLowerCase().includes('expired'));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-5 max-h-[92vh] overflow-y-auto animate-scale-up">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-700 shadow-sm">
              <ShieldAlert className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <h3 className="text-xl font-bold font-bebas tracking-wide text-slate-900 uppercase">Report Machine Misuse</h3>
              <p className="text-xs text-slate-500 font-medium">
                Release abandoned or squatting washers
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full bg-slate-50 text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-colors micro-scale"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Error Notification */}
        {errorMessage && (
          <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-700 flex items-start gap-2.5">
            <AlertTriangle className="h-4 w-4 text-rose-500 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Success Action Result Banner */}
        {reportResult && (
          <div
            className={`p-4 rounded-2xl border text-xs space-y-2.5 ${
              isMachineFreed
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                : 'bg-slate-50 border-slate-200 text-slate-900 shadow-sm'
            }`}
          >
            <div className="flex items-center gap-2 font-bold font-bebas text-base uppercase tracking-wide">
              <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
              <span>Report Evaluated by Backend</span>
            </div>
            <p className="p-3 rounded-2xl bg-white border border-slate-200 text-slate-900 font-gentium text-xs leading-relaxed shadow-sm">
              {reportResult.action_taken}
            </p>

            {isMachineFreed && targetMachine && onBookFreedMachine && (
              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onBookFreedMachine(targetMachine);
                  }}
                  className="w-full py-3.5 px-4 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 transition-all flex items-center justify-center gap-2 micro-scale"
                >
                  <Zap className="h-4 w-4 text-amber-400" />
                  <span>Reserve This Machine Right Now!</span>
                </button>
              </div>
            )}
          </div>
        )}

        {!reportResult && (
          <>
            {/* Machine Picker */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-widest text-slate-500">
                Select Observed Washing Machine:
              </label>
              <select
                value={selectedMachineId}
                onChange={(e) => setSelectedMachineId(Number(e.target.value))}
                className="w-full px-4 py-2.5 rounded-full bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              >
                {machines.map((m) => (
                  <option key={m.id} value={m.id}>
                    #{m.id} — {m.name} ({m.location}) [{m.status}]
                  </option>
                ))}
              </select>
            </div>

            {/* Reason Presets */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-slate-500">
                Reason for Bystander Report:
              </label>
              <div className="space-y-2">
                {REPORT_REASONS.map((r) => (
                  <label
                    key={r}
                    className={`flex items-start gap-3 p-3.5 rounded-2xl border text-xs cursor-pointer transition-all micro-scale ${
                      selectedReason === r
                        ? 'bg-blue-50 border-2 border-blue-600 text-slate-900 shadow-sm font-semibold'
                        : 'bg-slate-50 border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    <input
                      type="radio"
                      name="reportReason"
                      value={r}
                      checked={selectedReason === r}
                      onChange={() => setSelectedReason(r)}
                      className="mt-0.5 text-blue-600 focus:ring-0"
                    />
                    <span className="font-medium text-slate-900">{r}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Additional Note */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-widest text-slate-500">
                Optional note / observation:
              </label>
              <textarea
                rows={2}
                value={customComment}
                onChange={(e) => setCustomComment(e.target.value)}
                placeholder="e.g. Empty washer, clothes basket sitting nearby without person..."
                className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 resize-none transition-colors"
              />
            </div>

            {/* Explanatory callout */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-600 flex items-start gap-2.5 leading-relaxed shadow-sm">
              <HelpCircle className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
              <p className="font-medium">
                <strong className="text-slate-900">How Misuse Resolution Works:</strong> If the slot booked on this machine has exceeded the 5-minute arrival window, the backend instantly revokes the reservation, gives +1 penalty point to the no-show user, and frees the machine.
              </p>
            </div>

            {/* Actions */}
            <div className="flex gap-2.5 pt-1">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-3 rounded-full bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 text-xs font-bold transition-colors micro-scale"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmitReport}
                disabled={isSubmitting}
                className="flex-1 py-3 rounded-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold shadow-md shadow-blue-500/20 transition-all micro-scale flex items-center justify-center gap-2"
              >
                {isSubmitting ? 'Evaluating Slot in Backend...' : 'Submit Bystander Report'}
              </button>
            </div>
          </>
        )}

      </div>
    </div>
  );
};
