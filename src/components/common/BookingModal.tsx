import React, { useState } from 'react';
import {
  X,
  Clock,
  AlertTriangle,
  ArrowRight,
  Zap,
  Sparkles,
  ShieldCheck,
  Check,
  Waves,
} from 'lucide-react';
import { Machine, SlotBooking } from '../../types';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  machine: Machine | null;
  onBookingSuccess: (slot: SlotBooking) => void;
  onOpenScannerForSlot?: (slot: SlotBooking) => void;
}

interface WashCycleOption {
  id: number;
  mins: number;
  name: string;
  temp: string;
  tag: string;
  description: string;
}

const WASH_CYCLES: WashCycleOption[] = [
  {
    id: 30,
    mins: 30,
    name: 'Express Refresh',
    temp: '30°C Cold',
    tag: 'Quick 30m',
    description: 'Ideal for lightly soiled daily wear & quick loads',
  },
  {
    id: 45,
    mins: 45,
    name: 'Standard Normal',
    temp: '40°C Eco',
    tag: 'Popular',
    description: 'Standard cottons & mixed fabrics with water save',
  },
  {
    id: 60,
    mins: 60,
    name: 'Deep Steam Clean',
    temp: '60°C Thermal',
    tag: 'Heavy Stain',
    description: 'High temperature sanitization for bedding & towels',
  },
];

