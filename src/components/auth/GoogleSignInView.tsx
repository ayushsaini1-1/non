import React from 'react';

interface GoogleSignInViewProps {
  onSignIn: () => void;
}

export const GoogleSignInView: React.FC<GoogleSignInViewProps> = ({ onSignIn }) => {
  return (
    <div className="min-h-screen bg-[#141414] text-white flex flex-col items-center justify-center p-4 sm:p-6">
      {/* Outer Mobile Frame Container matching sketch Screen 1 */}
      <div className="w-full max-w-sm rounded-[3rem] border-2 border-zinc-700 bg-[#141414] p-8 min-h-[580px] flex flex-col items-center justify-center shadow-2xl relative">
        {/* Single Centered Google Sign-In Button matching exact sketch */}
        <button
          onClick={onSignIn}
          className="w-full py-4 px-6 rounded-2xl bg-zinc-900 border-2 border-zinc-600 hover:border-white text-white font-medium text-base shadow-xl flex items-center justify-center gap-3 transition-all active:scale-95 group"
        >
          <span className="font-mono text-zinc-100 text-base">
            Sign in with google
          </span>
        </button>
      </div>
    </div>
  );
};
