import React, { useState, useEffect } from 'react';
import { auth, db } from './firebase';
import { onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc, onSnapshot, query, collection, where, collectionGroup, updateDoc } from 'firebase/firestore';
import { UserProfile, UserRole } from './types';
import { TorLoading } from './components/TorLoading';
import { GlitchText } from './components/TorLoading';
import { Shield, Lock, Terminal, ShoppingCart, MessageSquare, Users, Settings, LogOut, AlertTriangle, Info, Volume2, VolumeX, BookOpen, Cpu } from 'lucide-react';
import { generateOnionAddress, formatBtc } from './utils';
import HiddenTerminal from './components/HiddenTerminal';

// Pages (to be implemented)
import Home from './pages/Home';
import Market from './pages/Market';
import Chat from './pages/Chat';
import Forums from './pages/Forums';
import Admin from './pages/Admin';
import Services from './pages/Services';
import Disclaimer from './pages/Disclaimer';
import Dashboard from './pages/Dashboard';
import ModulePlayer from './pages/ModulePlayer';
import Quiz from './pages/Quiz';
import Account from './pages/Account';

import { format } from 'date-fns';
import { AnimatePresence, motion } from 'motion/react';
import { RansomwarePopup, PhishingAlert } from './components/Tricks';
import OnlineUsersCounter from './components/OnlineUsersCounter';
import AdminGateway from './components/AdminGateway';
import * as openpgp from 'openpgp';

