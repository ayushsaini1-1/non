import React, { useState } from 'react';
import {
  ArrowLeft,
  Heart,
  ArrowRight,
  Flag,
  Sparkles,
  QrCode,
  ShieldAlert,
} from 'lucide-react';
import { Machine } from '../../types';

interface LiveCycleRadarViewProps {
  machines: Machine[];
  selectedMachineId?: number | null;
  onBack: () => void;
  onBookMachine: (machine: Machine) => void;
  onViewSticker: (machine: Machine) => void;
  onReportMisuse: (machine: Machine) => void;
}

interface Waypoint {
  id: string;
  timeLabel: string;
  title: string;
  desc: string;
  yPercent: number; // percentage from top
  xPercent: number; // percentage from left
  isFlag?: boolean;
}

const WAYPOINTS: Waypoint[] = [
  {
    id: 'step-5',
    timeLabel: '45 mins',
    title: 'Clean & Fresh Cycle Finish',
    desc: 'High-speed spin ends. Notification sent to pickup laundry.',
    yPercent: 22,
    xPercent: 54,
    isFlag: true,
  },
  {
    id: 'step-4',
    timeLabel: '30 mins',
    title: 'Deep Rinse & Softener',
    desc: 'Cold water thorough rinse and balance stabilization.',
    yPercent: 38,
    xPercent: 48,
  },
  {
    id: 'step-3',
    timeLabel: '15 mins',
    title: 'Active Wash & Steam',
    desc: 'Active suds penetrating fabrics at 40°C.',
    yPercent: 54,
    xPercent: 52,
  },
  {
    id: 'step-2',
    timeLabel: '5 mins',
    title: 'Arrival Grace Window Deadline',
    desc: 'Physical QR sticker must be scanned by 5m mark or slot auto-expires.',
    yPercent: 70,
    xPercent: 42,
  },
  {
    id: 'step-1',
    timeLabel: '0 mins',
    title: 'Slot Start & Check-In Tee',
    desc: 'Reserved time begins. Head to laundry room and scan QR code.',
    yPercent: 84,
    xPercent: 50,
  },
];

