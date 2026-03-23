import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';

interface GlitchTextProps {
  text: string;
  className?: string;
  speed?: number;
}

export const GlitchText: React.FC<GlitchTextProps> = ({ text, className = '', speed = 0.05 }) => {
  const [displayText, setDisplayText] = useState(text);
  const chars = '!@#$%^&*()_+{}|:<>?';

  useEffect(() => {
    let iteration = 0;
    const interval = setInterval(() => {
      setDisplayText(prev => 
        text.split('').map((char, index) => {
          if (index < iteration) return text[index];
          return chars[Math.floor(Math.random() * chars.length)];
        }).join('')
      );
      
      if (iteration >= text.length) clearInterval(interval);
      iteration += 1 / 3;
    }, speed * 1000);

    return () => clearInterval(interval);
  }, [text, speed]);

  return (
    <span className={`font-mono ${className}`}>
      {displayText}
    </span>
  );
};

export const TorLoading: React.FC<{ onComplete: () => void }> = ({ onComplete }) => {
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('Initializing circuit...');

  useEffect(() => {
    const statuses = [
      'Establishing Tor circuit...',
      'Connecting to entry node...',
      'Relaying through middle node...',
      'Exiting through exit node...',
      'Handshaking with hidden service...',
      'Loading ShadowNet...'
    ];

    let currentStatusIdx = 0;
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(onComplete, 500);
          return 100;
        }
        const next = prev + Math.random() * 15;
        if (next > (currentStatusIdx + 1) * (100 / statuses.length)) {
          currentStatusIdx++;
          setStatus(statuses[currentStatusIdx] || statuses[statuses.length - 1]);
        }
        return Math.min(next, 100);
      });
    }, 400);

    return () => clearInterval(interval);
  }, [onComplete]);

  return (
    <div className="fixed inset-0 bg-[#0a0a0a] flex flex-col items-center justify-center z-50 p-4">
      <div className="w-full max-w-md">
        <div className="flex justify-between mb-2">
          <GlitchText text="TOR BROWSER" className="text-[#00ff9d] text-xl font-bold" />
          <span className="text-[#00ff9d] font-mono">{Math.floor(progress)}%</span>
        </div>
        <div className="h-2 w-full bg-[#1a1a1a] border border-[#00ff9d]/30 rounded-full overflow-hidden">
          <motion.div 
            className="h-full bg-[#00ff9d]"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
          />
        </div>
        <p className="mt-4 text-[#00ff9d]/70 font-mono text-sm animate-pulse">
          {status}
        </p>
      </div>
      
      <div className="absolute bottom-8 text-center">
        <p className="text-[#8b0000] font-mono text-xs uppercase tracking-widest">
          ShadowNet v4.2.0-stable
        </p>
        <p className="text-[#00ff9d]/30 font-mono text-[10px] mt-1">
          Encrypted connection established via 127.0.0.1:9050
        </p>
      </div>
    </div>
  );
};
