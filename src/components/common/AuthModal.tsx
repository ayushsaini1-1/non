import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  ShieldCheck,
  Sparkles,
  AlertTriangle,
  Building2,
  CheckCircle2,
  Lock,
  Loader2,
  HelpCircle,
  ExternalLink,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { api } from '../../services/api';

declare global {
  interface Window {
    google?: any;
  }
}

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const GOOGLE_CLIENT_ID = '113222512181-l9msktcrvu5as0ftlt9fm6pimarckdsg.apps.googleusercontent.com';

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const { setSessionToken, isLoading } = useAuth();
  const { showToast } = useToast();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSigningIn, setIsSigningIn] = useState<boolean>(false);
  const [showConfigHelp, setShowConfigHelp] = useState<boolean>(false);
  const gsiContainerRef = useRef<HTMLDivElement>(null);

  const currentRedirectUri = `${window.location.origin}/auth/google/callback`;

  // Listen for popup window message
  useEffect(() => {
    const handleMessage = async (event: MessageEvent) => {
      const origin = event.origin;
      if (!origin.endsWith('.run.app') && !origin.includes('localhost')) {
        return;
      }

      if (event.data?.type === 'GOOGLE_AUTH_SUCCESS' && event.data?.token) {
        setIsSigningIn(true);
        try {
          await setSessionToken(event.data.token);
          const userName = event.data.user?.full_name || 'Resident';
          showToast('success', 'Google Auth Verified', `Signed in as ${userName}`);
          onClose();
        } catch (err: any) {
          setErrorMsg(err.message || 'Failed to initialize session.');
        } finally {
          setIsSigningIn(false);
        }
      } else if (event.data?.type === 'GOOGLE_AUTH_ERROR') {
        setIsSigningIn(false);
        setErrorMsg(event.data.error || 'Google authentication failed.');
        if (String(event.data.error || '').includes('redirect_uri_mismatch')) {
          setShowConfigHelp(true);
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [setSessionToken, showToast, onClose]);

  // Render Google Identity Services (GSI) Button
  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;

    const initGsi = () => {
      if (!isMounted) return;
      if (window.google?.accounts?.id && gsiContainerRef.current) {
        try {
          // Initialize once globally or re-render button without re-initializing if possible
          if (!(window as any)._gsiInitialized) {
            window.google.accounts.id.initialize({
              client_id: GOOGLE_CLIENT_ID,
              callback: async (response: { credential?: string }) => {
                if (response.credential) {
                  setIsSigningIn(true);
                  setErrorMsg(null);
                  try {
                    const res = await api.loginWithGoogleToken({ credential: response.credential });
                    await setSessionToken(res.access_token);
                    showToast('success', 'Google Auth Verified', `Welcome, ${res.user?.full_name || 'Resident'}!`);
                    onClose();
                  } catch (err: any) {
                    setErrorMsg(err.message || 'Google token login failed');
                  } finally {
                    setIsSigningIn(false);
                  }
                }
              },
              auto_select: false,
            });
            (window as any)._gsiInitialized = true;
          }

          if (gsiContainerRef.current) {
            gsiContainerRef.current.innerHTML = '';
            window.google.accounts.id.renderButton(gsiContainerRef.current, {
              theme: 'outline',
              size: 'large',
              width: 320,
              text: 'continue_with',
              shape: 'pill',
            });
          }
        } catch (e) {
          console.warn('GSI Render Warning:', e);
        }
      }
    };

    const timer = setTimeout(initGsi, 300);
    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [isOpen, setSessionToken, showToast, onClose]);

  if (!isOpen) return null;

  const handleGoogleSignInPopup = async () => {
    setErrorMsg(null);
    setIsSigningIn(true);

    try {
      const { url } = await api.getGoogleAuthUrl();
      const popup = window.open(
        url,
        'google_oauth_popup',
        'width=580,height=680,status=no,toolbar=no,menubar=no,location=no'
      );

      if (!popup || popup.closed || typeof popup.closed === 'undefined') {
        setIsSigningIn(false);
        setErrorMsg('Popup blocked by browser. Please allow popups for this site.');
      }
    } catch (err: any) {
      setIsSigningIn(false);
      setErrorMsg(err.message || 'Could not launch Google authentication window.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-fade-in">
      
      {/* Outer Shell */}
      <div className="relative w-full max-w-md bg-white rounded-[32px] shadow-2xl border border-slate-200 overflow-hidden p-8 sm:p-10 space-y-6 animate-scale-up max-h-[90vh] overflow-y-auto">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-900 transition-colors active:scale-95"
          title="Close sign in"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Header Icon & Title */}
        <div className="text-center space-y-3 pt-2">
          <div className="mx-auto h-14 w-14 rounded-2xl bg-black text-white shadow-lg flex items-center justify-center">
            <Sparkles className="h-6 w-6 text-amber-400" />
          </div>

          <div className="space-y-1">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-[10px] font-bold uppercase tracking-wider font-mono">
              <Building2 className="h-3 w-3 text-slate-500" />
              Resident Access Only
            </span>
            <h2 className="text-2xl font-black tracking-tight text-slate-900 font-sans">
              Sign In to DormWash
            </h2>
            <p className="text-xs text-slate-500 max-w-xs mx-auto leading-relaxed">
              Use your authorized Google account to manage washer schedules and active reservations.
            </p>
          </div>
        </div>

        {/* Error Notification */}
        {errorMsg && (
          <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-700 space-y-2">
            <div className="flex items-start gap-2.5">
              <AlertTriangle className="h-4 w-4 text-rose-500 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
            {errorMsg.includes('redirect_uri_mismatch') && (
              <button
                type="button"
                onClick={() => setShowConfigHelp(!showConfigHelp)}
                className="text-[11px] font-bold text-rose-800 underline hover:text-rose-950 flex items-center gap-1"
              >
                <HelpCircle className="h-3.5 w-3.5" />
                <span>Fix "redirect_uri_mismatch" setup instructions</span>
              </button>
            )}
          </div>
        )}

        {/* Google Cloud Console Config Guidance */}
        {showConfigHelp && (
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-2 text-left">
            <div className="font-bold flex items-center gap-1.5 text-amber-950">
              <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
              <span>Required Google Cloud Console Action</span>
            </div>
            <p className="text-[11px] leading-relaxed text-amber-800">
              Google requires this exact URI to be listed in your OAuth 2.0 Client ID settings under <strong>Authorized Redirect URIs</strong>:
            </p>
            <div className="p-2 rounded-lg bg-amber-100/80 font-mono text-[10px] break-all select-all font-bold text-amber-950 border border-amber-300/60">
              {currentRedirectUri}
            </div>
            <p className="text-[10px] text-amber-700">
              And under <strong>Authorized JavaScript origins</strong>:
            </p>
            <div className="p-2 rounded-lg bg-amber-100/80 font-mono text-[10px] break-all select-all font-bold text-amber-950 border border-amber-300/60">
              {window.location.origin}
            </div>
            <a
              href="https://console.cloud.google.com/apis/credentials"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-900 underline pt-1"
            >
              <span>Open Google Cloud Credentials</span>
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        )}

        {/* Google Sign-In Action */}
        <div className="space-y-3 flex flex-col items-center">
          
          {/* Unified GSI / OAuth Popup Button Container */}
          <div ref={gsiContainerRef} className="w-full flex justify-center min-h-[48px]">
            <button
              type="button"
              onClick={handleGoogleSignInPopup}
              disabled={isLoading || isSigningIn}
              className="w-full py-3.5 px-6 rounded-full bg-white hover:bg-slate-50 border-2 border-slate-200 hover:border-slate-400 text-slate-800 font-bold text-sm shadow-md transition-all flex items-center justify-center gap-3.5 active:scale-[0.98] disabled:opacity-50"
            >
              {isSigningIn ? (
                <Loader2 className="h-5 w-5 animate-spin text-blue-600 shrink-0" />
              ) : (
                <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
              )}
              <span>{isSigningIn ? 'Connecting to Google...' : 'Continue with Google'}</span>
            </button>
          </div>

          <div className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2 text-left">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
              <span>Hostel Auth Verified</span>
            </div>
            <ul className="text-[11px] text-slate-500 space-y-1.5 pl-1">
              <li className="flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                <span>Single sign-on via Google Workspace OAuth 2.0</span>
              </li>
              <li className="flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                <span>Automatically syncs your resident account profile</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Footer Security Note */}
        <div className="pt-2 border-t border-slate-100 flex items-center justify-center gap-1.5 text-[11px] font-medium text-slate-400">
          <Lock className="h-3.5 w-3.5 text-slate-400" />
          <span>Encrypted Session • Google Single Sign-On</span>
        </div>

      </div>
    </div>
  );
};

