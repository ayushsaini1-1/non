import React from 'react';
import { X, Printer, Download, QrCode, ShieldCheck } from 'lucide-react';
import { Machine } from '../../types';
import { api } from '../../services/api';

interface PrintableStickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  machine: Machine | null;
}

export const PrintableStickerModal: React.FC<PrintableStickerModalProps> = ({
  isOpen,
  onClose,
  machine,
}) => {
  if (!isOpen || !machine) return null;

  const qrImageUrl = api.getMachineQRImageUrl(machine.id);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-5 max-h-[92vh] overflow-y-auto animate-scale-up">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-blue-600 text-white shadow-md shadow-blue-500/20">
              <QrCode className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-xl font-bold font-bebas tracking-wide text-slate-900 uppercase">Physical Machine Sticker</h3>
              <p className="text-xs text-slate-500 font-medium">
                Official QR placard for physical hardware placement
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full bg-slate-50 text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-colors micro-scale"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Printable Physical Card Layout */}
        <div
          id="printable-sticker-card"
          className="bg-white text-slate-900 p-6 rounded-3xl border-2 border-blue-600 shadow-sm space-y-4 text-center font-sans print:m-0 print:border-2"
        >
          {/* Badge */}
          <div className="flex items-center justify-between border-b-2 border-blue-600 pb-2.5">
            <div className="flex items-center gap-1.5 text-left">
              <span className="font-bebas text-base font-bold tracking-wide uppercase text-blue-900">
                DormWash • Verified Washer
              </span>
            </div>
            <span className="px-3 py-0.5 rounded-full bg-slate-900 text-white text-xs font-bebas font-bold">
              #{machine.id.toString().padStart(2, '0')}
            </span>
          </div>

          {/* Machine Name & Room */}
          <div>
            <h2 className="text-2xl font-bold font-bebas tracking-wide text-slate-900 uppercase">
              {machine.name}
            </h2>
            <p className="text-xs font-semibold text-slate-500 mt-0.5">
              {machine.location}
            </p>
          </div>

          {/* QR Code Image from backend */}
          <div className="flex justify-center p-4 bg-slate-50 border border-slate-200 rounded-2xl">
            <img
              src={qrImageUrl}
              alt={`QR Code for ${machine.name}`}
              className="w-48 h-48 object-contain rounded-xl"
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
          </div>

          {/* Instructions */}
          <div className="text-left bg-blue-50/80 p-4 rounded-2xl border border-blue-100 space-y-1 text-xs leading-relaxed text-slate-700">
            <p className="font-bold text-blue-900 mb-1 flex items-center gap-1.5 font-bebas text-sm uppercase tracking-wide">
              <ShieldCheck className="h-4 w-4 text-blue-600 inline" />
              Resident Instructions:
            </p>
            <p>1. Book this washer in the DormWash web app.</p>
            <p>2. Scan this QR code sticker within <strong>5 minutes</strong> of start time.</p>
            <p>3. If unattended past 5 mins, the slot is freed for others.</p>
          </div>

          {/* Token String */}
          <p className="text-[9px] font-mono text-slate-400 break-all pt-1">
            Token: {machine.qr_code_token}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2.5 pt-1">
          <button
            type="button"
            onClick={handlePrint}
            className="flex-1 py-3 rounded-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-500/20 transition-all flex items-center justify-center gap-2 micro-scale"
          >
            <Printer className="h-4 w-4" />
            <span>Print Physical Sticker</span>
          </button>

          <a
            href={qrImageUrl}
            download={`Washer_${machine.id}_QR.png`}
            target="_blank"
            rel="noreferrer"
            className="px-5 py-3 rounded-full bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold transition-colors flex items-center justify-center gap-2 micro-scale"
          >
            <Download className="h-4 w-4" />
            <span>Save PNG</span>
          </a>
        </div>

      </div>
    </div>
  );
};
