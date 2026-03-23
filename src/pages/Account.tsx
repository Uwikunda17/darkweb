import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { doc, updateDoc, increment } from 'firebase/firestore';
import { UserProfile, OperationType } from '../types';
import { handleFirestoreError, formatBtc } from '../utils';
import { User, Wallet, Shield, Lock, AlertTriangle, CheckCircle, CreditCard, Key, Settings, LogOut, Eye, EyeOff, Download, Copy, RefreshCw } from 'lucide-react';
import { GlitchText } from '../components/TorLoading';
import { motion, AnimatePresence } from 'motion/react';
import * as openpgp from 'openpgp';

interface AccountProps {
  user: UserProfile;
  onLogout: () => void;
}

const Account: React.FC<AccountProps> = ({ user, onLogout }) => {
  const [depositAmount, setDepositAmount] = useState('');
  const [isDepositing, setIsDepositing] = useState(false);
  const [depositSuccess, setDepositSuccess] = useState(false);
  const [accessCode, setAccessCode] = useState('');
  const [codeStatus, setCodeStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [pgpKeys, setPgpKeys] = useState<{ publicKey: string; privateKey: string } | null>(null);
  const [showPrivateKey, setShowPrivateKey] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [codename, setCodename] = useState(user.codename || '');
  const [isUpdatingCodename, setIsUpdatingCodename] = useState(false);

  useEffect(() => {
    const storedKeys = localStorage.getItem(`pgp_keys_${user.uid}`);
    if (storedKeys) {
      setPgpKeys(JSON.parse(storedKeys));
    }
  }, [user.uid]);

  const generateNewKeys = async () => {
    if (!window.confirm('WARNING: Generating new keys will overwrite your existing keys. You will lose access to messages encrypted with your old keys. Continue?')) {
      return;
    }

    setIsGenerating(true);
    try {
      const { privateKey, publicKey } = await openpgp.generateKey({
        type: 'rsa',
        rsaBits: 2048,
        userIDs: [{ name: user.displayName || user.uid, email: user.email }],
      });
      
      const keys = { publicKey, privateKey };
      localStorage.setItem(`pgp_keys_${user.uid}`, JSON.stringify(keys));
      setPgpKeys(keys);
      
      // Update public key in Firestore
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, { publicKey });
      
      alert('New PGP keys generated successfully.');
    } catch (error) {
      console.error('Failed to generate keys:', error);
      alert('Failed to generate keys. Check console for details.');
    } finally {
      setIsGenerating(false);
    }
  };

  const exportKeys = () => {
    if (!pgpKeys) return;
    const content = `SHADOWNET PGP KEYS\nUSER: ${user.displayName}\nUID: ${user.uid}\nDATE: ${new Date().toISOString()}\n\n--- PUBLIC KEY ---\n${pgpKeys.publicKey}\n\n--- PRIVATE KEY ---\n${pgpKeys.privateKey}\n\nWARNING: NEVER SHARE YOUR PRIVATE KEY.`;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `shadow_keys_${user.uid.slice(0, 8)}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const updateCodename = async () => {
    if (!codename.trim() || codename === user.codename) return;
    
    setIsUpdatingCodename(true);
    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, { codename: codename.trim().toUpperCase() });
      alert('CODENAME UPDATED. YOUR IDENTITY IS NOW SECURED.');
    } catch (error) {
      console.error('Failed to update codename:', error);
      alert('FAILED TO UPDATE CODENAME.');
    } finally {
      setIsUpdatingCodename(false);
    }
  };

  const handleDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(depositAmount);
    if (isNaN(amount) || amount <= 0) return;

    setIsDepositing(true);
    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        balance: increment(amount)
      });
      setDepositSuccess(true);
      setDepositAmount('');
      setTimeout(() => setDepositSuccess(false), 3000);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}`);
    } finally {
      setIsDepositing(false);
    }
  };

  const handleCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (accessCode === '20082009') {
      setCodeStatus('success');
      try {
        const userRef = doc(db, 'users', user.uid);
        await updateDoc(userRef, {
          balance: increment(0.1), // Reward for the secret code
          role: 'admin' // Or some other "Elite" status
        });
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}`);
      }
    } else {
      setCodeStatus('error');
      setTimeout(() => setCodeStatus('idle'), 2000);
    }
  };

  const handlePayDebt = async () => {
    if (user.debt <= 0) return;
    if (user.balance < user.debt) {
      alert('Insufficient balance to pay full debt.');
      return;
    }

    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        balance: increment(-user.debt),
        debt: 0
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}`);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-12 animate-in fade-in duration-700">
      <header className="space-y-2">
        <GlitchText text="ACCOUNT MANAGEMENT" className="text-3xl font-black text-[#00ff9d]" />
        <p className="text-[#00ff9d]/50 text-xs uppercase tracking-widest">Secure Identity & Wallet Control</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Profile Info */}
        <section className="lg:col-span-1 space-y-8">
          <div className="bg-[#0d0d0d] border border-[#00ff9d]/10 p-8 rounded-sm space-y-6">
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="w-20 h-20 bg-[#8b0000]/20 rounded-full flex items-center justify-center border border-[#8b0000]/50 shadow-[0_0_20px_rgba(139,0,0,0.3)]">
                <User className="w-10 h-10 text-[#8b0000]" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">{user.displayName}</h3>
                <p className="text-[10px] text-[#00ff9d]/50 uppercase tracking-widest">{user.role}</p>
              </div>
            </div>

            <div className="space-y-4 pt-6 border-t border-[#00ff9d]/5">
              <div className="flex justify-between items-center">
                <span className="text-[10px] text-[#00ff9d]/50 uppercase">Email</span>
                <span className="text-xs text-[#00ff9d]">{user.email}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[10px] text-[#00ff9d]/50 uppercase">UID</span>
                <span className="text-[10px] font-mono text-[#00ff9d]/30">{user.uid.slice(0, 8)}...</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[10px] text-[#00ff9d]/50 uppercase">Status</span>
                <span className="text-[10px] text-[#00ff9d] flex items-center gap-1">
                  <Shield className="w-3 h-3" />
                  ENCRYPTED
                </span>
              </div>
            </div>

            <button 
              onClick={onLogout}
              className="w-full py-3 border border-[#8b0000]/30 text-[#8b0000] text-[10px] font-bold uppercase tracking-widest hover:bg-[#8b0000]/10 transition-all flex items-center justify-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              Terminate Session
            </button>
          </div>

          {/* Secret Code Section */}
          <div className="bg-[#0d0d0d] border border-[#8b0000]/20 p-8 rounded-sm space-y-6">
            <h3 className="text-xs font-bold text-white uppercase tracking-widest flex items-center gap-2">
              <Key className="w-4 h-4 text-[#8b0000]" />
              Access Code
            </h3>
            <form onSubmit={handleCodeSubmit} className="space-y-4">
              <p className="text-[10px] text-[#00ff9d]/50">Enter an 8-digit authorization code to unlock restricted features.</p>
              <input 
                type="text" 
                maxLength={8}
                placeholder="XXXXXXXX"
                value={accessCode}
                onChange={(e) => setAccessCode(e.target.value)}
                className="w-full bg-[#0a0a0a] border border-[#00ff9d]/20 rounded-sm py-3 px-4 text-xs font-mono tracking-[0.5em] focus:outline-none focus:border-[#00ff9d] transition-all text-center"
              />
              <button 
                type="submit"
                className="w-full py-3 bg-[#8b0000] text-white text-[10px] font-bold uppercase tracking-widest hover:bg-[#a00000] transition-all"
              >
                Verify Code
              </button>
              <AnimatePresence>
                {codeStatus === 'success' && (
                  <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-[10px] text-[#00ff9d] text-center font-bold">ACCESS GRANTED: ELITE STATUS UNLOCKED</motion.p>
                )}
                {codeStatus === 'error' && (
                  <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-[10px] text-[#8b0000] text-center font-bold">INVALID AUTHORIZATION CODE</motion.p>
                )}
              </AnimatePresence>
            </form>
          </div>
        </section>

        {/* Wallet & Debt */}
        <section className="lg:col-span-2 space-y-8">
          <div className="bg-[#0d0d0d] border border-[#00ff9d]/10 p-8 rounded-sm space-y-8">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-[#00ff9d] uppercase tracking-widest flex items-center gap-3">
                <Wallet className="w-6 h-6 text-[#8b0000]" />
                ShadowNet Wallet
              </h3>
              <div className="text-right">
                <p className="text-[10px] text-[#00ff9d]/50 uppercase">Available Balance</p>
                <p className="text-2xl font-black text-[#00ff9d]">{formatBtc(user.balance)}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Deposit Form */}
              <div className="space-y-6">
                <h4 className="text-xs font-bold text-white uppercase tracking-widest flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-[#8b0000]" />
                  Deposit Funds
                </h4>
                <form onSubmit={handleDeposit} className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] text-[#00ff9d]/50 uppercase">Amount (BTC)</label>
                    <input 
                      type="number" 
                      step="0.0001"
                      placeholder="0.0000"
                      value={depositAmount}
                      onChange={(e) => setDepositAmount(e.target.value)}
                      className="w-full bg-[#0a0a0a] border border-[#00ff9d]/20 rounded-sm py-3 px-4 text-xs font-mono focus:outline-none focus:border-[#00ff9d] transition-all"
                    />
                  </div>
                  <button 
                    type="submit"
                    disabled={isDepositing}
                    className="w-full py-4 bg-[#00ff9d] text-black font-bold uppercase tracking-widest hover:bg-[#00ff9d]/80 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                  >
                    {isDepositing ? 'Processing...' : 'Deposit to Wallet'}
                  </button>
                  <AnimatePresence>
                    {depositSuccess && (
                      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-2 text-[#00ff9d] text-[10px] font-bold uppercase justify-center">
                        <CheckCircle className="w-4 h-4" />
                        Deposit Confirmed
                      </motion.div>
                    )}
                  </AnimatePresence>
                </form>
              </div>

              {/* Debt Management */}
              <div className="space-y-6">
                <h4 className="text-xs font-bold text-white uppercase tracking-widest flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-[#8b0000]" />
                  Debt Status
                </h4>
                <div className="p-6 bg-[#8b0000]/5 border border-[#8b0000]/20 rounded-sm space-y-4">
                  <div>
                    <p className="text-[10px] text-[#8b0000] uppercase font-bold">Outstanding Debt</p>
                    <p className="text-2xl font-black text-[#8b0000]">{formatBtc(user.debt || 0)}</p>
                  </div>
                  <p className="text-[10px] text-[#00ff9d]/50 leading-relaxed">
                    Unpaid debt may result in restricted access to certain services and higher escrow fees.
                  </p>
                  <button 
                    onClick={handlePayDebt}
                    disabled={user.debt <= 0}
                    className="w-full py-3 border border-[#8b0000] text-[#8b0000] text-[10px] font-bold uppercase tracking-widest hover:bg-[#8b0000] hover:text-white disabled:opacity-30 transition-all"
                  >
                    Repay Debt
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Security Settings */}
          <div className="bg-[#0d0d0d] border border-[#00ff9d]/10 p-8 rounded-sm space-y-8">
            <h3 className="text-lg font-bold text-[#00ff9d] uppercase tracking-widest flex items-center gap-3">
              <Settings className="w-6 h-6 text-[#8b0000]" />
              Security Settings
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 border border-[#00ff9d]/5 bg-black/40 rounded-sm flex justify-between items-center">
                <div className="space-y-1">
                  <p className="text-xs font-bold text-white uppercase">PGP Encryption</p>
                  <p className="text-[10px] text-[#00ff9d]/50">Always active for messages</p>
                </div>
                <div className="w-10 h-5 bg-[#00ff9d]/20 rounded-full relative">
                  <div className="absolute right-1 top-1 w-3 h-3 bg-[#00ff9d] rounded-full" />
                </div>
              </div>
              <div className="p-4 border border-[#00ff9d]/5 bg-black/40 rounded-sm flex justify-between items-center">
                <div className="space-y-1">
                  <p className="text-xs font-bold text-white uppercase">2FA Gateway</p>
                  <p className="text-[10px] text-[#00ff9d]/50">Required for withdrawals</p>
                </div>
                <div className="w-10 h-5 bg-[#00ff9d]/20 rounded-full relative">
                  <div className="absolute right-1 top-1 w-3 h-3 bg-[#00ff9d] rounded-full" />
                </div>
              </div>
            </div>

            {/* Identity Section */}
            <div className="space-y-6 pt-6 border-t border-[#00ff9d]/10">
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-bold text-[#00ff9d] uppercase tracking-widest flex items-center gap-2">
                  <Shield className="w-4 h-4 text-[#8b0000]" />
                  Shadow Identity
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] text-[#00ff9d]/50 uppercase tracking-widest">Secret Codename</label>
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      value={codename}
                      onChange={(e) => setCodename(e.target.value.toUpperCase())}
                      placeholder="ENTER CODENAME..."
                      className="flex-1 bg-black border border-[#00ff9d]/20 rounded-sm px-4 py-2 text-xs text-[#00ff9d] focus:outline-none focus:border-[#00ff9d] font-mono"
                    />
                    <button 
                      onClick={updateCodename}
                      disabled={isUpdatingCodename || !codename.trim() || codename === user.codename}
                      className="px-4 py-2 bg-[#8b0000] text-white text-[10px] font-bold uppercase hover:bg-[#a00000] disabled:opacity-50 transition-all shadow-[0_0_10px_rgba(139,0,0,0.2)]"
                    >
                      {isUpdatingCodename ? '...' : 'Update'}
                    </button>
                  </div>
                  <p className="text-[8px] text-[#00ff9d]/30 italic">This codename is used for secure terminal communications.</p>
                </div>

                <div className="space-y-4">
                  <label className="text-[10px] text-[#00ff9d]/50 uppercase tracking-widest">System Integrity</label>
                  <div className="space-y-2">
                    <div className="flex justify-between text-[8px] uppercase tracking-widest">
                      <span className="text-[#00ff9d]/50">Anonymity Level</span>
                      <span className="text-[#00ff9d]">98.4%</span>
                    </div>
                    <div className="h-1 bg-black border border-[#00ff9d]/10 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: '98.4%' }}
                        className="h-full bg-[#00ff9d] shadow-[0_0_10px_#00ff9d]"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-[8px] uppercase tracking-widest">
                      <span className="text-[#00ff9d]/50">Encryption Strength</span>
                      <span className="text-[#00ff9d]">AES-256-GCM</span>
                    </div>
                    <div className="h-1 bg-black border border-[#00ff9d]/10 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: '100%' }}
                        className="h-full bg-[#8b0000] shadow-[0_0_10px_#8b0000]"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* PGP Keys Display */}
            <div className="space-y-6 pt-6 border-t border-[#00ff9d]/10">
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-bold text-[#00ff9d] uppercase tracking-widest">PGP Key Management</h3>
                <button 
                  onClick={generateNewKeys}
                  disabled={isGenerating}
                  className="flex items-center gap-2 text-[8px] px-3 py-1 border border-[#8b0000]/30 text-[#8b0000] uppercase hover:bg-[#8b0000]/10 disabled:opacity-50"
                >
                  <RefreshCw className={`w-2 h-2 ${isGenerating ? 'animate-spin' : ''}`} />
                  {isGenerating ? 'Generating...' : 'Generate New Keys'}
                </button>
              </div>

              {pgpKeys ? (
                <div className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h4 className="text-[10px] font-bold text-[#00ff9d] uppercase tracking-widest">Public PGP Key</h4>
                      <div className="flex gap-4">
                        <button 
                          onClick={() => {
                            navigator.clipboard.writeText(pgpKeys.publicKey);
                            alert('Public key copied to clipboard');
                          }}
                          className="text-[8px] text-[#00ff9d]/50 hover:text-[#00ff9d] uppercase flex items-center gap-1"
                        >
                          <Copy className="w-2 h-2" />
                          Copy Key
                        </button>
                      </div>
                    </div>
                    <div className="bg-black p-4 rounded-sm border border-[#00ff9d]/10 h-32 overflow-y-auto no-scrollbar">
                      <code className="text-[8px] text-[#00ff9d]/30 break-all whitespace-pre-wrap font-mono">
                        {pgpKeys.publicKey}
                      </code>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h4 className="text-[10px] font-bold text-[#8b0000] uppercase tracking-widest">Private PGP Key</h4>
                      <div className="flex gap-4">
                        <button 
                          onClick={() => {
                            navigator.clipboard.writeText(pgpKeys.privateKey);
                            alert('WARNING: PRIVATE KEY COPIED. KEEP IT SECURE!');
                          }}
                          className="text-[8px] text-[#8b0000]/50 hover:text-[#8b0000] uppercase flex items-center gap-1"
                        >
                          <Copy className="w-2 h-2" />
                          Copy Key
                        </button>
                        <button 
                          onClick={() => setShowPrivateKey(!showPrivateKey)}
                          className="text-[8px] text-[#8b0000]/50 hover:text-[#8b0000] uppercase flex items-center gap-1"
                        >
                          {showPrivateKey ? <EyeOff className="w-2 h-2" /> : <Eye className="w-2 h-2" />}
                          {showPrivateKey ? 'Hide' : 'Show'}
                        </button>
                      </div>
                    </div>
                    <div className="bg-black p-4 rounded-sm border border-[#8b0000]/10 h-32 overflow-y-auto no-scrollbar relative">
                      {showPrivateKey ? (
                        <code className="text-[8px] text-[#8b0000]/30 break-all whitespace-pre-wrap font-mono">
                          {pgpKeys.privateKey}
                        </code>
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/80 backdrop-blur-sm">
                          <p className="text-[8px] text-[#8b0000] font-bold uppercase tracking-widest">Key Encrypted & Hidden</p>
                        </div>
                      )}
                    </div>
                    <div className="flex justify-between items-center">
                      <p className="text-[8px] text-[#8b0000]/50 uppercase italic">
                        Warning: Never share your private key. It is stored locally in your browser.
                      </p>
                      <button 
                        onClick={exportKeys}
                        className="flex items-center gap-1 text-[8px] text-[#00ff9d]/50 hover:text-[#00ff9d] uppercase"
                      >
                        <Download className="w-2 h-2" />
                        Export Keys (.txt)
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-8 border border-dashed border-[#00ff9d]/20 text-center">
                  <p className="text-[10px] text-[#00ff9d]/30 uppercase">No PGP keys found. Generate them to enable encrypted chat.</p>
                </div>
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Account;
