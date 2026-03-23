export type UserRole = 'admin' | 'user';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  balance: number;
  debt: number;
  points: number;
  completedModules: string[];
  achievements: string[];
  streak: number;
  lastActive: string;
  publicKey?: string;
  privateKey?: string; // Only for system bots
  codename?: string;
}

export interface TrainingModule {
  id: string;
  title: string;
  description: string;
  category: 'phishing' | 'ransomware' | 'scams' | 'social-engineering' | 'network' | 'passwords' | 'malware';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  points: number;
  icon: string;
  scenario: string;
  educationalOutcome: string;
  redFlags: string[];
  bestPractices: string[];
  isActive: boolean;
}

export interface Quiz {
  id: string;
  moduleId: string;
  questions: {
    id: string;
    question: string;
    options: string[];
    correctIndex: number;
    explanation: string;
  }[];
}

export interface UserProgress {
  userId: string;
  moduleId: string;
  status: 'not-started' | 'in-progress' | 'completed';
  quizScore?: number;
  completedAt?: string;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  requirement: string;
}

export interface Vendor {
  id: string;
  name: string;
  category: string;
  rating: number;
  description: string;
}

export interface ChatCode {
  code: string;
  vendorId: string;
  isActive: boolean;
  createdBy?: string;
  expiresAt?: string;
}

export interface Chat {
  id: string;
  participants: string[];
  lastMessage: string;
  updatedAt: string;
  typing?: Record<string, boolean>;
}

export interface Message {
  id: string;
  chatId: string;
  senderId: string;
  text: string;
  timestamp: string;
  encrypted: boolean;
  read?: boolean;
}

export interface MarketItem {
  id: string;
  title: string;
  price: number;
  category: string;
  vendorId: string;
  description: string;
}

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}
