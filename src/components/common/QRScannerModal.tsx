import React, { useEffect, useState, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import confetti from 'canvas-confetti';
import {
  X,
  Camera,
  AlertCircle,
  RefreshCw,
  QrCode,
  Flashlight,
  SwitchCamera,
  Upload,
  Clock,
  Check,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { Machine, SlotBooking } from '../../types';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

interface QRScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetSlot?: SlotBooking | null;
  machines: Machine[];
  onScanSuccess: (token: string, message: string) => void;
  onReportRequest?: (token: string) => void;
}

export const QRScannerModal: React.FC<QRScannerModalProps> = ({
  isOpen,
  onClose,
  targetSlot,
  machines,
  onScanSuccess,
  onReportRequest,
}) => {
  const { refreshUser } = useAuth();
  const [manualToken, setManualToken] = useState<string>('');
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [torchEnabled, setTorchEnabled] = useState<boolean>(false);
  const [hasTorchSupport, setHasTorchSupport] = useState<boolean>(false);
  const [selectedScanTab, setSelectedScanTab] = useState<'camera' | 'upload'>('camera');
  const [audioFeedback, setAudioFeedback] = useState<boolean>(true);

  const [verificationResult, setVerificationResult] = useState<{
    success: boolean;
    message: string;
    machineName?: string;
  } | null>(null);

  const scannerRef = useRef<Html5Qrcode | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const qrRegionId = 'html5qr-code-region';

  // Target machine if slot provided
  const targetMachine = targetSlot
    ? machines.find((m) => m.id === targetSlot.machine_id)
    : null;

  // Sound feedback
  const playBeep = () => {
    if (!audioFeedback) return;
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, audioCtx.currentTime); // A5 note
      gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.18);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.18);
    } catch {
      // Audio context might be restricted before interaction
    }
  };

  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      setVerificationResult(null);
      setCameraError(null);
      setManualToken('');
      setTorchEnabled(false);
      return;
    }

    if (selectedScanTab === 'camera') {
      startCamera();
    }

    return () => {
      stopCamera();
    };
  }, [isOpen, selectedScanTab, facingMode]);

  const startCamera = async () => {
    setCameraError(null);
    try {
      // 1. Ensure DOM container element exists before initializing scanner
      let attempts = 0;
      while (!document.getElementById(qrRegionId) && attempts < 10) {
        await new Promise((r) => setTimeout(r, 80));
        attempts++;
      }

      const element = document.getElementById(qrRegionId);
      if (!element) {
        throw new Error('Scanner element not mounted in DOM');
      }

      // 2. Stop/clear existing scanner instance safely
      if (scannerRef.current) {
        try {
          if (scannerRef.current.isScanning) {
            await scannerRef.current.stop();
          }
          await scannerRef.current.clear();
        } catch {
          // ignore cleanup errors
        }
        scannerRef.current = null;
      }

      // 3. Create fresh Html5Qrcode instance
      const scanner = new Html5Qrcode(qrRegionId);
      scannerRef.current = scanner;

      const qrboxCalc = (viewfinderWidth: number, viewfinderHeight: number) => {
        const minEdge = Math.min(viewfinderWidth, viewfinderHeight);
        const qrboxSize = Math.floor(minEdge * 0.72);
        return {
          width: qrboxSize,
          height: qrboxSize,
        };
      };

      const qrCallback = (decodedText: string) => {
        playBeep();
        handleTokenSubmitted(decodedText);
      };

      // 4. Attempt starting with facingMode constraint
      try {
        await scanner.start(
          { facingMode: facingMode },
          {
            fps: 15,
            qrbox: qrboxCalc,
            aspectRatio: 1.0,
          },
          qrCallback,
          () => {}
        );
      } catch (modeErr) {
        console.warn('FacingMode camera start failed, attempting getCameras() fallback:', modeErr);
        // Fallback to camera device enumeration
        const devices = await Html5Qrcode.getCameras();
        if (devices && devices.length > 0) {
          const backCam = devices.find((d) => d.label.toLowerCase().includes('back') || d.label.toLowerCase().includes('rear'));
          const selectedCamId = backCam ? backCam.id : devices[0].id;

          await scanner.start(
            selectedCamId,
            {
              fps: 15,
              qrbox: qrboxCalc,
              aspectRatio: 1.0,
            },
            qrCallback,
            () => {}
          );
        } else {
          throw modeErr;
        }
      }

      setIsScanning(true);

      // Check for torch capability
      try {
        const capabilities = scanner.getRunningTrackCapabilities();
        if (capabilities && 'torch' in capabilities) {
          setHasTorchSupport(true);
        }
      } catch {
        setHasTorchSupport(false);
      }
    } catch (err: any) {
      setIsScanning(false);
      console.warn('Camera access error:', err);
      const msg = err?.message || '';
      if (msg.includes('Permission') || msg.includes('NotAllowedError') || msg.includes('denied')) {
        setCameraError('Camera permission was denied. Please allow camera access in your browser or use Photo / Test scan below.');
      } else if (msg.includes('NotFound') || msg.includes('DevicesNotFoundError')) {
        setCameraError('No camera hardware detected on this device. You can upload a photo of the QR sticker or use Quick Test scan.');
      } else {
        setCameraError('Live camera video feed unavailable. You can upload a photo of the QR sticker, enter the token string, or click Quick Test Scan below.');
      }
    }
  };

  const stopCamera = async () => {
    if (scannerRef.current) {
      try {
        if (scannerRef.current.isScanning) {
          await scannerRef.current.stop();
        }
        await scannerRef.current.clear();
      } catch {
        // ignore
      }
      setIsScanning(false);
    }
  };

  const toggleTorch = async () => {
    if (!scannerRef.current || !isScanning) return;
    try {
      const nextState = !torchEnabled;
      await scannerRef.current.applyVideoConstraints({
        advanced: [{ torch: nextState } as any],
      });
      setTorchEnabled(nextState);
    } catch {
      // Torch toggle failed or not supported on this device
    }
  };

  const toggleCameraFacing = () => {
    setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsVerifying(true);
    setVerificationResult(null);

    try {
      if (!scannerRef.current) {
        scannerRef.current = new Html5Qrcode(qrRegionId);
      }
      const decodedText = await scannerRef.current.scanFile(file, true);
      playBeep();
      await handleTokenSubmitted(decodedText);
    } catch (err: any) {
      setVerificationResult({
        success: false,
        message: 'No valid QR code detected in this photo. Please try another angle or use 1-Tap Test.',
      });
      setIsVerifying(false);
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleTokenSubmitted = async (token: string) => {
    const trimmed = token.trim();
    if (!trimmed) return;

    setIsVerifying(true);
    setVerificationResult(null);

    // If targetSlot provided, verify directly with slot
    if (targetSlot) {
      try {
        const res = await api.verifyQR(targetSlot.id, trimmed);
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.55 },
          colors: ['#22c55e', '#3b82f6', '#f59e0b', '#ec4899'],
        });
        setVerificationResult({
          success: true,
          message: res.message || 'QR Code Verified! Slot is now active.',
          machineName: targetMachine?.name,
        });
        await refreshUser();
        onScanSuccess(trimmed, res.message);
      } catch (err: any) {
        setVerificationResult({
          success: false,
          message: err.message || 'Failed to verify QR code for this washer slot.',
        });
      } finally {
        setIsVerifying(false);
      }
    } else {
      // General scan mode: find which machine it belongs to
      const matchedMachine = machines.find((m) => m.qr_code_token === trimmed);
      if (matchedMachine) {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.6 },
        });
        setVerificationResult({
          success: true,
          message: `Identified Washer: ${matchedMachine.name} (${matchedMachine.location})`,
          machineName: matchedMachine.name,
        });
        onScanSuccess(trimmed, `Identified Washer: ${matchedMachine.name}`);
      } else {
        setVerificationResult({
          success: false,
          message: 'Unrecognized QR token. Please scan a valid DormWash machine sticker.',
        });
      }
      setIsVerifying(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-lg bg-white border-t sm:border border-slate-200 rounded-t-[36px] sm:rounded-[36px] p-6 sm:p-8 shadow-2xl space-y-5 max-h-[94vh] overflow-y-auto animate-scale-up">
        
        {/* Top Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-black text-white shadow-md shadow-black/15">
              <Camera className="h-5 w-5" />
            </div>
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 font-mono">
                Hardware Check-in
              </span>
              <h3 className="text-xl font-bold tracking-tight text-slate-900 font-sans">
                {targetSlot ? `Check-in: Slot #${targetSlot.id}` : 'Physical Washer Scanner'}
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2.5 rounded-full bg-slate-100 text-slate-500 hover:text-slate-900 hover:bg-slate-200 transition-colors active:scale-95"
            title="Close scanner"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Mode Selector Tabs (Live Camera vs Photo Scan) */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-full border border-slate-200/80">
          <button
            onClick={() => setSelectedScanTab('camera')}
            className={`flex-1 py-2 px-3 rounded-full text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              selectedScanTab === 'camera'
                ? 'bg-black text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Camera className="h-3.5 w-3.5" />
            <span>Live Camera</span>
          </button>

          <button
            onClick={() => setSelectedScanTab('upload')}
            className={`flex-1 py-2 px-3 rounded-full text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              selectedScanTab === 'upload'
                ? 'bg-black text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Upload className="h-3.5 w-3.5" />
            <span>Photo Scan</span>
          </button>
        </div>

        {/* Target Slot Details Banner */}
        {targetSlot && targetMachine && !verificationResult?.success && (
          <div className="p-4 rounded-3xl bg-slate-50 border border-slate-200 text-xs space-y-2">
            <div className="flex items-center justify-between text-slate-900 font-bold">
              <span className="font-sans text-sm flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
                Required Machine: {targetMachine.name}
              </span>
              <span className="font-mono text-xs px-2.5 py-0.5 rounded-full bg-white border border-slate-200 text-slate-700 font-bold">
                ID #{targetMachine.id}
              </span>
            </div>
            <p className="text-slate-500 font-medium">Location: {targetMachine.location}</p>
            <div className="flex items-center gap-1.5 text-blue-700 font-bold bg-blue-50/80 p-2.5 rounded-2xl border border-blue-100">
              <Clock className="h-4 w-4 text-blue-600 shrink-0" />
              <span>Arrival Grace Rule: Scan the physical QR sticker on the washer before 5 minutes expire.</span>
            </div>
          </div>
        )}

        {/* Verification Result Banner */}
        {verificationResult && (
          <div
            className={`p-5 rounded-3xl border text-sm flex items-start gap-3.5 animate-scale-up ${
              verificationResult.success
                ? 'bg-emerald-50/90 border-emerald-200 text-emerald-950'
                : 'bg-rose-50/90 border-rose-200 text-rose-950'
            }`}
          >
            {verificationResult.success ? (
              <div className="p-2 rounded-2xl bg-emerald-600 text-white shrink-0 mt-0.5 shadow-md">
                <Check className="h-5 w-5 stroke-[3]" />
              </div>
            ) : (
              <div className="p-2 rounded-2xl bg-rose-600 text-white shrink-0 mt-0.5 shadow-md">
                <AlertCircle className="h-5 w-5" />
              </div>
            )}
            <div className="space-y-1 flex-1">
              <p className="font-bold text-base text-slate-900">
                {verificationResult.success ? 'Arrival Verified & Activated!' : 'Verification Issue'}
              </p>
              <p className="text-xs font-medium text-slate-600 leading-relaxed">
                {verificationResult.message}
              </p>
              {verificationResult.success && (
                <div className="pt-2 flex items-center gap-2">
                  <button
                    onClick={onClose}
                    className="px-5 py-2.5 rounded-full bg-black hover:bg-slate-900 text-white font-bold text-xs transition-all shadow-md shadow-black/15 active:scale-95"
                  >
                    Done & View Slot
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Live Camera Viewport Area */}
        {selectedScanTab === 'camera' && (
          <div className="space-y-3 animate-fade-in">
            <div className="relative w-full h-72 sm:h-80 rounded-[32px] overflow-hidden bg-slate-950 border-2 border-slate-900 flex flex-col items-center justify-center shadow-2xl text-white">
              
              {/* html5-qrcode video viewport container */}
              <div id={qrRegionId} className="w-full h-full object-cover" />

              {/* Viewfinder Overlay & Framing Grid */}
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center p-6">
                
                {/* Center Target Reticle Box */}
                <div className="relative w-52 h-52 sm:w-56 sm:h-56 rounded-3xl border-2 border-white/40 shadow-[0_0_0_9999px_rgba(0,0,0,0.55)] flex items-center justify-center overflow-hidden">
                  
                  {/* Laser Scan Line Animation */}
                  <div className="absolute inset-x-2 h-0.5 bg-gradient-to-r from-emerald-400 via-white to-emerald-400 shadow-[0_0_12px_#34d399] animate-scan-laser" />

                  {/* Corner Targets */}
                  <div className="absolute top-2 left-2 w-4 h-4 border-t-4 border-l-4 border-white rounded-tl-lg" />
                  <div className="absolute top-2 right-2 w-4 h-4 border-t-4 border-r-4 border-white rounded-tr-lg" />
                  <div className="absolute bottom-2 left-2 w-4 h-4 border-b-4 border-l-4 border-white rounded-bl-lg" />
                  <div className="absolute bottom-2 right-2 w-4 h-4 border-b-4 border-r-4 border-white rounded-br-lg" />

                  {/* Center Dot Indicator */}
                  <div className="h-2 w-2 rounded-full bg-emerald-400/80 animate-ping" />
                </div>
              </div>

              {/* Top Controls Overlay on Video */}
              <div className="absolute top-4 inset-x-4 flex items-center justify-between z-20 pointer-events-auto">
                <div className="px-3 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-white text-[11px] font-bold flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Align Sticker in Center</span>
                </div>

                <div className="flex items-center gap-2">
                  {hasTorchSupport && (
                    <button
                      onClick={toggleTorch}
                      className={`p-2.5 rounded-full backdrop-blur-md border transition-all active:scale-95 ${
                        torchEnabled
                          ? 'bg-amber-400 text-slate-900 border-amber-300 shadow-lg'
                          : 'bg-black/60 text-white border-white/20 hover:bg-black/80'
                      }`}
                      title="Toggle Flashlight"
                    >
                      <Flashlight className="h-4 w-4" />
                    </button>
                  )}

                  <button
                    onClick={toggleCameraFacing}
                    className="p-2.5 rounded-full bg-black/60 hover:bg-black/80 backdrop-blur-md border border-white/20 text-white transition-all active:scale-95"
                    title="Flip Camera Direction"
                  >
                    <SwitchCamera className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Camera Error Fallback Message */}
              {cameraError && (
                <div className="absolute inset-0 bg-slate-900/95 backdrop-blur-md p-6 flex flex-col items-center justify-center text-center space-y-3 z-30">
                  <div className="p-3.5 rounded-full bg-white/10 border border-white/20 text-white">
                    <QrCode className="h-8 w-8 text-slate-300" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-bold text-white font-sans">Camera Feed Unavailable</p>
                    <p className="text-xs text-slate-300 max-w-xs leading-relaxed">{cameraError}</p>
                  </div>
                  <button
                    onClick={() => setSelectedScanTab('upload')}
                    className="px-5 py-2.5 rounded-full bg-white hover:bg-slate-100 text-slate-900 text-xs font-bold shadow-lg transition-all active:scale-95 flex items-center gap-2"
                  >
                    <Upload className="h-3.5 w-3.5 text-blue-600" />
                    <span>Switch to Photo Scan</span>
                  </button>
                </div>
              )}
            </div>

            {/* Sub-bar with sound feedback toggle & restart */}
            <div className="flex items-center justify-between text-xs text-slate-500 px-1">
              <button
                onClick={() => setAudioFeedback(!audioFeedback)}
                className={`font-semibold flex items-center gap-1.5 transition-colors ${
                  audioFeedback ? 'text-slate-900' : 'text-slate-400'
                }`}
              >
                {audioFeedback ? (
                  <Volume2 className="h-3.5 w-3.5 text-slate-900" />
                ) : (
                  <VolumeX className="h-3.5 w-3.5 text-slate-400" />
                )}
                <span>Sound Feedback: {audioFeedback ? 'On' : 'Muted'}</span>
              </button>

              <button
                onClick={startCamera}
                className="hover:text-slate-900 font-semibold flex items-center gap-1 transition-colors"
              >
                <RefreshCw className="h-3 w-3" />
                <span>Restart Lens</span>
              </button>
            </div>
          </div>
        )}

        {/* Photo Upload Mode */}
        {selectedScanTab === 'upload' && (
          <div className="space-y-3 animate-fade-in">
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-300 hover:border-slate-400 bg-slate-50 hover:bg-slate-100/80 rounded-[32px] p-8 text-center cursor-pointer transition-all flex flex-col items-center justify-center space-y-3 group"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
              <div className="p-4 rounded-3xl bg-white border border-slate-200 text-slate-700 shadow-sm group-hover:scale-105 transition-transform">
                <Upload className="h-8 w-8 text-blue-600" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-bold text-slate-900">Upload Laundry Sticker Image</p>
                <p className="text-xs text-slate-500 max-w-xs mx-auto">
                  Take a photo of the QR sticker on the washer or pick one from your device gallery.
                </p>
              </div>
              <button
                type="button"
                className="px-5 py-2 rounded-full bg-black text-white text-xs font-bold shadow-sm"
              >
                Choose Photo
              </button>
            </div>
          </div>
        )}

        {/* Manual Token Input */}
        <div className="space-y-2 pt-2 border-t border-slate-100">
          <div className="flex items-center justify-between">
            <label className="text-xs font-extrabold uppercase tracking-wider text-slate-500 font-mono">
              Or Paste QR Token String:
            </label>
            <button
              type="button"
              onClick={() => {
                const tokenToFill = targetMachine?.qr_code_token || machines[0]?.qr_code_token || '';
                setManualToken(tokenToFill);
                if (tokenToFill) handleTokenSubmitted(tokenToFill);
              }}
              className="text-[11px] font-bold text-blue-600 hover:text-blue-800 underline transition-colors"
            >
              1-Tap Test Scan ({targetMachine ? targetMachine.name : 'Machine 1'})
            </button>
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="e.g. WM_QR_MACHINE_1_..."
              value={manualToken}
              onChange={(e) => setManualToken(e.target.value)}
              className="flex-1 px-4 py-2.5 rounded-full bg-slate-50 border border-slate-200 text-xs font-mono text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-black/10"
            />
            <button
              onClick={() => handleTokenSubmitted(manualToken)}
              disabled={!manualToken.trim() || isVerifying}
              className="px-5 py-2.5 rounded-full bg-black hover:bg-slate-900 disabled:opacity-50 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-md shadow-black/10 active:scale-95 shrink-0"
            >
              {isVerifying && <RefreshCw className="h-3.5 w-3.5 animate-spin" />}
              <span>Verify</span>
            </button>
          </div>
        </div>

        {/* Bystander Action shortcut if not bound to a slot */}
        {!targetSlot && onReportRequest && (
          <div className="pt-2 border-t border-slate-100 text-center">
            <button
              onClick={() => {
                onClose();
                onReportRequest(manualToken || machines[0]?.qr_code_token || '');
              }}
              className="text-xs text-slate-500 hover:text-blue-600 font-bold transition-colors"
            >
              Found an abandoned washer? Switch to Bystander Misuse Report
            </button>
          </div>
        )}

      </div>
    </div>
  );
};
