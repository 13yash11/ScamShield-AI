export type ScanType = 'text' | 'screenshot' | 'url';

export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface User {
  id: string;
  fullName: string;
  email: string;
  role: 'user' | 'admin';
  createdAt: string;
}

export interface AuthCredentials {
  identifier: string; // Email address
  password: string;
}

export interface SignUpData {
  fullName: string;
  email: string;
  password: string;
  rePassword: string;
}

export interface ScanResult {
  id: string;
  scanType: ScanType;
  target: string;
  riskLevel: RiskLevel;
  riskScore: number; // 0 to 100
  summary: string;
  warningSigns: string[];
  suspiciousPhrases?: string[];
  explanation: string;
  recommendations: string[];
  detectionMethod: string;
  limitations: string;
  aiUsed?: boolean;
  fallbackReason?: string | null;
  confidence?: null;
  saved?: boolean;
  persistenceError?: string | null;
  createdAt: string;
}

export interface ScanHistoryItem {
  id: string;
  scanType: ScanType;
  riskLevel: RiskLevel;
  summary: string;
  targetPreview: string;
  createdAt: string;
}

export interface AdminMetrics {
  totalScans: number;
  flaggedThreats: number;
  activeUsers: number;
  reportedScamsCount: number;
}

export interface ScamReport {
  id: string;
  reporterEmail?: string;
  content: string;
  type: ScanType;
  submittedAt: string;
  status: 'PENDING_REVIEW' | 'CONFIRMED_SCAM' | 'BENIGN';
  notes?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  code?: string;
}

export interface PrivacyPreferences {
  saveHistory: boolean;
  storeContent: boolean;
  useAi: boolean;
}

export interface NotificationPreferences { securityNotices: boolean; }

export interface UserSettings {
  user: User;
  notificationPreferences: NotificationPreferences;
  privacyPreferences: PrivacyPreferences;
  message?: string;
}

export interface SettingsPatch {
  profile?: Pick<User, 'fullName' | 'email'>;
  notificationPreferences?: NotificationPreferences;
  privacyPreferences?: PrivacyPreferences;
}
