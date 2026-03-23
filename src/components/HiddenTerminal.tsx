import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Terminal, X, Lock, AlertCircle, Send, Clock } from 'lucide-react';
import { db } from '../firebase';
import { collection, query, where, onSnapshot, addDoc, orderBy, limit, doc, getDoc, updateDoc, getDocs } from 'firebase/firestore';
import { UserProfile, Message, Chat as ChatType } from '../types';
import * as openpgp from 'openpgp';

const SYSTEM_MESSAGES = [
  "✓ Secure tunnel established",
  "✓ Encryption verified (AES-256)",
  "✓ Session authenticated",
  "✓ Firewall rules applied",
];

interface HiddenTerminalProps {
  user: UserProfile;
  isOpen: boolean;
  onClose: () => void;
  onUnlock: (type: 'chat' | 'market') => void;
  onAdminAccess: () => void;
}

const HiddenTerminal: React.FC<HiddenTerminalProps> = ({ user, isOpen, onClose, onUnlock, onAdminAccess }) => {
  const [input, setInput] = useState('');
  const [suggestion, setSuggestion] = useState('');
  const [history, setHistory] = useState<{ type: 'system' | 'command' | 'response' | 'error'; text: string }[]>([
    { type: 'system', text: 'ShadowNet CLI v4.2.0 [Secure Terminal]' },
    { type: 'system', text: 'Type "help" for available commands' },
  ]);

  const COMMANDS = [
    'help',
    'status',
    'chat',
    'clear',
    'exit',
    'admin t',
    'chat-terminal : activate',
    'chat-state-true = chat',
    'market-state-true = market',
    'exit-chat'
  ];

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const currentInput = input.toLowerCase();
      if (!currentInput) return;

      const matches = COMMANDS.filter(cmd => cmd.startsWith(currentInput));
      if (matches.length === 1) {
        setInput(matches[0]);
      } else if (matches.length > 1) {
        // Cycle through matches or show them in history?
        // Basic: just pick the first one or do nothing if ambiguous
        setInput(matches[0]);
      }
    }
  };

  const [isActivated, setIsActivated] = useState(false);
  const [chatMode, setChatMode] = useState(false);
  const [activeChat, setActiveChat] = useState<ChatType | null>(null);
  const [chatMessages, setChatMessages] = useState<Message[]>([]);
  const [decryptedMessages, setDecryptedMessages] = useState<Record<string, string>>({});
  const [isBooting, setIsBooting] = useState(true);
  const inputRef = useRef<HTMLInputElement>(null);
  const chatUnsubscribeRef = useRef<(() => void) | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    if (contentRef.current) {
      contentRef.current.scrollTop = contentRef.current.scrollHeight;
    }
  }, [history, chatMessages]);

  useEffect(() => {
    if (isOpen) {
      setIsBooting(true);
      const bootSequence = [
        { type: 'system' as const, text: 'Initializing ShadowNet OS...' },
        { type: 'system' as const, text: 'Loading kernel modules...' },
        { type: 'system' as const, text: 'Establishing secure tunnel...' },
        { type: 'system' as const, text: 'Verifying encryption...' },
        { type: 'system' as const, text: '✓ System ready' },
      ];

      setHistory(bootSequence);

      setTimeout(() => {
        setIsBooting(false);
      }, 2500);
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && !isBooting && !chatMode) {
      const interval = setInterval(() => {
        if (Math.random() < 0.08) {
          const msg = SYSTEM_MESSAGES[Math.floor(Math.random() * SYSTEM_MESSAGES.length)];
          setHistory(prev => [...prev, { type: 'system', text: `→ ${msg}` }]);
        }
      }, 6000);
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
      if (chatUnsubscribeRef.current) chatUnsubscribeRef.current();

      const msgQ = query(
        collection(db, `chats/${activeChat.id}/messages`),
        orderBy('timestamp', 'asc'),
        limit(50)
      );

      chatUnsubscribeRef.current = onSnapshot(msgQ, (msgSnap) => {
        const msgs = msgSnap.docs.map(d => ({ id: d.id, ...d.data() } as Message));
        setChatMessages(msgs);
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
          newDecrypted[msg.id] = '[Decryption failed]';
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
        setHistory(prev => [...prev, { type: 'system', text: 'Exiting chat mode...' }]);
      } else if (activeChat) {
        setHistory(prev => [...prev, { type: 'command', text: `> ${cmd}` }]);
        await sendChatMessage(cmd);
      }
      setInput('');
      return;
    }

    const lowerCmd = cmd.toLowerCase();
    const args = cmd.split(' ');
    setHistory(prev => [...prev, { type: 'command', text: `> ${cmd}` }]);

    if (lowerCmd === 'help') {
      const helpText = [
        'Available commands:',
        '  help              - Show this menu',
        '  status            - Show connection status',
        '  chat              - List active chats',
        '  chat <codename>   - Start chat with operative',
        '  clear             - Clear terminal',
        '  exit              - Close terminal',
      ];
      helpText.forEach(line => {
        setHistory(prev => [...prev, { type: 'response', text: line }]);
      });
    } else if (lowerCmd === 'clear') {
      setHistory([
        { type: 'system', text: 'ShadowNet CLI v4.2.0 [Secure Terminal]' },
        { type: 'system', text: 'Type "help" for available commands' },
      ]);
    } else if (lowerCmd === 'exit') {
      onClose();
    } else if (lowerCmd === 'status') {
      const statusLines = [
        `Connection:      ✓ Encrypted (AES-256)`,
        `Gateway:         TOR Node #7721`,
        `Status:          Active & Secure`,
        `Identity:        ${user.codename || 'UNSET'}`,
        `Uptime:          Stable`,
      ];
      statusLines.forEach(line => {
        setHistory(prev => [...prev, { type: 'response', text: line }]);
      });
    } else if (lowerCmd === 'admin t') {
      setHistory(prev => [...prev, { type: 'response', text: 'Initializing Admin Gateway...' }]);
      setTimeout(() => {
        onAdminAccess();
        onClose();
      }, 1000);
    } else if (args[0].toLowerCase() === 'chat') {
      if (args.length === 1) {
        setHistory(prev => [...prev, { type: 'response', text: 'Fetching active chats...' }]);
        const q = query(
          collection(db, 'chats'),
          where('participants', 'array-contains', user.uid),
          orderBy('updatedAt', 'desc')
        );
        const snap = await getDocs(q);
        if (snap.empty) {
          setHistory(prev => [...prev, { type: 'response', text: 'No active chats found.' }]);
        } else {
          setHistory(prev => [...prev, { type: 'response', text: 'Active chats:' }]);
          for (const d of snap.docs) {
            const chatData = d.data();
            const otherId = chatData.participants.find((p: string) => p !== user.uid);
            const otherDoc = await getDoc(doc(db, 'users', otherId));
            const otherCodename = otherDoc.data()?.codename || 'UNKNOWN';
            setHistory(prev => [...prev, { type: 'response', text: `  • ${otherCodename} [${d.id.slice(0, 8)}]` }]);
          }
          setHistory(prev => [...prev, { type: 'response', text: 'Use "chat <codename>" to connect' }]);
        }
      } else {
        let targetCodename = args[1].toUpperCase();
        if (targetCodename === ':' && args.length > 2) {
          targetCodename = args[2].toUpperCase();
        }

        setHistory(prev => [...prev, { type: 'response', text: `Locating operative "${targetCodename}"...` }]);

        const q = query(collection(db, 'users'), where('codename', '==', targetCodename));
        const snap = await getDocs(q);

        if (snap.empty) {
          setHistory(prev => [...prev, { type: 'error', text: `Error: Operative "${targetCodename}" not found.` }]);
        } else {
          const targetUser = snap.docs[0].data() as UserProfile;
          if (targetUser.uid === user.uid) {
            setHistory(prev => [...prev, { type: 'error', text: 'Error: Cannot chat with yourself.' }]);
          } else {
            const chatQ = query(
              collection(db, 'chats'),
              where('participants', 'array-contains', user.uid)
            );
            const chatSnap = await getDocs(chatQ);
            let chat = chatSnap.docs.find(d => d.data().participants.includes(targetUser.uid));

            if (!chat) {
              setHistory(prev => [...prev, { type: 'response', text: 'Establishing new secure channel...' }]);
              const newChat = await addDoc(collection(db, 'chats'), {
                participants: [user.uid, targetUser.uid],
                lastMessage: 'Channel opened',
                updatedAt: new Date().toISOString(),
              });
              setActiveChat({ id: newChat.id, participants: [user.uid, targetUser.uid], lastMessage: 'Channel opened', updatedAt: new Date().toISOString() });
            } else {
              setActiveChat({ id: chat.id, ...chat.data() } as ChatType);
            }
            setChatMode(true);
            setHistory(prev => [...prev, { type: 'response', text: '✓ Secure channel established. Type "exit-chat" to return.' }]);
          }
        }
      }
    } else if (lowerCmd === 'chat-terminal : activate') {
      setIsActivated(true);
      setHistory(prev => [...prev, { type: 'response', text: '✓ Chat terminal activated' }]);
    } else if (cmd === 'chat-state-true = chat') {
      if (isActivated) {
        setHistory(prev => [...prev, { type: 'response', text: 'Access granted. Redirecting...' }]);
        setTimeout(() => {
          onUnlock('chat');
          onUnlock('market');
          onClose();
        }, 1500);
      } else {
        setHistory(prev => [...prev, { type: 'error', text: 'Error: Terminal not activated.' }]);
      }
    } else if (cmd === 'market-state-true = market') {
      if (isActivated) {
        setHistory(prev => [...prev, { type: 'response', text: 'Access granted. Redirecting...' }]);
        setTimeout(() => {
          onUnlock('market');
          onUnlock('chat');
          onClose();
        }, 1500);
      } else {
        setHistory(prev => [...prev, { type: 'error', text: 'Error: Terminal not activated.' }]);
      }
    } else {
      setHistory(prev => [...prev, { type: 'error', text: `Error: Command "${cmd}" not recognized` }]);
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
        setHistory(prev => [...prev, { type: 'error', text: 'Error: PGP keys not found. Visit account page.' }]);
        return;
      }

      const keys = JSON.parse(storedKeys);
      const publicKeys = await Promise.all([
        openpgp.readKey({ armoredKey: keys.publicKey }),
        openpgp.readKey({ armoredKey: recipientPublicKey }),
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
        read: false,
      });

      await updateDoc(doc(db, 'chats', activeChat.id), {
        lastMessage: 'Encrypted message',
        updatedAt: new Date().toISOString(),
      });
    } catch (e) {
      console.error('Terminal chat error:', e);
      setHistory(prev => [...prev, { type: 'error', text: 'Error: Message delivery failed.' }]);
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
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 md:p-8"
        >
          {/* Terminal Window */}
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="w-full max-w-5xl h-full max-h-[700px] bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-lg shadow-2xl border border-slate-700/50 overflow-hidden flex flex-col"
          >
            {/* Title Bar */}
            <div className="flex items-center justify-between px-4 py-3 bg-slate-900/80 border-b border-slate-700/50 backdrop-blur-sm">
              <div className="flex items-center gap-3">
                <div className="flex gap-2">
                  <button
                    onClick={() => {}}
                    className="w-3 h-3 rounded-full bg-yellow-500 hover:bg-yellow-400 transition-colors"
                  />
                  <button
                    onClick={() => {}}
                    className="w-3 h-3 rounded-full bg-orange-500 hover:bg-orange-400 transition-colors"
                  />
                  <button
                    onClick={onClose}
                    className="w-3 h-3 rounded-full bg-red-500 hover:bg-red-400 transition-colors"
                  />
                </div>
                <div className="flex items-center gap-2 ml-2">
                  <Terminal className="w-4 h-4 text-cyan-400" />
                  <span className="text-sm font-semibold text-cyan-400 font-mono">
                    {chatMode ? 'Secure Chat' : 'ShadowNet CLI'} — {user.codename || 'Anonymous'}
                  </span>
                  {chatMode && (
                    <span className="ml-2 inline-flex items-center gap-1 text-xs text-emerald-400">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      Connected
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-emerald-400" />
                <span className="text-xs text-slate-400">AES-256 Encrypted</span>
              </div>
            </div>

            {/* Content Area */}
            <div
              ref={contentRef}
              className="flex-1 p-6 overflow-y-auto text-sm font-mono space-y-1 bg-slate-900/40"
              style={{
                scrollbarWidth: 'thin',
                scrollbarColor: 'rgba(100,116,139,0.5) transparent',
              }}
            >
              {isBooting ? (
                // Boot sequence
                history.map((entry, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.1 }}
                    className="text-cyan-400/70"
                  >
                    ▓ {entry.text}
                  </motion.div>
                ))
              ) : !chatMode ? (
                // Terminal mode
                history.map((entry, i) => (
                  <div
                    key={i}
                    className={`${
                      entry.type === 'command'
                        ? 'text-cyan-300 font-semibold'
                        : entry.type === 'error'
                        ? 'text-red-400'
                        : entry.type === 'response'
                        ? 'text-slate-300'
                        : 'text-slate-400'
                    }`}
                  >
                    {entry.type === 'response' && <span className="text-slate-600">$</span>}{' '}
                    {entry.text}
                  </div>
                ))
              ) : (
                // Chat mode
                <div className="space-y-3">
                  <div className="text-slate-400 text-xs mb-4 pb-3 border-b border-slate-700/50">
                    ► Connected to operative • Session: {activeChat?.id.slice(0, 8)}
                  </div>
                  {chatMessages.length === 0 ? (
                    <div className="text-slate-500 text-xs">
                      [Waiting for messages...]
                    </div>
                  ) : (
                    chatMessages.map((msg) => (
                      <motion.div
                        key={msg.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.2 }}
                        className="flex gap-3 group"
                      >
                        <div className="flex-shrink-0 w-12 text-right text-xs text-slate-500">
                          {msg.senderId === user.uid ? '(you)' : '(them)'}
                        </div>
                        <div className="flex-1">
                          <p
                            className={`${
                              msg.senderId === user.uid
                                ? 'text-cyan-300'
                                : 'text-emerald-300'
                            } break-words`}
                          >
                            {msg.encrypted
                              ? decryptedMessages[msg.id] || '⟳ decrypting...'
                              : msg.text}
                          </p>
                          <p className="text-xs text-slate-500 mt-1 group-hover:text-slate-400">
                            {new Date(msg.timestamp).toLocaleTimeString()}
                          </p>
                        </div>
                      </motion.div>
                    ))
                  )}
                </div>
              )}

              {/* Input Form */}
              {!isBooting && (
                <form onSubmit={handleCommand} className="flex items-center gap-2 pt-4 mt-4 border-t border-slate-700/50">
                  <span className="text-slate-500">$</span>
                  <input
                    ref={inputRef}
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="flex-1 bg-transparent border-none outline-none text-cyan-300 placeholder-slate-600 font-mono"
                    autoFocus
                    placeholder={chatMode ? 'Type message...' : 'Enter command...'}
                  />
                  {input.trim() && (
                    <button
                      type="submit"
                      className="text-slate-500 hover:text-cyan-400 transition-colors"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  )}
                </form>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-3 border-t border-slate-700/50 bg-slate-900/60 backdrop-blur-sm flex justify-between items-center text-xs text-slate-500">
              <div className="flex items-center gap-4">
                <span>✓ System Stable</span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {new Date().toLocaleTimeString()}
                </span>
              </div>
              <span>ShadowNet CLI v4.2.0</span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default HiddenTerminal;