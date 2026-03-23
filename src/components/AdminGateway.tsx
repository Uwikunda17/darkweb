import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Shield, Lock, X, Terminal, AlertTriangle, UserPlus, LogIn } from 'lucide-react';
import { auth, db } from '../firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { GlitchText } from './TorLoading';

interface AdminGatewayProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const AdminGateway: React.FC<AdminGatewayProps> = ({ isOpen, onClose, onSuccess }) => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [adminKey, setAdminKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (mode === 'register') {
        // Secret Admin Key required for registration
        if (adminKey !== 'SHADOWNET_ROOT_2026') {
          throw new Error('INVALID ADMIN AUTHORIZATION KEY');
        }
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        
        // Create admin profile
        await setDoc(doc(db, 'users', user.uid), {
          uid: user.uid,
          email: user.email,
          displayName: 'System Admin',
          role: 'admin',
          balance: 999,
          debt: 0,
          points: 0,
          completedModules: [],
          achievements: [],
          streak: 0,
          lastActive: new Date().toISOString()
        });
      } else {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const userDoc = await getDoc(doc(db, 'users', userCredential.user.uid));
        
        if (!userDoc.exists() || userDoc.data()?.role !== 'admin') {
          throw new Error('INSUFFICIENT PRIVILEGES');
        }
      }
      onSuccess();
    } catch (err: any) {
      console.error('Admin Auth Error:', err);
      setError(err.message.toUpperCase());
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-4 font-mono"
        >
          <motion.div 
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            className="w-full max-w-md bg-[#050505] border border-[#8b0000]/30 p-8 rounded-sm shadow-[0_0_50px_rgba(139,0,0,0.2)] space-y-8"
          >
            <div className="flex justify-between items-start">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-[#8b0000]">
                  <Shield className="w-5 h-5" />
                  <span className="text-[10px] font-bold uppercase tracking-[0.3em]">Restricted Access</span>
                </div>
                <GlitchText text="ADMIN GATEWAY" className="text-2xl font-black text-white" />
              </div>
              <button onClick={onClose} className="text-white/30 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex gap-4 border-b border-white/10">
              <button 
                onClick={() => setMode('login')}
                className={`pb-2 text-[10px] font-bold uppercase tracking-widest transition-all ${mode === 'login' ? 'text-[#8b0000] border-b-2 border-[#8b0000]' : 'text-white/30'}`}
              >
                Login
              </button>
              <button 
                onClick={() => setMode('register')}
                className={`pb-2 text-[10px] font-bold uppercase tracking-widest transition-all ${mode === 'register' ? 'text-[#8b0000] border-b-2 border-[#8b0000]' : 'text-white/30'}`}
              >
                Register
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[8px] text-white/50 uppercase tracking-widest">Admin Email</label>
                  <input 
                    type="email" 
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-black border border-white/10 rounded-sm py-3 px-4 text-xs text-white focus:outline-none focus:border-[#8b0000] transition-all"
                    placeholder="admin@shadownet.void"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[8px] text-white/50 uppercase tracking-widest">Security Credentials</label>
                  <input 
                    type="password" 
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-black border border-white/10 rounded-sm py-3 px-4 text-xs text-white focus:outline-none focus:border-[#8b0000] transition-all"
                    placeholder="••••••••"
                  />
                </div>
                {mode === 'register' && (
                  <div className="space-y-1">
                    <label className="text-[8px] text-[#8b0000] uppercase tracking-widest font-bold">Root Authorization Key</label>
                    <input 
                      type="password" 
                      required
                      value={adminKey}
                      onChange={(e) => setAdminKey(e.target.value)}
                      className="w-full bg-[#8b0000]/5 border border-[#8b0000]/30 rounded-sm py-3 px-4 text-xs text-[#8b0000] focus:outline-none focus:border-[#8b0000] transition-all"
                      placeholder="MASTER_KEY"
                    />
                  </div>
                )}
              </div>

              {error && (
                <div className="p-3 bg-[#8b0000]/10 border border-[#8b0000]/30 flex items-center gap-3">
                  <AlertTriangle className="w-4 h-4 text-[#8b0000]" />
                  <span className="text-[8px] text-[#8b0000] font-bold uppercase leading-tight">{error}</span>
                </div>
              )}

              <button 
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-[#8b0000] text-white font-bold uppercase tracking-widest hover:bg-[#a00000] transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(139,0,0,0.3)]"
              >
                {loading ? (
                  <Terminal className="w-4 h-4 animate-spin" />
                ) : mode === 'login' ? (
                  <>
                    <LogIn className="w-4 h-4" />
                    Initialize Session
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4" />
                    Provision Admin
                  </>
                )}
              </button>
            </form>

            <div className="pt-4 border-t border-white/5 text-center">
              <p className="text-[8px] text-white/20 uppercase tracking-[0.2em]">
                Unauthorized access is strictly prohibited.
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AdminGateway;
