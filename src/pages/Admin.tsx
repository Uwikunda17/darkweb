import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, getDocs, addDoc, updateDoc, doc, deleteDoc, where, onSnapshot, setDoc } from 'firebase/firestore';
import { ChatCode, UserProfile, OperationType, Vendor } from '../types';
import { handleFirestoreError } from '../utils';
import { Settings, Plus, Trash2, RefreshCw, Key, Users, Shield, Lock, Check, X, Terminal, AlertTriangle, MessageSquare, BookOpen } from 'lucide-react';
import { GlitchText } from '../components/TorLoading';
import { format } from 'date-fns';

interface AdminProps {
  user: UserProfile;
}

const Admin: React.FC<AdminProps> = ({ user }) => {
  const [codes, setCodes] = useState<ChatCode[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [newCode, setNewCode] = useState('');
  const [selectedVendor, setSelectedVendor] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [activeTab, setActiveTab] = useState<'codes' | 'vendors' | 'chats' | 'modules'>('codes');
  const [allChats, setAllChats] = useState<any[]>([]);
  const [modules, setModules] = useState<any[]>([]);
  const [newVendor, setNewVendor] = useState({ name: '', category: '', description: '' });

  useEffect(() => {
    if (user.role !== 'admin') return;

    const unsubscribeChats = onSnapshot(collection(db, 'chats'), (snapshot) => {
      setAllChats(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    const fetchVendors = async () => {
      try {
        const q = query(collection(db, 'vendors'));
        const querySnapshot = await getDocs(q);
        const fetchedVendors = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Vendor));
        
        if (fetchedVendors.length === 0) {
          const seedVendors: Partial<Vendor>[] = [
            { name: "SILK_ROAD_V3", category: "General", rating: 4.8, description: "The original marketplace reborn." },
            { name: "VOID_HACKERS", category: "Hacking", rating: 4.9, description: "Professional exploit developers." },
            { name: "PHARMA_DIRECT", category: "Drugs", rating: 4.5, description: "Direct from the lab." },
            { name: "ID_FORGER", category: "Fake IDs", rating: 4.7, description: "High quality document forgery." }
          ];
          for (const v of seedVendors) {
            await addDoc(collection(db, 'vendors'), v);
          }
          fetchVendors();
          return;
        }
        setVendors(fetchedVendors);
      } catch (err) {
        handleFirestoreError(err, OperationType.LIST, 'vendors');
      }
    };

    const unsubscribeCodes = onSnapshot(collection(db, 'chatCodes'), (snapshot) => {
      const fetchedCodes = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as unknown as ChatCode));
      setCodes(fetchedCodes);
      setLoading(false);
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, 'chatCodes');
    });

    const unsubscribeModules = onSnapshot(collection(db, 'modules'), (snapshot) => {
      setModules(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'modules'));

    fetchVendors();
    return () => {
      unsubscribeChats();
      unsubscribeCodes();
      unsubscribeModules();
    };
  }, [user]);

  const handleAddVendor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVendor.name) return;
    try {
      await addDoc(collection(db, 'vendors'), {
        ...newVendor,
        rating: 5.0,
        id: Math.random().toString(36).substr(2, 9)
      });
      setNewVendor({ name: '', category: '', description: '' });
      setActiveTab('vendors');
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'vendors');
    }
  };

  const deleteVendor = async (vendorId: string) => {
    if (!window.confirm('Delete this vendor?')) return;
    try {
      const q = query(collection(db, 'vendors'), where('id', '==', vendorId));
      const snap = await getDocs(q);
      snap.forEach(async (d) => await deleteDoc(d.ref));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, 'vendors');
    }
  };

  const generateRandomCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 10; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setNewCode(result);
  };

  const handleAddCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCode || !selectedVendor) return;

    setIsAdding(true);
    try {
      await addDoc(collection(db, 'chatCodes'), {
        code: newCode.toUpperCase(),
        vendorId: selectedVendor,
        isActive: true,
        createdBy: user.uid
      });
      setNewCode('');
      setSelectedVendor('');
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'chatCodes');
    } finally {
      setIsAdding(false);
    }
  };

  const toggleCodeStatus = async (codeId: string, currentStatus: boolean) => {
    try {
      const codeRef = doc(db, 'chatCodes', codeId);
      await updateDoc(codeRef, { isActive: !currentStatus });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `chatCodes/${codeId}`);
    }
  };

  const deleteCode = async (codeId: string) => {
    if (!window.confirm('Are you sure you want to delete this access code?')) return;
    try {
      await deleteDoc(doc(db, 'chatCodes', codeId));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `chatCodes/${codeId}`);
    }
  };

  const seedModules = async () => {
    if (!window.confirm('Seed default training modules? This will add 10 modules.')) return;
    const defaultModules = [
      {
        id: 'phishing-101',
        title: 'Phishing Detection',
        description: 'Learn to identify malicious emails and fake login pages.',
        category: 'phishing',
        difficulty: 'beginner',
        points: 100,
        icon: 'Shield',
        scenario: 'A fake login page appears asking for your credentials.',
        educationalOutcome: 'Users will learn to check URLs and sender addresses.',
        redFlags: ['Mismatched URL', 'Urgent language', 'Suspicious sender'],
        bestPractices: ['Check URL', 'Enable 2FA', 'Report suspicious emails'],
        isActive: true
      },
      {
        id: 'ransomware-defense',
        title: 'Ransomware Response',
        description: 'What to do when your files are encrypted.',
        category: 'ransomware',
        difficulty: 'intermediate',
        points: 200,
        icon: 'Lock',
        scenario: 'A ransomware pop-up locks your screen.',
        educationalOutcome: 'Users will learn to disconnect from network and use backups.',
        redFlags: ['Sudden encryption', 'Ransom demand', 'System slowdown'],
        bestPractices: ['Regular backups', 'Disconnect network', 'Never pay ransom'],
        isActive: true
      },
      {
        id: 'social-engineering',
        title: 'Social Engineering',
        description: 'Defending against psychological manipulation.',
        category: 'scams',
        difficulty: 'intermediate',
        points: 150,
        icon: 'Users',
        scenario: 'Someone calls claiming to be IT support.',
        educationalOutcome: 'Users will learn to verify identity and never share passwords.',
        redFlags: ['Unexpected call', 'Request for password', 'Authority pressure'],
        bestPractices: ['Verify identity', 'Call back official number', 'Keep passwords private'],
        isActive: true
      }
    ];

    try {
      for (const m of defaultModules) {
        await setDoc(doc(db, 'modules', m.id), m);
      }
      alert('Modules seeded successfully.');
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'modules');
    }
  };

  const deleteModule = async (moduleId: string) => {
    if (!window.confirm('Delete this module?')) return;
    try {
      await deleteDoc(doc(db, 'modules', moduleId));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `modules/${moduleId}`);
    }
  };

  if (user.role !== 'admin') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8 space-y-6">
        <AlertTriangle className="w-16 h-16 text-[#8b0000] animate-pulse" />
        <h2 className="text-3xl font-black text-[#8b0000]">ACCESS DENIED</h2>
        <p className="text-[10px] text-[#00ff9d]/50 uppercase tracking-widest max-w-xs">
          This terminal is restricted to ShadowNet administrators only. 
          Your IP address has been logged and reported to the Void.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-12 animate-in slide-in-from-top duration-700">
      <header className="flex flex-col md:flex-row justify-between items-end gap-4">
        <div className="space-y-2">
          <GlitchText text="ADMIN TERMINAL" className="text-3xl font-black text-[#8b0000]" />
          <p className="text-[#00ff9d]/50 text-xs uppercase tracking-widest">System Control & Access Management</p>
        </div>
      </header>

      <div className="flex gap-4 border-b border-[#00ff9d]/10 mb-8">
        {[
          { id: 'codes', label: 'Access Codes', icon: Key },
          { id: 'vendors', label: 'Vendors', icon: Users },
          { id: 'chats', label: 'Active Chats', icon: MessageSquare },
          { id: 'modules', label: 'Modules', icon: BookOpen },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-6 py-4 text-xs font-bold uppercase tracking-widest transition-all border-b-2 ${
              activeTab === tab.id 
                ? 'border-[#8b0000] text-[#00ff9d]' 
                : 'border-transparent text-[#00ff9d]/40 hover:text-[#00ff9d]'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {activeTab === 'codes' && (
          <>
            <section className="lg:col-span-1 border border-[#00ff9d]/10 bg-[#0d0d0d] p-8 rounded-sm space-y-8">
              <div className="flex items-center gap-3">
                <Key className="w-6 h-6 text-[#8b0000]" />
                <h3 className="text-lg font-bold text-[#00ff9d] uppercase tracking-widest">Generate Code</h3>
              </div>

              <form onSubmit={handleAddCode} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] text-[#00ff9d]/50 uppercase tracking-widest">Access Code</label>
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      placeholder="X-XXXX-XXXX-X" 
                      value={newCode}
                      onChange={(e) => setNewCode(e.target.value.toUpperCase())}
                      className="flex-1 bg-[#0a0a0a] border border-[#00ff9d]/20 rounded-sm py-3 px-4 text-xs font-mono tracking-widest focus:outline-none focus:border-[#00ff9d] transition-all"
                    />
                    <button 
                      type="button"
                      onClick={generateRandomCode}
                      className="p-3 bg-[#00ff9d]/5 border border-[#00ff9d]/20 text-[#00ff9d] hover:bg-[#00ff9d]/10 transition-all"
                      title="Randomize"
                    >
                      <RefreshCw className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] text-[#00ff9d]/50 uppercase tracking-widest">Assign to Vendor</label>
                  <select 
                    value={selectedVendor}
                    onChange={(e) => setSelectedVendor(e.target.value)}
                    className="w-full bg-[#0a0a0a] border border-[#00ff9d]/20 rounded-sm py-3 px-4 text-xs focus:outline-none focus:border-[#00ff9d] transition-all"
                  >
                    <option value="">Select Vendor</option>
                    {vendors.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                  </select>
                </div>

                <button 
                  type="submit"
                  disabled={isAdding || !newCode || !selectedVendor}
                  className="w-full py-4 bg-[#8b0000] text-white font-bold uppercase tracking-widest hover:bg-[#a00000] disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Activate Access Code
                </button>
              </form>
            </section>

            <section className="lg:col-span-2 border border-[#00ff9d]/10 bg-[#0d0d0d] p-8 rounded-sm space-y-8">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <Terminal className="w-6 h-6 text-[#8b0000]" />
                  <h3 className="text-lg font-bold text-[#00ff9d] uppercase tracking-widest">Active Circuits</h3>
                </div>
                <span className="text-[10px] text-[#00ff9d]/30 uppercase tracking-widest">{codes.length} Codes Active</span>
              </div>

              <div className="overflow-x-auto no-scrollbar">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-[#00ff9d]/10">
                      <th className="pb-4 text-[10px] text-[#00ff9d]/50 uppercase tracking-widest font-bold">Code</th>
                      <th className="pb-4 text-[10px] text-[#00ff9d]/50 uppercase tracking-widest font-bold">Vendor</th>
                      <th className="pb-4 text-[10px] text-[#00ff9d]/50 uppercase tracking-widest font-bold">Status</th>
                      <th className="pb-4 text-[10px] text-[#00ff9d]/50 uppercase tracking-widest font-bold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#00ff9d]/5">
                    {codes.map((code: any) => (
                      <tr key={code.id} className="group hover:bg-[#00ff9d]/5 transition-colors">
                        <td className="py-4 font-mono text-xs text-[#00ff9d] tracking-widest">{code.code}</td>
                        <td className="py-4 text-xs text-[#00ff9d]/70">
                          {vendors.find(v => v.id === code.vendorId)?.name || code.vendorId}
                        </td>
                        <td className="py-4">
                          <button 
                            onClick={() => toggleCodeStatus(code.id, code.isActive)}
                            className={`flex items-center gap-2 text-[8px] px-2 py-1 rounded-full uppercase font-bold border transition-all ${
                              code.isActive 
                                ? 'text-[#00ff9d] border-[#00ff9d]/30 bg-[#00ff9d]/5 hover:bg-[#8b0000]/20 hover:border-[#8b0000]/30 hover:text-[#8b0000]' 
                                : 'text-[#8b0000] border-[#8b0000]/30 bg-[#8b0000]/5 hover:bg-[#00ff9d]/20 hover:border-[#00ff9d]/30 hover:text-[#00ff9d]'
                            }`}
                          >
                            {code.isActive ? <Check className="w-2 h-2" /> : <X className="w-2 h-2" />}
                            {code.isActive ? 'Active' : 'Revoked'}
                          </button>
                        </td>
                        <td className="py-4 text-right">
                          <button 
                            onClick={() => deleteCode(code.id)}
                            className="p-2 text-[#8b0000]/30 hover:text-[#8b0000] transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        )}

        {activeTab === 'vendors' && (
          <>
            <section className="lg:col-span-1 border border-[#00ff9d]/10 bg-[#0d0d0d] p-8 rounded-sm space-y-8">
              <div className="flex items-center gap-3">
                <Users className="w-6 h-6 text-[#8b0000]" />
                <h3 className="text-lg font-bold text-[#00ff9d] uppercase tracking-widest">Add Vendor</h3>
              </div>
              <form onSubmit={handleAddVendor} className="space-y-6">
                <input 
                  type="text" 
                  placeholder="Vendor Name" 
                  value={newVendor.name}
                  onChange={(e) => setNewVendor({...newVendor, name: e.target.value})}
                  className="w-full bg-[#0a0a0a] border border-[#00ff9d]/20 rounded-sm py-3 px-4 text-xs focus:outline-none focus:border-[#00ff9d] transition-all"
                />
                <input 
                  type="text" 
                  placeholder="Category" 
                  value={newVendor.category}
                  onChange={(e) => setNewVendor({...newVendor, category: e.target.value})}
                  className="w-full bg-[#0a0a0a] border border-[#00ff9d]/20 rounded-sm py-3 px-4 text-xs focus:outline-none focus:border-[#00ff9d] transition-all"
                />
                <textarea 
                  placeholder="Description" 
                  value={newVendor.description}
                  onChange={(e) => setNewVendor({...newVendor, description: e.target.value})}
                  className="w-full bg-[#0a0a0a] border border-[#00ff9d]/20 rounded-sm py-3 px-4 text-xs h-24 focus:outline-none focus:border-[#00ff9d] transition-all"
                />
                <button type="submit" className="w-full py-4 bg-[#8b0000] text-white font-bold uppercase tracking-widest hover:bg-[#a00000]">Add Vendor</button>
              </form>
            </section>
            <section className="lg:col-span-2 border border-[#00ff9d]/10 bg-[#0d0d0d] p-8 rounded-sm space-y-8">
              <h3 className="text-lg font-bold text-[#00ff9d] uppercase tracking-widest">Manage Vendors</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {vendors.map(v => (
                  <div key={v.id} className="p-4 border border-[#00ff9d]/10 bg-[#0a0a0a] flex justify-between items-center">
                    <div>
                      <p className="text-xs font-bold text-[#00ff9d]">{v.name}</p>
                      <p className="text-[10px] text-[#00ff9d]/50 uppercase">{v.category}</p>
                    </div>
                    <button onClick={() => deleteVendor(v.id)} className="text-[#8b0000]/50 hover:text-[#8b0000]"><Trash2 className="w-4 h-4" /></button>
                  </div>
                ))}
              </div>
            </section>
          </>
        )}

        {activeTab === 'chats' && (
          <section className="lg:col-span-3 border border-[#00ff9d]/10 bg-[#0d0d0d] p-8 rounded-sm space-y-8">
            <h3 className="text-lg font-bold text-[#00ff9d] uppercase tracking-widest">All Active Chats</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {allChats.map(chat => (
                <div key={chat.id} className="p-4 border border-[#00ff9d]/10 bg-[#0a0a0a] space-y-2">
                  <div className="flex justify-between text-[10px] text-[#00ff9d]/50 uppercase">
                    <span>ID: {chat.id.slice(0, 8)}</span>
                    <span>{chat.updatedAt ? format(new Date(chat.updatedAt), 'MMM dd HH:mm') : 'N/A'}</span>
                  </div>
                  <p className="text-xs text-[#00ff9d] font-bold">Participants: {chat.participants.length}</p>
                  <p className="text-[10px] text-[#00ff9d]/70 italic truncate">"{chat.lastMessage}"</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {activeTab === 'modules' && (
          <section className="lg:col-span-3 border border-[#00ff9d]/10 bg-[#0d0d0d] p-8 rounded-sm space-y-8">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold text-[#00ff9d] uppercase tracking-widest">Training Modules</h3>
              <button 
                onClick={seedModules}
                className="px-4 py-2 bg-[#8b0000] text-white text-[10px] font-bold uppercase tracking-widest hover:bg-[#a00000]"
              >
                Seed Default Modules
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {modules.map(module => (
                <div key={module.id} className="p-4 border border-[#00ff9d]/10 bg-[#0a0a0a] space-y-4">
                  <div className="flex justify-between items-start">
                    <h4 className="text-xs font-bold text-[#00ff9d] uppercase">{module.title}</h4>
                    <button onClick={() => deleteModule(module.id)} className="text-[#8b0000]/50 hover:text-[#8b0000]"><Trash2 className="w-4 h-4" /></button>
                  </div>
                  <p className="text-[10px] text-[#00ff9d]/50 line-clamp-2">{module.description}</p>
                  <div className="flex justify-between text-[8px] uppercase tracking-widest text-[#00ff9d]/30">
                    <span>{module.category}</span>
                    <span>{module.points} XP</span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
};

export default Admin;
