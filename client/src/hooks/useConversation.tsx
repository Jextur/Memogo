import { useState, useCallback } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createConversation, sendMessage, getConversation, generatePackages } from "../lib/api";
import { Conversation, ChatMessage, TravelPackage } from "../types/travel";

export function useConversation(conversationId?: string) {
  const [currentConversationId, setCurrentConversationId] = useState<string | undefined>(conversationId);
  const queryClient = useQueryClient();

  // Get conversation query
  const { data: conversation, isLoading: conversationLoading } = useQuery({
    queryKey: ['/api/conversation', currentConversationId],
    enabled: !!currentConversationId,
  });

  // Create conversation mutation
  const createConversationMutation = useMutation({
    mutationFn: createConversation,
    onSuccess: (data: Conversation) => {
      setCurrentConversationId(data.id);
      queryClient.setQueryData(['/api/conversation', data.id], data);
    },
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: ({ conversationId, message }: { conversationId: string; message: string }) =>
      sendMessage(conversationId, message),
    onSuccess: (data, variables) => {
      queryClient.setQueryData(['/api/conversation', variables.conversationId], data.conversation);
    },
  });

  // Generate packages mutation
  const generatePackagesMutation = useMutation({
    mutationFn: generatePackages,
    onSuccess: (data, conversationId) => {
      console.log("Package generation successful:", data.packages.length, "packages created");
      queryClient.setQueryData(['/api/conversation', conversationId, 'packages'], data.packages);
      // Refresh conversation to get updated status
      queryClient.invalidateQueries({ queryKey: ['/api/conversation', conversationId] });
    },
    onError: (error, conversationId) => {
      console.error("Package generation failed for conversation", conversationId, ":", error);
    },
  });

  // Helper functions
  const startConversation = useCallback((initialData?: {
    destination?: string;
    days?: number;
    people?: number;
    theme?: string;
  }) => {
    createConversationMutation.mutate({
      userId: undefined, // Will be handled by backend
      ...initialData,
    });
  }, [createConversationMutation]);

  const sendUserMessage = useCallback((message: string) => {
    if (!currentConversationId) return;
    sendMessageMutation.mutate({
      conversationId: currentConversationId,
      message,
    });
  }, [currentConversationId, sendMessageMutation]);

  const generateTravelPackages = useCallback(() => {
    if (!currentConversationId) return;
    generatePackagesMutation.mutate(currentConversationId);
  }, [currentConversationId, generatePackagesMutation]);

  return {
    conversation: conversation as Conversation,
    conversationId: currentConversationId,
    isLoading: conversationLoading,
    
    // Mutations
    startConversation,
    sendUserMessage,
    generateTravelPackages,
    
    // Mutation states
    isCreatingConversation: createConversationMutation.isPending,
    isSendingMessage: sendMessageMutation.isPending,
    isGeneratingPackages: generatePackagesMutation.isPending,
    
    // Latest AI response
    latestAIResponse: sendMessageMutation.data?.aiResponse,
    nextStep: sendMessageMutation.data?.nextStep,
  };
}
