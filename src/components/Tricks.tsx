import React, { useState, useEffect } from 'react';
import { AlertTriangle, Lock, Shield, Terminal, X, Skull } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { GlitchText } from './TorLoading';

export const RansomwarePopup: React.FC<{ onClose: () => void; educationMode?: boolean }> = ({ onClose, educationMode }) => {
  const [countdown, setCountdown] = useState(72 * 3600); // 72 hours in seconds

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(prev => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <motion.div 
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.8, opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-red-900/20 backdrop-blur-md"
    >
      <div className="bg-[#0a0a0a] border-4 border-[#8b0000] w-full max-w-2xl overflow-hidden shadow-[0_0_50px_rgba(139,0,0,0.5)]">
        <div className="bg-[#8b0000] p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Skull className="text-white w-8 h-8 animate-bounce" />
            <h2 className="text-white font-black text-xl tracking-tighter">WanaShadow 2.0 - ENCRYPTED</h2>
          </div>
          <button onClick={onClose} className="text-white/50 hover:text-white transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <div className="p-8 flex flex-col md:flex-row gap-8 relative">
          {educationMode && (
            <div className="absolute inset-0 z-50 pointer-events-none">
              <div className="absolute top-1/4 left-1/4 p-2 bg-[#00ff9d] text-black text-[8px] font-bold uppercase rounded-sm shadow-lg animate-bounce">
                RED FLAG: SCARE TACTICS
              </div>
              <div className="absolute bottom-1/4 right-1/4 p-2 bg-[#00ff9d] text-black text-[8px] font-bold uppercase rounded-sm shadow-lg animate-bounce delay-100">
                RED FLAG: BITCOIN DEMAND
              </div>
            </div>
          )}
          <div className="flex-1 space-y-6">
            <div className="space-y-2">
              <h3 className="text-[#8b0000] font-bold text-lg uppercase">What happened to my computer?</h3>
              <p className="text-[10px] text-[#00ff9d]/70 leading-relaxed">
                Your important files are encrypted. Many of your documents, photos, videos, databases and other files are no longer accessible because they have been encrypted. Maybe you are busy looking for a way to recover your files, but do not waste your time. Nobody can recover your files without our decryption service.
              </p>
            </div>
            
            <div className="space-y-2">
              <h3 className="text-[#8b0000] font-bold text-lg uppercase">Can I recover my files?</h3>
              <p className="text-[10px] text-[#00ff9d]/70 leading-relaxed">
                Sure. We guarantee that you can recover all your files safely and easily. But you have not so enough time. You can decrypt some of your files for free. Try now by clicking &lt;Decrypt&gt;. But if you want to decrypt all your files, you need to pay.
              </p>
            </div>

            <div className="p-4 bg-[#8b0000]/10 border border-[#8b0000]/30 rounded-sm">
              <p className="text-[10px] text-[#8b0000] font-bold uppercase mb-2">Payment Information</p>
              <p className="text-[10px] text-[#00ff9d]/50 mb-4">Send $300 worth of Bitcoin to the following address:</p>
              <div className="bg-[#0d0d0d] p-2 border border-[#00ff9d]/20 font-mono text-[10px] text-[#00ff9d] break-all">
                1BvBMSEYstWetqTFn5Au4m4GFg7xJaNVN2
              </div>
            </div>
          </div>

          <div className="w-full md:w-64 space-y-6 flex flex-col items-center text-center">
            <div className="p-4 bg-[#1a1a1a] border border-[#8b0000]/50 w-full space-y-2">
              <p className="text-[10px] text-[#8b0000] font-bold uppercase">Payment will be raised on</p>
              <p className="text-xl font-bold text-white">{formatTime(countdown)}</p>
            </div>
            
            <div className="p-4 bg-[#1a1a1a] border border-[#8b0000]/50 w-full space-y-2">
              <p className="text-[10px] text-[#8b0000] font-bold uppercase">Your files will be lost on</p>
              <p className="text-xl font-bold text-white">{formatTime(countdown / 2)}</p>
            </div>

            <div className="flex flex-col gap-2 w-full">
              <button className="w-full py-3 bg-[#8b0000] text-white font-bold uppercase text-xs hover:bg-[#a00000] transition-all">Check Payment</button>
              <button className="w-full py-3 border border-[#8b0000] text-[#8b0000] font-bold uppercase text-xs hover:bg-[#8b0000]/10 transition-all">Decrypt</button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export const PhishingAlert: React.FC<{ onClose: () => void; educationMode?: boolean }> = ({ onClose, educationMode }) => {
  return (
    <motion.div 
      initial={{ y: 50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 50, opacity: 0 }}
      className="fixed bottom-8 right-8 z-[90] w-full max-w-sm"
    >
      <div className="bg-[#0d0d0d] border border-[#8b0000] p-6 rounded-sm shadow-[0_0_30px_rgba(139,0,0,0.3)] relative overflow-hidden">
        {educationMode && (
          <div className="absolute inset-0 z-50 pointer-events-none border-2 border-[#00ff9d] animate-pulse">
            <div className="absolute -top-2 -left-2 p-1 bg-[#00ff9d] text-black text-[6px] font-bold uppercase">
              PHISHING INDICATOR: URGENCY
            </div>
          </div>
        )}
        <div className="absolute top-0 left-0 w-1 h-full bg-[#8b0000]" />
        <button onClick={onClose} className="absolute top-2 right-2 text-[#00ff9d]/30 hover:text-[#00ff9d]">
          <X className="w-4 h-4" />
        </button>
        
        <div className="flex gap-4">
          <AlertTriangle className="w-8 h-8 text-[#8b0000] shrink-0" />
          <div className="space-y-2">
            <h4 className="text-[#8b0000] font-bold text-sm uppercase tracking-widest">SECURITY ALERT</h4>
            <p className="text-[10px] text-[#00ff9d]/70 leading-relaxed">
              Our system detected an unauthorized login attempt from an unknown IP in Moscow, Russia. 
              Your escrow funds have been temporarily frozen for your protection.
            </p>
            <button className="text-[10px] text-[#8b0000] font-bold uppercase hover:underline">Verify Identity Now</button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
