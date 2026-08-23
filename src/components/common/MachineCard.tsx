import React from 'react';
import {
  MapPin,
  QrCode,
  AlertTriangle,
  Sparkles,
  Star,
  CheckCircle2,
} from 'lucide-react';
import { Machine, SlotBooking } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { GracePeriodCountdown } from './GracePeriodCountdown';

interface MachineCardProps {
  machine: Machine;
  activeSlot?: SlotBooking | null;
  onBookClick: (machine: Machine) => void;
  onViewStickerClick: (machine: Machine) => void;
  onReportMisuseClick: (machine: Machine) => void;
  onScanForSlotClick?: (slot: SlotBooking) => void;
  onExploreRadarClick?: (machine: Machine) => void;
}

export const MachineCard: React.FC<MachineCardProps> = ({
  machine,
  activeSlot,
  onBookClick,
  onReportMisuseClick,
  onScanForSlotClick,
}) => {
  const { user } = useAuth();

  const isAvailable = machine.status === 'AVAILABLE';
  const isMaintenance = machine.status === 'MAINTENANCE';
  const isMySlot = activeSlot && user && activeSlot.user_id === user.id;
  const isPendingCheckIn = activeSlot && activeSlot.status === 'BOOKED';

  return (
    <div className="rounded-[28px] bg-white border border-slate-200/90 shadow-sm hover:shadow-md hover:border-slate-300 transition-all p-5 sm:p-6 flex flex-col justify-between space-y-4">
      
      {/* Top Header Row: Machine ID, Status & Rating */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-black text-white font-mono font-bold text-base shadow-sm">
            #{machine.id.toString().padStart(2, '0')}
          </div>
          <div>
            <h3 className="text-lg font-bold tracking-tight text-slate-900 font-sans">
              {machine.name}
            </h3>
            <p className="text-xs text-slate-500 font-medium flex items-center gap-1.5 mt-0.5">
              <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />
              <span>{machine.location}</span>
            </p>
          </div>
        </div>

        {/* Status Badge */}
        <div className="flex flex-col items-end gap-1.5">
          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold font-mono ${
              isAvailable
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : isMaintenance
                ? 'bg-rose-50 text-rose-700 border border-rose-200'
                : 'bg-amber-50 text-amber-700 border border-amber-200'
            }`}
          >
            <span
              className={`h-2 w-2 rounded-full ${
                isAvailable
                  ? 'bg-emerald-500'
                  : isMaintenance
                  ? 'bg-rose-500'
                  : 'bg-amber-500'
              }`}
            />
            <span>{isAvailable ? 'Available' : isMaintenance ? 'Broken' : 'In Cycle'}</span>
          </span>

          <div className="flex items-center gap-1 text-[11px] font-bold text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-full">
            <Star className="h-3 w-3 text-amber-500 fill-amber-500" />
            <span>4.9</span>
          </div>
        </div>
      </div>

      {/* Feature Specs */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-medium text-slate-600 pt-1 border-t border-slate-100">
        <span className="text-xs font-semibold text-slate-500">
          Free with Resident Pass
        </span>
      </div>

      {/* Active Booking Countdown if currently in use */}
      {activeSlot && (
        <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
          <div className="flex items-center justify-between text-xs font-bold">
            <span className={isMySlot ? 'text-blue-700 flex items-center gap-1.5' : 'text-slate-700'}>
              {isMySlot ? (
                <>
                  <CheckCircle2 className="h-3.5 w-3.5 text-blue-600" />
                  <span>Your Active Reservation</span>
                </>
              ) : (
                <span>Reserved by Resident #{activeSlot.user_id}</span>
              )}
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-white border border-slate-200 font-mono font-bold text-slate-700">
              {activeSlot.status}
            </span>
          </div>

          <GracePeriodCountdown
            startTime={activeSlot.start_time}
            endTime={activeSlot.end_time}
            gracePeriodEnd={activeSlot.grace_period_end}
            status={activeSlot.status}
            checkedInAt={activeSlot.checked_in_at}
          />

          {isMySlot && isPendingCheckIn && onScanForSlotClick && (
            <button
              onClick={() => onScanForSlotClick(activeSlot)}
              className="w-full mt-1.5 py-2.5 px-4 rounded-full bg-black hover:bg-slate-900 text-white text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2 active:scale-95"
            >
              <QrCode className="h-3.5 w-3.5" />
              <span>Scan Physical QR Sticker</span>
            </button>
          )}
        </div>
      )}

      {/* Action Buttons */}
      <div className="pt-2 flex items-center gap-2.5">
        {isMaintenance ? (
          <button
            disabled
            className="w-full py-3 px-4 rounded-full bg-rose-50 border border-rose-200 text-rose-700 font-bold text-xs flex items-center justify-center gap-1.5 opacity-90 cursor-not-allowed"
          >
            <AlertTriangle className="h-3.5 w-3.5 text-rose-500" />
            <span>Broken • Out of Order</span>
          </button>
        ) : isAvailable ? (
          <button
            onClick={() => onBookClick(machine)}
            className="w-full py-3 px-5 rounded-full bg-black hover:bg-slate-900 active:scale-[0.98] text-white font-bold text-xs tracking-wide transition-all shadow-sm flex items-center justify-center gap-2"
          >
            <span>Reserve Slot</span>
            <Sparkles className="h-3.5 w-3.5 text-amber-400" />
          </button>
        ) : (
          <button
            onClick={() => onReportMisuseClick(machine)}
            className="w-full py-3 px-4 rounded-full bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-900 font-bold text-xs transition-all flex items-center justify-center gap-1.5 active:scale-98"
          >
            <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
            <span>Report No-Show / Issue</span>
          </button>
        )}
      </div>

    </div>
  );
};
