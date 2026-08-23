import React, { useState, useEffect } from 'react';
import {
  Shield,
  PlusCircle,
  Printer,
  RefreshCw,
  MapPin,
} from 'lucide-react';
import { Machine, MisuseReport } from '../../types';
import { api } from '../../services/api';

interface AdminPortalViewProps {
  machines: Machine[];
  onRefreshMachines: () => void;
  onViewSticker: (machine: Machine) => void;
}

export const AdminPortalView: React.FC<AdminPortalViewProps> = ({
  machines,
  onRefreshMachines,
  onViewSticker,
}) => {
  const [reports, setReports] = useState<MisuseReport[]>([]);
  const [isLoadingReports, setIsLoadingReports] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'fleet' | 'reports'>('fleet');

  // Add machine form state
  const [isAddingMachine, setIsAddingMachine] = useState<boolean>(false);
  const [newMachineName, setNewMachineName] = useState<string>('');
  const [newMachineLocation, setNewMachineLocation] = useState<string>('');
  const [isSubmittingMachine, setIsSubmittingMachine] = useState<boolean>(false);
  const [formFeedback, setFormFeedback] = useState<{ message: string; isError?: boolean } | null>(null);

  const fetchReports = async () => {
    setIsLoadingReports(true);
    try {
      const data = await api.getReports();
      setReports(data);
    } catch {
      // ignore
    } finally {
      setIsLoadingReports(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const handleCreateMachine = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMachineName.trim() || !newMachineLocation.trim()) {
      setFormFeedback({ message: 'Please provide both a machine name and location.', isError: true });
      return;
    }

    setIsSubmittingMachine(true);
    setFormFeedback(null);

    try {
      const created = await api.createMachine({
        name: newMachineName.trim(),
        location: newMachineLocation.trim(),
      });
      setFormFeedback({
        message: `Registered ${created.name} (ID #${created.id}) with QR token generated!`,
      });
      setNewMachineName('');
      setNewMachineLocation('');
      setIsAddingMachine(false);
      onRefreshMachines();
    } catch (err: any) {
      setFormFeedback({ message: err.message || 'Failed to create machine', isError: true });
    } finally {
      setIsSubmittingMachine(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Admin Banner */}
      <div className="rounded-3xl bg-white border border-slate-200 p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5">
          <div className="flex items-center gap-3.5">
            <div className="p-3.5 rounded-2xl bg-blue-600 text-white shadow-md shadow-blue-500/25">
              <Shield className="h-7 w-7 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-xs font-bold uppercase tracking-wider">
                  Facility Staff
                </span>
                <span className="text-slate-400 text-xs">•</span>
                <span className="text-slate-500 text-xs font-medium">Operations Center</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold font-bebas tracking-wide text-slate-900 uppercase mt-1">
                Laundry Facility Administration
              </h1>
            </div>
          </div>

          {/* Tab buttons */}
          <div className="flex items-center gap-1.5 p-1 rounded-full bg-slate-100 border border-slate-200 shadow-inner">
            <button
              onClick={() => setActiveTab('fleet')}
              className={`px-4 py-2 rounded-full text-xs font-bold tracking-wide transition-all micro-scale ${
                activeTab === 'fleet'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20 font-bold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white'
              }`}
            >
              Fleet & QR Placards ({machines.length})
            </button>
            <button
              onClick={() => {
                setActiveTab('reports');
                fetchReports();
              }}
              className={`px-4 py-2 rounded-full text-xs font-bold tracking-wide transition-all micro-scale ${
                activeTab === 'reports'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20 font-bold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white'
              }`}
            >
              Incident Log ({reports.length})
            </button>
          </div>
        </div>
      </div>

      {/* Feedback Alert */}
      {formFeedback && (
        <div
          className={`p-4 rounded-2xl border text-xs font-semibold flex items-center justify-between shadow-sm ${
            formFeedback.isError
              ? 'bg-rose-50 border-rose-200 text-rose-700'
              : 'bg-blue-50 border-blue-200 text-blue-700'
          }`}
        >
          <span>{formFeedback.message}</span>
          <button onClick={() => setFormFeedback(null)} className="underline font-bold">
            Dismiss
          </button>
        </div>
      )}

      {/* TAB 1: FLEET & QR STICKERS */}
      {activeTab === 'fleet' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold font-bebas tracking-wide text-slate-900 uppercase">
                Registered Washing Machine Fleet
              </h2>
              <p className="text-xs text-slate-600">
                Print physical QR code stickers and manage hardware locations.
              </p>
            </div>
            <button
              onClick={() => setIsAddingMachine(!isAddingMachine)}
              className="px-5 py-2.5 rounded-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-500/20 transition-all flex items-center gap-1.5 micro-scale"
            >
              <PlusCircle className="h-4 w-4 text-white" />
              <span>{isAddingMachine ? 'Close Form' : 'Register New Machine'}</span>
            </button>
          </div>

          {/* Add Machine Form Drawer */}
          {isAddingMachine && (
            <form
              onSubmit={handleCreateMachine}
              className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 space-y-4 animate-scale-up shadow-lg"
            >
              <h3 className="text-lg font-bold font-bebas tracking-wide text-slate-900 uppercase">
                Register New Washing Machine
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold uppercase tracking-widest text-slate-500">Machine Model / Label:</label>
                  <input
                    type="text"
                    value={newMachineName}
                    onChange={(e) => setNewMachineName(e.target.value)}
                    placeholder="e.g. EcoWash Pro #4"
                    className="w-full mt-1.5 px-4 py-2.5 rounded-full bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-widest text-slate-500">Hostel Location / Room:</label>
                  <input
                    type="text"
                    value={newMachineLocation}
                    onChange={(e) => setNewMachineLocation(e.target.value)}
                    placeholder="e.g. Block B - 1st Floor Room 104"
                    className="w-full mt-1.5 px-4 py-2.5 rounded-full bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    required
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddingMachine(false)}
                  className="px-4 py-2 rounded-full bg-slate-50 hover:bg-slate-100 text-slate-600 text-xs font-bold transition-colors micro-scale"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingMachine}
                  className="px-5 py-2.5 rounded-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold shadow-md shadow-blue-500/20 micro-scale transition-all"
                >
                  {isSubmittingMachine ? 'Generating...' : 'Save & Generate QR Code'}
                </button>
              </div>
            </form>
          )}

          {/* Machine Placard Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {machines.map((m) => (
              <div
                key={m.id}
                className="rounded-3xl border border-slate-200 bg-white p-6 space-y-4 flex flex-col justify-between shadow-sm hover:shadow-md transition-all"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="px-3 py-1 rounded-full bg-slate-100 border border-slate-200 font-bebas text-sm font-bold text-slate-900">
                      #{m.id.toString().padStart(2, '0')}
                    </span>
                    <span
                      className={`text-xs px-3 py-1 rounded-full font-bold uppercase tracking-wider ${
                        m.status === 'AVAILABLE'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : m.status === 'MAINTENANCE'
                          ? 'bg-rose-50 text-rose-700 border border-rose-200'
                          : 'bg-amber-50 text-amber-800 border border-amber-200'
                      }`}
                    >
                      {m.status === 'MAINTENANCE' ? 'BROKEN' : m.status}
                    </span>
                  </div>

                  <h3 className="text-base font-bold font-bebas tracking-wide text-slate-900 uppercase mt-3">
                    {m.name}
                  </h3>
                  <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-1 font-medium">
                    <MapPin className="h-3.5 w-3.5 text-blue-600" />
                    <span>{m.location}</span>
                  </p>

                  <div className="mt-3 p-3 rounded-2xl bg-slate-50 border border-slate-200 font-mono text-[10px] text-slate-600 truncate">
                    Token: {m.qr_code_token}
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100">
                  <button
                    onClick={() => onViewSticker(m)}
                    className="w-full py-2.5 px-4 rounded-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-500/20 transition-colors flex items-center justify-center gap-2 micro-scale"
                  >
                    <Printer className="h-3.5 w-3.5" />
                    <span>Print QR Code Sticker</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: MISUSE INCIDENT LOG */}
      {activeTab === 'reports' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold font-bebas tracking-wide text-slate-900 uppercase">
                Misuse Reports Audit Trail
              </h2>
              <p className="text-xs text-slate-600">
                Log of bystander scans, grace timeout expiries, and liberated machines.
              </p>
            </div>
            <button
              onClick={fetchReports}
              className="px-4 py-2 rounded-full bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm micro-scale"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isLoadingReports ? 'animate-spin text-blue-600' : ''}`} />
              <span>Refresh Log</span>
            </button>
          </div>

          {reports.length === 0 ? (
            <div className="rounded-3xl border border-slate-200 bg-white p-12 text-center space-y-3 shadow-sm">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-blue-600 inline-block mx-auto">
                <Shield className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-base font-bold font-bebas tracking-wide text-slate-900 uppercase">
                Zero Misuse Incidents Reported
              </h3>
              <p className="text-xs text-slate-600 max-w-sm mx-auto leading-relaxed">
                All residents have checked in on time via physical QR codes. The hostel laundry system is running smoothly.
              </p>
            </div>
          ) : (
            <div className="rounded-3xl border border-slate-200 bg-white overflow-hidden divide-y divide-slate-100 shadow-sm">
              {reports.map((report) => (
                <div
                  key={report.id}
                  className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs hover:bg-slate-50 transition-colors"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full bg-slate-100 border border-slate-200 font-bebas text-xs font-bold text-slate-900">
                        Incident #{report.id}
                      </span>
                      <span className="text-slate-400 font-mono text-[11px]">
                        {new Date(report.created_at).toLocaleString()}
                      </span>
                    </div>

                    <p className="text-slate-900 font-semibold pt-1">
                      Reason: <span className="font-normal text-slate-700">{report.reason}</span>
                    </p>

                    <div className="p-2.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 text-[11px] leading-relaxed font-gentium mt-1">
                      {report.action_taken}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <span className="px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-700 font-mono text-[11px]">
                      Reporter #{report.reporter_id}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

    </div>
  );
};
