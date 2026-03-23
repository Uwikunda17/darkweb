import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, getDocs, query, where, addDoc, updateDoc, doc, getDoc, increment } from 'firebase/firestore';
import { MarketItem, UserProfile, OperationType } from '../types';
import { handleFirestoreError, formatBtc } from '../utils';
import { ShoppingCart, Shield, Lock, AlertTriangle, Search, Filter, CheckCircle, XCircle } from 'lucide-react';
import { GlitchText } from '../components/TorLoading';

interface MarketProps {
  user: UserProfile;
}

const Market: React.FC<MarketProps> = ({ user }) => {
  const [items, setItems] = useState<MarketItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<MarketItem | null>(null);
  const [purchaseStatus, setPurchaseStatus] = useState<'idle' | 'processing' | 'success' | 'scam' | 'insufficient'>('idle');
  const [searchQuery, setSearchQuery] = useState('');
  const [category, setCategory] = useState('All');
  const [isListingModalOpen, setIsListingModalOpen] = useState(false);
  const [newItem, setNewItem] = useState({
    title: '',
    price: '',
    category: 'Software',
    description: '',
    imageUrl: ''
  });

  const categories = ['All', 'Drugs', 'Hacked Accounts', 'Stolen Cards', 'Fake IDs', 'Weapons', 'Software'];
  const listingCategories = categories.filter(c => c !== 'All');

  useEffect(() => {
    const fetchItems = async () => {
      try {
        const q = query(collection(db, 'marketItems'));
        const querySnapshot = await getDocs(q);
        const fetchedItems = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as MarketItem));
        
        // If no items exist, seed some for the demo
        if (fetchedItems.length === 0) {
          const seedItems: Partial<MarketItem>[] = [
            { title: "Premium Hacked Netflix Accounts (x10)", price: 0.0005, category: "Hacked Accounts", vendorId: "v1", description: "Fresh accounts with 4K UHD subscription. 1 month warranty." },
            { title: "US Passport - High Quality Replica", price: 0.015, category: "Fake IDs", vendorId: "v2", description: "Scannable MRZ, UV features, high quality paper. Ships worldwide." },
            { title: "Stolen Visa Gold (x5) - $5k Limit", price: 0.008, category: "Stolen Cards", vendorId: "v3", description: "CVV included. High success rate for online shopping." },
            { title: "Remote Access Trojan (RAT) - FUD", price: 0.002, category: "Software", vendorId: "v4", description: "Fully undetectable by major AVs. 24/7 support included." },
            { title: "Glock 17 - 9mm (Untraceable)", price: 0.045, category: "Weapons", vendorId: "v5", description: "Serial number removed. 2 magazines included. Ships in parts." },
            { title: "Pure MDMA Crystals (10g)", price: 0.003, category: "Drugs", vendorId: "v6", description: "99% purity. Lab tested. Discreet shipping." }
          ];
          
          for (const item of seedItems) {
            await addDoc(collection(db, 'marketItems'), item);
          }
          fetchItems(); // Re-fetch
          return;
        }
        
        setItems(fetchedItems);
      } catch (error) {
        handleFirestoreError(error, OperationType.LIST, 'marketItems');
      } finally {
        setLoading(false);
      }
    };

    fetchItems();
  }, []);

  const handlePurchase = async () => {
    if (!selectedItem) return;
    
    // Strict balance check
    if (user.balance < selectedItem.price) {
      setPurchaseStatus('insufficient');
      return;
    }

    setPurchaseStatus('processing');
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // 30% chance of an "exit scam" simulation
    const isScam = Math.random() < 0.3;
    
    if (isScam) {
      setPurchaseStatus('scam');
    } else {
      try {
        // Update user balance
        const userRef = doc(db, 'users', user.uid);
        await updateDoc(userRef, {
          balance: increment(-selectedItem.price)
        });
        
        // Record order
        await addDoc(collection(db, 'orders'), {
          userId: user.uid,
          productId: selectedItem.id,
          productName: selectedItem.title,
          price: selectedItem.price,
          status: 'completed',
          timestamp: new Date().toISOString()
        });

        setPurchaseStatus('success');
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}`);
      }
    }
  };

  const handleListItem = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const itemData = {
        title: newItem.title,
        price: parseFloat(newItem.price),
        category: newItem.category,
        description: newItem.description,
        imageUrl: newItem.imageUrl,
        vendorId: user.uid,
        timestamp: new Date().toISOString()
      };

      await addDoc(collection(db, 'marketItems'), itemData);
      setIsListingModalOpen(false);
      setNewItem({ title: '', price: '', category: 'Software', description: '', imageUrl: '' });
      
      // Refresh items
      const q = query(collection(db, 'marketItems'));
      const querySnapshot = await getDocs(q);
      setItems(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as MarketItem)));
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'marketItems');
    }
  };

  const filteredItems = items.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = category === 'All' || item.category === category;
    return matchesSearch && matchesCategory;
  });

  if (loading) return <div className="text-[#00ff9d] font-mono">Scanning market...</div>;

  return (
    <div className="space-y-8 animate-in slide-in-from-bottom duration-700">
      <header className="flex flex-col md:flex-row justify-between items-end gap-4">
        <div className="space-y-2">
          <GlitchText text="BLACK MARKET" className="text-3xl font-black text-[#8b0000]" />
          <p className="text-[#00ff9d]/50 text-xs uppercase tracking-widest">Secure Escrow Enabled</p>
        </div>
        <div className="flex gap-4 w-full md:w-auto">
          <button 
            onClick={() => setIsListingModalOpen(true)}
            className="px-4 py-2 bg-[#8b0000]/10 border border-[#8b0000]/30 text-[#8b0000] text-[10px] font-bold uppercase tracking-widest hover:bg-[#8b0000] hover:text-white transition-all flex items-center gap-2"
          >
            <Lock className="w-3 h-3" />
            List Item
          </button>
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#00ff9d]/30" />
            <input 
              type="text" 
              placeholder="Search items..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#0d0d0d] border border-[#00ff9d]/20 rounded-sm py-2 pl-10 pr-4 text-xs focus:outline-none focus:border-[#00ff9d]/50 transition-colors"
            />
          </div>
          <select 
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="bg-[#0d0d0d] border border-[#00ff9d]/20 rounded-sm py-2 px-4 text-xs focus:outline-none focus:border-[#00ff9d]/50 transition-colors"
          >
            {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
          </select>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredItems.map(item => (
          <div 
            key={item.id} 
            className="border border-[#00ff9d]/10 bg-[#0d0d0d] rounded-sm hover:border-[#8b0000]/50 transition-all group relative overflow-hidden flex flex-col"
          >
            {item.imageUrl && (
              <div className="w-full h-40 overflow-hidden border-b border-[#00ff9d]/5">
                <img 
                  src={item.imageUrl} 
                  alt={item.title} 
                  className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500" 
                  referrerPolicy="no-referrer"
                />
              </div>
            )}
            
            <div className="p-6 flex-1 flex flex-col">
              <div className="absolute top-2 right-2 p-2 opacity-10 group-hover:opacity-30 transition-opacity z-10">
                {!item.imageUrl && <ShoppingCart className="w-12 h-12 text-[#8b0000]" />}
              </div>
              
              <span className="text-[8px] uppercase tracking-widest text-[#8b0000] font-bold mb-2 block">{item.category}</span>
              <h3 className="text-[#00ff9d] font-bold text-lg mb-2 group-hover:text-white transition-colors">{item.title}</h3>
              <p className="text-[10px] text-[#00ff9d]/50 mb-6 line-clamp-2">{item.description}</p>
              
              <div className="flex justify-between items-center mt-auto pt-4 border-t border-[#00ff9d]/5">
                <div className="flex flex-col">
                  <span className="text-[8px] uppercase text-[#00ff9d]/30">Price</span>
                  <span className="text-[#8b0000] font-bold">{formatBtc(item.price)}</span>
                </div>
                <button 
                  onClick={() => setSelectedItem(item)}
                  className="px-4 py-2 bg-[#00ff9d]/5 border border-[#00ff9d]/20 text-[#00ff9d] text-[10px] font-bold uppercase tracking-widest hover:bg-[#8b0000] hover:text-white hover:border-[#8b0000] transition-all"
                >
                  Buy Now
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Listing Modal */}
      {isListingModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#0d0d0d] border border-[#8b0000] w-full max-w-lg p-8 rounded-sm shadow-[0_0_30px_rgba(139,0,0,0.2)]">
            <div className="flex justify-between items-start mb-6">
              <h3 className="text-xl font-bold text-[#00ff9d]">LIST NEW ITEM</h3>
              <button onClick={() => setIsListingModalOpen(false)} className="text-[#8b0000] hover:text-[#ff0000] transition-colors">
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleListItem} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[8px] uppercase tracking-widest text-[#00ff9d]/50">Item Title</label>
                  <input 
                    type="text" 
                    required
                    value={newItem.title}
                    onChange={(e) => setNewItem({...newItem, title: e.target.value})}
                    className="w-full bg-black border border-[#00ff9d]/20 rounded-sm py-2 px-3 text-xs text-[#00ff9d] focus:outline-none focus:border-[#00ff9d]/50"
                    placeholder="e.g. Premium Botnet Access"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[8px] uppercase tracking-widest text-[#00ff9d]/50">Price (BTC)</label>
                  <input 
                    type="number" 
                    step="0.0001"
                    required
                    value={newItem.price}
                    onChange={(e) => setNewItem({...newItem, price: e.target.value})}
                    className="w-full bg-black border border-[#00ff9d]/20 rounded-sm py-2 px-3 text-xs text-[#00ff9d] focus:outline-none focus:border-[#00ff9d]/50"
                    placeholder="0.005"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[8px] uppercase tracking-widest text-[#00ff9d]/50">Category</label>
                <select 
                  value={newItem.category}
                  onChange={(e) => setNewItem({...newItem, category: e.target.value})}
                  className="w-full bg-black border border-[#00ff9d]/20 rounded-sm py-2 px-3 text-xs text-[#00ff9d] focus:outline-none focus:border-[#00ff9d]/50"
                >
                  {listingCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[8px] uppercase tracking-widest text-[#00ff9d]/50">Image URL</label>
                <input 
                  type="url" 
                  value={newItem.imageUrl}
                  onChange={(e) => setNewItem({...newItem, imageUrl: e.target.value})}
                  className="w-full bg-black border border-[#00ff9d]/20 rounded-sm py-2 px-3 text-xs text-[#00ff9d] focus:outline-none focus:border-[#00ff9d]/50"
                  placeholder="https://example.com/image.jpg"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[8px] uppercase tracking-widest text-[#00ff9d]/50">Description</label>
                <textarea 
                  required
                  rows={4}
                  value={newItem.description}
                  onChange={(e) => setNewItem({...newItem, description: e.target.value})}
                  className="w-full bg-black border border-[#00ff9d]/20 rounded-sm py-2 px-3 text-xs text-[#00ff9d] focus:outline-none focus:border-[#00ff9d]/50 resize-none"
                  placeholder="Detailed description of your product..."
                />
              </div>

              <button 
                type="submit"
                className="w-full py-4 bg-[#8b0000] text-white font-bold uppercase tracking-widest hover:bg-[#a00000] transition-all flex items-center justify-center gap-2 mt-4"
              >
                <Shield className="w-4 h-4" />
                Publish to Market
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Purchase Modal */}
      {selectedItem && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#0d0d0d] border border-[#8b0000] w-full max-w-md p-8 rounded-sm shadow-[0_0_30px_rgba(139,0,0,0.2)]">
            {purchaseStatus === 'idle' && (
              <div className="space-y-6">
                <div className="flex justify-between items-start">
                  <h3 className="text-xl font-bold text-[#00ff9d]">CONFIRM PURCHASE</h3>
                  <button onClick={() => setSelectedItem(null)} className="text-[#8b0000] hover:text-[#ff0000] transition-colors">
                    <XCircle className="w-6 h-6" />
                  </button>
                </div>
                
                <div className="p-4 bg-[#1a1a1a] border border-[#00ff9d]/10 rounded-sm">
                  <p className="text-xs text-[#00ff9d]/50 uppercase mb-1">Item</p>
                  <p className="text-[#00ff9d] font-bold">{selectedItem.title}</p>
                  <div className="flex justify-between mt-4">
                    <div>
                      <p className="text-xs text-[#00ff9d]/50 uppercase mb-1">Price</p>
                      <p className="text-[#8b0000] font-bold">{formatBtc(selectedItem.price)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-[#00ff9d]/50 uppercase mb-1">Vendor</p>
                      <p className="text-[#00ff9d] font-bold">Anonymous_V{selectedItem.vendorId}</p>
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-[#8b0000]/10 border border-[#8b0000]/30 rounded-sm">
                  <AlertTriangle className="w-5 h-5 text-[#8b0000] shrink-0" />
                  <p className="text-[10px] text-[#00ff9d]/70 leading-relaxed">
                    All sales are final. Funds will be held in escrow until delivery is confirmed by the vendor. 
                    ShadowNet is not responsible for vendor exit-scams.
                  </p>
                </div>

                <button 
                  onClick={handlePurchase}
                  className="w-full py-4 bg-[#8b0000] text-white font-bold uppercase tracking-widest hover:bg-[#a00000] transition-all flex items-center justify-center gap-2"
                >
                  <Lock className="w-4 h-4" />
                  Authorize BTC Transfer
                </button>
              </div>
            )}

            {purchaseStatus === 'insufficient' && (
              <div className="space-y-6">
                <div className="flex justify-between items-start">
                  <h3 className="text-xl font-bold text-[#8b0000]">INSUFFICIENT BALANCE</h3>
                  <button onClick={() => { setSelectedItem(null); setPurchaseStatus('idle'); }} className="text-[#8b0000] hover:text-[#ff0000] transition-colors">
                    <XCircle className="w-6 h-6" />
                  </button>
                </div>
                
                <div className="p-4 bg-[#8b0000]/5 border border-[#8b0000]/20 rounded-sm space-y-4">
                  <p className="text-xs text-[#00ff9d]/70 leading-relaxed">
                    You do not have enough BTC in your ShadowNet wallet to complete this transaction. 
                    Please deposit more funds to proceed.
                  </p>
                  <div className="flex items-start gap-3 p-3 bg-[#8b0000]/10 border border-[#8b0000]/30 rounded-sm">
                    <AlertTriangle className="w-5 h-5 text-[#8b0000] shrink-0" />
                    <p className="text-[10px] text-[#8b0000] font-bold uppercase">
                      TRANSACTION REJECTED BY ESCROW SYSTEM.
                    </p>
                  </div>
                </div>

                <button 
                  onClick={() => { setSelectedItem(null); setPurchaseStatus('idle'); }}
                  className="w-full py-4 bg-[#8b0000] text-white font-bold uppercase tracking-widest hover:bg-[#a00000] transition-all"
                >
                  Return to Market
                </button>
              </div>
            )}

            {purchaseStatus === 'processing' && (
              <div className="flex flex-col items-center justify-center py-12 space-y-6">
                <div className="w-16 h-16 border-4 border-[#8b0000] border-t-transparent rounded-full animate-spin" />
                <div className="text-center">
                  <h3 className="text-xl font-bold text-[#00ff9d] mb-2">PROCESSING TRANSACTION</h3>
                  <p className="text-xs text-[#00ff9d]/50 font-mono">Broadcasting to blockchain network...</p>
                </div>
              </div>
            )}

            {purchaseStatus === 'success' && (
              <div className="flex flex-col items-center justify-center py-12 space-y-6 text-center">
                <CheckCircle className="w-16 h-16 text-[#00ff9d]" />
                <div className="space-y-2">
                  <h3 className="text-xl font-bold text-[#00ff9d]">TRANSACTION SUCCESSFUL</h3>
                  <p className="text-xs text-[#00ff9d]/70">
                    Funds transferred to escrow. The vendor has been notified. 
                    Check your private messages for delivery details.
                  </p>
                </div>
                <button 
                  onClick={() => { setSelectedItem(null); setPurchaseStatus('idle'); }}
                  className="px-8 py-2 border border-[#00ff9d]/30 text-[#00ff9d] text-xs font-bold uppercase hover:bg-[#00ff9d]/5 transition-all"
                >
                  Close
                </button>
              </div>
            )}

            {purchaseStatus === 'scam' && (
              <div className="flex flex-col items-center justify-center py-12 space-y-6 text-center">
                <AlertTriangle className="w-16 h-16 text-[#8b0000]" />
                <div className="space-y-2">
                  <h3 className="text-xl font-bold text-[#8b0000]">TRANSACTION FAILED</h3>
                  <p className="text-xs text-[#00ff9d]/70">
                    ERROR: VENDOR_EXIT_SCAM_DETECTED. The vendor has deleted their account and the funds have been lost in the void. 
                    Welcome to the Dark Web.
                  </p>
                </div>
                <button 
                  onClick={() => { setSelectedItem(null); setPurchaseStatus('idle'); }}
                  className="px-8 py-2 border border-[#8b0000]/30 text-[#8b0000] text-xs font-bold uppercase hover:bg-[#8b0000]/5 transition-all"
                >
                  Accept Loss
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Market;
