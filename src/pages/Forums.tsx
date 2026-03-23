import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, getDocs, addDoc, orderBy, onSnapshot, Timestamp } from 'firebase/firestore';
import { UserProfile, OperationType } from '../types';
import { handleFirestoreError } from '../utils';
import { Users, MessageSquare, Plus, Terminal, Shield, Lock, AlertTriangle, Search, Filter, CheckCircle, XCircle, Clock } from 'lucide-react';
import { GlitchText } from '../components/TorLoading';
import { format } from 'date-fns';

interface ForumsProps {
  user: UserProfile;
}

interface ForumPost {
  id: string;
  title: string;
  content: string;
  authorId: string;
  authorName: string;
  timestamp: string;
  replies: number;
}

const Forums: React.FC<ForumsProps> = ({ user }) => {
  const [posts, setPosts] = useState<ForumPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewPost, setShowNewPost] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const q = query(collection(db, 'forumPosts'), orderBy('timestamp', 'desc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedPosts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ForumPost));
      
      // Seed posts if none exist
      if (fetchedPosts.length === 0 && loading) {
        const seedPosts: Partial<ForumPost>[] = [
          { title: "How to properly clean BTC?", content: "I have some coins from a recent operation. What's the best mixer currently?", authorId: "v1", authorName: "Hacker_X", timestamp: new Date().toISOString(), replies: 12 },
          { title: "Avoid 'Onion_Market_V2' - Exit Scam!", content: "They just took my 0.5 BTC and deleted the site. Beware!", authorId: "v2", authorName: "Victim_99", timestamp: new Date(Date.now() - 3600000).toISOString(), replies: 45 },
          { title: "New 0-day exploit for Windows 11", content: "Selling for 5 BTC. DM for details. Serious buyers only.", authorId: "v3", authorName: "Void_Master", timestamp: new Date(Date.now() - 7200000).toISOString(), replies: 3 },
          { title: "Looking for reliable ID vendor", content: "Need a high quality EU passport. Any recommendations?", authorId: "v4", authorName: "Traveler", timestamp: new Date(Date.now() - 86400000).toISOString(), replies: 8 }
        ];
        
        seedPosts.forEach(async (post) => {
          await addDoc(collection(db, 'forumPosts'), post);
        });
      }
      
      setPosts(fetchedPosts);
      setLoading(false);
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, 'forumPosts');
    });

    return () => unsubscribe();
  }, [loading]);

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim()) return;

    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'forumPosts'), {
        title: newTitle.trim(),
        content: newContent.trim(),
        authorId: user.uid,
        authorName: user.displayName,
        timestamp: new Date().toISOString(),
        replies: 0
      });
      setNewTitle('');
      setNewContent('');
      setShowNewPost(false);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'forumPosts');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return <div className="text-[#00ff9d] font-mono">Scanning boards...</div>;

  return (
    <div className="space-y-8 animate-in slide-in-from-right duration-700">
      <header className="flex flex-col md:flex-row justify-between items-end gap-4">
        <div className="space-y-2">
          <GlitchText text="SHADOW FORUMS" className="text-3xl font-black text-[#00ff9d]" />
          <p className="text-[#00ff9d]/50 text-xs uppercase tracking-widest">Anonymous Discussion Boards</p>
        </div>
        <button 
          onClick={() => setShowNewPost(true)}
          className="px-6 py-2 bg-[#8b0000] text-white text-xs font-bold uppercase tracking-widest hover:bg-[#a00000] transition-all flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          New Discussion
        </button>
      </header>

      <div className="space-y-4">
        {posts.map(post => (
          <div 
            key={post.id} 
            className="border border-[#00ff9d]/10 bg-[#0d0d0d] p-6 rounded-sm hover:border-[#00ff9d]/30 transition-all group"
          >
            <div className="flex flex-col md:flex-row justify-between gap-4">
              <div className="space-y-2 flex-1">
                <h3 className="text-[#00ff9d] font-bold text-lg group-hover:text-white transition-colors">{post.title}</h3>
                <p className="text-[10px] text-[#00ff9d]/50 line-clamp-2 leading-relaxed">{post.content}</p>
              </div>
              <div className="flex flex-row md:flex-col items-end justify-between md:justify-start gap-4 shrink-0">
                <div className="text-right">
                  <p className="text-[10px] text-[#00ff9d] font-bold uppercase tracking-widest">{post.authorName}</p>
                  <div className="flex items-center gap-1 text-[8px] text-[#00ff9d]/30 uppercase mt-1">
                    <Clock className="w-2 h-2" />
                    {format(new Date(post.timestamp), 'MMM dd, HH:mm')}
                  </div>
                </div>
                <div className="flex items-center gap-2 text-[10px] text-[#00ff9d]/40 uppercase">
                  <MessageSquare className="w-3 h-3" />
                  {post.replies} Replies
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* New Post Modal */}
      {showNewPost && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#0d0d0d] border border-[#00ff9d]/20 w-full max-w-2xl p-8 rounded-sm shadow-[0_0_30px_rgba(0,255,157,0.1)]">
            <div className="flex justify-between items-start mb-8">
              <h3 className="text-xl font-bold text-[#00ff9d] uppercase tracking-widest">Start Discussion</h3>
              <button onClick={() => setShowNewPost(false)} className="text-[#8b0000] hover:text-[#ff0000] transition-colors">
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleCreatePost} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] text-[#00ff9d]/50 uppercase tracking-widest">Title</label>
                <input 
                  type="text" 
                  placeholder="Enter a descriptive title..." 
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full bg-[#0a0a0a] border border-[#00ff9d]/20 rounded-sm py-3 px-4 text-xs focus:outline-none focus:border-[#00ff9d] transition-all"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] text-[#00ff9d]/50 uppercase tracking-widest">Content</label>
                <textarea 
                  placeholder="Write your message anonymously..." 
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  className="w-full bg-[#0a0a0a] border border-[#00ff9d]/20 rounded-sm py-3 px-4 text-xs h-40 focus:outline-none focus:border-[#00ff9d] transition-all resize-none"
                  required
                />
              </div>

              <div className="flex items-start gap-3 p-3 bg-[#00ff9d]/5 border border-[#00ff9d]/20 rounded-sm">
                <Shield className="w-5 h-5 text-[#00ff9d] shrink-0" />
                <p className="text-[10px] text-[#00ff9d]/70 leading-relaxed">
                  Your identity is hidden. We do not log IP addresses. 
                  Avoid posting PII or illegal content that violates our community standards.
                </p>
              </div>

              <button 
                type="submit"
                disabled={isSubmitting || !newTitle.trim() || !newContent.trim()}
                className="w-full py-4 bg-[#00ff9d]/10 border border-[#00ff9d]/30 text-[#00ff9d] font-bold uppercase tracking-widest hover:bg-[#00ff9d] hover:text-[#0a0a0a] transition-all flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <div className="w-4 h-4 border-2 border-[#00ff9d] border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Lock className="w-4 h-4" />
                )}
                Broadcast to Boards
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Forums;
