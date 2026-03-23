import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { doc, getDoc, updateDoc, increment, collection, query, where, getDocs, setDoc } from 'firebase/firestore';
import { Quiz as QuizType, UserProfile, OperationType } from '../types';
import { handleFirestoreError } from '../utils';
import { GlitchText } from '../components/TorLoading';
import { Shield, Zap, Target, Award, BookOpen, ChevronRight, Lock, CheckCircle, AlertTriangle, Play, Info, ArrowLeft, Terminal, Eye, AlertCircle, HelpCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface QuizProps {
  user: UserProfile;
  moduleId: string;
  onComplete: () => void;
}

const Quiz: React.FC<QuizProps> = ({ user, moduleId, onComplete }) => {
  const [quiz, setQuiz] = useState<QuizType | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [score, setScore] = useState(0);
  const [isFinished, setIsFinished] = useState(false);

  useEffect(() => {
    const fetchQuiz = async () => {
      try {
        const q = query(collection(db, 'quizzes'), where('moduleId', '==', moduleId));
        const snap = await getDocs(q);
        if (!snap.empty) {
          setQuiz({ id: snap.docs[0].id, ...snap.docs[0].data() } as QuizType);
        } else {
          // Seed a default quiz if none exists for this module
          const defaultQuiz: QuizType = {
            id: `quiz-${moduleId}`,
            moduleId,
            questions: [
              {
                id: 'q1',
                question: 'What is the most common indicator of a phishing email?',
                options: [
                  'Professional language',
                  'Mismatched sender email address',
                  'High-resolution images',
                  'Correct spelling'
                ],
                correctIndex: 1,
                explanation: 'Attackers often use email addresses that look similar to real ones but are slightly different (e.g., @g00gle.com instead of @google.com).'
              },
              {
                id: 'q2',
                question: 'If you receive a ransomware pop-up, what is the first thing you should do?',
                options: [
                  'Pay the ransom immediately',
                  'Disconnect the device from the network',
                  'Restart the computer',
                  'Call the number on the screen'
                ],
                correctIndex: 1,
                explanation: 'Disconnecting from the network prevents the ransomware from spreading to other devices on the same network.'
              },
              {
                id: 'q3',
                question: 'What does "Escrow" mean in a dark market context?',
                options: [
                  'A type of malware',
                  'A third-party holding funds until delivery is confirmed',
                  'A private chat protocol',
                  'A vendor reputation score'
                ],
                correctIndex: 1,
                explanation: 'Escrow services protect both buyers and sellers by ensuring funds are only released when the transaction is successfully completed.'
              }
            ]
          };
          setQuiz(defaultQuiz);
          await setDoc(doc(db, 'quizzes', defaultQuiz.id), defaultQuiz);
        }
      } catch (err) {
        handleFirestoreError(err, OperationType.GET, `quizzes/${moduleId}`);
      } finally {
        setLoading(false);
      }
    };
    fetchQuiz();
  }, [moduleId]);

  const handleOptionSelect = (index: number) => {
    if (showExplanation) return;
    setSelectedOption(index);
    setShowExplanation(true);
    if (index === quiz?.questions[currentQuestionIndex].correctIndex) {
      setScore(prev => prev + 1);
    }
  };

  const nextQuestion = async () => {
    if (!quiz) return;
    if (currentQuestionIndex < quiz.questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setSelectedOption(null);
      setShowExplanation(false);
    } else {
      setIsFinished(true);
      // Update user progress and points
      try {
        const q = query(collection(db, 'userProgress'), where('userId', '==', user.uid), where('moduleId', '==', moduleId));
        const snap = await getDocs(q);
        if (!snap.empty) {
          const progressId = snap.docs[0].id;
          await updateDoc(doc(db, 'userProgress', progressId), {
            quizScore: (score / quiz.questions.length) * 100,
            status: 'completed'
          });
        }
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, 'userProgress');
      }
    }
  };

  if (loading) return <div className="text-[#00ff9d] font-mono text-center p-20">LOADING ASSESSMENT...</div>;
  if (!quiz) return <div className="text-[#8b0000] font-mono text-center p-20">QUIZ NOT FOUND</div>;

  const currentQuestion = quiz.questions[currentQuestionIndex];

  return (
    <div className="max-w-2xl mx-auto space-y-12 animate-in fade-in duration-700">
      <header className="space-y-4 text-center">
        <div className="flex justify-center">
          <HelpCircle className="w-12 h-12 text-[#8b0000]" />
        </div>
        <GlitchText text="MODULE ASSESSMENT" className="text-3xl font-black text-[#00ff9d]" />
        <p className="text-[#00ff9d]/50 text-[10px] uppercase tracking-widest">Question {currentQuestionIndex + 1} of {quiz.questions.length}</p>
      </header>

      <AnimatePresence mode="wait">
        {!isFinished ? (
          <motion.div 
            key={currentQuestionIndex}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-8"
          >
            <div className="bg-[#0d0d0d] border border-[#00ff9d]/10 p-8 rounded-sm space-y-8">
              <h3 className="text-lg font-bold text-white tracking-widest leading-relaxed">{currentQuestion.question}</h3>
              
              <div className="grid grid-cols-1 gap-4">
                {currentQuestion.options.map((option, index) => {
                  const isCorrect = index === currentQuestion.correctIndex;
                  const isSelected = index === selectedOption;
                  
                  let borderColor = 'border-[#00ff9d]/10';
                  let textColor = 'text-[#00ff9d]/70';
                  
                  if (showExplanation) {
                    if (isCorrect) {
                      borderColor = 'border-[#00ff9d]';
                      textColor = 'text-[#00ff9d]';
                    } else if (isSelected) {
                      borderColor = 'border-[#8b0000]';
                      textColor = 'text-[#8b0000]';
                    } else {
                      textColor = 'text-[#00ff9d]/20';
                      borderColor = 'border-[#00ff9d]/5';
                    }
                  } else if (isSelected) {
                    borderColor = 'border-[#00ff9d]';
                  }

                  return (
                    <button
                      key={index}
                      onClick={() => handleOptionSelect(index)}
                      disabled={showExplanation}
                      className={`w-full p-4 text-left text-xs font-bold uppercase tracking-widest border rounded-sm transition-all ${borderColor} ${textColor} ${!showExplanation && 'hover:bg-[#00ff9d]/5 hover:border-[#00ff9d]/50'}`}
                    >
                      <div className="flex items-center gap-4">
                        <span className="w-6 h-6 flex items-center justify-center border border-inherit rounded-full text-[10px]">{String.fromCharCode(65 + index)}</span>
                        {option}
                      </div>
                    </button>
                  );
                })}
              </div>

              {showExplanation && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className={`p-6 rounded-sm space-y-4 ${selectedOption === currentQuestion.correctIndex ? 'bg-[#00ff9d]/5 border border-[#00ff9d]/20' : 'bg-[#8b0000]/5 border border-[#8b0000]/20'}`}
                >
                  <div className="flex items-center gap-2">
                    {selectedOption === currentQuestion.correctIndex ? (
                      <CheckCircle className="w-4 h-4 text-[#00ff9d]" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-[#8b0000]" />
                    )}
                    <span className={`text-[10px] font-black uppercase tracking-widest ${selectedOption === currentQuestion.correctIndex ? 'text-[#00ff9d]' : 'text-[#8b0000]'}`}>
                      {selectedOption === currentQuestion.correctIndex ? 'Correct Analysis' : 'Incorrect Identification'}
                    </span>
                  </div>
                  <p className="text-[10px] text-[#00ff9d]/70 leading-relaxed italic">{currentQuestion.explanation}</p>
                  
                  <button 
                    onClick={nextQuestion}
                    className="w-full py-3 bg-[#0d0d0d] border border-[#00ff9d]/20 text-[#00ff9d] text-[10px] font-bold uppercase tracking-widest hover:bg-[#00ff9d]/10 transition-all"
                  >
                    {currentQuestionIndex < quiz.questions.length - 1 ? 'Next Question' : 'Finish Assessment'}
                  </button>
                </motion.div>
              )}
            </div>
          </motion.div>
        ) : (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-[#0d0d0d] border border-[#00ff9d]/10 p-12 rounded-sm text-center space-y-8"
          >
            <div className="space-y-4">
              <Award className="w-16 h-16 text-[#00ff9d] mx-auto" />
              <h3 className="text-2xl font-black text-white tracking-widest uppercase">Assessment Complete</h3>
              <p className="text-xs text-[#00ff9d]/50 uppercase tracking-widest">Your Score: {score} / {quiz.questions.length}</p>
            </div>

            <div className="flex flex-col gap-4">
              <button 
                onClick={onComplete}
                className="w-full py-4 bg-[#8b0000] text-white font-bold uppercase tracking-widest hover:bg-[#a00000] transition-colors"
              >
                Return to Dashboard
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Quiz;
