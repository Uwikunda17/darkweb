import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Terminal, X, Shield, Zap, AlertCircle, MessageSquare } from 'lucide-react';
import { db } from '../firebase';
import { collection, query, where, onSnapshot, addDoc, orderBy, limit, doc, getDoc, updateDoc, getDocs } from 'firebase/firestore';
import { UserProfile, Message, Chat as ChatType } from '../types';
import * as openpgp from 'openpgp';

const SYSTEM_MESSAGES = [
  "SYSTEM: ENCRYPTED TUNNEL ESTABLISHED",
  "SYSTEM: ROTATING GATEWAY NODES...",
  "SYSTEM: PACKET SNIFFING DETECTED... BYPASSING",
  "SYSTEM: FIREWALL BREACH ATTEMPT BLOCKED",
  "SYSTEM: KERNEL OPTIMIZATION COMPLETE",
  "SYSTEM: ANONYMITY LEVEL: MAXIMUM",
  "SYSTEM: VOLATILE MEMORY PURGED",
];

interface HiddenTerminalProps {
  user: UserProfile;
  isOpen: boolean;
  onClose: () => void;
  onUnlock: (type: 'chat' | 'market') => void;
}

const HiddenTerminal: React.FC<HiddenTerminalProps> = ({ user, isOpen, onClose, onUnlock }) => {
  const [input, setInput] = useState('');
  const [history, setHistory] = useState<string[]>(['SHADOWNET_OS v4.2.0 - SECURE TERMINAL', 'TYPE "HELP" FOR COMMANDS', '']);
  const [isActivated, setIsActivated] = useState(false);
  const [chatMode, setChatMode] = useState(false);
  const [activeChat, setActiveChat] = useState<ChatType | null>(null);
  const [chatMessages, setChatMessages] = useState<Message[]>([]);
  const [decryptedMessages, setDecryptedMessages] = useState<Record<string, string>>({});
  const [isBooting, setIsBooting] = useState(true);
  const inputRef = useRef<HTMLInputElement>(null);
  const chatUnsubscribeRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (isOpen) {
      setIsBooting(true);
      setHistory(['INITIALIZING SHADOWNET_OS...', 'LOADING KERNEL...', 'ESTABLISHING SECURE TUNNEL...']);
      
      const bootSequence = [
        'MOUNTING VOLATILE STORAGE...',
        'DECRYPTING SYSTEM FILES...',
        'SHADOWNET_OS v4.2.0 - SECURE TERMINAL',
        'TYPE "HELP" FOR COMMANDS',
        ''
      ];

      bootSequence.forEach((line, i) => {
        setTimeout(() => {
          setHistory(prev => [...prev, line]);
          if (i === bootSequence.length - 1) setIsBooting(false);
        }, (i + 1) * 400);
      });
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && !isBooting && !chatMode) {
      const interval = setInterval(() => {
        if (Math.random() < 0.1) {
          const msg = SYSTEM_MESSAGES[Math.floor(Math.random() * SYSTEM_MESSAGES.length)];
          setHistory(prev => [...prev, msg, '']);
        }
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [isOpen, isBooting, chatMode]);

  useEffect(() => {
    if (isOpen && !isBooting) {
      inputRef.current?.focus();
    }
  }, [isOpen, isBooting]);

  // Handle Chat Mode Listeners
  useEffect(() => {
    if (chatMode && user && activeChat) {
      // Listen to messages for this chat
      if (chatUnsubscribeRef.current) chatUnsubscribeRef.current();
      
      const msgQ = query(
        collection(db, `chats/${activeChat.id}/messages`),
        orderBy('timestamp', 'asc'),
        limit(20)
      );

      chatUnsubscribeRef.current = onSnapshot(msgQ, (msgSnap) => {
        const msgs = msgSnap.docs.map(d => ({ id: d.id, ...d.data() } as Message));
        setChatMessages(msgs);
        
        // Auto-decrypt new messages
        decryptMessages(msgs);
      });

      return () => {
        if (chatUnsubscribeRef.current) chatUnsubscribeRef.current();
      };
    }
  }, [chatMode, user, activeChat]);

  const decryptMessages = async (msgs: Message[]) => {
    const storedKeys = localStorage.getItem(`pgp_keys_${user.uid}`);
    if (!storedKeys) return;
    const keys = JSON.parse(storedKeys);
    
    const newDecrypted = { ...decryptedMessages };
    let changed = false;

    for (const msg of msgs) {
      if (msg.encrypted && !newDecrypted[msg.id]) {
        try {
          const privateKey = await openpgp.readPrivateKey({ armoredKey: keys.privateKey });
          const messageObj = await openpgp.readMessage({ armoredMessage: msg.text });
          const { data: decrypted } = await openpgp.decrypt({
            message: messageObj,
            decryptionKeys: privateKey,
          });
          newDecrypted[msg.id] = decrypted as string;
          changed = true;
        } catch (e) {
          newDecrypted[msg.id] = '[DECRYPTION_ERROR]';
          changed = true;
        }
      }
    }
    if (changed) setDecryptedMessages(newDecrypted);
  };

  const handleCommand = async (e: React.FormEvent) => {
    e.preventDefault();
    const cmd = input.trim();
    if (!cmd) return;

    if (chatMode) {
      if (cmd.toLowerCase() === 'exit-chat') {
        setChatMode(false);
        setHistory(prev => [...prev, 'SYSTEM: EXITING CHAT MODE', '']);
      } else if (activeChat) {
        // Send message in chat mode
        await sendChatMessage(cmd);
      }
      setInput('');
      return;
    }

    const lowerCmd = cmd.toLowerCase();
    const args = cmd.split(' ');
    setHistory(prev => [...prev, `> ${cmd}`]);
    
    if (lowerCmd === 'help') {
      setHistory(prev => [...prev, 'AVAILABLE COMMANDS:', ' - HELP: SHOW THIS MENU', ' - CLEAR: CLEAR TERMINAL', ' - EXIT: CLOSE TERMINAL', ' - STATUS: SHOW CONNECTION STATUS', ' - CHAT: LIST ACTIVE CHATS', ' - CHAT <CODENAME>: START CHAT WITH OPERATIVE', '']);
    } else if (lowerCmd === 'clear') {
      setHistory(['SHADOWNET_OS v4.2.0 - SECURE TERMINAL', '']);
    } else if (lowerCmd === 'exit') {
      onClose();
    } else if (lowerCmd === 'status') {
      setHistory(prev => [...prev, 'CONNECTION: ENCRYPTED', 'GATEWAY: TOR_NODE_7721', 'ENCRYPTION: AES-256-GCM', 'CODENAME: ' + (user.codename || 'UNSET'), '']);
    } else if (args[0].toLowerCase() === 'chat') {
      if (args.length === 1) {
        // List active chats
        setHistory(prev => [...prev, 'SYSTEM: FETCHING ACTIVE CHATS...', '']);
        const q = query(
          collection(db, 'chats'),
          where('participants', 'array-contains', user.uid),
          orderBy('updatedAt', 'desc')
        );
        const snap = await getDocs(q);
        if (snap.empty) {
          setHistory(prev => [...prev, 'NO ACTIVE CHATS FOUND.', '']);
        } else {
          setHistory(prev => [...prev, 'ACTIVE CHATS:']);
          for (const d of snap.docs) {
            const chatData = d.data();
            const otherId = chatData.participants.find((p: string) => p !== user.uid);
            const otherDoc = await getDoc(doc(db, 'users', otherId));
            const otherCodename = otherDoc.data()?.codename || 'UNKNOWN';
            setHistory(prev => [...prev, ` - ${otherCodename} (ID: ${d.id.slice(0, 8)})`]);
          }
          setHistory(prev => [...prev, 'USE "CHAT <CODENAME>" TO CONNECT', '']);
        }
      } else {
        // Start/Open chat with codename
        const targetCodename = args[1].toUpperCase();
        setHistory(prev => [...prev, `SYSTEM: LOCATING OPERATIVE "${targetCodename}"...`, '']);
        
        const q = query(collection(db, 'users'), where('codename', '==', targetCodename));
        const snap = await getDocs(q);
        
        if (snap.empty) {
          setHistory(prev => [...prev, `ERROR: OPERATIVE "${targetCodename}" NOT FOUND.`, '']);
        } else {
          const targetUser = snap.docs[0].data() as UserProfile;
          if (targetUser.uid === user.uid) {
            setHistory(prev => [...prev, 'ERROR: CANNOT CHAT WITH SELF.', '']);
          } else {
            // Check for existing chat
            const chatQ = query(
              collection(db, 'chats'),
              where('participants', 'array-contains', user.uid)
            );
            const chatSnap = await getDocs(chatQ);
            let chat = chatSnap.docs.find(d => d.data().participants.includes(targetUser.uid));
            
            if (!chat) {
              setHistory(prev => [...prev, 'SYSTEM: ESTABLISHING NEW SECURE CHANNEL...', '']);
              const newChat = await addDoc(collection(db, 'chats'), {
                participants: [user.uid, targetUser.uid],
                lastMessage: 'Channel Opened',
                updatedAt: new Date().toISOString()
              });
              setActiveChat({ id: newChat.id, participants: [user.uid, targetUser.uid], lastMessage: 'Channel Opened', updatedAt: new Date().toISOString() });
            } else {
              setActiveChat({ id: chat.id, ...chat.data() } as ChatType);
            }
            setChatMode(true);
            setHistory(prev => [...prev, 'SYSTEM: SECURE CHANNEL ESTABLISHED.', '']);
          }
        }
      }
    } else if (lowerCmd === 'chat-terminal : activate') {
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

  const sendChatMessage = async (text: string) => {
    if (!activeChat || !user) return;
    
    try {
      const recipientId = activeChat.participants.find(p => p !== user.uid);
      if (!recipientId) return;
      
      const recipientDoc = await getDoc(doc(db, 'users', recipientId));
      if (!recipientDoc.exists()) return;
      
      const recipientPublicKey = recipientDoc.data().publicKey;
      const storedKeys = localStorage.getItem(`pgp_keys_${user.uid}`);
      if (!storedKeys || !recipientPublicKey) {
        setHistory(prev => [...prev, 'ERROR: PGP KEYS NOT FOUND. VISIT ACCOUNT PAGE.', '']);
        return;
      }
      
      const keys = JSON.parse(storedKeys);
      const publicKeys = await Promise.all([
        openpgp.readKey({ armoredKey: keys.publicKey }),
        openpgp.readKey({ armoredKey: recipientPublicKey })
      ]);

      const encrypted = await openpgp.encrypt({
        message: await openpgp.createMessage({ text }),
        encryptionKeys: publicKeys,
      });

      await addDoc(collection(db, `chats/${activeChat.id}/messages`), {
        chatId: activeChat.id,
        senderId: user.uid,
        text: encrypted,
        timestamp: new Date().toISOString(),
        encrypted: true,
        read: false
      });

      await updateDoc(doc(db, 'chats', activeChat.id), {
        lastMessage: 'Encrypted Message',
        updatedAt: new Date().toISOString()
      });
    } catch (e) {
      console.error('Terminal chat error:', e);
    }
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
                <span className="text-[10px] font-bold text-[#00ff9d] uppercase tracking-widest">ShadowNet Hidden CLI {chatMode ? '- SECURE CHAT MODE' : ''}</span>
              </div>
              <button onClick={onClose} className="text-[#00ff9d]/50 hover:text-[#00ff9d]">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 p-6 overflow-y-auto no-scrollbar text-[12px] space-y-1">
              {isBooting ? (
                history.map((line, i) => (
                  <div key={i} className="text-[#00ff9d]/70 animate-pulse">
                    {line}
                  </div>
                ))
              ) : !chatMode ? (
                history.map((line, i) => (
                  <div key={i} className={`${line.startsWith('>') ? 'text-[#00ff9d]' : line.startsWith('ERROR') ? 'text-[#8b0000]' : line.startsWith('SYSTEM') ? 'text-[#00ff9d]/40 italic' : 'text-[#00ff9d]/70'}`}>
                    {line}
                  </div>
                ))
              ) : (
                <div className="space-y-2">
                  <div className="text-[#8b0000] font-bold mb-4 border-b border-[#8b0000]/20 pb-2 flex justify-between items-center">
                    <div>
                      --- SECURE CHAT SESSION: {activeChat?.id.slice(0, 8)} ---
                      <p className="text-[8px] font-normal text-[#00ff9d]/50 mt-1">TYPE "EXIT-CHAT" TO RETURN TO CLI</p>
                    </div>
                    <div className="text-[8px] text-[#00ff9d]/30 animate-pulse">ENCRYPTED_STREAM_ACTIVE</div>
                  </div>
                  {chatMessages.map((msg, i) => (
                    <div key={msg.id || i} className="flex gap-2 animate-in fade-in slide-in-from-left-2 duration-300">
                      <span className={`font-bold ${msg.senderId === user.uid ? 'text-[#00ff9d]' : 'text-[#8b0000]'}`}>
                        [{msg.senderId === user.uid ? 'YOU' : 'OPERATIVE'}]:
                      </span>
                      <span className="text-[#00ff9d]/80">
                        {msg.encrypted ? (decryptedMessages[msg.id] || '[DECRYPTING...]') : msg.text}
                      </span>
                    </div>
                  ))}
                </div>
              )}
              {!isBooting && (
                <form onSubmit={handleCommand} className="flex items-center gap-2 pt-2">
                  <span className="text-[#00ff9d]">{chatMode ? '[SECURE_CHAT] >' : '>'}</span>
                  <input
                    ref={inputRef}
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    className="flex-1 bg-transparent border-none outline-none text-[#00ff9d] caret-[#00ff9d]"
                    autoFocus
                    placeholder={chatMode ? "Type message..." : "Enter command..."}
                  />
                </form>
              )}
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
                {chatMode && (
                  <div className="flex items-center gap-1 text-[#8b0000]">
                    <MessageSquare className="w-2 h-2" />
                    Chat Mode
                  </div>
                )}
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
