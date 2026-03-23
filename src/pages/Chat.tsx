import React, { useState, useEffect, useRef } from 'react';
import { db } from '../firebase';
import { collection, query, where, onSnapshot, addDoc, orderBy, doc, getDoc, getDocs, limit, Timestamp, updateDoc, setDoc } from 'firebase/firestore';
import { Chat as ChatType, Message, UserProfile, OperationType, ChatCode } from '../types';
import { handleFirestoreError } from '../utils';
import { MessageSquare, Lock, Shield, Send, Terminal, AlertTriangle, Key, Users, Search, X, Eye, EyeOff } from 'lucide-react';
import { GlitchText } from '../components/TorLoading';
import { format } from 'date-fns';
import * as openpgp from 'openpgp';

interface ChatProps {
  user: UserProfile;
}

const Chat: React.FC<ChatProps> = ({ user }) => {
  const [chats, setChats] = useState<ChatType[]>([]);
  const [activeChat, setActiveChat] = useState<ChatType | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [chatCode, setChatCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCodeEntry, setShowCodeEntry] = useState(true);
  const [userKeys, setUserKeys] = useState<{ publicKey: string; privateKey: string } | null>(null);
  const [recipientPublicKey, setRecipientPublicKey] = useState<string | null>(null);
  const [decryptedMessages, setDecryptedMessages] = useState<Record<string, string>>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize PGP Keys and Support Bot Key
  useEffect(() => {
    const initKeys = async () => {
      const storedKeys = localStorage.getItem(`pgp_keys_${user.uid}`);
      let myPublicKey = '';
      if (storedKeys) {
        const keys = JSON.parse(storedKeys);
        setUserKeys(keys);
        myPublicKey = keys.publicKey;
      } else {
        const { privateKey, publicKey } = await openpgp.generateKey({
          type: 'rsa',
          rsaBits: 2048,
          userIDs: [{ name: user.displayName || user.uid, email: user.email }],
        });
        const keys = { publicKey, privateKey };
        localStorage.setItem(`pgp_keys_${user.uid}`, JSON.stringify(keys));
        setUserKeys(keys);
        myPublicKey = publicKey;
        
        // Store public key in Firestore for others to find
        try {
          await updateDoc(doc(db, 'users', user.uid), {
            publicKey: publicKey
          });
        } catch (error) {
          console.error('Failed to store public key:', error);
        }
      }

      // Ensure SUPPORT_SYSTEM has a key
      const supportRef = doc(db, 'users', 'SUPPORT_SYSTEM');
      const supportSnap = await getDoc(supportRef);
      if (!supportSnap.exists()) {
        const { publicKey: supportPub, privateKey: supportPriv } = await openpgp.generateKey({
          type: 'rsa',
          rsaBits: 2048,
          userIDs: [{ name: 'ShadowNet Support', email: 'support@shadow.net' }],
        });
        await setDoc(supportRef, {
          uid: 'SUPPORT_SYSTEM',
          displayName: 'ShadowNet Support',
          email: 'support@shadow.net',
          publicKey: supportPub,
          privateKey: supportPriv,
          role: 'admin',
          balance: 0,
          debt: 0,
          points: 0,
          completedModules: [],
          achievements: [],
          streak: 0,
          lastActive: new Date().toISOString()
        });
      }
    };
    initKeys();
  }, [user]);

  // Support Bot Response Logic
  useEffect(() => {
    if (!activeChat || activeChat.participants.indexOf('SUPPORT_SYSTEM') === -1) return;

    const lastMsg = messages[messages.length - 1];
    if (lastMsg && lastMsg.senderId === user.uid) {
      const triggerBotResponse = async () => {
        // Wait a bit for "realism"
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        const responses = [
          "Circuit verified. How can ShadowNet Support assist you today?",
          "We are monitoring the gateway. Your connection is secure.",
          "PGP handshake successful. All communications are now end-to-end encrypted.",
          "If you are experiencing issues with your wallet, please check the Account page.",
          "Remember: Never share your private key with anyone, not even us."
        ];
        const responseText = responses[Math.floor(Math.random() * responses.length)];

        try {
          const supportRef = doc(db, 'users', 'SUPPORT_SYSTEM');
          const supportSnap = await getDoc(supportRef);
          const supportData = supportSnap.data();
          
          if (supportData && supportData.privateKey && userKeys) {
            // Encrypt for both self and recipient
            const publicKeys = await Promise.all([
              openpgp.readKey({ armoredKey: supportData.publicKey }),
              openpgp.readKey({ armoredKey: userKeys.publicKey })
            ]);

            const encrypted = await openpgp.encrypt({
              message: await openpgp.createMessage({ text: responseText }),
              encryptionKeys: publicKeys,
            });

            await addDoc(collection(db, `chats/${activeChat.id}/messages`), {
              chatId: activeChat.id,
              senderId: 'SUPPORT_SYSTEM',
              text: encrypted,
              timestamp: new Date().toISOString(),
              encrypted: true
            });

            await updateDoc(doc(db, 'chats', activeChat.id), {
              lastMessage: 'Encrypted Message',
              updatedAt: new Date().toISOString()
            });
          }
        } catch (err) {
          console.error('Bot response error:', err);
        }
      };
      triggerBotResponse();
    }
  }, [messages.length, activeChat, user.uid, userKeys]);

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'chats'),
      where('participants', 'array-contains', user.uid),
      orderBy('updatedAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedChats = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ChatType));
      setChats(fetchedChats);
      if (fetchedChats.length > 0) {
        setShowCodeEntry(false);
      }
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, 'chats');
    });

    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    if (!activeChat) return;

    const q = query(
      collection(db, `chats/${activeChat.id}/messages`),
      orderBy('timestamp', 'asc'),
      limit(100)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedMessages = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Message));
      setMessages(fetchedMessages);
      scrollToBottom();
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, `chats/${activeChat.id}/messages`);
    });

    // Fetch recipient's public key
    const fetchRecipientKey = async () => {
      const recipientId = activeChat.participants.find(p => p !== user.uid);
      if (recipientId) {
        const recipientDoc = await getDoc(doc(db, 'users', recipientId));
        if (recipientDoc.exists()) {
          setRecipientPublicKey(recipientDoc.data().publicKey || null);
        }
      }
    };
    fetchRecipientKey();

    return () => unsubscribe();
  }, [activeChat, user.uid]);

  // Decrypt messages
  useEffect(() => {
    const decryptAll = async () => {
      if (!userKeys) return;
      
      const newDecrypted: Record<string, string> = { ...decryptedMessages };
      let changed = false;

      for (const msg of messages) {
        if (msg.encrypted && !newDecrypted[msg.id]) {
          try {
            const privateKey = await openpgp.readPrivateKey({ armoredKey: userKeys.privateKey });
            const messageObj = await openpgp.readMessage({ armoredMessage: msg.text });
            const { data: decrypted } = await openpgp.decrypt({
              message: messageObj,
              decryptionKeys: privateKey,
            });
            newDecrypted[msg.id] = decrypted as string;
            changed = true;
          } catch (error) {
            console.error('Decryption failed for message:', msg.id, error);
            newDecrypted[msg.id] = '[DECRYPTION_ERROR: INVALID_KEY]';
            changed = true;
          }
        }
      }

      if (changed) {
        setDecryptedMessages(newDecrypted);
      }
    };

    decryptAll();
  }, [messages, userKeys]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatCode.trim()) return;

    setIsVerifying(true);
    setError(null);

    try {
      let codeData: ChatCode | null = null;

      // Special case for the master code
      if (chatCode.trim() === '20082009') {
        codeData = {
          code: '20082009',
          vendorId: 'SUPPORT_SYSTEM',
          isActive: true,
          expiresAt: new Date(Date.now() + 1000000000).toISOString()
        };
      } else {
        // Check if code exists and is active in Firestore
        const q = query(collection(db, 'chatCodes'), where('code', '==', chatCode.trim()), where('isActive', '==', true));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
          setError('ACCESS DENIED – THIS IS THE DARK WEB, IDIOT');
          setIsVerifying(false);
          return;
        }
        codeData = querySnapshot.docs[0].data() as ChatCode;
      }
      
      // Check if a chat already exists with this vendor
      const existingChatQuery = query(
        collection(db, 'chats'),
        where('participants', 'array-contains', user.uid)
      );
      const existingChats = await getDocs(existingChatQuery);
      const existingChat = existingChats.docs.find(doc => {
        const data = doc.data() as ChatType;
        return data.participants.includes(codeData!.vendorId);
      });

      if (existingChat) {
        setActiveChat({ id: existingChat.id, ...existingChat.data() } as ChatType);
        setShowCodeEntry(false);
      } else {
        // Create new chat
        const newChatData = {
          participants: [user.uid, codeData.vendorId],
          lastMessage: 'Circuit established. Secure communication ready.',
          updatedAt: new Date().toISOString()
        };
        const chatRef = await addDoc(collection(db, 'chats'), newChatData);
        
        // Add initial system message
        await addDoc(collection(db, `chats/${chatRef.id}/messages`), {
          chatId: chatRef.id,
          senderId: 'system',
          text: 'END-TO-END ENCRYPTION ENABLED. PGP KEY EXCHANGE COMPLETE.',
          timestamp: new Date().toISOString(),
          encrypted: true
        });

        setActiveChat({ id: chatRef.id, ...newChatData } as ChatType);
        setShowCodeEntry(false);
      }
      
      setChatCode('');
    } catch (err) {
      console.error('Verification error:', err);
      setError('SYSTEM ERROR: CIRCUIT FAILURE');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeChat || !userKeys || !recipientPublicKey) return;

    const messageText = newMessage.trim();
    setNewMessage('');

    try {
      // Encrypt for both self and recipient
      const publicKeys = await Promise.all([
        openpgp.readKey({ armoredKey: userKeys.publicKey }),
        openpgp.readKey({ armoredKey: recipientPublicKey })
      ]);

      const encrypted = await openpgp.encrypt({
        message: await openpgp.createMessage({ text: messageText }),
        encryptionKeys: publicKeys,
      });

      const messageData = {
        chatId: activeChat.id,
        senderId: user.uid,
        text: encrypted,
        timestamp: new Date().toISOString(),
        encrypted: true
      };

      await addDoc(collection(db, `chats/${activeChat.id}/messages`), messageData);
      
      // Update chat last message
      const chatRef = doc(db, 'chats', activeChat.id);
      await updateDoc(chatRef, {
        lastMessage: 'Encrypted Message',
        updatedAt: new Date().toISOString()
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `chats/${activeChat.id}/messages`);
    }
  };

  if (showCodeEntry && chats.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-4 animate-in zoom-in duration-500">
        <div className="w-full max-w-md bg-[#0d0d0d] border border-[#8b0000]/50 p-8 rounded-sm shadow-[0_0_30px_rgba(139,0,0,0.1)]">
          <div className="flex flex-col items-center text-center space-y-6">
            <div className="w-16 h-16 bg-[#8b0000]/10 rounded-full flex items-center justify-center border border-[#8b0000]/30">
              <Key className="w-8 h-8 text-[#8b0000]" />
            </div>
            <div className="space-y-2">
              <GlitchText text="SECURE ACCESS CODE" className="text-2xl font-black text-[#00ff9d]" />
              <p className="text-[10px] text-[#00ff9d]/50 uppercase tracking-widest leading-relaxed">
                Enter the 8-12 character vendor access code to establish a secure circuit.
              </p>
            </div>

            <form onSubmit={handleVerifyCode} className="w-full space-y-4">
              <div className="relative">
                <input 
                  type="text" 
                  placeholder="X-XXXX-XXXX-X" 
                  value={chatCode}
                  onChange={(e) => setChatCode(e.target.value.toUpperCase())}
                  className={`w-full bg-[#0a0a0a] border ${error ? 'border-[#8b0000]' : 'border-[#00ff9d]/20'} rounded-sm py-4 px-4 text-center font-mono text-lg tracking-[0.5em] focus:outline-none focus:border-[#00ff9d] transition-all`}
                  disabled={isVerifying}
                />
                {isVerifying && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <div className="w-6 h-6 border-2 border-[#00ff9d] border-t-transparent rounded-full animate-spin" />
                  </div>
                )}
              </div>
              
              {error && (
                <p className="text-[#8b0000] text-[10px] font-bold animate-pulse uppercase tracking-widest">
                  {error}
                </p>
              )}

              <button 
                type="submit"
                disabled={isVerifying || !chatCode}
                className="w-full py-4 bg-[#8b0000] text-white font-bold uppercase tracking-widest hover:bg-[#a00000] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                Establish Circuit
              </button>
            </form>

            <div className="flex items-center gap-2 text-[8px] text-[#00ff9d]/30 uppercase">
              <Shield className="w-3 h-3" />
              End-to-End Encryption Enabled
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-250px)] flex border border-[#00ff9d]/10 bg-[#0d0d0d] rounded-sm overflow-hidden animate-in fade-in duration-700">
      {/* Sidebar */}
      <div className="w-1/4 border-r border-[#00ff9d]/10 flex flex-col">
        <div className="p-4 border-b border-[#00ff9d]/10 flex justify-between items-center">
          <h3 className="text-xs font-bold uppercase tracking-widest text-[#00ff9d]/60">Active Circuits</h3>
          <button 
            onClick={() => setShowCodeEntry(true)}
            className="p-1 hover:bg-[#00ff9d]/10 rounded-sm text-[#00ff9d]"
            title="New Circuit"
          >
            <Key className="w-4 h-4" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto no-scrollbar">
          {chats.map(chat => (
            <button
              key={chat.id}
              onClick={() => setActiveChat(chat)}
              className={`w-full p-4 text-left border-b border-[#00ff9d]/5 transition-all ${
                activeChat?.id === chat.id ? 'bg-[#8b0000]/10 border-l-2 border-l-[#8b0000]' : 'hover:bg-[#00ff9d]/5'
              }`}
            >
              <div className="flex justify-between items-start mb-1">
                <span className="text-[10px] font-bold text-[#00ff9d]">
                  {chat.participants.find(p => p !== user.uid)?.slice(0, 8)}...
                </span>
                <span className="text-[8px] text-[#00ff9d]/30">
                  {format(new Date(chat.updatedAt), 'HH:mm')}
                </span>
              </div>
              <p className="text-[10px] text-[#00ff9d]/50 truncate">{chat.lastMessage}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col relative">
        {activeChat ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b border-[#00ff9d]/10 bg-[#0a0a0a] flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-[#8b0000]/20 rounded-full flex items-center justify-center border border-[#8b0000]/30">
                  <Terminal className="w-4 h-4 text-[#8b0000]" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-[#00ff9d]">
                    VENDOR_ID: {activeChat.participants.find(p => p !== user.uid)}
                  </h4>
                  <div className="flex items-center gap-1 text-[8px] text-[#00ff9d]/40 uppercase">
                    <Lock className="w-2 h-2" />
                    Encrypted Session Active
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-[#00ff9d] rounded-full animate-pulse" />
                  <span className="text-[8px] text-[#00ff9d]/60 uppercase">Secure</span>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 no-scrollbar bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]">
              {messages.map((msg, i) => (
                <div 
                  key={msg.id || i} 
                  className={`flex ${msg.senderId === user.uid ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[70%] space-y-1 ${msg.senderId === 'system' ? 'w-full flex flex-col items-center' : ''}`}>
                    {msg.senderId === 'system' ? (
                      <div className="bg-[#8b0000]/10 border border-[#8b0000]/30 px-4 py-1 rounded-sm">
                        <p className="text-[8px] text-[#8b0000] font-bold tracking-widest uppercase">{msg.text}</p>
                      </div>
                    ) : (
                      <>
                        <div className={`px-4 py-3 rounded-sm text-[11px] font-mono relative group ${
                          msg.senderId === user.uid 
                            ? 'bg-[#00ff9d]/10 border border-[#00ff9d]/20 text-[#00ff9d]' 
                            : 'bg-[#8b0000]/10 border border-[#8b0000]/20 text-[#00ff9d]/90'
                        }`}>
                          {msg.encrypted && (
                            <Lock className="absolute -top-2 -right-2 w-3 h-3 text-[#00ff9d]/30 opacity-0 group-hover:opacity-100 transition-opacity" />
                          )}
                          {msg.encrypted ? (decryptedMessages[msg.id] || '[ENCRYPTED_DATA_STREAM]') : msg.text}
                        </div>
                        <p className={`text-[8px] text-[#00ff9d]/30 uppercase ${msg.senderId === user.uid ? 'text-right' : 'text-left'}`}>
                          {format(new Date(msg.timestamp), 'HH:mm:ss')}
                        </p>
                      </>
                    )}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <form onSubmit={handleSendMessage} className="p-4 bg-[#0a0a0a] border-t border-[#00ff9d]/10 flex gap-4">
              <input 
                type="text" 
                placeholder="Type your encrypted message..." 
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                className="flex-1 bg-[#0d0d0d] border border-[#00ff9d]/20 rounded-sm py-3 px-4 text-xs focus:outline-none focus:border-[#00ff9d] transition-colors"
              />
              <button 
                type="submit"
                disabled={!newMessage.trim()}
                className="px-6 bg-[#8b0000] text-white rounded-sm hover:bg-[#a00000] disabled:opacity-50 transition-all flex items-center justify-center"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8 space-y-6">
            <MessageSquare className="w-16 h-16 text-[#00ff9d]/10" />
            <div className="space-y-2">
              <h3 className="text-xl font-bold text-[#00ff9d]/30 uppercase tracking-widest">No Active Circuit</h3>
              <p className="text-[10px] text-[#00ff9d]/20 max-w-xs mx-auto">
                Select a circuit from the sidebar or enter a new access code to establish secure communication.
              </p>
            </div>
            <button 
              onClick={() => setShowCodeEntry(true)}
              className="px-6 py-2 border border-[#00ff9d]/20 text-[#00ff9d]/40 text-[10px] font-bold uppercase hover:text-[#00ff9d] hover:border-[#00ff9d] transition-all"
            >
              Enter Access Code
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Chat;
