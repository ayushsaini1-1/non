import React, { useState } from 'react';
import {
  Clock,
  QrCode,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react';
import { Machine, SlotBooking } from '../../types';
import { GracePeriodCountdown } from '../common/GracePeriodCountdown';
import { api } from '../../services/api';

interface MySlotsViewProps {
  slots: SlotBooking[];
  machines: Machine[];
  isLoading: boolean;
  onRefresh: () => void;
  onScanQRForSlot: (slot: SlotBooking) => void;
  onExploreWashers: () => void;
}

export const MySlotsView: React.FC<MySlotsViewProps> = ({
  slots,
  machines,
  isLoading,
  onRefresh,
  onScanQRForSlot,
  onExploreWashers,
}) => {
  const [cancellingId, setCancellingId] = useState<number | null>(null);
  const [actionMessage, setActionMessage] = useState<{ text: string; isError?: boolean } | null>(null);

  const machineMap = new Map<number, Machine>(machines.map((m) => [m.id, m]));

  const activeSlots = slots.filter(
    (s) => s.status === 'BOOKED' || s.status === 'CHECKED_IN'
  );

  const pastSlots = slots.filter(
    (s) => s.status !== 'BOOKED' && s.status !== 'CHECKED_IN'
  );

  const handleCancelSlot = async (slotId: number) => {
    if (!window.confirm('Are you sure you want to cancel this booking?')) return;
    setCancellingId(slotId);
    setActionMessage(null);
    try {
      await api.cancelSlot(slotId);
      setActionMessage({ text: `Slot #${slotId} cancelled successfully.` });
      onRefresh();
    } catch (err: any) {
      setActionMessage({ text: err.message || 'Failed to cancel slot', isError: true });
    } finally {
      setCancellingId(null);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold uppercase tracking-wider">
              <Clock className="h-3.5 w-3.5 text-blue-600" />
              Active Dashboard
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold font-bebas tracking-wide text-slate-900 uppercase flex items-center gap-2.5">
            <span>My Bookings & QR Verification</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-600">
            Manage your washer reservations and confirm physical presence via the machine's QR sticker.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onRefresh}
            className="px-4 py-2 rounded-full bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 hover:text-slate-900 text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm micro-scale"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin text-blue-600' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Action Notification */}
      {actionMessage && (
        <div
          className={`p-4 rounded-2xl border text-xs font-semibold flex items-center justify-between shadow-sm ${
            actionMessage.isError
              ? 'bg-rose-50 border-rose-200 text-rose-700'
              : 'bg-blue-50 border-blue-200 text-blue-700'
          }`}
        >
          <span>{actionMessage.text}</span>
          <button
            onClick={() => setActionMessage(null)}
            className="text-xs underline hover:opacity-80 font-bold"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Section 1: Active & Upcoming Slots */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-blue-600" />
            Active Reservations ({activeSlots.length})
          </h3>
          <span className="text-xs text-slate-500 font-medium">
            5-Minute Arrival Verification
          </span>
        </div>

        {activeSlots.length === 0 ? (
          <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center space-y-4 shadow-sm">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-slate-500 inline-block mx-auto">
              <Clock className="h-8 w-8 text-blue-600" />
            </div>
            <div className="space-y-1">
              <p className="text-base font-bold font-bebas tracking-wide text-slate-900 uppercase">
                You don't have any active washer bookings right now.
              </p>
              <p className="text-xs text-slate-600 max-w-sm mx-auto leading-relaxed">
                Choose an available washing machine from the catalog to schedule your laundry cycle.
              </p>
            </div>
            <button
              onClick={onExploreWashers}
              className="px-6 py-2.5 rounded-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-md shadow-blue-500/20 micro-scale"
            >
              Browse Available Washers
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {activeSlots.map((slot) => {
              const machine = machineMap.get(slot.machine_id);
              const isCheckedIn = slot.status === 'CHECKED_IN';
              const startDate = new Date(slot.start_time);
              const endDate = new Date(slot.end_time);

              return (
                <div
                  key={slot.id}
                  className={`rounded-3xl border p-6 transition-all shadow-sm space-y-4 bg-white ${
                    isCheckedIn
                      ? 'border-emerald-300 ring-2 ring-emerald-500/10'
                      : 'border-slate-200'
                  }`}
                >
                  {/* Card Header */}
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded-lg bg-slate-100 border border-slate-200 font-bebas text-xs font-bold text-slate-800">
                          #{slot.machine_id.toString().padStart(2, '0')}
                        </span>
                        <h4 className="text-base font-bold font-bebas tracking-wide text-slate-900 uppercase">
                          {machine ? machine.name : `Machine #${slot.machine_id}`}
                        </h4>
                      </div>
                      <p className="text-xs text-slate-500 mt-1 font-medium">
                        Location: {machine ? machine.location : 'Campus Hostel'}
                      </p>
                    </div>

                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                        isCheckedIn
                          ? 'bg-emerald-50 border border-emerald-200 text-emerald-700'
                          : 'bg-amber-50 border border-amber-200 text-amber-800'
                      }`}
                    >
                      {isCheckedIn ? 'Checked In (Active)' : 'Pending QR Scan'}
                    </span>
                  </div>

                  {/* Timing details */}
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-1.5">
                    <div className="flex justify-between text-slate-600">
                      <span>Scheduled Window:</span>
                      <span className="text-slate-900 font-gentium font-bold text-sm">
                        {startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} – {endDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    {slot.checked_in_at && (
                      <div className="flex justify-between text-emerald-700 font-semibold">
                        <span>QR Verified At:</span>
                        <span className="font-gentium font-bold">{new Date(slot.checked_in_at).toLocaleTimeString()}</span>
                      </div>
                    )}
                  </div>

                  {/* Grace Period Counter */}
                  <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200">
                    <GracePeriodCountdown
                      startTime={slot.start_time}
                      endTime={slot.end_time}
                      gracePeriodEnd={slot.grace_period_end}
                      status={slot.status}
                      checkedInAt={slot.checked_in_at}
                    />
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2.5 pt-1">
                    {!isCheckedIn && (
                      <>
                        <button
                          type="button"
                          onClick={() => onScanQRForSlot(slot)}
                          className="flex-1 py-3 px-5 rounded-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 micro-scale"
                        >
                          <QrCode className="h-4 w-4" />
                          <span>Scan QR Code Sticker</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleCancelSlot(slot.id)}
                          disabled={cancellingId === slot.id}
                          className="py-3 px-4 rounded-full bg-slate-50 hover:bg-rose-50 border border-slate-200 text-rose-600 text-xs font-bold transition-all micro-scale"
                          title="Cancel Booking"
                        >
                          {cancellingId === slot.id ? '...' : 'Cancel'}
                        </button>
                      </>
                    )}

                    {isCheckedIn && (
                      <div className="w-full py-3 px-4 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold text-center flex items-center justify-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                        <span>Verified & Washing Active</span>
                      </div>
                    )}
                  </div>

                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Section 2: Historical / Past Bookings */}
      {pastSlots.length > 0 && (
        <div className="space-y-3 pt-4 border-t border-slate-200">
          <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500">
            Past Bookings History ({pastSlots.length})
          </h3>

          <div className="rounded-3xl border border-slate-200 bg-white overflow-hidden divide-y divide-slate-100 shadow-sm">
            {pastSlots.map((slot) => {
              const machine = machineMap.get(slot.machine_id);
              const isExpired = slot.status === 'EXPIRED';
              const isCancelled = slot.status === 'CANCELLED';
              const isMisuse = slot.status === 'MISUSE_REPORTED';

              return (
                <div
                  key={slot.id}
                  className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-100 border border-slate-200 text-slate-900 font-bebas text-sm font-bold">
                      #{slot.machine_id}
                    </div>
                    <div>
                      <p className="font-bold font-bebas tracking-wide text-slate-900 uppercase text-sm">
                        {machine ? machine.name : `Machine #${slot.machine_id}`}
                      </p>
                      <p className="text-slate-500 text-[11px]">
                        {new Date(slot.start_time).toLocaleDateString()} at{' '}
                        {new Date(slot.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-3">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                        isExpired
                          ? 'bg-rose-50 text-rose-700 border border-rose-200'
                          : isCancelled
                          ? 'bg-slate-100 text-slate-600 border border-slate-200'
                          : isMisuse
                          ? 'bg-amber-50 text-amber-800 border border-amber-200'
                          : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      }`}
                    >
                      {isExpired ? 'Forfeited (+1 Penalty)' : slot.status}
                    </span>
                    <span className="text-slate-400 font-mono text-[11px]">
                      Slot #{slot.id}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

    </div>
  );
};
