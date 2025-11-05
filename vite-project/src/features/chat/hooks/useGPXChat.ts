/**
 * Hook for managing GPX chat state and interactions
 */

import { useState, useCallback } from 'react';
import type { ChatMessage, ChatState, GPXChatContext } from '../types';
import { sendChatQuery } from '@/services/gpxChat';

export function useGPXChat(initialContext: GPXChatContext | null = null) {
  const [state, setState] = useState<ChatState>({
    messages: [],
    isLoading: false,
    error: null,
    context: initialContext,
  });

  /**
   * Updates the GPX context (e.g., when route data changes)
   */
  const updateContext = useCallback((newContext: GPXChatContext) => {
    setState((prev) => ({
      ...prev,
      context: newContext,
      // Add a system message when context changes
      messages: [
        ...prev.messages,
        {
          id: crypto.randomUUID(),
          role: 'system',
          content: `Route context updated: ${newContext.routeName} (${newContext.totalDistance.toFixed(2)}km, +${newContext.elevationGain.toFixed(0)}m)`,
          timestamp: new Date(),
        },
      ],
    }));
  }, []);

  /**
   * Sends a message to the chat
   */
  const sendMessage = useCallback(
    async (query: string) => {
      if (!state.context) {
        setState((prev) => ({
          ...prev,
          error: 'No route context available. Please upload or load a GPX file first.',
        }));
        return;
      }

      if (!query.trim()) {
        return;
      }

      // Add user message immediately
      const userMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'user',
        content: query,
        timestamp: new Date(),
        metadata: {
          routeId: state.context.routeId,
        },
      };

      setState((prev) => ({
        ...prev,
        messages: [...prev.messages, userMessage],
        isLoading: true,
        error: null,
      }));

      try {
        // Prepare conversation history (last 10 messages for context)
        const conversationHistory = state.messages
          .slice(-10)
          .map((msg) => ({
            role: msg.role,
            content: msg.content,
          }));

        // Send query with context
        const response = await sendChatQuery(
          query,
          state.context,
          conversationHistory
        );

        // Add assistant response
        const assistantMessage: ChatMessage = {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: response.message,
          timestamp: new Date(),
          metadata: {
            routeId: state.context.routeId,
            processingTime: response.metadata?.processingTime,
          },
        };

        setState((prev) => ({
          ...prev,
          messages: [...prev.messages, assistantMessage],
          isLoading: false,
        }));
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Failed to get response';

        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: errorMessage,
        }));
      }
    },
    [state.context, state.messages]
  );

  /**
   * Clears the chat history
   */
  const clearChat = useCallback(() => {
    setState((prev) => ({
      ...prev,
      messages: [],
      error: null,
    }));
  }, []);

  /**
   * Clears the error state
   */
  const clearError = useCallback(() => {
    setState((prev) => ({
      ...prev,
      error: null,
    }));
  }, []);

  return {
    messages: state.messages,
    isLoading: state.isLoading,
    error: state.error,
    context: state.context,
    sendMessage,
    updateContext,
    clearChat,
    clearError,
  };
}
