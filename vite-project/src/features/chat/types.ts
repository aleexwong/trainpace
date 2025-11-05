/**
 * Types for the RAG-based GPX chat system
 */

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  metadata?: {
    routeId?: string;
    processingTime?: number;
  };
}

export interface GPXChatContext {
  routeId: string;
  routeName: string;
  totalDistance: number;
  elevationGain: number;
  elevationLoss: number;
  maxElevation?: number;
  minElevation?: number;
  segments: SegmentContext[];
  profile: ProfilePoint[];
  goalPace?: number;
  gradeThreshold?: number;
}

interface SegmentContext {
  type: 'uphill' | 'downhill' | 'flat';
  startDistance: number;
  endDistance: number;
  length: number;
  grade: number;
  challengeRating: string;
  pacingAdvice?: string;
}

interface ProfilePoint {
  distance: number;
  elevation: number;
  grade?: number;
}

export interface ChatRequest {
  query: string;
  context: GPXChatContext;
  conversationHistory: ChatMessage[];
}

export interface ChatResponse {
  message: string;
  suggestions?: string[];
  metadata?: {
    relevantSegments?: number[];
    processingTime?: number;
  };
}

export interface ChatState {
  messages: ChatMessage[];
  isLoading: boolean;
  error: string | null;
  context: GPXChatContext | null;
}
