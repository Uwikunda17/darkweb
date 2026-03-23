import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, where, getDocs, onSnapshot } from 'firebase/firestore';
import { TrainingModule, UserProfile, UserProgress, OperationType } from '../types';
import { handleFirestoreError } from '../utils';
import { GlitchText } from '../components/TorLoading';
import { Shield, Zap, Target, Award, BookOpen, ChevronRight, Lock, CheckCircle, AlertTriangle } from 'lucide-react';
import { motion } from 'motion/react';

interface DashboardProps {
  user: UserProfile;
  onNavigate: (page: any, params?: any) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ user, onNavigate }) => {
  const [modules, setModules] = useState<TrainingModule[]>([]);
  const [progress, setProgress] = useState<UserProgress[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribeModules = onSnapshot(collection(db, 'modules'), (snapshot) => {
      setModules(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as TrainingModule)));
      setLoading(false);
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'modules'));

    const q = query(collection(db, 'userProgress'), where('userId', '==', user.uid));
    const unsubscribeProgress = onSnapshot(q, (snapshot) => {
      setProgress(snapshot.docs.map(doc => doc.data() as UserProgress));
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'userProgress'));

    return () => {
      unsubscribeModules();
      unsubscribeProgress();
    };
  }, [user.uid]);

  const getModuleStatus = (moduleId: string) => {
    const p = progress.find(item => item.moduleId === moduleId);
    return p ? p.status : 'not-started';
  };

  const categories = [
    { id: 'phishing', label: 'Phishing', icon: Shield },
    { id: 'ransomware', label: 'Ransomware', icon: Lock },
    { id: 'scams', label: 'Scams', icon: AlertTriangle },
    { id: 'network', label: 'Network', icon: Zap },
  ];

  if (loading) {
    return <div className="flex items-center justify-center min-h-[60vh] text-[#00ff9d] font-mono">INITIALIZING LEARNING INTERFACE...</div>;
  }

  return (
    <div className="space-y-12 animate-in fade-in duration-1000">
      <header className="flex flex-col md:flex-row justify-between items-end gap-6 border-b border-[#00ff9d]/10 pb-8">
        <div className="space-y-2">
          <GlitchText text={`WELCOME, ${user.displayName.toUpperCase()}`} className="text-3xl font-black text-[#00ff9d]" />
          <p className="text-[#00ff9d]/50 text-xs uppercase tracking-[0.3em]">Cybersecurity Training Dashboard</p>
        </div>
        <div className="flex gap-4">
          <div className="bg-[#0d0d0d] border border-[#00ff9d]/20 p-4 rounded-sm text-center min-w-[120px]">
            <p className="text-[10px] text-[#00ff9d]/50 uppercase mb-1">Total Points</p>
            <p className="text-xl font-black text-[#00ff9d]">{user.points || 0}</p>
          </div>
          <div className="bg-[#0d0d0d] border border-[#8b0000]/20 p-4 rounded-sm text-center min-w-[120px]">
            <p className="text-[10px] text-[#8b0000]/50 uppercase mb-1">Modules Done</p>
            <p className="text-xl font-black text-[#8b0000]">{user.completedModules?.length || 0}</p>
          </div>
        </div>
      </header>

      <section className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-3 space-y-8">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-white uppercase tracking-widest flex items-center gap-3">
              <BookOpen className="w-5 h-5 text-[#8b0000]" />
              Training Modules
            </h3>
            <div className="flex gap-2">
              {categories.map(cat => (
                <span key={cat.id} className="text-[8px] px-2 py-1 bg-[#0d0d0d] border border-[#00ff9d]/10 text-[#00ff9d]/50 uppercase tracking-widest rounded-full">
                  {cat.label}
                </span>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {modules.length === 0 ? (
              <div className="col-span-2 p-12 border border-dashed border-[#00ff9d]/20 text-center space-y-4">
                <AlertTriangle className="w-12 h-12 text-[#8b0000] mx-auto opacity-50" />
                <p className="text-xs text-[#00ff9d]/50 uppercase tracking-widest">No training modules available in the database.</p>
                {user.role === 'admin' && (
                  <button 
                    onClick={() => onNavigate('admin')}
                    className="px-6 py-2 bg-[#8b0000] text-white text-[10px] font-bold uppercase tracking-widest hover:bg-[#a00000]"
                  >
                    Initialize Modules
                  </button>
                )}
              </div>
            ) : (
              modules.map((module, index) => {
                const status = getModuleStatus(module.id);
                return (
                  <motion.div
                    key={module.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    onClick={() => onNavigate('module', { moduleId: module.id })}
                    className="group relative border border-[#00ff9d]/10 bg-[#0d0d0d] p-6 rounded-sm hover:border-[#8b0000]/50 transition-all cursor-pointer overflow-hidden"
                  >
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                      <Shield className="w-12 h-12 text-[#00ff9d]" />
                    </div>
                    
                    <div className="relative z-10 space-y-4">
                      <div className="flex justify-between items-start">
                        <span className="text-[8px] font-bold px-2 py-0.5 rounded-full border border-[#00ff9d]/30 text-[#00ff9d] uppercase">
                          {module.difficulty}
                        </span>
                        {status === 'completed' && <CheckCircle className="w-4 h-4 text-[#00ff9d]" />}
                      </div>
                      
                      <div className="space-y-1">
                        <h4 className="text-sm font-black text-white group-hover:text-[#8b0000] transition-colors tracking-widest uppercase">{module.title}</h4>
                        <p className="text-[10px] text-[#00ff9d]/50 line-clamp-2 leading-relaxed">{module.description}</p>
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between items-center text-[8px] uppercase tracking-widest">
                          <span className={status === 'completed' ? 'text-[#00ff9d]' : status === 'in-progress' ? 'text-yellow-500' : 'text-[#00ff9d]/30'}>
                            {status.replace('-', ' ')}
                          </span>
                          <span className="text-[#00ff9d]/30">
                            {status === 'completed' ? '100%' : status === 'in-progress' ? '50%' : '0%'}
                          </span>
                        </div>
                        <div className="h-1 w-full bg-[#00ff9d]/5 rounded-full overflow-hidden">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: status === 'completed' ? '100%' : status === 'in-progress' ? '50%' : '0%' }}
                            className={`h-full transition-all duration-1000 ${
                              status === 'completed' ? 'bg-[#00ff9d]' : status === 'in-progress' ? 'bg-yellow-500' : 'bg-transparent'
                            }`}
                          />
                        </div>
                      </div>

                      <div className="pt-4 flex justify-between items-center border-t border-[#00ff9d]/5">
                        <span className="text-[10px] font-mono text-[#00ff9d]">{module.points} XP</span>
                        <div className="flex items-center gap-1 text-[8px] text-[#8b0000] font-bold uppercase tracking-widest group-hover:translate-x-1 transition-transform">
                          {status === 'completed' ? 'Review' : 'Start Training'}
                          <ChevronRight className="w-3 h-3" />
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })
            )}
          </div>
        </div>

        <div className="space-y-8">
          <div className="bg-[#0d0d0d] border border-[#00ff9d]/10 p-6 rounded-sm space-y-6">
            <h3 className="text-xs font-bold text-white uppercase tracking-widest flex items-center gap-2">
              <Award className="w-4 h-4 text-[#8b0000]" />
              Achievements
            </h3>
            <div className="space-y-4">
              {user.achievements?.length === 0 ? (
                <p className="text-[10px] text-[#00ff9d]/30 italic">No badges earned yet. Complete modules to unlock.</p>
              ) : (
                user.achievements?.map(achId => (
                  <div key={achId} className="flex items-center gap-3 p-2 bg-black/40 border border-[#00ff9d]/5 rounded-sm">
                    <div className="w-8 h-8 bg-[#8b0000]/10 rounded-full flex items-center justify-center">
                      <Award className="w-4 h-4 text-[#8b0000]" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-[#00ff9d] uppercase">{achId.replace(/-/g, ' ')}</p>
                      <p className="text-[8px] text-[#00ff9d]/50">Requirement met</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="bg-[#0d0d0d] border border-[#8b0000]/10 p-6 rounded-sm space-y-6">
            <h3 className="text-xs font-bold text-white uppercase tracking-widest flex items-center gap-2">
              <Target className="w-4 h-4 text-[#8b0000]" />
              Daily Streak
            </h3>
            <div className="flex items-center gap-4">
              <div className="text-3xl font-black text-[#8b0000]">{user.streak || 0}</div>
              <div className="space-y-1">
                <p className="text-[10px] text-[#00ff9d] uppercase font-bold">Day Streak</p>
                <p className="text-[8px] text-[#00ff9d]/50">Keep learning to build your streak!</p>
              </div>
            </div>
            <div className="grid grid-cols-7 gap-1">
              {[...Array(7)].map((_, i) => (
                <div key={i} className={`h-1 rounded-full ${i < (user.streak || 0) % 7 ? 'bg-[#8b0000]' : 'bg-[#00ff9d]/10'}`}></div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Dashboard;
