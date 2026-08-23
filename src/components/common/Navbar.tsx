import React from 'react';
import {
  User as UserIcon,
  QrCode,
  Clock,
  LayoutGrid,
} from 'lucide-react';

export type ActiveTab = 'onboarding' | 'washers' | 'radar' | 'my-slots' | 'scan' | 'report' | 'admin' | 'account';

interface NavbarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  activeSlotCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  activeSlotCount,
}) => {
  // Floating bottom dock items
  const dockItems = [
    {
      key: 'washers' as ActiveTab,
      label: 'Explore',
      icon: <LayoutGrid className="w-5 h-5" />,
      badge: null,
    },
    {
      key: 'scan' as ActiveTab,
      label: 'Scan QR',
      icon: <QrCode className="w-5 h-5" />,
      badge: null,
    },
    {
      key: 'my-slots' as ActiveTab,
      label: 'Bookings',
      icon: <Clock className="w-5 h-5" />,
      badge: activeSlotCount > 0 ? activeSlotCount : null,
    },
    {
      key: 'account' as ActiveTab,
      label: 'Profile',
      icon: <UserIcon className="w-5 h-5" />,
      badge: null,
    },
  ];

  return (
    <nav aria-label="Main Navigation" className="fixed bottom-5 inset-x-0 z-40 flex justify-center pointer-events-none px-4">
      <div className="pointer-events-auto bg-white/95 backdrop-blur-2xl border border-slate-200/90 rounded-full p-1.5 shadow-2xl shadow-slate-900/15 flex items-center gap-1 sm:gap-2">
        {dockItems.map((item) => {
          const isActive = activeTab === item.key;
          return (
            <button
              key={item.key}
              onClick={() => setActiveTab(item.key)}
              className={`relative px-4 sm:px-5 py-2.5 rounded-full transition-all duration-200 flex items-center gap-2 active:scale-95 ${
                isActive
                  ? 'bg-black text-white shadow-lg shadow-black/20 font-bold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 font-medium'
              }`}
              title={item.label}
            >
              <span className={isActive ? 'text-white' : 'text-slate-700'}>
                {item.icon}
              </span>

              <span className={`text-xs ${isActive ? 'inline font-bold' : 'hidden sm:inline'}`}>
                {item.label}
              </span>

              {item.badge && (
                <span
                  className={`text-[9px] px-1.5 py-0.5 rounded-full font-mono font-bold leading-none ${
                    isActive ? 'bg-amber-400 text-black' : 'bg-black text-white'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};