export const LiveCycleRadarView: React.FC<LiveCycleRadarViewProps> = ({
  machines,
  selectedMachineId,
  onBack,
  onBookMachine,
  onViewSticker,
  onReportMisuse,
}) => {
  const [activeMachineIndex, setActiveMachineIndex] = useState<number>(() => {
    if (selectedMachineId) {
      const idx = machines.findIndex((m) => m.id === selectedMachineId);
      return idx >= 0 ? idx : 0;
    }
    return 0;
  });

  const [selectedWaypoint, setSelectedWaypoint] = useState<Waypoint>(WAYPOINTS[3]); // 5 mins grace as default focus
  const [isLiked, setIsLiked] = useState<boolean>(false);

  const currentMachine = machines[activeMachineIndex] || machines[0];

  const handleNextMachine = () => {
    setActiveMachineIndex((prev) => (prev + 1) % machines.length);
  };

  const handlePrevMachine = () => {
    setActiveMachineIndex((prev) => (prev - 1 + machines.length) % machines.length);
  };

  if (!currentMachine) return null;

  return (
    <div className="max-w-md mx-auto min-h-[85vh] flex flex-col justify-between animate-fade-in relative pb-12">
      
      {/* Top Floating App Bar */}
      <div className="absolute top-4 inset-x-4 z-20 flex items-center justify-between">
        <button
          onClick={onBack}
          className="p-3 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur-md text-white border border-white/20 transition-all active:scale-95 shadow-lg"
          title="Back to discovery"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>

        <div className="px-4 py-2 rounded-full bg-black/40 backdrop-blur-md border border-white/20 text-white text-xs font-bold tracking-wide">
          <span>Cycle Radar • #{currentMachine.id}</span>
        </div>

        <button
          onClick={() => setIsLiked(!isLiked)}
          className={`p-3 rounded-full backdrop-blur-md border border-white/20 transition-all active:scale-95 shadow-lg ${
            isLiked ? 'bg-rose-500 text-white' : 'bg-black/40 hover:bg-black/60 text-white'
          }`}
          title="Save as Favorite"
        >
          <Heart className={`h-4 w-4 ${isLiked ? 'fill-white' : ''}`} />
        </button>
      </div>

      {/* Main Aerial GPS Fairway / Concentric Radar Canvas (Matching Screen 2 from image) */}
      <div className="relative w-full h-[500px] sm:h-[530px] rounded-[40px] overflow-hidden bg-[#1E3A2F] border-2 border-emerald-900/40 shadow-2xl">
        
        {/* Deep Green Aerial Water & Fairway Textures */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#142E25] via-[#1B4332] to-[#122A21]" />
        
        {/* Ocean/Water Sand Bunkers (Simulating the Golf Terrain from screenshot) */}
        <div className="absolute -left-10 top-16 w-36 h-72 rounded-full bg-[#1C4E3D] blur-xl opacity-70" />
        <div className="absolute -right-8 bottom-24 w-40 h-80 rounded-full bg-[#0D241C] blur-2xl opacity-80" />
        
        {/* Organic Sand Trap Bunkers */}
        <div className="absolute left-6 top-32 w-16 h-28 rounded-full bg-[#D8D2C2]/25 rotate-12 blur-[1px] border border-[#D8D2C2]/40" />
        <div className="absolute right-8 top-16 w-20 h-36 rounded-full bg-[#D8D2C2]/20 -rotate-12 blur-[1px] border border-[#D8D2C2]/30" />

        {/* Center Fairway Oval with Concentric Elevation Rings (Screen 2 1:1) */}
        <div className="absolute inset-x-8 top-12 bottom-20 rounded-[100px] bg-[#2D6A4F]/60 border-2 border-dashed border-emerald-300/40 flex items-center justify-center shadow-inner">
          <div className="absolute inset-x-6 top-8 bottom-8 rounded-[80px] bg-[#40916C]/40 border border-emerald-200/30" />
          <div className="absolute inset-x-12 top-16 bottom-16 rounded-[60px] bg-[#52B788]/25 border border-emerald-100/30" />
        </div>

        {/* Dotted Trajectory Flight Line */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none z-10">
          <path
            d="M 190 440 Q 155 370 190 280 T 205 120"
            fill="none"
            stroke="rgba(255, 255, 255, 0.65)"
            strokeWidth="2.5"
            strokeDasharray="6 6"
          />
        </svg>

        {/* Interactive Waypoint Nodes along the Fairway */}
        {WAYPOINTS.map((wp) => {
          const isSelected = selectedWaypoint.id === wp.id;
          return (
            <div
              key={wp.id}
              style={{
                top: `${wp.yPercent}%`,
                left: `${wp.xPercent}%`,
                transform: 'translate(-50%, -50%)',
              }}
              className="absolute z-20"
            >
              {wp.isFlag ? (
                /* Flag Node (Hole Goal / 45 min Finish) */
                <button
                  onClick={() => setSelectedWaypoint(wp)}
                  className="flex flex-col items-center group cursor-pointer"
                >
                  <div className="p-2 rounded-full bg-white text-emerald-800 shadow-xl border-2 border-emerald-600 transition-transform group-hover:scale-110 flex items-center justify-center">
                    <Flag className="h-4 w-4 text-emerald-700 fill-emerald-600" />
                  </div>
                  <span className="mt-1 px-2.5 py-0.5 rounded-full bg-white/90 backdrop-blur-md font-extrabold text-[10px] text-slate-900 shadow-md font-mono">
                    {wp.timeLabel}
                  </span>
                </button>
              ) : (
                /* Pill Distance/Timing Node (Matching screenshot pill yardages: 87yds, 121yds, 173yds) */
                <button
                  onClick={() => setSelectedWaypoint(wp)}
                  className={`px-3 py-1 rounded-full font-bold text-[11px] font-mono transition-all shadow-lg flex items-center gap-1.5 cursor-pointer ${
                    isSelected
                      ? 'bg-white text-slate-900 ring-4 ring-emerald-400/50 scale-110'
                      : 'bg-white/85 text-slate-800 hover:bg-white hover:scale-105 border border-white/60'
                  }`}
                >
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${
                      wp.id === 'step-2' ? 'bg-amber-500 animate-pulse' : 'bg-emerald-600'
                    }`}
                  />
                  <span>{wp.timeLabel}</span>
                </button>
              )}
            </div>
          );
        })}

        {/* Floating Active Waypoint Description Toast in the Radar */}
        <div className="absolute top-16 inset-x-8 z-20">
          <div className="p-3.5 rounded-2xl bg-black/60 backdrop-blur-md border border-white/20 text-white text-xs space-y-1 animate-fade-in shadow-xl">
            <div className="flex items-center justify-between">
              <span className="font-extrabold font-mono text-emerald-400 text-[11px] uppercase tracking-wider flex items-center gap-1">
                <Sparkles className="h-3 w-3" />
                {selectedWaypoint.timeLabel} Stage
              </span>
              <span className="text-[10px] text-slate-300">Tap nodes to explore</span>
            </div>
            <p className="font-bold text-white text-xs">{selectedWaypoint.title}</p>
            <p className="text-[11px] text-slate-300 leading-snug">{selectedWaypoint.desc}</p>
          </div>
        </div>

      </div>

      {/* Bottom Floating Course Sheet (Screen 2 Bottom Sheet Card 1:1) */}
      <div className="mt-[-60px] relative z-30 bg-white border border-slate-200 rounded-[36px] p-6 sm:p-7 shadow-2xl space-y-5 animate-scale-up">
        
        {/* Title and Room Location */}
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 font-sans">
              {currentMachine.name}
            </h2>
            <span
              className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                currentMachine.status === 'AVAILABLE'
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : currentMachine.status === 'MAINTENANCE'
                  ? 'bg-rose-50 text-rose-700 border border-rose-200'
                  : 'bg-amber-50 text-amber-800 border border-amber-200'
              }`}
            >
              {currentMachine.status === 'MAINTENANCE' ? 'BROKEN' : currentMachine.status}
            </span>
          </div>
          <p className="text-xs text-slate-500 font-medium">
            {currentMachine.location} • Smart Campus Laundry Suite
          </p>
        </div>

        {/* Stat Cards Grid (Par / Hole / Hcp 1:1 format from image) */}
        <div className="grid grid-cols-3 gap-2 bg-slate-50 border border-slate-100 p-4 rounded-3xl text-center">
          <div className="space-y-0.5">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-mono">
              45
            </span>
            <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wide">
              Mins Cycle
            </p>
          </div>

          <div className="space-y-0.5 border-x border-slate-200 px-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-blue-600 font-mono">
              5
            </span>
            <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wide">
              Mins Grace
            </p>
          </div>

          <div className="space-y-0.5">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-mono">
              8
            </span>
            <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wide">
              Kg Capacity
            </p>
          </div>
        </div>

        {/* Action Controls (Screen 2 Arrow Navigation + Solid Black Pill Button) */}
        <div className="flex items-center gap-3 pt-1">
          
          {/* Back/Prev Machine Pill Button */}
          <button
            onClick={handlePrevMachine}
            className="p-4 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition-all active:scale-95"
            title="Previous machine"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>

          {/* Primary Solid Black Pill Button (Screen 2 Right Pill) */}
          <button
            onClick={() => onBookMachine(currentMachine)}
            disabled={currentMachine.status === 'MAINTENANCE'}
            className="flex-1 py-4 px-6 rounded-full bg-black hover:bg-slate-900 disabled:opacity-50 active:scale-[0.98] text-white font-bold text-sm tracking-wide transition-all shadow-xl shadow-black/15 flex items-center justify-center gap-3 group"
          >
            <span>Reserve Machine</span>
            <ArrowRight className="h-4 w-4 text-white group-hover:translate-x-1 transition-transform" />
          </button>

          {/* Next Machine Pill Button */}
          <button
            onClick={handleNextMachine}
            className="p-4 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition-all active:scale-95"
            title="Next machine"
          >
            <ArrowRight className="h-5 w-5" />
          </button>
        </div>

        {/* Secondary Utility Actions */}
        <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
          <button
            onClick={() => onViewSticker(currentMachine)}
            className="hover:text-blue-600 font-bold flex items-center gap-1"
          >
            <QrCode className="h-3.5 w-3.5" />
            <span>View Physical QR Placard</span>
          </button>

          <button
            onClick={() => onReportMisuse(currentMachine)}
            className="hover:text-amber-600 font-bold flex items-center gap-1"
          >
            <ShieldAlert className="h-3.5 w-3.5" />
            <span>Report Idle No-Show</span>
          </button>
        </div>

      </div>

    </div>
  );
};
