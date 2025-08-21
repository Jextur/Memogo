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
    onError: (error, variables) => {
      console.error("Error sending message:", error);
      
      // Create a helpful error message
      const currentConv = queryClient.getQueryData<Conversation>(['/api/conversation', variables.conversationId]);
      const errorMessage: ChatMessage = {
        id: `error-${Date.now()}`,
        role: "assistant",
        content: "I had a little trouble understanding that. Could you try rephrasing? Don't worry about typos - I can handle 'lodon' for London or 'five days' instead of '5 days'. What would you like to tell me?",
        timestamp: new Date(),
        options: (!currentConv || currentConv.messages.length === 0) ? ["London", "Paris", "Tokyo", "New York"] : undefined
      };
      
      // Add error message to conversation
      if (currentConv) {
        queryClient.setQueryData(['/api/conversation', variables.conversationId], {
          ...currentConv,
          messages: [...currentConv.messages, errorMessage]
        });
      }
    },
  });

  // Generate packages mutation
  const generatePackagesMutation = useMutation({
    mutationFn: generatePackages,
    onSuccess: (data, conversationId) => {
      console.log("Package generation successful:", data.packages.length, "packages created");
      // Set the packages data directly in cache
      queryClient.setQueryData(['/api/conversation', conversationId, 'packages'], data.packages);
      // Force refetch of packages query to ensure UI updates immediately
      queryClient.refetchQueries({ queryKey: ['/api/conversation', conversationId, 'packages'] });
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
