import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Terminal, X, Shield, Zap, AlertCircle } from 'lucide-react';

interface HiddenTerminalProps {
  isOpen: boolean;
  onClose: () => void;
  onUnlock: (type: 'chat' | 'market') => void;
}

const HiddenTerminal: React.FC<HiddenTerminalProps> = ({ isOpen, onClose, onUnlock }) => {
  const [input, setInput] = useState('');
  const [history, setHistory] = useState<string[]>(['SHADOWNET_OS v4.2.0 - SECURE TERMINAL', 'TYPE "HELP" FOR COMMANDS', '']);
  const [isActivated, setIsActivated] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
    }
  }, [isOpen]);

  const handleCommand = (e: React.FormEvent) => {
    e.preventDefault();
    const cmd = input.trim().toLowerCase();
    if (!cmd) return;

    setHistory(prev => [...prev, `> ${input}`]);
    
    if (cmd === 'help') {
      setHistory(prev => [...prev, 'AVAILABLE COMMANDS:', ' - HELP: SHOW THIS MENU', ' - CLEAR: CLEAR TERMINAL', ' - EXIT: CLOSE TERMINAL', ' - STATUS: SHOW CONNECTION STATUS', '']);
    } else if (cmd === 'clear') {
      setHistory(['SHADOWNET_OS v4.2.0 - SECURE TERMINAL', '']);
    } else if (cmd === 'exit') {
      onClose();
    } else if (cmd === 'status') {
      setHistory(prev => [...prev, 'CONNECTION: ENCRYPTED', 'GATEWAY: TOR_NODE_7721', 'ENCRYPTION: AES-256-GCM', '']);
    } else if (cmd === 'chat-terminal : activate') {
      setIsActivated(true);
      setHistory(prev => [...prev, 'SYSTEM: CHAT TERMINAL ACTIVATED', 'SYSTEM: AWAITING STATE CONFIGURATION...', '']);
    } else if (cmd === 'chat-state-true = chat') {
      if (isActivated) {
        setHistory(prev => [...prev, 'SYSTEM: ACCESS GRANTED', 'SYSTEM: REDIRECTING TO SECURE CHAT...', '']);
        setTimeout(() => {
          onUnlock('chat');
          onUnlock('market'); // Unlocking both as requested
          onClose();
        }, 1500);
      } else {
        setHistory(prev => [...prev, 'ERROR: TERMINAL NOT ACTIVATED', '']);
      }
    } else if (cmd === 'market-state-true = market') {
      if (isActivated) {
        setHistory(prev => [...prev, 'SYSTEM: ACCESS GRANTED', 'SYSTEM: REDIRECTING TO BLACK MARKET...', '']);
        setTimeout(() => {
          onUnlock('market');
          onUnlock('chat'); // Unlocking both as requested
          onClose();
        }, 1500);
      } else {
        setHistory(prev => [...prev, 'ERROR: TERMINAL NOT ACTIVATED', '']);
      }
    } else {
      setHistory(prev => [...prev, `ERROR: COMMAND "${cmd}" NOT RECOGNIZED`, '']);
    }

    setInput('');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          key="hidden-terminal-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-4 md:p-10 font-mono"
        >
          <div className="w-full max-w-4xl h-full max-h-[600px] bg-[#050505] border border-[#00ff9d]/30 rounded-sm shadow-[0_0_50px_rgba(0,255,157,0.1)] flex flex-col overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-2 border-b border-[#00ff9d]/20 bg-[#0a0a0a]">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-[#00ff9d]" />
                <span className="text-[10px] font-bold text-[#00ff9d] uppercase tracking-widest">ShadowNet Hidden CLI</span>
              </div>
              <button onClick={onClose} className="text-[#00ff9d]/50 hover:text-[#00ff9d]">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 p-6 overflow-y-auto no-scrollbar text-[12px] space-y-1">
              {history.map((line, i) => (
                <div key={i} className={`${line.startsWith('>') ? 'text-[#00ff9d]' : line.startsWith('ERROR') ? 'text-[#8b0000]' : 'text-[#00ff9d]/70'}`}>
                  {line}
                </div>
              ))}
              <form onSubmit={handleCommand} className="flex items-center gap-2 pt-2">
                <span className="text-[#00ff9d]">{'>'}</span>
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  className="flex-1 bg-transparent border-none outline-none text-[#00ff9d] caret-[#00ff9d]"
                  autoFocus
                />
              </form>
            </div>

            {/* Footer */}
            <div className="px-4 py-2 border-t border-[#00ff9d]/10 bg-[#0a0a0a] flex justify-between items-center">
              <div className="flex items-center gap-4 text-[8px] text-[#00ff9d]/40 uppercase tracking-widest">
                <div className="flex items-center gap-1">
                  <Shield className="w-2 h-2" />
                  Secure
                </div>
                <div className="flex items-center gap-1">
                  <Zap className="w-2 h-2" />
                  Active
                </div>
              </div>
              <div className="text-[8px] text-[#00ff9d]/20 uppercase">
                ShadowNet Hidden CLI v4.2.0
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default HiddenTerminal;
