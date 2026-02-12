// DTOs and interfaces shared between frontend and backend

export interface UserDto {
  id: string;
  email: string;
  name?: string;
  avatarUrl?: string;
  provider?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ConversationDto {
  id: string;
  userId: string;
  title: string;
  createdAt: Date;
  updatedAt: Date;
  lastMessageAt: Date;
}

export interface MessageDto {
  id: string;
  conversationId: string;
  role: 'user' | 'assistant' | 'system';
  content?: string;
  uiSchema?: any;
  createdAt: Date;
}

export interface InteractionEventDto {
  id: string;
  conversationId: string;
  messageId: string;
  eventType: string;
  eventData: any;
  createdAt: Date;
}

export interface StateSnapshotDto {
  id: string;
  conversationId: string;
  snapshotData: any;
  eventSequenceNumber: number;
  createdAt: Date;
}

export interface AiProviderConfigDto {
  id: string;
  providerName: string;
  capabilities: any;
  config: any;
  isActive: boolean;
  createdAt: Date;
}

export interface AnalyticsEventDto {
  eventName: string;
  category: 'auth' | 'conversation' | 'navigation' | 'engagement';
  properties?: Record<string, any>;
  sessionId?: string;
  pageUrl?: string;
}

export interface AnalyticsStatsDto {
  totalEvents: number;
  uniqueUsers: number;
  eventsByCategory: Record<string, number>;
  eventsByName: { eventName: string; count: number }[];
  dailyActivity: { date: string; count: number }[];
}

export interface RegisterDto {
  email: string;
  password: string;
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface AuthResponseDto {
  access_token: string;
}

export interface JwtPayload {
  sub: string;
  email: string;
  iat?: number;
  exp?: number;
}
