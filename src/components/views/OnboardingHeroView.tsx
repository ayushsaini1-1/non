import React from 'react';
import {
  ArrowRight,
  Zap,
  Clock,
  QrCode,
  MapPin,
} from 'lucide-react';

interface OnboardingHeroViewProps {
  onGetStarted: () => void;
  onExploreRadar?: () => void;
}

export const OnboardingHeroView: React.FC<OnboardingHeroViewProps> = ({
  onGetStarted,
}) => {
  return (
    <div className="max-w-md mx-auto min-h-[80vh] flex flex-col justify-between animate-fade-in">
      {/* Visual Canvas Container */}
      <div className="relative w-full h-[380px] sm:h-[440px] rounded-[36px] overflow-hidden bg-gradient-to-b from-slate-900 via-blue-950 to-slate-900 border border-slate-800 shadow-2xl p-6 flex flex-col justify-between">
        
        {/* Ambient Glows */}
        <div className="absolute -top-12 -right-12 w-64 h-64 bg-blue-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-12 -left-12 w-64 h-64 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />

        {/* Top Floating Status Badges */}
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-white text-xs font-semibold">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Campus Laundry Hub</span>
          </div>
        </div>

        {/* Center Graphic Animation (Washer Drum & Energy Waves) */}
        <div className="relative z-10 my-auto flex flex-col items-center justify-center text-center">
          <div className="relative w-48 h-48 rounded-full border-4 border-white/20 flex items-center justify-center shadow-2xl bg-gradient-to-tr from-blue-600/30 to-emerald-500/20 backdrop-blur-sm">
            {/* Concentric Pulsing Rings */}
            <div className="absolute inset-2 rounded-full border-2 border-white/30 animate-spin" style={{ animationDuration: '18s' }} />
            <div className="absolute inset-6 rounded-full border border-blue-400/40" />
            <div className="absolute inset-10 rounded-full border-2 border-dashed border-emerald-400/50 animate-spin" style={{ animationDuration: '24s', animationDirection: 'reverse' }} />
            
            {/* Center Core Washer Badge */}
            <div className="h-20 w-20 rounded-full bg-white text-slate-900 shadow-2xl flex flex-col items-center justify-center font-bebas p-1">
              <Zap className="h-6 w-6 text-blue-600 fill-blue-600 mb-0.5" />
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-800">DormWash</span>
            </div>

            {/* Orbiting Feature Badges */}
            <div className="absolute -top-2 px-2.5 py-1 rounded-full bg-slate-900/90 border border-slate-700 text-white text-[10px] font-bold shadow-lg flex items-center gap-1">
              <Clock className="h-3 w-3 text-amber-400" />
              <span>5m Grace</span>
            </div>
            <div className="absolute -bottom-2 px-2.5 py-1 rounded-full bg-slate-900/90 border border-slate-700 text-white text-[10px] font-bold shadow-lg flex items-center gap-1">
              <QrCode className="h-3 w-3 text-blue-400" />
              <span>QR Verified</span>
            </div>
          </div>
        </div>

        {/* Bottom Feature Badges */}
        <div className="relative z-10 flex items-center justify-center gap-2">
          <span className="px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-[11px] text-slate-300 font-medium inline-flex items-center gap-1.5">
            <Zap className="h-3 w-3 text-amber-400" />
            <span>6 Washers Available</span>
          </span>
          <span className="px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-[11px] text-slate-300 font-medium inline-flex items-center gap-1.5">
            <MapPin className="h-3 w-3 text-blue-400" />
            <span>Blocks A • B • C</span>
          </span>
        </div>

      </div>

      {/* Bottom Sheet Card (Matching Screen 1 from image) */}
      <div className="mt-4 bg-white border border-slate-200 rounded-[36px] p-8 sm:p-10 shadow-xl text-center space-y-6 animate-scale-up">
        <div className="space-y-2">
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 font-sans">
            Wash Smarter
          </h1>
          <p className="text-sm text-slate-500 max-w-xs mx-auto leading-relaxed font-medium">
            Track your cycle, reserve campus washers, and scan physical QR stickers to skip laundry queues.
          </p>
        </div>

        {/* Feature Pills */}
        <div className="flex items-center justify-center gap-2 text-xs font-semibold text-slate-600">
          <span className="px-3 py-1 rounded-full bg-slate-100 border border-slate-200">
            0 Wait Time
          </span>
          <span className="px-3 py-1 rounded-full bg-slate-100 border border-slate-200">
            Anti-Squatting
          </span>
          <span className="px-3 py-1 rounded-full bg-slate-100 border border-slate-200">
            Campus ID Free
          </span>
        </div>

        {/* High-Contrast Black Pill Action Button (Screen 1 "Get Started →") */}
        <button
          onClick={onGetStarted}
          className="w-full py-4 px-8 rounded-full bg-black hover:bg-slate-900 active:scale-[0.98] text-white font-bold text-sm tracking-wide transition-all shadow-xl shadow-black/15 flex items-center justify-center gap-3 group"
        >
          <span>Get Started</span>
          <ArrowRight className="h-4 w-4 text-white group-hover:translate-x-1 transition-transform" />
        </button>
      </div>

    </div>
  );
};
