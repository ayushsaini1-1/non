import React from 'react';
import {
  User,
  AlertTriangle,
  CheckCircle2,
  Clock,
  LogOut,
  Shield,
  ShieldAlert,
  LogIn,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface AccountStandingViewProps {
  onOpenAuth?: () => void;
  onNavigateToAdmin?: () => void;
  onNavigateToReport?: () => void;
}

export const AccountStandingView: React.FC<AccountStandingViewProps> = ({
  onOpenAuth,
  onNavigateToAdmin,
  onNavigateToReport,
}) => {
  const { user, isAdmin, logout } = useAuth();

  if (!user) {
    return (
      <div className="max-w-md mx-auto bg-white border border-slate-200/90 rounded-[36px] p-8 sm:p-10 text-center space-y-6 shadow-xl animate-scale-up">
        <div className="p-4 rounded-3xl bg-slate-100 text-slate-800 inline-block mx-auto border border-slate-200">
          <User className="h-10 w-10 text-slate-700" />
        </div>
        <div className="space-y-1.5">
          <h2 className="text-2xl font-bold font-sans text-slate-900">Sign In to DormWash</h2>
          <p className="text-xs text-slate-500 max-w-xs mx-auto leading-relaxed">
            Manage your booked washer slots, monitor cycle timers, and track penalty points.
          </p>
        </div>

        {onOpenAuth && (
          <button
            onClick={onOpenAuth}
            className="w-full py-3.5 px-6 rounded-full bg-black hover:bg-slate-900 text-white text-xs font-bold transition-all shadow-lg flex items-center justify-center gap-2 active:scale-95"
          >
            <LogIn className="h-4 w-4" />
            <span>Sign In with Google</span>
          </button>
        )}
      </div>
    );
  }

  const penalty = user.penalty_points || 0;
  const isClean = penalty === 0;
  const isWarning = penalty >= 1 && penalty < 3;

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      
      {/* Profile Overview Card */}
      <div className="rounded-[36px] bg-white border border-slate-200/90 p-6 sm:p-8 shadow-sm space-y-6">
        
        {/* User Identity Header */}
        <div className="flex items-center justify-between pb-5 border-b border-slate-100">
          <div className="flex items-center gap-3.5">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-black text-base font-bold text-white shadow-md shadow-black/15">
              {user.full_name.charAt(0)}
            </div>
            <div>
              <h2 className="text-xl font-bold font-sans tracking-tight text-slate-900">
                {user.full_name}
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                {user.email} • ID #{user.id}
              </p>
            </div>
          </div>

          <span className="px-3.5 py-1.5 rounded-full bg-slate-100 border border-slate-200 text-xs font-bold text-slate-800 uppercase tracking-wider font-mono">
            {user.role}
          </span>
        </div>

        {/* Penalty Standing Gauge */}
        <div
          className={`p-5 rounded-3xl border space-y-3.5 ${
            isClean
              ? 'bg-emerald-50/80 border-emerald-200 text-emerald-950'
              : isWarning
              ? 'bg-amber-50/80 border-amber-200 text-amber-950'
              : 'bg-rose-50/80 border-rose-200 text-rose-950'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 font-bold text-sm">
              {isClean ? (
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              ) : (
                <AlertTriangle className="h-5 w-5 text-amber-600" />
              )}
              <span className="font-bold tracking-tight text-sm uppercase">
                {isClean
                  ? 'Good Standing (Full Reservation Privileges)'
                  : isWarning
                  ? 'Warning Tier (No-shows Recorded)'
                  : 'Restricted Status (Excessive Missed Slots)'}
              </span>
            </div>
            <span className="text-xs font-bold px-3 py-1 rounded-full bg-white border border-slate-200 shadow-sm text-slate-900 font-mono">
              {penalty} Penalty {penalty === 1 ? 'Pt' : 'Pts'}
            </span>
          </div>

          <p className="text-xs text-slate-600 leading-relaxed font-medium">
            {isClean
              ? 'You have checked in on time for all booked slots. Keep up the good work keeping dorm laundry running efficiently!'
              : isWarning
              ? 'You missed the 5-minute arrival window on a previous booking. Please make sure to scan physical QR codes promptly when your slot starts.'
              : 'Your account has accumulated 3+ penalties for missed washer reservations. Continued misuse may lead to temporary reservation hold.'}
          </p>

          {/* Gauge bar */}
          <div className="h-2 w-full bg-white/80 rounded-full overflow-hidden p-0.5 border border-slate-200">
            <div
              className={`h-full rounded-full transition-all ${
                isClean ? 'bg-emerald-500 w-1/12' : isWarning ? 'bg-amber-500 w-2/3' : 'bg-rose-500 w-full'
              }`}
            />
          </div>
        </div>

        {/* Quick Shortcut Actions (Admin Center & Misuse Reporting) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {isAdmin && onNavigateToAdmin && (
            <button
              onClick={onNavigateToAdmin}
              className="p-4 rounded-3xl bg-slate-900 hover:bg-black text-white text-left transition-all shadow-md flex items-center justify-between active:scale-98"
            >
              <div className="space-y-0.5">
                <span className="text-xs font-bold flex items-center gap-1.5 text-white">
                  <Shield className="h-3.5 w-3.5 text-blue-400" />
                  Facility Admin Portal
                </span>
                <p className="text-[11px] text-slate-300">Fleet management & physical stickers</p>
              </div>
              <span className="text-[10px] font-bold px-3 py-1 rounded-full bg-white text-slate-900 font-mono">
                Open
              </span>
            </button>
          )}

          {onNavigateToReport && (
            <button
              onClick={onNavigateToReport}
              className="p-4 rounded-3xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-left transition-all flex items-center justify-between active:scale-98"
            >
              <div className="space-y-0.5">
                <span className="text-xs font-bold flex items-center gap-1.5 text-slate-900">
                  <ShieldAlert className="h-3.5 w-3.5 text-amber-600" />
                  Report No-Show / Issue
                </span>
                <p className="text-[11px] text-slate-500">Free up abandoned washing machines</p>
              </div>
              <span className="text-[10px] font-bold px-3 py-1 rounded-full bg-black text-white font-mono">
                Report
              </span>
            </button>
          )}
        </div>

        {/* Campus Laundry Conduct Rules */}
        <div className="space-y-3 pt-2">
          <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5 text-slate-700" />
            Hostel Laundry Code of Conduct
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="p-4 rounded-3xl bg-slate-50 border border-slate-200 space-y-1.5">
              <span className="text-slate-900 font-bold uppercase tracking-wide block text-xs">1. 5-Min Arrival</span>
              <p className="text-slate-500 text-[11px] leading-relaxed">
                Arrive at the washer and scan the physical QR sticker within 5 minutes of start.
              </p>
            </div>

            <div className="p-4 rounded-3xl bg-slate-50 border border-slate-200 space-y-1.5">
              <span className="text-slate-900 font-bold uppercase tracking-wide block text-xs">2. Anti-Squatting</span>
              <p className="text-slate-500 text-[11px] leading-relaxed">
                Unverified reservations auto-expire and award +1 penalty point.
              </p>
            </div>

            <div className="p-4 rounded-3xl bg-slate-50 border border-slate-200 space-y-1.5">
              <span className="text-slate-900 font-bold uppercase tracking-wide block text-xs">3. Prompt Pickup</span>
              <p className="text-slate-500 text-[11px] leading-relaxed">
                Please collect garments promptly once the spin cycle completes.
              </p>
            </div>
          </div>
        </div>

        {/* Logout */}
        <div className="pt-2 border-t border-slate-100">
          <button
            onClick={logout}
            className="w-full py-3.5 rounded-full bg-slate-50 hover:bg-rose-50 border border-slate-200 text-rose-600 text-xs font-bold transition-colors flex items-center justify-center gap-2 active:scale-98"
          >
            <LogOut className="h-4 w-4" />
            <span>Sign Out from DormWash</span>
          </button>
        </div>

      </div>

    </div>
  );
};
