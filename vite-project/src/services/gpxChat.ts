/**
 * RAG-based chat service for GPX route analysis
 * Sends user queries along with GPX context to AI for intelligent responses
 */

import { auth } from '@/lib/firebase';
import type { ChatRequest, ChatResponse, GPXChatContext } from '@/features/chat/types';

const API_URL = import.meta.env.VITE_GPX_API_URL || 'https://api.trainpace.com';

/**
 * Sends a chat query with GPX context to the backend RAG pipeline
 */
export async function sendChatQuery(
  query: string,
  context: GPXChatContext,
  conversationHistory: { role: string; content: string }[] = []
): Promise<ChatResponse> {
  const user = auth.currentUser;

  if (!user) {
    throw new Error('User must be authenticated to use chat');
  }

  const token = await user.getIdToken();

  const request: ChatRequest = {
    query,
    context,
    conversationHistory: conversationHistory.map((msg) => ({
      id: crypto.randomUUID(),
      role: msg.role as 'user' | 'assistant' | 'system',
      content: msg.content,
      timestamp: new Date(),
    })),
  };

  try {
    const startTime = performance.now();

    const response = await fetch(`${API_URL}/api/gpx-chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      if (response.status === 429) {
        throw new Error('Too many requests. Please wait a moment and try again.');
      }
      if (response.status === 401) {
        throw new Error('Authentication failed. Please sign in again.');
      }
      throw new Error(`Failed to get response: ${response.statusText}`);
    }

    const data = await response.json();
    const processingTime = performance.now() - startTime;

    return {
      message: data.message || data.response || '',
      suggestions: data.suggestions || [],
      metadata: {
        relevantSegments: data.relevantSegments || [],
        processingTime,
      },
    };
  } catch (error) {
    console.error('Error in GPX chat:', error);
    throw error;
  }
}

/**
 * Builds the GPX context from route data and analysis results
 */
export function buildGPXContext(
  routeId: string,
  routeName: string,
  analysisData: any,
  settings?: { basePaceMinPerKm?: number; gradeThreshold?: number }
): GPXChatContext {
  const segments = analysisData?.elevationInsights?.segments || [];
  const profile = analysisData?.profile || [];

  return {
    routeId,
    routeName,
    totalDistance: analysisData?.totalDistanceKm || 0,
    elevationGain: analysisData?.elevationGain || 0,
    elevationLoss: analysisData?.elevationInsights?.totalElevationLoss || 0,
    maxElevation: profile.length > 0 ? Math.max(...profile.map((p: any) => p.elevation)) : undefined,
    minElevation: profile.length > 0 ? Math.min(...profile.map((p: any) => p.elevation)) : undefined,
    segments: segments.map((seg: any) => ({
      type: seg.type || 'flat',
      startDistance: seg.startDistance || 0,
      endDistance: seg.endDistance || 0,
      length: seg.length || 0,
      grade: seg.grade || 0,
      challengeRating: seg.challengeRating || 'easy',
      pacingAdvice: seg.pacingAdvice,
    })),
    profile: profile.map((p: any) => ({
      distance: p.distance || 0,
      elevation: p.elevation || 0,
      grade: p.grade,
    })),
    goalPace: settings?.basePaceMinPerKm,
    gradeThreshold: settings?.gradeThreshold,
  };
}

/**
 * Generate suggested questions based on the route data
 */
export function getSuggestedQuestions(context: GPXChatContext): string[] {
  const suggestions: string[] = [];

  // Always include these basic questions
  suggestions.push('What are the most challenging parts of this route?');
  suggestions.push('How should I pace this race?');

  // Add context-specific questions
  if (context.elevationGain > 500) {
    suggestions.push('What pacing strategy should I use for the climbs?');
  }

  const uphillSegments = context.segments.filter(s => s.type === 'uphill');
  if (uphillSegments.length > 3) {
    suggestions.push('Where are all the uphill sections?');
  }

  if (context.segments.some(s => s.challengeRating === 'brutal' || s.challengeRating === 'hard')) {
    suggestions.push('How should I prepare for the hardest sections?');
  }

  if (context.goalPace) {
    suggestions.push('Will I hit my goal pace on this terrain?');
  }

  suggestions.push('What should I know about the elevation profile?');

  return suggestions;
}