export const BookingModal: React.FC<BookingModalProps> = ({
  isOpen,
  onClose,
  machine,
  onBookingSuccess,
  onOpenScannerForSlot,
}) => {
  const { user, isAuthenticated } = useAuth();
  const [selectedCycleMins, setSelectedCycleMins] = useState<number>(45);
  const [startType, setStartType] = useState<'now' | 'custom'>('now');
  const [customStartTime, setCustomStartTime] = useState<string>(() => {
    const d = new Date(Date.now() + 10 * 60 * 1000); // 10 mins in future
    return d.toTimeString().substring(0, 5);
  });
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen || !machine) return null;

  const handleConfirmBooking = async () => {
    if (!isAuthenticated || !user) {
      setErrorMessage('Please sign in with Google before reserving a washer.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      let startDate = new Date();
      if (startType === 'now') {
        startDate = new Date(Date.now() + 1000);
      } else {
        const [hours, minutes] = customStartTime.split(':').map(Number);
        const target = new Date();
        target.setHours(hours, minutes, 0, 0);
        if (target.getTime() < Date.now() - 60000) {
          throw new Error('Scheduled start time cannot be in the past');
        }
        startDate = target;
      }

      const endDate = new Date(startDate.getTime() + selectedCycleMins * 60 * 1000);

      const newSlot = await api.bookSlot(machine.id, startDate, endDate);
      onBookingSuccess(newSlot);
      onClose();

      if (startType === 'now' && onOpenScannerForSlot) {
        onOpenScannerForSlot(newSlot);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to book slot.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const activeCycleObj = WASH_CYCLES.find((c) => c.mins === selectedCycleMins) || WASH_CYCLES[1];

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-lg bg-white border-t sm:border border-slate-200 rounded-t-[36px] sm:rounded-[36px] p-6 sm:p-8 shadow-2xl space-y-5 max-h-[94vh] overflow-y-auto animate-scale-up">
        
        {/* Modal Top Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-black text-white shadow-md shadow-black/15">
              <Waves className="h-5 w-5 text-blue-400" />
            </div>
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 font-mono flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                Reserve Washer
              </span>
              <h3 className="text-xl font-bold tracking-tight text-slate-900 font-sans">
                {machine.name}
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2.5 rounded-full bg-slate-100 text-slate-500 hover:text-slate-900 hover:bg-slate-200 transition-colors active:scale-95"
            title="Close modal"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Machine Badge & Specs Summary */}
        <div className="p-4 rounded-3xl bg-slate-50 border border-slate-200/80 flex items-center justify-between text-xs">
          <div className="space-y-0.5">
            <span className="font-extrabold text-slate-900 text-sm">
              {machine.location}
            </span>
            <p className="text-slate-500 font-medium font-mono text-[11px]">
              Hardware Tag #{machine.id} • {machine.status}
            </p>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-slate-200 text-slate-800 font-bold font-mono text-xs shadow-sm">
            <Sparkles className="h-3.5 w-3.5 text-amber-500" />
            <span>Hostel Washer #{machine.id}</span>
          </div>
        </div>

        {/* Error Notification */}
        {errorMessage && (
          <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-700 flex items-start gap-2.5">
            <AlertTriangle className="h-4 w-4 text-rose-500 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Wash Cycle Selector */}
        <div className="space-y-2">
          <div className="flex items-center justify-between px-0.5">
            <label className="text-xs font-extrabold uppercase tracking-wider text-slate-500 font-mono">
              Select Wash Cycle Program:
            </label>
            <span className="text-[10px] font-bold text-blue-600 px-2 py-0.5 rounded-full bg-blue-50 border border-blue-200 font-mono">
              {activeCycleObj.temp}
            </span>
          </div>

          <div className="space-y-2">
            {WASH_CYCLES.map((cycle) => {
              const isSelected = selectedCycleMins === cycle.mins;
              return (
                <button
                  key={cycle.id}
                  type="button"
                  onClick={() => setSelectedCycleMins(cycle.mins)}
                  className={`w-full p-3.5 rounded-2xl border text-left transition-all flex items-center justify-between active:scale-[0.99] ${
                    isSelected
                      ? 'bg-black border-black text-white shadow-lg shadow-black/15'
                      : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-800'
                  }`}
                >
                  <div className="space-y-0.5 pr-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold font-sans">{cycle.name}</span>
                      <span
                        className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider font-mono ${
                          isSelected
                            ? 'bg-white/20 text-white'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {cycle.tag}
                      </span>
                    </div>
                    <p
                      className={`text-[11px] font-medium leading-tight ${
                        isSelected ? 'text-slate-300' : 'text-slate-500'
                      }`}
                    >
                      {cycle.description}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <div className="text-right font-mono">
                      <span className="text-base font-black">{cycle.mins}m</span>
                    </div>
                    <div
                      className={`h-6 w-6 rounded-full border flex items-center justify-center ${
                        isSelected
                          ? 'bg-white text-slate-900 border-white'
                          : 'border-slate-300 bg-slate-50'
                      }`}
                    >
                      {isSelected && <Check className="h-3.5 w-3.5 stroke-[3]" />}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Start Time Radio Switcher */}
        <div className="space-y-2 pt-1">
          <label className="text-xs font-extrabold uppercase tracking-wider text-slate-500 font-mono">
            Reservation Schedule Mode:
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setStartType('now')}
              className={`p-3.5 rounded-2xl border text-xs font-bold transition-all flex flex-col items-center justify-center gap-1 active:scale-95 ${
                startType === 'now'
                  ? 'bg-black text-white border-black shadow-md'
                  : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}
            >
              <Zap className={`h-4 w-4 ${startType === 'now' ? 'text-amber-400' : 'text-slate-400'}`} />
              <span>Start Immediately</span>
              <span className="text-[10px] opacity-80 font-normal font-mono">5m check-in begins</span>
            </button>

            <button
              type="button"
              onClick={() => setStartType('custom')}
              className={`p-3.5 rounded-2xl border text-xs font-bold transition-all flex flex-col items-center justify-center gap-1 active:scale-95 ${
                startType === 'custom'
                  ? 'bg-black text-white border-black shadow-md'
                  : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}
            >
              <Clock className={`h-4 w-4 ${startType === 'custom' ? 'text-amber-400' : 'text-slate-400'}`} />
              <span>Schedule Hour</span>
              <span className="text-[10px] opacity-80 font-normal font-mono">Pick exact start time</span>
            </button>
          </div>

          {startType === 'custom' && (
            <div className="pt-2 animate-fade-in">
              <input
                type="time"
                value={customStartTime}
                onChange={(e) => setCustomStartTime(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-sm font-bold font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-black/10"
              />
            </div>
          )}
        </div>

        {/* 5-Minute Arrival Grace Badge */}
        <div className="p-4 rounded-2xl bg-blue-50/80 border border-blue-200/80 text-xs text-blue-950 space-y-1">
          <div className="flex items-center gap-1.5 font-bold text-blue-900">
            <ShieldCheck className="h-4 w-4 text-blue-600" />
            <span>Anti-Squatting Check-in Guarantee</span>
          </div>
          <p className="text-[11px] text-blue-800 font-medium leading-relaxed">
            When your slot begins, scan the physical QR sticker on {machine.name} within 5 minutes. Unchecked slots auto-cancel to keep laundry fair for everyone.
          </p>
        </div>

        {/* Modal Action Buttons */}
        <div className="pt-2 flex items-center gap-3">
          <button
            type="button"
            onClick={onClose}
            className="p-4 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition-all active:scale-95"
            title="Cancel"
          >
            <X className="h-5 w-5" />
          </button>

          <button
            type="button"
            onClick={handleConfirmBooking}
            disabled={isSubmitting}
            className="flex-1 py-4 px-6 rounded-full bg-black hover:bg-slate-900 disabled:opacity-50 active:scale-[0.98] text-white font-bold text-sm tracking-wide transition-all shadow-xl shadow-black/15 flex items-center justify-center gap-3 group"
          >
            <span>{isSubmitting ? 'Reserving...' : `Confirm & Reserve ${selectedCycleMins}m Slot`}</span>
            <ArrowRight className="h-4 w-4 text-white group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

      </div>
    </div>
  );
};

