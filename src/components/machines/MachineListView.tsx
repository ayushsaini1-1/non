import React from 'react';

export interface MachineData {
  id: string;
  number: string;
  name: string;
  status: 'Booked' | 'Available' | 'Pending retrieval' | 'Maintenance';
  remainingSeconds: number;
  user?: string | null;
  room?: string | null;
}

interface MachineListViewProps {
  machines: MachineData[];
  onMachineClick: (machine: MachineData) => void;
  onSignOut: () => void;
}

export const MachineListView: React.FC<MachineListViewProps> = ({
  machines,
  onMachineClick,
  onSignOut,
}) => {
  const formatTimer = (seconds: number) => {
    if (seconds <= 0) return '00:00';
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-[#141414] text-white flex flex-col items-center justify-center p-4 sm:p-6">
      {/* Outer Mobile Frame Container matching sketch Screen 2 */}
      <div className="w-full max-w-sm rounded-[3rem] border-2 border-zinc-700 bg-[#141414] p-5 min-h-[580px] flex flex-col justify-between shadow-2xl relative">
        
        {/* Top Header Space matching sketch */}
        <div className="pt-3 pb-2 px-1 flex items-center justify-between border-b border-zinc-800/80 mb-3">
          <div>
            <h2 className="text-sm font-mono font-bold text-zinc-300">DormWash</h2>
            <p className="text-[10px] font-mono text-zinc-500">Live Washer Status</p>
          </div>
          <button
            onClick={onSignOut}
            className="px-2.5 py-1 rounded-xl bg-zinc-900 border border-zinc-800 text-[10px] font-mono text-zinc-400 hover:text-white transition-all"
          >
            Sign Out
          </button>
        </div>

        {/* Machine Rows Container Card matching exact sketch */}
        <div className="flex-1 rounded-3xl border-2 border-zinc-700 bg-[#141414] overflow-hidden divide-y-2 divide-zinc-800 my-auto">
          {machines.map((m) => {
            const isBooked = m.status === 'Booked';
            const isPending = m.status === 'Pending retrieval';
            const isAvailable = m.status === 'Available';

            return (
              <div
                key={m.id}
                onClick={() => onMachineClick(m)}
                className="p-3.5 flex items-center justify-between hover:bg-zinc-900/80 transition-colors cursor-pointer active:bg-zinc-900 group"
              >
                {/* Left Number Box Badge (matching sketch 01, 02, 03...) */}
                <div
                  className={`px-3 py-1.5 rounded-2xl border-2 ${
                    isBooked
                      ? 'border-zinc-500 text-white'
                      : isPending
                      ? 'border-zinc-500 text-zinc-200'
                      : 'border-zinc-600 text-zinc-300'
                  } bg-zinc-950 font-mono font-normal text-base shadow-inner group-hover:border-white transition-colors`}
                >
                  {m.number}
                </div>

                {/* Right Status & Timer (matching sketch typography) */}
                <div className="text-right space-y-0.5">
                  <p
                    className={`text-xs font-mono tracking-wide ${
                      isBooked
                        ? 'text-white font-bold'
                        : isPending
                        ? 'text-zinc-200 font-medium'
                        : isAvailable
                        ? 'text-zinc-400 font-medium'
                        : 'text-zinc-500 font-medium'
                    }`}
                  >
                    {m.status}
                  </p>
                  <p className="text-sm font-mono font-medium text-white tracking-widest">
                    {formatTimer(m.remainingSeconds)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer info */}
        <div className="text-center pt-3 text-[10px] font-mono text-zinc-600">
          Tap washer to book or manage
        </div>
      </div>
    </div>
  );
};