export default function App() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [showTorLoading, setShowTorLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState<'home' | 'market' | 'chat' | 'forums' | 'admin' | 'disclaimer' | 'services' | 'dashboard' | 'module' | 'quiz' | 'account'>('home');
  const [navigationParams, setNavigationParams] = useState<any>(null);
  const [onionAddress, setOnionAddress] = useState('');
  const [showRansomware, setShowRansomware] = useState(false);
  const [showPhishing, setShowPhishing] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [unreadChatCount, setUnreadChatCount] = useState(0);
  const [isTerminalOpen, setIsTerminalOpen] = useState(false);
  const [isAdminGatewayOpen, setIsAdminGatewayOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [unreadMessages, setUnreadMessages] = useState<any[]>([]);
  const [userKeys, setUserKeys] = useState<{ publicKey: string; privateKey: string } | null>(null);
  const [unlockedFeatures, setUnlockedFeatures] = useState<string[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('unlocked_features');
      return saved ? JSON.parse(saved) : ['home', 'dashboard', 'services', 'forums', 'account', 'disclaimer'];
    }
    return ['home', 'dashboard', 'services', 'forums', 'account', 'disclaimer'];
  });

  useEffect(() => {
    setOnionAddress(generateOnionAddress());
    
    // Keyboard shortcuts
    const handleKeyDown = (e: KeyboardEvent) => {
      // Terminal: Alt + T
      if (e.altKey && e.key === 't') {
        setIsTerminalOpen(prev => !prev);
      }
    };

    // Better multi-key detection for Alt + H + S
    const pressedKeys = new Set<string>();
    const handleKeyCombo = (e: KeyboardEvent) => {
      pressedKeys.add(e.key.toLowerCase());
      if (e.altKey && pressedKeys.has('h') && pressedKeys.has('s')) {
        setIsAdminGatewayOpen(prev => !prev);
        pressedKeys.clear();
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      pressedKeys.delete(e.key.toLowerCase());
    };

    window.addEventListener('keydown', handleKeyCombo);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('keydown', handleKeyDown);

    // Randomly trigger "tricks"
    const triggerTricks = () => {
      if (Math.random() < 0.05) setShowRansomware(true);
      if (Math.random() < 0.1) setShowPhishing(true);
    };

    const interval = setInterval(triggerTricks, 30000); // Check every 30s

    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        const userRef = doc(db, 'users', firebaseUser.uid);
        
        // Use onSnapshot for real-time updates to balance, debt, etc.
        const unsubscribeUser = onSnapshot(userRef, async (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data() as UserProfile;
            // Patch missing fields for existing users
            const requiredFields: Partial<UserProfile> = {
              status: 'active',
              role: 'user',
              balance: 0,
              debt: 0,
              points: 0,
              completedModules: [],
              achievements: [],
              streak: 0,
              lastActive: new Date().toISOString()
            };
            
            let needsUpdate = false;
            const updateData: any = {};
            
            (Object.keys(requiredFields) as (keyof UserProfile)[]).forEach(key => {
              const val = data[key];
              const isMissing = val === undefined || val === null;
              const isNumeric = typeof requiredFields[key] === 'number';
              const isInvalidNumber = isNumeric && (typeof val !== 'number' || isNaN(val));

              if (isMissing || isInvalidNumber) {
                updateData[key] = requiredFields[key];
                needsUpdate = true;
              }
            });

            if (needsUpdate) {
              try {
                await updateDoc(userRef, updateData);
              } catch (e) {
                console.error('Failed to patch user profile:', e);
              }
            } else {
              setUser(data);
            }
          } else {
            // Create new user if doesn't exist
            const newUser: UserProfile = {
              uid: firebaseUser.uid,
              email: firebaseUser.email || '',
              displayName: firebaseUser.displayName || 'Anonymous',
              role: 'user',
              status: 'active',
              balance: 0,
              debt: 0,
              points: 0,
              completedModules: [],
              achievements: [],
              streak: 0,
              lastActive: new Date().toISOString()
            };
            setDoc(userRef, newUser).catch(e => console.error('Failed to create user:', e));
            setUser(newUser);
          }
          setLoading(false);
        }, (err) => {
          console.error('User profile listener error details:', {
            message: err.message,
            code: (err as any).code,
            name: err.name,
            uid: firebaseUser.uid
          });
          setLoading(false);
        });

        return () => {
          unsubscribeUser();
        };
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    return () => {
      unsubscribe();
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  useEffect(() => {
    if (user?.uid) {
      const storedKeys = localStorage.getItem(`pgp_keys_${user.uid}`);
      if (storedKeys) {
        setUserKeys(JSON.parse(storedKeys));
      }
    }
  }, [user?.uid]);

  useEffect(() => {
    if (!user?.uid) return;

    // Update lastActive every 2 minutes
    const updateStatus = async () => {
      try {
        await updateDoc(doc(db, 'users', user.uid), {
          lastActive: new Date().toISOString()
        });
      } catch (e) {
        console.error('Failed to update status:', e);
      }
    };

    updateStatus();
    const statusInterval = setInterval(updateStatus, 120000);

    return () => clearInterval(statusInterval);
  }, [user?.uid]);

  useEffect(() => {
    if (!user?.uid) return;

    const chatsQuery = query(
      collection(db, 'chats'),
      where('participants', 'array-contains', user.uid)
    );

    const unsubscribers: (() => void)[] = [];

    const unsubscribeChats = onSnapshot(chatsQuery, (snapshot) => {
      // Clear existing message unsubscribers
      unsubscribers.forEach(unsub => unsub());
      unsubscribers.length = 0;

      let totalUnread = 0;
      const allUnread: any[] = [];

      snapshot.docs.forEach(chatDoc => {
        const chatId = chatDoc.id;
        const messagesQuery = query(
          collection(db, `chats/${chatId}/messages`),
          where('read', '==', false),
          where('senderId', '!=', user.uid)
        );

        const unsubMessages = onSnapshot(messagesQuery, async (msgSnapshot) => {
          const newMessages = await Promise.all(msgSnapshot.docs.map(async (mDoc) => {
            const mData = mDoc.data();
            let senderName = mData.senderId.slice(0, 8);
            
            // Try to get sender name
            try {
              const sDoc = await getDoc(doc(db, 'users', mData.senderId));
              if (sDoc.exists()) {
                const sData = sDoc.data();
                senderName = sData.codename || sData.displayName || senderName;
              }
            } catch (e) {}

            let text = mData.text;
            if (mData.encrypted && userKeys) {
              try {
                const privateKey = await openpgp.readPrivateKey({ armoredKey: userKeys.privateKey });
                const messageObj = await openpgp.readMessage({ armoredMessage: mData.text });
                const { data: decrypted } = await openpgp.decrypt({
                  message: messageObj,
                  decryptionKeys: privateKey,
                });
                text = decrypted as string;
              } catch (e) {
                text = '[ENCRYPTED]';
              }
            }

            return {
              id: mDoc.id,
              ...mData,
              senderName,
              displayText: text
            };
          }));

          setUnreadMessages(prev => {
            const filtered = prev.filter(m => m.chatId !== chatId);
            return [...filtered, ...newMessages].sort((a, b) => 
              new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
            );
          });
        });

        unsubscribers.push(unsubMessages);
      });
    });

    return () => {
      unsubscribeChats();
      unsubscribers.forEach(unsub => unsub());
    };
  }, [user, userKeys]);

  useEffect(() => {
    setUnreadChatCount(unreadMessages.length);
  }, [unreadMessages]);

  const handleLogin = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error('Login error:', error);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setCurrentPage('home');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleUnlock = (type: 'chat' | 'market') => {
    setUnlockedFeatures(prev => {
      const next = [...new Set([...prev, type])];
      localStorage.setItem('unlocked_features', JSON.stringify(next));
      return next;
    });
    setCurrentPage(type as any);
  };

  if (showTorLoading) {
    return <TorLoading onComplete={() => setShowTorLoading(false)} />;
  }

  if (loading) {
    return <div className="bg-[#0a0a0a] min-h-screen flex items-center justify-center text-[#00ff9d] font-mono">Loading circuit...</div>;
  }

  const handleNavigate = (page: any, params?: any) => {
    setCurrentPage(page);
    setNavigationParams(params);
  };

  const renderPage = () => {
    if (user && user.status === 'banned') {
      return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-4">
          <AlertTriangle className="w-24 h-24 text-[#8b0000] mb-6 animate-bounce" />
          <h2 className="text-4xl font-bold text-[#8b0000] mb-4 tracking-tighter">ACCESS DENIED: ACCOUNT TERMINATED</h2>
          <p className="text-[#00ff9d]/70 max-w-md mb-8 font-mono uppercase text-sm">
            Your identity has been flagged for violations of the ShadowNet protocol. 
            Your access to all encrypted circuits has been permanently revoked.
          </p>
          <div className="p-4 border border-[#8b0000]/30 bg-[#8b0000]/5 rounded-sm">
            <p className="text-[10px] text-[#8b0000] font-bold uppercase tracking-[0.2em]">Reason: Security Protocol Violation</p>
          </div>
          <button
            onClick={handleLogout}
            className="mt-8 px-8 py-2 border border-[#00ff9d]/20 text-[#00ff9d]/50 hover:text-[#00ff9d] hover:border-[#00ff9d] transition-all text-xs uppercase tracking-widest"
          >
            Disconnect from Node
          </button>
        </div>
      );
    }

    if (!user && currentPage !== 'disclaimer') {
      return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-4">
          <Shield className="w-16 h-16 text-[#8b0000] mb-6 animate-pulse" />
          <h2 className="text-3xl font-bold text-[#00ff9d] mb-4">AUTHENTICATION REQUIRED</h2>
          <p className="text-[#00ff9d]/70 max-w-md mb-8 font-mono">
            To access the ShadowNet portal, you must verify your identity through our encrypted gateway.
          </p>
          <button
            onClick={handleLogin}
            className="px-8 py-3 bg-[#8b0000] text-white font-bold rounded-sm hover:bg-[#a00000] transition-colors flex items-center gap-2 border border-[#8b0000] hover:border-[#ff0000] shadow-[0_0_15px_rgba(139,0,0,0.3)]"
          >
            <Lock className="w-4 h-4" />
            ENTER GATEWAY
          </button>
        </div>
      );
    }

    switch (currentPage) {
      case 'home': return <Home onNavigate={setCurrentPage} />;
      case 'dashboard': return <Dashboard user={user!} onNavigate={handleNavigate} />;
      case 'module': return <ModulePlayer user={user!} moduleId={navigationParams?.moduleId} onBack={() => setCurrentPage('dashboard')} onNavigate={handleNavigate} />;
      case 'quiz': return <Quiz user={user!} moduleId={navigationParams?.moduleId} onComplete={() => setCurrentPage('dashboard')} />;
      case 'market': return <Market user={user!} />;
      case 'chat': return <Chat user={user!} />;
      case 'forums': return <Forums user={user!} />;
      case 'services': return <Services />;
      case 'admin': return <Admin user={user!} />;
      case 'account': return <Account user={user!} onLogout={handleLogout} />;
      case 'disclaimer': return <Disclaimer onBack={() => setCurrentPage('home')} />;
      default: return <Home onNavigate={setCurrentPage} />;
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#00ff9d] font-mono selection:bg-[#8b0000] selection:text-white">
      {/* Scanline Effect */}
      <div className="fixed inset-0 pointer-events-none z-50 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%]" />
      
      {/* Top Bar */}
      <header className="border-b border-[#00ff9d]/20 p-4 bg-[#0d0d0d] sticky top-0 z-40">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#8b0000] rounded-full flex items-center justify-center border border-[#ff0000]/50 shadow-[0_0_10px_rgba(139,0,0,0.5)]">
              <Terminal className="text-white w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tighter text-[#00ff9d]">
                SHADOW<span className="text-[#8b0000]">NET</span>
              </h1>
              <div className="flex items-center gap-2 text-[10px] text-[#00ff9d]/50">
                <span className="w-2 h-2 bg-[#00ff9d] rounded-full animate-pulse" />
                <span className="font-mono">{onionAddress}</span>
              </div>
            </div>
          </div>

            <div className="flex items-center gap-4">
              <OnlineUsersCounter />
              
              {user && (
                <div className="relative">
                  <button 
                    onClick={() => setIsNotificationOpen(!isNotificationOpen)}
                    className="p-2 text-[#00ff9d]/30 hover:text-[#00ff9d] transition-colors relative"
                    title="Notifications"
                  >
                    <MessageSquare className="w-5 h-5" />
                    {unreadChatCount > 0 && (
                      <span className="absolute top-1 right-1 flex h-3 w-3 items-center justify-center rounded-full bg-[#8b0000] text-[7px] text-white animate-pulse">
                        {unreadChatCount}
                      </span>
                    )}
                  </button>

                  <AnimatePresence>
                    {isNotificationOpen && (
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="absolute right-0 mt-2 w-64 bg-[#0d0d0d] border border-[#00ff9d]/20 rounded-sm shadow-2xl z-50 p-4 space-y-4"
                      >
                        <div className="flex justify-between items-center border-b border-[#00ff9d]/10 pb-2">
                          <span className="text-[10px] font-bold uppercase tracking-widest text-[#00ff9d]">Incoming Transmissions</span>
                          <span className="text-[8px] text-[#00ff9d]/30">{unreadChatCount} New</span>
                        </div>
                        <div className="max-h-48 overflow-y-auto no-scrollbar space-y-2">
                          {unreadMessages.length > 0 ? unreadMessages.map(msg => (
                            <button 
                              key={msg.id}
                              onClick={() => {
                                setCurrentPage('chat');
                                setIsNotificationOpen(false);
                              }}
                              className="w-full text-left p-2 hover:bg-[#00ff9d]/5 border border-transparent hover:border-[#00ff9d]/10 transition-all group relative overflow-hidden"
                            >
                              <div className="flex items-start gap-2">
                                <div className="w-6 h-6 bg-[#8b0000]/20 rounded-full flex items-center justify-center border border-[#8b0000]/30 mt-0.5">
                                  <Terminal className="w-3 h-3 text-[#8b0000]" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex justify-between items-center mb-0.5">
                                    <span className="text-[9px] text-[#00ff9d] font-bold uppercase tracking-tighter truncate">
                                      {msg.senderName}
                                    </span>
                                    <span className="text-[7px] text-[#00ff9d]/30 font-mono">
                                      {format(new Date(msg.timestamp), 'HH:mm')}
                                    </span>
                                  </div>
                                  <p className="text-[8px] text-[#00ff9d]/60 truncate leading-tight italic">
                                    {msg.displayText.length > 40 ? msg.displayText.slice(0, 40) + '...' : msg.displayText}
                                  </p>
                                </div>
                              </div>
                              {/* Glitch line effect on hover */}
                              <div className="absolute bottom-0 left-0 w-full h-[1px] bg-[#00ff9d]/0 group-hover:bg-[#00ff9d]/20 transition-all" />
                            </button>
                          )) : (
                            <p className="text-[8px] text-[#00ff9d]/30 text-center py-4 uppercase tracking-widest">No new transmissions</p>
                          )}
                        </div>
                        <button 
                          onClick={() => {
                            setCurrentPage('chat');
                            setIsNotificationOpen(false);
                          }}
                          className="w-full py-2 bg-[#8b0000]/10 border border-[#8b0000]/30 text-[#8b0000] text-[8px] font-bold uppercase tracking-widest hover:bg-[#8b0000] hover:text-white transition-all"
                        >
                          Open Secure Terminal
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}

              <button 
                onClick={() => setSoundEnabled(!soundEnabled)}
                className="p-2 text-[#00ff9d]/30 hover:text-[#00ff9d] transition-colors"
                title={soundEnabled ? "Mute" : "Unmute"}
              >
                {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              </button>
              {user && (
                <div className="flex items-center gap-6 text-sm">
                  <div className="flex flex-col items-end">
                    <span className="text-[#00ff9d]/50 text-[10px] uppercase">Balance</span>
                    <span className="text-[#00ff9d] font-bold">{formatBtc(user.balance)}</span>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-[#8b0000]/50 text-[10px] uppercase">Debt</span>
                    <span className="text-[#8b0000] font-bold">{formatBtc(user.debt || 0)}</span>
                  </div>
                  <div className="h-8 w-px bg-[#00ff9d]/20" />
                  <div className="flex items-center gap-3">
                    <div className="text-right hidden sm:block">
                      <p className="font-bold text-xs">{user.displayName}</p>
                      <p className="text-[10px] text-[#00ff9d]/50 uppercase">{user.role}</p>
                    </div>
                    <button 
                      onClick={handleLogout}
                      className="p-2 hover:bg-[#8b0000]/20 rounded-full transition-colors text-[#8b0000]"
                      title="Logout"
                    >
                      <LogOut className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

      {/* Main Navigation */}
      {user && (
        <nav className="bg-[#0d0d0d] border-b border-[#00ff9d]/10 sticky top-[73px] z-30 overflow-x-auto no-scrollbar">
          <div className="max-w-7xl mx-auto flex">
            {[
              { id: 'home', label: 'Hidden Wiki', icon: Info },
              { id: 'dashboard', label: 'Training', icon: BookOpen },
              { id: 'market', label: 'Black Market', icon: ShoppingCart },
              { id: 'chat', label: 'Private Chat', icon: MessageSquare, badge: unreadChatCount },
              { id: 'services', label: 'Services', icon: Terminal },
              { id: 'forums', label: 'Forums', icon: Users },
              { id: 'account', label: 'Profile', icon: Settings },
            ].filter(item => unlockedFeatures.includes(item.id)).map((item) => (
              <button
                key={item.id}
                onClick={() => setCurrentPage(item.id as any)}
                className={`flex items-center gap-2 px-6 py-4 text-xs font-bold uppercase tracking-widest transition-all border-b-2 relative ${
                  currentPage === item.id 
                    ? 'border-[#8b0000] text-[#00ff9d] bg-[#8b0000]/5' 
                    : 'border-transparent text-[#00ff9d]/40 hover:text-[#00ff9d] hover:bg-[#00ff9d]/5'
                }`}
              >
                <item.icon className="w-4 h-4" />
                {item.label}
                {item.badge > 0 && (
                  <span className="absolute top-2 right-2 flex h-4 w-4 items-center justify-center rounded-full bg-[#8b0000] text-[8px] text-white animate-pulse">
                    {item.badge}
                  </span>
                )}
              </button>
            ))}
          </div>
        </nav>
      )}

      {/* News Ticker */}
      <div className="bg-[#8b0000]/10 border-b border-[#8b0000]/20 py-1 overflow-hidden whitespace-nowrap">
        <div className="flex animate-marquee gap-8">
          {[
            "VULNERABILITY EXPLOITED IN MAJOR BANKING SYSTEM",
            "NEW VENDOR 'SILK_ROAD_V3' NOW ACTIVE",
            "ESCROW SERVICE SEIZED BY INTERPOL - USE AT OWN RISK",
            "BTC PRICE SURGE: DARK MARKET ACTIVITY INCREASING",
            "REMINDER: ALWAYS USE PGP ENCRYPTION FOR SENSITIVE DATA",
            "HACKER GROUP 'VOID' CLAIMS RESPONSIBILITY FOR DATA LEAK"
          ].map((news, i) => (
            <span key={`news-${i}`} className="text-[10px] font-bold text-[#8b0000] uppercase tracking-widest">
              [NEWS] {news}
            </span>
          ))}
        </div>
      </div>

      {/* Content */}
      <main className="max-w-7xl mx-auto p-4 md:p-8">
        {renderPage()}
      </main>

      {/* Tricks */}
      <AnimatePresence>
        {showRansomware && <RansomwarePopup key="ransomware-popup" onClose={() => setShowRansomware(false)} />}
        {showPhishing && <PhishingAlert key="phishing-alert" onClose={() => setShowPhishing(false)} />}
      </AnimatePresence>

      {/* Hidden Terminal */}
      <HiddenTerminal 
        user={user!}
        isOpen={isTerminalOpen} 
        onClose={() => setIsTerminalOpen(false)} 
        onUnlock={handleUnlock}
        onAdminAccess={() => setIsAdminGatewayOpen(true)}
      />

      {/* Admin Gateway */}
      <AdminGateway 
        isOpen={isAdminGatewayOpen} 
        onClose={() => setIsAdminGatewayOpen(false)} 
        onSuccess={() => {
          setIsAdminGatewayOpen(false);
          setCurrentPage('admin');
        }}
      />

      {/* Footer */}
      <footer className="mt-auto border-t border-[#00ff9d]/10 p-8 bg-[#0d0d0d]">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8 opacity-50">
          <div className="text-center md:text-left">
            <p className="text-xs uppercase tracking-widest mb-2">ShadowNet Simulator v4.2.0</p>
            <p className="text-[10px]">For educational and entertainment purposes only. No actual illegal activities occur here.</p>
          </div>
          <div className="flex gap-6">
            <button onClick={() => setIsTerminalOpen(true)} className="text-[10px] uppercase hover:text-[#00ff9d] transition-colors flex items-center gap-1">
              <Cpu className="w-3 h-3" />
              Hidden CLI
            </button>
            <button onClick={() => setCurrentPage('disclaimer')} className="text-[10px] uppercase hover:text-[#00ff9d] transition-colors">Disclaimer</button>
            <span className="text-[10px] uppercase">Security: High</span>
            <span className="text-[10px] uppercase">Nodes: 3 Active</span>
          </div>
        </div>
      </footer>

      <style>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee {
          display: inline-flex;
          animation: marquee 30s linear infinite;
        }
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}
