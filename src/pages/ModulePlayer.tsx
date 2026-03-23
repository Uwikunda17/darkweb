import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { doc, getDoc, updateDoc, arrayUnion, increment, collection, addDoc, query, where, getDocs } from 'firebase/firestore';
import { TrainingModule, UserProfile, OperationType, UserProgress } from '../types';
import { handleFirestoreError } from '../utils';
import { GlitchText } from '../components/TorLoading';
import { Shield, Zap, Target, Award, BookOpen, ChevronRight, Lock, CheckCircle, AlertTriangle, Play, Info, ArrowLeft, Terminal, Eye, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { RansomwarePopup, PhishingAlert } from '../components/Tricks';

interface ModulePlayerProps {
  user: UserProfile;
  moduleId: string;
  onBack: () => void;
  onNavigate: (page: any, params?: any) => void;
}

const ModulePlayer: React.FC<ModulePlayerProps> = ({ user, moduleId, onBack, onNavigate }) => {
  const [module, setModule] = useState<TrainingModule | null>(null);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState<'intro' | 'scenario' | 'analysis' | 'conclusion'>('intro');
  const [showTrick, setShowTrick] = useState(false);
  const [analysisMode, setAnalysisMode] = useState(false);

  useEffect(() => {
    const fetchModule = async () => {
      try {
        const docRef = doc(db, 'modules', moduleId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setModule({ id: docSnap.id, ...docSnap.data() } as TrainingModule);
        }
      } catch (err) {
        handleFirestoreError(err, OperationType.GET, `modules/${moduleId}`);
      } finally {
        setLoading(false);
      }
    };
    fetchModule();
  }, [moduleId]);

  const startScenario = () => {
    setStep('scenario');
    setShowTrick(true);
  };

  const completeScenario = () => {
    setShowTrick(false);
    setStep('analysis');
  };

  const finishModule = async () => {
    try {
      const q = query(collection(db, 'userProgress'), where('userId', '==', user.uid), where('moduleId', '==', moduleId));
      const snap = await getDocs(q);
      
      if (snap.empty) {
        await addDoc(collection(db, 'userProgress'), {
          userId: user.uid,
          moduleId: moduleId,
          status: 'completed',
          completedAt: new Date().toISOString()
        });
        
        const userRef = doc(db, 'users', user.uid);
        await updateDoc(userRef, {
          points: increment(module?.points || 0),
          completedModules: arrayUnion(moduleId)
        });
      }
      onNavigate('quiz', { moduleId });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'userProgress');
    }
  };

  if (loading) return <div className="text-[#00ff9d] font-mono text-center p-20">LOADING SCENARIO...</div>;
  if (!module) return <div className="text-[#8b0000] font-mono text-center p-20">MODULE NOT FOUND</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-12 animate-in fade-in duration-700">
      <button 
        onClick={onBack}
        className="flex items-center gap-2 text-[10px] text-[#00ff9d]/50 uppercase tracking-widest hover:text-[#00ff9d] transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Dashboard
      </button>

      <header className="space-y-4">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-[#8b0000]/10 border border-[#8b0000]/20 rounded-sm">
            <Shield className="w-8 h-8 text-[#8b0000]" />
          </div>
          <div className="space-y-1">
            <h2 className="text-2xl font-black text-white tracking-widest uppercase">{module.title}</h2>
            <p className="text-[10px] text-[#00ff9d]/50 uppercase tracking-widest">{module.category} | {module.difficulty} | {module.points} XP</p>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-8">
        <AnimatePresence mode="wait">
          {step === 'intro' && (
            <motion.section 
              key="intro"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="bg-[#0d0d0d] border border-[#00ff9d]/10 p-8 rounded-sm space-y-8"
            >
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-[#00ff9d] uppercase tracking-widest flex items-center gap-2">
                  <Info className="w-5 h-5 text-[#8b0000]" />
                  Scenario Briefing
                </h3>
                <p className="text-xs text-[#00ff9d]/70 leading-relaxed">{module.description}</p>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-bold text-[#00ff9d] uppercase tracking-widest flex items-center gap-2">
                  <Target className="w-5 h-5 text-[#8b0000]" />
                  Learning Objectives
                </h3>
                <p className="text-xs text-[#00ff9d]/70 leading-relaxed">{module.educationalOutcome}</p>
              </div>

              <button 
                onClick={startScenario}
                className="w-full py-4 bg-[#8b0000] text-white font-bold uppercase tracking-widest hover:bg-[#a00000] transition-colors flex items-center justify-center gap-2"
              >
                <Play className="w-4 h-4" />
                Initiate Training Scenario
              </button>
            </motion.section>
          )}

          {step === 'scenario' && (
            <motion.section 
              key="scenario"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-[#0d0d0d] border border-[#8b0000]/20 p-12 rounded-sm text-center space-y-8 min-h-[400px] flex flex-col items-center justify-center"
            >
              <div className="space-y-4">
                <Terminal className="w-16 h-16 text-[#8b0000] mx-auto animate-pulse" />
                <GlitchText text="SCENARIO IN PROGRESS" className="text-xl font-black text-[#8b0000]" />
                <p className="text-xs text-[#00ff9d]/50 uppercase tracking-widest">Interact with the simulation to continue.</p>
              </div>
              
              <div className="w-full max-w-md p-6 bg-black/40 border border-[#00ff9d]/5 rounded-sm text-left font-mono text-[10px] text-[#00ff9d]/70">
                <p className="mb-2 text-[#8b0000] font-bold">SYSTEM LOG:</p>
                <p className="mb-1">{">"} Initializing {module.category} simulation...</p>
                <p className="mb-1">{">"} Injecting payload into local environment...</p>
                <p className="mb-1">{">"} Waiting for user interaction...</p>
              </div>

              <button 
                onClick={completeScenario}
                className="px-8 py-3 border border-[#00ff9d]/30 text-[#00ff9d] text-[10px] font-bold uppercase tracking-widest hover:bg-[#00ff9d]/10"
              >
                Continue to Analysis
              </button>
            </motion.section>
          )}

          {step === 'analysis' && (
            <motion.section 
              key="analysis"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-8"
            >
              <div className="bg-[#0d0d0d] border border-[#00ff9d]/10 p-8 rounded-sm space-y-8">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-[#00ff9d] uppercase tracking-widest flex items-center gap-2">
                    <Eye className="w-5 h-5 text-[#8b0000]" />
                    Threat Analysis
                  </h3>
                  <button 
                    onClick={() => setAnalysisMode(!analysisMode)}
                    className={`text-[8px] px-3 py-1 rounded-full border transition-all ${analysisMode ? 'bg-[#8b0000] text-white border-[#8b0000]' : 'border-[#00ff9d]/30 text-[#00ff9d]/50'}`}
                  >
                    {analysisMode ? 'EXIT ANALYSIS' : 'ENTER ANALYSIS MODE'}
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <h4 className="text-xs font-bold text-[#8b0000] uppercase tracking-widest flex items-center gap-2">
                      <AlertCircle className="w-4 h-4" />
                      Red Flags Detected
                    </h4>
                    <ul className="space-y-2">
                      {module.redFlags.map((flag, i) => (
                        <li key={i} className="text-[10px] text-[#00ff9d]/70 flex items-start gap-2">
                          <span className="text-[#8b0000]">•</span>
                          {flag}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="space-y-4">
                    <h4 className="text-xs font-bold text-[#00ff9d] uppercase tracking-widest flex items-center gap-2">
                      <CheckCircle className="w-4 h-4" />
                      Best Practices
                    </h4>
                    <ul className="space-y-2">
                      {module.bestPractices.map((practice, i) => (
                        <li key={i} className="text-[10px] text-[#00ff9d]/70 flex items-start gap-2">
                          <span className="text-[#00ff9d]">•</span>
                          {practice}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="p-4 bg-[#8b0000]/5 border border-[#8b0000]/20 rounded-sm">
                  <p className="text-[10px] text-[#00ff9d]/80 leading-relaxed italic">
                    <span className="text-[#8b0000] font-bold uppercase mr-2">Expert Insight:</span>
                    {module.educationalOutcome}
                  </p>
                </div>

                <button 
                  onClick={finishModule}
                  className="w-full py-4 bg-[#00ff9d] text-black font-bold uppercase tracking-widest hover:bg-[#00ff9d]/80 transition-colors flex items-center justify-center gap-2"
                >
                  Take Module Quiz
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </motion.section>
          )}
        </AnimatePresence>
      </div>

      {/* Interactive Tricks Triggered by Module */}
      <AnimatePresence>
        {showTrick && module.category === 'ransomware' && (
          <RansomwarePopup onClose={() => {}} educationMode={analysisMode} />
        )}
        {showTrick && module.category === 'phishing' && (
          <PhishingAlert onClose={() => {}} educationMode={analysisMode} />
        )}
      </AnimatePresence>
    </div>
  );
};

export default ModulePlayer;
