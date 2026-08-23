import React, { useState, useMemo } from 'react';
import {
  Search,
  SlidersHorizontal,
  AlertCircle,
  RefreshCw,
  Zap,
} from 'lucide-react';
import { Machine, SlotBooking } from '../../types';
import { MachineCard } from '../common/MachineCard';

interface MachineGridViewProps {
  machines: Machine[];
  slots: SlotBooking[];
  isLoading: boolean;
  onRefresh: () => void;
  onBookMachine: (machine: Machine) => void;
  onViewSticker: (machine: Machine) => void;
  onReportMisuse: (machine: Machine) => void;
  onScanForSlot?: (slot: SlotBooking) => void;
  onExploreRadar: (machine: Machine) => void;
}

// Generate the next 7 days for the horizontal date selector (Matching Screen 3)
const generateDates = () => {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const list = [];
  const now = new Date();
  for (let i = 0; i < 7; i++) {
    const d = new Date(now.getTime() + i * 24 * 60 * 60 * 1000);
    list.push({
      dateObj: d,
      dayName: days[d.getDay()],
      dayNumber: d.getDate(),
      isToday: i === 0,
      iso: d.toISOString().split('T')[0],
    });
  }
  return list;
};

export const MachineGridView: React.FC<MachineGridViewProps> = ({
  machines,
  slots,
  isLoading,
  onRefresh,
  onBookMachine,
  onViewSticker,
  onReportMisuse,
  onScanForSlot,
  onExploreRadar,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLocation, setSelectedLocation] = useState<string>('all');
  const [filterAvailableOnly, setFilterAvailableOnly] = useState<boolean>(false);
  const [showFilters, setShowFilters] = useState<boolean>(false);

  const datesList = useMemo(() => generateDates(), []);
  const [selectedDateIso, setSelectedDateIso] = useState<string>(datesList[0]?.iso || '');

  // Extract unique locations
  const locations = useMemo(() => {
    const locs = Array.from(new Set(machines.map((m) => m.location)));
    return ['all', ...locs];
  }, [machines]);

  // Filter machines
  const filteredMachines = useMemo(() => {
    return machines.filter((machine) => {
      const matchSearch =
        machine.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        machine.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
        machine.id.toString().includes(searchQuery);

      const matchLocation =
        selectedLocation === 'all' || machine.location.toLowerCase().includes(selectedLocation.toLowerCase());

      const matchAvailable = filterAvailableOnly
        ? machine.status === 'AVAILABLE'
        : true;

      return matchSearch && matchLocation && matchAvailable;
    });
  }, [machines, searchQuery, selectedLocation, filterAvailableOnly]);

  const availableCount = machines.filter((m) => m.status === 'AVAILABLE').length;

  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-fade-in pb-16">
      
      {/* Search Bar & Filter Button (Screen 3 Top Search Bar 1:1) */}
      <div className="flex items-center gap-2.5">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search washers, dorm rooms, blocks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-3.5 rounded-full bg-white border border-slate-200/90 text-xs font-semibold text-slate-900 placeholder:text-slate-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-slate-400 transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 hover:text-slate-700"
            >
              Clear
            </button>
          )}
        </div>

        {/* Filter Sliders Button (Screen 3 Right Filter Button) */}
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`p-3.5 rounded-full border transition-all shadow-sm active:scale-95 flex items-center justify-center ${
            showFilters || filterAvailableOnly || selectedLocation !== 'all'
              ? 'bg-black text-white border-black'
              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
          }`}
          title="Toggle Filters"
        >
          <SlidersHorizontal className="h-4 w-4" />
        </button>

        {/* Refresh button */}
        <button
          onClick={onRefresh}
          className="p-3.5 rounded-full bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 shadow-sm transition-all active:scale-95"
          title="Refresh Machine Status"
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Horizontal Date Selector Bar (Screen 3 1:1 Date Carousel) */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <span className="text-xs font-extrabold uppercase tracking-wider text-slate-500 font-mono">
            Reservation Schedule
          </span>
          <span className="text-xs font-bold text-slate-700 flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            {availableCount} Available Now
          </span>
        </div>

        {/* Day Pills Carousel */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar scroll-smooth">
          {datesList.map((item) => {
            const isSelected = selectedDateIso === item.iso;
            return (
              <button
                key={item.iso}
                onClick={() => setSelectedDateIso(item.iso)}
                className={`min-w-[62px] sm:min-w-[72px] py-3.5 px-3 rounded-2xl sm:rounded-3xl flex flex-col items-center justify-center transition-all duration-200 shadow-sm cursor-pointer ${
                  isSelected
                    ? 'bg-black text-white shadow-lg shadow-black/15 scale-105'
                    : 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-200/80 hover:border-slate-300'
                }`}
              >
                <span
                  className={`text-[11px] font-semibold uppercase tracking-wider ${
                    isSelected ? 'text-slate-300' : 'text-slate-400'
                  }`}
                >
                  {item.dayName}
                </span>
                <span className="text-base sm:text-lg font-extrabold font-mono mt-0.5">
                  {item.dayNumber}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Collapsible Filter Bar */}
      {showFilters && (
        <div className="p-4 rounded-3xl bg-white border border-slate-200/90 shadow-md space-y-3 animate-scale-up">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Filter by Location & Status
            </span>
            <button
              onClick={() => {
                setSelectedLocation('all');
                setFilterAvailableOnly(false);
              }}
              className="text-xs font-bold text-blue-600 hover:underline"
            >
              Reset Filters
            </button>
          </div>

          <div className="flex flex-wrap gap-2">
            {locations.map((loc) => (
              <button
                key={loc}
                onClick={() => setSelectedLocation(loc)}
                className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${
                  selectedLocation === loc
                    ? 'bg-black text-white shadow-sm'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                {loc === 'all' ? 'All Campus Blocks' : loc}
              </button>
            ))}

            <button
              onClick={() => setFilterAvailableOnly(!filterAvailableOnly)}
              className={`px-4 py-2 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 ${
                filterAvailableOnly
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              <Zap className="h-3.5 w-3.5" />
              <span>Available Washers Only</span>
            </button>
          </div>
        </div>
      )}

      {/* Machine Discovery Cards Grid (Screen 3 format) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredMachines.map((machine) => {
          const activeSlot = slots.find(
            (s) =>
              s.machine_id === machine.id &&
              (s.status === 'BOOKED' || s.status === 'CHECKED_IN')
          );

          return (
            <MachineCard
              key={machine.id}
              machine={machine}
              activeSlot={activeSlot}
              onBookClick={onBookMachine}
              onViewStickerClick={onViewSticker}
              onReportMisuseClick={onReportMisuse}
              onScanForSlotClick={onScanForSlot}
              onExploreRadarClick={onExploreRadar}
            />
          );
        })}
      </div>

      {filteredMachines.length === 0 && (
        <div className="p-12 text-center bg-white border border-slate-200 rounded-[32px] space-y-3">
          <AlertCircle className="h-10 w-10 text-slate-400 mx-auto" />
          <h3 className="text-base font-bold text-slate-900">No Washing Machines Found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Try adjusting your search query or reset your location filter.
          </p>
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedLocation('all');
              setFilterAvailableOnly(false);
            }}
            className="px-5 py-2.5 rounded-full bg-black text-white text-xs font-bold"
          >
            Clear All Filters
          </button>
        </div>
      )}

    </div>
  );
};
