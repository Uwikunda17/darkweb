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
  const [activeTab, setActiveTab] = useState<'codes' | 'vendors' | 'chats' | 'modules' | 'users' | 'orders' | 'products' | 'services' | 'settings'>('codes');
  const [allChats, setAllChats] = useState<any[]>([]);
  const [modules, setModules] = useState<any[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [marketItems, setMarketItems] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [siteSettings, setSiteSettings] = useState<any>({});
  const [newVendor, setNewVendor] = useState({ name: '', category: '', description: '' });
  const [newItem, setNewItem] = useState({ title: '', price: 0, description: '', category: '', vendorId: '', imageUrl: '' });
  const [newService, setNewService] = useState({ title: '', price: '', description: '', icon: 'Terminal', status: 'ONLINE', warning: '' });

  const [newModule, setNewModule] = useState({ title: '', description: '', category: 'phishing', difficulty: 'beginner', points: 100, icon: 'Shield', scenario: '', educationalOutcome: '', redFlags: '', bestPractices: '' });

  useEffect(() => {
    if (user.role !== 'admin') return;

    const unsubscribeUsers = onSnapshot(collection(db, 'users'), (snapshot) => {
      setUsers(snapshot.docs.map(doc => ({ ...doc.data() } as UserProfile)));
    });

    const unsubscribeOrders = onSnapshot(collection(db, 'orders'), (snapshot) => {
      setOrders(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    const unsubscribeMarket = onSnapshot(collection(db, 'marketItems'), (snapshot) => {
      setMarketItems(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    const unsubscribeServices = onSnapshot(collection(db, 'services'), (snapshot) => {
      setServices(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    const unsubscribeSettings = onSnapshot(doc(db, 'settings', 'site'), (snapshot) => {
      if (snapshot.exists()) setSiteSettings(snapshot.data());
    });

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
      unsubscribeUsers();
      unsubscribeOrders();
      unsubscribeMarket();
      unsubscribeServices();
      unsubscribeSettings();
      unsubscribeChats();
      unsubscribeCodes();
      unsubscribeModules();
    };
  }, [user]);

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItem.title || !newItem.vendorId) return;
    try {
      await addDoc(collection(db, 'marketItems'), newItem);
      setNewItem({ title: '', price: 0, description: '', category: '', vendorId: '', imageUrl: '' });
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'marketItems');
    }
  };

  const handleAddService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newService.title) return;
    try {
      await addDoc(collection(db, 'services'), newService);
      setNewService({ title: '', price: '', description: '', icon: 'Terminal', status: 'ONLINE', warning: '' });
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'services');
    }
  };

  const updateSiteSettings = async (key: string, value: any) => {
    try {
      await setDoc(doc(db, 'settings', 'site'), { [key]: value }, { merge: true });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, 'settings/site');
    }
  };

  const deleteUser = async (userId: string) => {
    if (!window.confirm('Delete this user?')) return;
    try {
      await deleteDoc(doc(db, 'users', userId));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `users/${userId}`);
    }
  };

  const toggleUserStatus = async (userId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'banned' : 'active';
    if (!window.confirm(`Are you sure you want to ${newStatus === 'banned' ? 'BAN' : 'UNBAN'} this user?`)) return;
    try {
      await updateDoc(doc(db, 'users', userId), { status: newStatus });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${userId}`);
    }
  };

  const deleteOrder = async (orderId: string) => {
    if (!window.confirm('Delete this order?')) return;
    try {
      await deleteDoc(doc(db, 'orders', orderId));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `orders/${orderId}`);
    }
  };

  const deleteItem = async (itemId: string) => {
    if (!window.confirm('Delete this item?')) return;
    try {
      await deleteDoc(doc(db, 'marketItems', itemId));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `marketItems/${itemId}`);
    }
  };

  const deleteService = async (serviceId: string) => {
    if (!window.confirm('Delete this service?')) return;
    try {
      await deleteDoc(doc(db, 'services', serviceId));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `services/${serviceId}`);
    }
  };

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

  const handleAddModule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newModule.title) return;
    try {
      const moduleData = {
        ...newModule,
        redFlags: newModule.redFlags.split('\n').filter(f => f.trim()),
        bestPractices: newModule.bestPractices.split('\n').filter(b => b.trim()),
        isActive: true
      };
      await addDoc(collection(db, 'modules'), moduleData);
      setNewModule({ title: '', description: '', category: 'phishing', difficulty: 'beginner', points: 100, icon: 'Shield', scenario: '', educationalOutcome: '', redFlags: '', bestPractices: '' });
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
          <div className="flex items-center gap-3 text-[#8b0000]">
            <Shield className="w-8 h-8" />
            <GlitchText text="ROOT CONTROL CENTER" className="text-3xl font-black" />
          </div>
          <p className="text-[#00ff9d]/50 text-xs uppercase tracking-widest">ShadowNet Kernel v4.2.0-STABLE | Authorized Access Only</p>
        </div>
        <div className="flex gap-4">
          <div className="bg-[#8b0000]/5 border border-[#8b0000]/20 p-3 rounded-sm">
            <p className="text-[8px] text-[#8b0000] uppercase font-bold">Total Operatives</p>
            <p className="text-xl font-black text-white">{users.length}</p>
          </div>
          <div className="bg-[#00ff9d]/5 border border-[#00ff9d]/20 p-3 rounded-sm">
            <p className="text-[8px] text-[#00ff9d] uppercase font-bold">Active Circuits</p>
            <p className="text-xl font-black text-white">{codes.filter(c => c.isActive).length}</p>
          </div>
          <div className="bg-[#8b0000]/5 border border-[#8b0000]/20 p-3 rounded-sm">
            <p className="text-[8px] text-[#8b0000] uppercase font-bold">Total Revenue</p>
            <p className="text-xl font-black text-white">{orders.reduce((acc, o) => acc + (o.price || 0), 0).toFixed(4)} BTC</p>
          </div>
        </div>
      </header>

      <div className="flex gap-4 border-b border-[#00ff9d]/10 mb-8 overflow-x-auto no-scrollbar">
        {[
          { id: 'codes', label: 'Access Codes', icon: Key },
          { id: 'vendors', label: 'Vendors', icon: Users },
          { id: 'products', label: 'Products', icon: Plus },
          { id: 'services', label: 'Services', icon: Terminal },
          { id: 'modules', label: 'Modules', icon: BookOpen },
          { id: 'users', label: 'Users', icon: Users },
          { id: 'orders', label: 'Orders', icon: Shield },
          { id: 'chats', label: 'Chats', icon: MessageSquare },
          { id: 'settings', label: 'Settings', icon: Settings },
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

        {activeTab === 'users' && (
          <section className="lg:col-span-3 border border-[#00ff9d]/10 bg-[#0d0d0d] p-8 rounded-sm space-y-8">
            <h3 className="text-lg font-bold text-[#00ff9d] uppercase tracking-widest">User Directory</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#00ff9d]/10">
                    <th className="pb-4 text-[10px] text-[#00ff9d]/50 uppercase tracking-widest font-bold">User</th>
                    <th className="pb-4 text-[10px] text-[#00ff9d]/50 uppercase tracking-widest font-bold">Role</th>
                    <th className="pb-4 text-[10px] text-[#00ff9d]/50 uppercase tracking-widest font-bold">Status</th>
                    <th className="pb-4 text-[10px] text-[#00ff9d]/50 uppercase tracking-widest font-bold">Balance</th>
                    <th className="pb-4 text-[10px] text-[#00ff9d]/50 uppercase tracking-widest font-bold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#00ff9d]/5">
                  {users.map((u) => (
                    <tr key={u.uid} className="hover:bg-[#00ff9d]/5 transition-colors">
                      <td className="py-4">
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-[#00ff9d]">{u.displayName}</span>
                          <span className="text-[10px] text-[#00ff9d]/30">{u.email}</span>
                        </div>
                      </td>
                      <td className="py-4 text-xs text-[#00ff9d]/70 uppercase">{u.role}</td>
                      <td className="py-4">
                        <button 
                          onClick={() => toggleUserStatus(u.uid, u.status || 'active')}
                          className={`px-2 py-1 text-[8px] font-bold uppercase border rounded-full transition-all ${
                            (u.status || 'active') === 'active' 
                              ? 'text-[#00ff9d] border-[#00ff9d]/30 bg-[#00ff9d]/5 hover:bg-[#8b0000]/20 hover:border-[#8b0000]/30 hover:text-[#8b0000]' 
                              : 'text-[#8b0000] border-[#8b0000]/30 bg-[#8b0000]/5 hover:bg-[#00ff9d]/20 hover:border-[#00ff9d]/30 hover:text-[#00ff9d]'
                          }`}
                        >
                          {u.status || 'active'}
                        </button>
                      </td>
                      <td className="py-4 text-xs text-[#00ff9d] font-mono">{u.balance} BTC</td>
                      <td className="py-4 text-right space-x-2">
                        <button onClick={() => deleteUser(u.uid)} className="text-[#8b0000]/50 hover:text-[#8b0000] transition-colors" title="Delete User">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {activeTab === 'orders' && (
          <section className="lg:col-span-3 border border-[#00ff9d]/10 bg-[#0d0d0d] p-8 rounded-sm space-y-8">
            <h3 className="text-lg font-bold text-[#00ff9d] uppercase tracking-widest">Order History</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {orders.map(order => (
                <div key={order.id} className="p-4 border border-[#00ff9d]/10 bg-[#0a0a0a] space-y-2">
                  <div className="flex justify-between text-[10px] text-[#00ff9d]/50 uppercase">
                    <span>Order: {order.id.slice(0, 8)}</span>
                    <span>{order.timestamp ? format(new Date(order.timestamp), 'MMM dd HH:mm') : 'N/A'}</span>
                  </div>
                  <p className="text-xs text-[#00ff9d] font-bold">{order.productName || 'Unknown Product'}</p>
                  <p className="text-[10px] text-[#00ff9d]/70">Buyer: {users.find(u => u.uid === order.userId)?.displayName || order.userId}</p>
                  <p className="text-xs text-[#8b0000] font-mono">{order.price} BTC</p>
                  <button onClick={() => deleteOrder(order.id)} className="text-[8px] text-[#8b0000] uppercase font-bold hover:underline">Cancel Order</button>
                </div>
              ))}
            </div>
          </section>
        )}

        {activeTab === 'products' && (
          <>
            <section className="lg:col-span-1 border border-[#00ff9d]/10 bg-[#0d0d0d] p-8 rounded-sm space-y-8">
              <h3 className="text-lg font-bold text-[#00ff9d] uppercase tracking-widest">New Market Item</h3>
              <form onSubmit={handleAddItem} className="space-y-4">
                <input 
                  type="text" 
                  placeholder="Item Title" 
                  value={newItem.title}
                  onChange={(e) => setNewItem({...newItem, title: e.target.value})}
                  className="w-full bg-[#0a0a0a] border border-[#00ff9d]/20 rounded-sm py-3 px-4 text-xs focus:outline-none focus:border-[#00ff9d]"
                />
                <input 
                  type="number" 
                  placeholder="Price (BTC)" 
                  value={newItem.price}
                  onChange={(e) => setNewItem({...newItem, price: parseFloat(e.target.value)})}
                  className="w-full bg-[#0a0a0a] border border-[#00ff9d]/20 rounded-sm py-3 px-4 text-xs focus:outline-none focus:border-[#00ff9d]"
                />
                <input 
                  type="text" 
                  placeholder="Category" 
                  value={newItem.category}
                  onChange={(e) => setNewItem({...newItem, category: e.target.value})}
                  className="w-full bg-[#0a0a0a] border border-[#00ff9d]/20 rounded-sm py-3 px-4 text-xs focus:outline-none focus:border-[#00ff9d]"
                />
                <select 
                  value={newItem.vendorId}
                  onChange={(e) => setNewItem({...newItem, vendorId: e.target.value})}
                  className="w-full bg-[#0a0a0a] border border-[#00ff9d]/20 rounded-sm py-3 px-4 text-xs focus:outline-none focus:border-[#00ff9d]"
                >
                  <option value="">Select Vendor</option>
                  {vendors.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                </select>
                <input 
                  type="text" 
                  placeholder="Image URL" 
                  value={newItem.imageUrl}
                  onChange={(e) => setNewItem({...newItem, imageUrl: e.target.value})}
                  className="w-full bg-[#0a0a0a] border border-[#00ff9d]/20 rounded-sm py-3 px-4 text-xs focus:outline-none focus:border-[#00ff9d]"
                />
                <textarea 
                  placeholder="Description" 
                  value={newItem.description}
                  onChange={(e) => setNewItem({...newItem, description: e.target.value})}
                  className="w-full bg-[#0a0a0a] border border-[#00ff9d]/20 rounded-sm py-3 px-4 text-xs h-24 focus:outline-none focus:border-[#00ff9d]"
                />
                <button type="submit" className="w-full py-4 bg-[#8b0000] text-white font-bold uppercase tracking-widest hover:bg-[#a00000]">Add Item</button>
              </form>
            </section>
            <section className="lg:col-span-2 border border-[#00ff9d]/10 bg-[#0d0d0d] p-8 rounded-sm space-y-8">
              <h3 className="text-lg font-bold text-[#00ff9d] uppercase tracking-widest">Market Inventory</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {marketItems.map(p => (
                  <div key={p.id} className="p-4 border border-[#00ff9d]/10 bg-[#0a0a0a] flex gap-4">
                    {p.imageUrl && <img src={p.imageUrl} alt={p.title} className="w-12 h-12 object-cover border border-[#00ff9d]/20" referrerPolicy="no-referrer" />}
                    <div className="flex-1">
                      <p className="text-xs font-bold text-[#00ff9d]">{p.title}</p>
                      <p className="text-[10px] text-[#00ff9d]/50 uppercase">{vendors.find(v => v.id === p.vendorId)?.name || p.vendorId}</p>
                      <p className="text-xs text-[#8b0000] font-mono">{p.price} BTC</p>
                    </div>
                    <button onClick={() => deleteItem(p.id)} className="text-[#8b0000]/50 hover:text-[#8b0000]"><Trash2 className="w-4 h-4" /></button>
                  </div>
                ))}
              </div>
            </section>
          </>
        )}

        {activeTab === 'services' && (
          <>
            <section className="lg:col-span-1 border border-[#00ff9d]/10 bg-[#0d0d0d] p-8 rounded-sm space-y-8">
              <h3 className="text-lg font-bold text-[#00ff9d] uppercase tracking-widest">New Service</h3>
              <form onSubmit={handleAddService} className="space-y-4">
                <input 
                  type="text" 
                  placeholder="Service Title" 
                  value={newService.title}
                  onChange={(e) => setNewService({...newService, title: e.target.value})}
                  className="w-full bg-[#0a0a0a] border border-[#00ff9d]/20 rounded-sm py-3 px-4 text-xs focus:outline-none focus:border-[#00ff9d]"
                />
                <input 
                  type="text" 
                  placeholder="Price (e.g. 0.05 BTC / Hour)" 
                  value={newService.price}
                  onChange={(e) => setNewService({...newService, price: e.target.value})}
                  className="w-full bg-[#0a0a0a] border border-[#00ff9d]/20 rounded-sm py-3 px-4 text-xs focus:outline-none focus:border-[#00ff9d]"
                />
                <input 
                  type="text" 
                  placeholder="Warning Text" 
                  value={newService.warning}
                  onChange={(e) => setNewService({...newService, warning: e.target.value})}
                  className="w-full bg-[#0a0a0a] border border-[#00ff9d]/20 rounded-sm py-3 px-4 text-xs focus:outline-none focus:border-[#00ff9d]"
                />
                <textarea 
                  placeholder="Description" 
                  value={newService.description}
                  onChange={(e) => setNewService({...newService, description: e.target.value})}
                  className="w-full bg-[#0a0a0a] border border-[#00ff9d]/20 rounded-sm py-3 px-4 text-xs h-24 focus:outline-none focus:border-[#00ff9d]"
                />
                <button type="submit" className="w-full py-4 bg-[#8b0000] text-white font-bold uppercase tracking-widest hover:bg-[#a00000]">Add Service</button>
              </form>
            </section>
            <section className="lg:col-span-2 border border-[#00ff9d]/10 bg-[#0d0d0d] p-8 rounded-sm space-y-8">
              <h3 className="text-lg font-bold text-[#00ff9d] uppercase tracking-widest">Service Catalog</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {services.map(s => (
                  <div key={s.id} className="p-4 border border-[#00ff9d]/10 bg-[#0a0a0a] flex justify-between items-center">
                    <div>
                      <p className="text-xs font-bold text-[#00ff9d]">{s.title}</p>
                      <p className="text-xs text-[#8b0000] font-mono">{s.price}</p>
                    </div>
                    <button onClick={() => deleteService(s.id)} className="text-[#8b0000]/50 hover:text-[#8b0000]"><Trash2 className="w-4 h-4" /></button>
                  </div>
                ))}
              </div>
            </section>
          </>
        )}

        {activeTab === 'settings' && (
          <section className="lg:col-span-3 border border-[#00ff9d]/10 bg-[#0d0d0d] p-8 rounded-sm space-y-8">
            <h3 className="text-lg font-bold text-[#00ff9d] uppercase tracking-widest">Website Configuration</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <div className="flex justify-between items-center p-4 border border-[#00ff9d]/10 bg-[#0a0a0a]">
                  <span className="text-xs text-[#00ff9d]">Maintenance Mode</span>
                  <button 
                    onClick={() => updateSiteSettings('maintenance', !siteSettings.maintenance)}
                    className={`px-4 py-1 text-[8px] font-bold uppercase border ${siteSettings.maintenance ? 'bg-[#8b0000] text-white' : 'text-[#00ff9d] border-[#00ff9d]/30'}`}
                  >
                    {siteSettings.maintenance ? 'Enabled' : 'Disabled'}
                  </button>
                </div>
                <div className="flex justify-between items-center p-4 border border-[#00ff9d]/10 bg-[#0a0a0a]">
                  <span className="text-xs text-[#00ff9d]">New Registrations</span>
                  <button 
                    onClick={() => updateSiteSettings('registrations', !siteSettings.registrations)}
                    className={`px-4 py-1 text-[8px] font-bold uppercase border ${!siteSettings.registrations ? 'bg-[#8b0000] text-white' : 'text-[#00ff9d] border-[#00ff9d]/30'}`}
                  >
                    {siteSettings.registrations ? 'Open' : 'Closed'}
                  </button>
                </div>
              </div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] text-[#00ff9d]/50 uppercase tracking-widest">System Message</label>
                  <textarea 
                    value={siteSettings.systemMessage || ''}
                    onChange={(e) => updateSiteSettings('systemMessage', e.target.value)}
                    className="w-full bg-[#0a0a0a] border border-[#00ff9d]/20 rounded-sm py-3 px-4 text-xs h-24 focus:outline-none focus:border-[#00ff9d]"
                    placeholder="Global alert message..."
                  />
                </div>
              </div>
            </div>
          </section>
        )}

        {activeTab === 'modules' && (
          <>
            <section className="lg:col-span-1 border border-[#00ff9d]/10 bg-[#0d0d0d] p-8 rounded-sm space-y-8">
              <h3 className="text-lg font-bold text-[#00ff9d] uppercase tracking-widest">New Training</h3>
              <form onSubmit={handleAddModule} className="space-y-4">
                <input 
                  type="text" 
                  placeholder="Module Title" 
                  value={newModule.title}
                  onChange={(e) => setNewModule({...newModule, title: e.target.value})}
                  className="w-full bg-[#0a0a0a] border border-[#00ff9d]/20 rounded-sm py-3 px-4 text-xs focus:outline-none focus:border-[#00ff9d]"
                />
                <select 
                  value={newModule.category}
                  onChange={(e) => setNewModule({...newModule, category: e.target.value as any})}
                  className="w-full bg-[#0a0a0a] border border-[#00ff9d]/20 rounded-sm py-3 px-4 text-xs focus:outline-none focus:border-[#00ff9d]"
                >
                  <option value="phishing">Phishing</option>
                  <option value="ransomware">Ransomware</option>
                  <option value="scams">Scams</option>
                  <option value="social-engineering">Social Engineering</option>
                  <option value="network">Network</option>
                  <option value="passwords">Passwords</option>
                  <option value="malware">Malware</option>
                </select>
                <select 
                  value={newModule.difficulty}
                  onChange={(e) => setNewModule({...newModule, difficulty: e.target.value as any})}
                  className="w-full bg-[#0a0a0a] border border-[#00ff9d]/20 rounded-sm py-3 px-4 text-xs focus:outline-none focus:border-[#00ff9d]"
                >
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
                <input 
                  type="number" 
                  placeholder="Points" 
                  value={newModule.points}
                  onChange={(e) => setNewModule({...newModule, points: parseInt(e.target.value)})}
                  className="w-full bg-[#0a0a0a] border border-[#00ff9d]/20 rounded-sm py-3 px-4 text-xs focus:outline-none focus:border-[#00ff9d]"
                />
                <textarea 
                  placeholder="Description" 
                  value={newModule.description}
                  onChange={(e) => setNewModule({...newModule, description: e.target.value})}
                  className="w-full bg-[#0a0a0a] border border-[#00ff9d]/20 rounded-sm py-3 px-4 text-xs h-20 focus:outline-none focus:border-[#00ff9d]"
                />
                <textarea 
                  placeholder="Scenario" 
                  value={newModule.scenario}
                  onChange={(e) => setNewModule({...newModule, scenario: e.target.value})}
                  className="w-full bg-[#0a0a0a] border border-[#00ff9d]/20 rounded-sm py-3 px-4 text-xs h-20 focus:outline-none focus:border-[#00ff9d]"
                />
                <textarea 
                  placeholder="Red Flags (one per line)" 
                  value={newModule.redFlags}
                  onChange={(e) => setNewModule({...newModule, redFlags: e.target.value})}
                  className="w-full bg-[#0a0a0a] border border-[#00ff9d]/20 rounded-sm py-3 px-4 text-xs h-20 focus:outline-none focus:border-[#00ff9d]"
                />
                <button type="submit" className="w-full py-4 bg-[#8b0000] text-white font-bold uppercase tracking-widest hover:bg-[#a00000]">Add Module</button>
              </form>
            </section>
            <section className="lg:col-span-2 border border-[#00ff9d]/10 bg-[#0d0d0d] p-8 rounded-sm space-y-8">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-bold text-[#00ff9d] uppercase tracking-widest">Training Modules</h3>
                <button 
                  onClick={seedModules}
                  className="px-4 py-2 bg-[#8b0000] text-white text-[10px] font-bold uppercase tracking-widest hover:bg-[#a00000]"
                >
                  Seed Defaults
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
          </>
        )}
      </div>
    </div>
  );
};

export default Admin;
