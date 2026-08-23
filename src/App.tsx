import { useState, useEffect, useCallback } from 'react';
import { QrCode } from 'lucide-react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider, useToast } from './context/ToastContext';
import { Machine, SlotBooking, MisuseReport } from './types';
import { api } from './services/api';

import { Navbar, ActiveTab } from './components/common/Navbar';
import { MachineGridView } from './components/views/MachineGridView';
import { MySlotsView } from './components/views/MySlotsView';
import { MisuseReportingView } from './components/views/MisuseReportingView';
import { AdminPortalView } from './components/views/AdminPortalView';
import { AccountStandingView } from './components/views/AccountStandingView';
import { LiveCycleRadarView } from './components/views/LiveCycleRadarView';
import { OnboardingHeroView } from './components/views/OnboardingHeroView';

import { BookingModal } from './components/common/BookingModal';
import { PrintableStickerModal } from './components/common/PrintableStickerModal';
import { MisuseReportModal } from './components/common/MisuseReportModal';
import { QRScannerModal } from './components/common/QRScannerModal';
import { AuthModal } from './components/common/AuthModal';

function MainAppContent() {
  const { isAuthenticated, isAdmin, refreshUser } = useAuth();
  const { showToast } = useToast();

  // Navigation state
  const [activeTab, setActiveTab] = useState<ActiveTab>('washers');
  const [selectedRadarMachineId, setSelectedRadarMachineId] = useState<number | null>(null);

  // Data state
  const [machines, setMachines] = useState<Machine[]>([]);
  const [mySlots, setMySlots] = useState<SlotBooking[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Modal states
  const [selectedMachineForBooking, setSelectedMachineForBooking] = useState<Machine | null>(null);
  const [selectedMachineForSticker, setSelectedMachineForSticker] = useState<Machine | null>(null);
  const [selectedMachineForMisuse, setSelectedMachineForMisuse] = useState<Machine | null>(null);
  const [scannerState, setScannerState] = useState<{
    isOpen: boolean;
    targetSlot?: SlotBooking | null;
  }>({ isOpen: false, targetSlot: null });
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);

  // Fetch machines and slots
  const fetchData = useCallback(async () => {
    try {
      const machineList = await api.getMachines();
      setMachines(machineList);
    } catch {
      // Backend offline or unreachable
    }

    if (isAuthenticated) {
      try {
        const slotList = await api.getMySlots();
        setMySlots(slotList);
      } catch {
        // ignore
      }
    } else {
      setMySlots([]);
    }
    setIsLoading(false);
  }, [isAuthenticated]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 4000);
    return () => clearInterval(interval);
  }, [fetchData]);

  // Active slot count
  const activeSlotCount = mySlots.filter(
    (s) => s.status === 'BOOKED' || s.status === 'CHECKED_IN'
  ).length;

  // Handlers
  const handleOpenBooking = (machine: Machine) => {
    if (!isAuthenticated) {
      setIsAuthModalOpen(true);
      return;
    }
    setSelectedMachineForBooking(machine);
  };

  const handleBookingSuccess = (slot: SlotBooking) => {
    showToast('success', 'Reservation Confirmed', `Slot #${slot.id} reserved. Scan the physical QR code sticker within 5 minutes.`);
    fetchData();
    setActiveTab('my-slots');
  };

  const handleOpenSticker = (machine: Machine) => {
    setSelectedMachineForSticker(machine);
  };

  const handleOpenMisuse = (machine: Machine) => {
    if (!isAuthenticated) {
      setIsAuthModalOpen(true);
      return;
    }
    setSelectedMachineForMisuse(machine);
  };

  const handleOpenScannerForSlot = (slot: SlotBooking) => {
    setScannerState({ isOpen: true, targetSlot: slot });
  };

  const handleGeneralScanRequest = () => {
    setScannerState({ isOpen: true, targetSlot: null });
  };

  const handleScanSuccess = (_token: string, message: string) => {
    showToast('success', 'Arrival Verified', message);
    fetchData();
    refreshUser();
  };

  const handleReportSuccess = (report: MisuseReport) => {
    showToast('info', 'Report Evaluated', report.action_taken);
    fetchData();
    refreshUser();
  };

  const handleBookFreedMachine = (machine: Machine) => {
    handleOpenBooking(machine);
  };

  const handleExploreRadar = (machine: Machine) => {
    setSelectedRadarMachineId(machine.id);
    setActiveTab('radar');
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 flex flex-col selection:bg-black selection:text-white font-sans antialiased">
      
      {/* Floating Bottom Navigation Dock */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        activeSlotCount={activeSlotCount}
      />

      {/* Main Content Area */}
      <main className="flex-1 mx-auto max-w-5xl w-full px-4 sm:px-6 pt-6 sm:pt-8 pb-28 sm:pb-32">
        
        {activeTab === 'onboarding' && (
          <OnboardingHeroView
            onGetStarted={() => setActiveTab('washers')}
            onExploreRadar={() => {
              if (machines.length > 0) {
                setSelectedRadarMachineId(machines[0].id);
              }
              setActiveTab('radar');
            }}
          />
        )}

        {activeTab === 'washers' && (
          <MachineGridView
            machines={machines}
            slots={mySlots}
            isLoading={isLoading}
            onRefresh={fetchData}
            onBookMachine={handleOpenBooking}
            onViewSticker={handleOpenSticker}
            onReportMisuse={handleOpenMisuse}
            onScanForSlot={handleOpenScannerForSlot}
            onExploreRadar={handleExploreRadar}
          />
        )}

        {activeTab === 'radar' && (
          <LiveCycleRadarView
            machines={machines}
            selectedMachineId={selectedRadarMachineId}
            onBack={() => setActiveTab('washers')}
            onBookMachine={handleOpenBooking}
            onViewSticker={handleOpenSticker}
            onReportMisuse={handleOpenMisuse}
          />
        )}

        {activeTab === 'my-slots' && (
          <MySlotsView
            slots={mySlots}
            machines={machines}
            isLoading={isLoading}
            onRefresh={fetchData}
            onScanQRForSlot={handleOpenScannerForSlot}
            onExploreWashers={() => setActiveTab('washers')}
          />
        )}

        {activeTab === 'scan' && (
          <div className="max-w-xl mx-auto space-y-6 animate-fade-in">
            <div className="rounded-[36px] bg-white border border-slate-200/90 p-8 sm:p-10 text-center space-y-5 shadow-lg">
              <div className="p-4 rounded-3xl bg-slate-100 text-slate-900 inline-block mx-auto border border-slate-200">
                <QrCode className="h-10 w-10 text-black" />
              </div>
              <div className="space-y-1.5">
                <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 font-sans">
                  Physical Machine QR Scanner
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto leading-relaxed font-medium">
                  Point your device camera at the physical QR sticker pasted on the washer to verify your arrival within the 5-minute grace window.
                </p>
              </div>

              <button
                onClick={handleGeneralScanRequest}
                className="w-full py-4 rounded-full bg-black hover:bg-slate-900 text-white font-bold text-sm shadow-xl shadow-black/10 transition-all flex items-center justify-center gap-2 active:scale-95"
              >
                <QrCode className="h-4 w-4" />
                <span>Launch Camera Scanner</span>
              </button>
            </div>

            {/* Admin Debug Testing Only */}
            {isAdmin && (
              <div className="p-6 rounded-[32px] bg-white border border-slate-200/90 space-y-3.5 shadow-md">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 font-mono">
                    Staff Simulation & Instant Testing
                  </h3>
                  <span className="text-[10px] text-blue-600 font-bold bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                    1-Tap Testing
                  </span>
                </div>
                <div className="space-y-2">
                  {machines.map((m) => (
                    <button
                      key={m.id}
                      onClick={() => {
                        setScannerState({ isOpen: true, targetSlot: null });
                      }}
                      className="w-full p-4 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-left text-xs flex items-center justify-between transition-colors active:scale-98"
                    >
                      <div>
                        <p className="font-bold text-sm text-slate-900">{m.name}</p>
                        <p className="text-[11px] text-slate-500 mt-0.5">{m.location}</p>
                      </div>
                      <span className="text-[10px] font-bold px-3 py-1 rounded-full bg-black text-white shadow-sm">
                        Test #{m.id}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'report' && (
          <MisuseReportingView
            machines={machines}
            onReportSuccess={handleReportSuccess}
            onBookFreedMachine={handleBookFreedMachine}
            onOpenQRScanner={handleGeneralScanRequest}
          />
        )}

        {activeTab === 'admin' && isAdmin && (
          <AdminPortalView
            machines={machines}
            onRefreshMachines={fetchData}
            onViewSticker={handleOpenSticker}
          />
        )}

        {activeTab === 'account' && (
          <AccountStandingView
            onOpenAuth={() => setIsAuthModalOpen(true)}
            onNavigateToAdmin={() => setActiveTab('admin')}
            onNavigateToReport={() => setActiveTab('report')}
          />
        )}
      </main>

      {/* Modals */}
      <BookingModal
        isOpen={!!selectedMachineForBooking}
        onClose={() => setSelectedMachineForBooking(null)}
        machine={selectedMachineForBooking}
        onBookingSuccess={handleBookingSuccess}
        onOpenScannerForSlot={handleOpenScannerForSlot}
      />

      <PrintableStickerModal
        isOpen={!!selectedMachineForSticker}
        onClose={() => setSelectedMachineForSticker(null)}
        machine={selectedMachineForSticker}
      />

      <MisuseReportModal
        isOpen={!!selectedMachineForMisuse}
        onClose={() => setSelectedMachineForMisuse(null)}
        machines={machines}
        initialMachineId={selectedMachineForMisuse?.id}
        onReportSubmitted={handleReportSuccess}
        onBookFreedMachine={handleBookFreedMachine}
      />

      <QRScannerModal
        isOpen={scannerState.isOpen}
        onClose={() => setScannerState({ isOpen: false, targetSlot: null })}
        targetSlot={scannerState.targetSlot}
        machines={machines}
        onScanSuccess={handleScanSuccess}
        onReportRequest={(_token) => {
          setScannerState({ isOpen: false, targetSlot: null });
          setActiveTab('report');
        }}
      />

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />

    </div>
  );
}

export function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <MainAppContent />
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;
