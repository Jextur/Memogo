import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { useConversation } from "@/hooks/useConversation";
import { ChatMessage } from "@/types/travel";
import { Plane, Bot, User, Send } from "lucide-react";

interface ChatInterfaceProps {
  conversationId?: string;
  onPackagesReady?: () => void;
  onConversationIdChange?: (id: string) => void;
}

export function ChatInterface({ conversationId, onPackagesReady, onConversationIdChange }: ChatInterfaceProps) {
  const [message, setMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const packageGenerationTriggeredRef = useRef<string | null>(null);
  
  const {
    conversation,
    conversationId: currentConversationId,
    isLoading,
    startConversation,
    sendUserMessage,
    generateTravelPackages,
    isSendingMessage,
    isGeneratingPackages,
    latestAIResponse,
    nextStep,
  } = useConversation(conversationId);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conversation?.messages]);

  // Start conversation if none exists
  useEffect(() => {
    if (!conversationId && !currentConversationId && !isLoading) {
      startConversation();
    }
  }, [conversationId, currentConversationId, isLoading]); // Remove startConversation from deps to prevent infinite loop

  // Notify parent of conversation ID changes
  useEffect(() => {
    if (currentConversationId && onConversationIdChange) {
      onConversationIdChange(currentConversationId);
    }
  }, [currentConversationId, onConversationIdChange]);

  // Handle package generation trigger with delay to ensure conversation data is saved
  useEffect(() => {
    if (nextStep === "generate" && !isGeneratingPackages && currentConversationId) {
      // Prevent duplicate generation for the same conversation
      if (packageGenerationTriggeredRef.current === currentConversationId) {
        return;
      }
      
      console.log("Auto-triggering package generation for conversation:", currentConversationId);
      packageGenerationTriggeredRef.current = currentConversationId;
      
      // Add a small delay to ensure conversation data is fully saved
      setTimeout(() => {
        generateTravelPackages();
      }, 500); // 500ms delay to allow conversation update to complete
    }
  }, [nextStep, isGeneratingPackages, currentConversationId]);

  // Notify parent when packages are ready
  useEffect(() => {
    if (conversation?.status === "completed" && onPackagesReady) {
      onPackagesReady();
    }
  }, [conversation?.status, onPackagesReady]);

  const handleSendMessage = () => {
    if (!message.trim() || isSendingMessage) return;
    sendUserMessage(message);
    setMessage("");
  };

  const handleOptionSelect = (option: string) => {
    sendUserMessage(option);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (isLoading) {
    return (
      <Card className="bg-brand-card border-brand-border flex-1 flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner className="mx-auto mb-4" />
          <p className="text-brand-mute">Starting conversation...</p>
        </div>
      </Card>
    );
  }

  const messages = conversation?.messages || [];
  const showWelcome = messages.length === 0;

  return (
    <Card className="bg-brand-card border-brand-border overflow-hidden flex flex-col h-full">
      <CardHeader className="border-b border-brand-border">
        <CardTitle className="flex items-center gap-2 text-brand-text">
          <Plane className="w-5 h-5 text-brand-accent" />
          Plan Your Perfect Trip
        </CardTitle>
        <p className="text-brand-mute text-sm">Chat with our AI travel consultant</p>
      </CardHeader>
      
      <CardContent className="flex-1 p-4 overflow-y-auto space-y-4" style={{ maxHeight: "600px" }}>
        {showWelcome && (
          <div className="flex items-start space-x-3">
            <div className="w-8 h-8 bg-brand-accent rounded-full flex items-center justify-center flex-shrink-0">
              <Bot className="text-brand-bg w-4 h-4" />
            </div>
            <div className="bg-brand-bg/50 rounded-2xl rounded-tl-sm px-4 py-3 max-w-xs">
              <p className="text-sm text-brand-text">
                Hi! I'm your AI travel consultant. Where would you like to go for your next adventure? 🌏
              </p>
            </div>
          </div>
        )}

        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex items-start space-x-3 ${
              msg.role === "user" ? "flex-row-reverse space-x-reverse" : ""
            }`}
          >
            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
              msg.role === "user" 
                ? "bg-brand-accent/20" 
                : "bg-brand-accent"
            }`}>
              {msg.role === "user" ? (
                <User className="text-brand-accent w-4 h-4" />
              ) : (
                <Bot className="text-brand-bg w-4 h-4" />
              )}
            </div>
            <div className={`rounded-2xl px-4 py-3 max-w-sm ${
              msg.role === "user"
                ? "bg-brand-accent/10 border border-brand-accent/20 rounded-tr-sm"
                : "bg-brand-bg/50 rounded-tl-sm"
            }`}>
              <p className="text-sm text-brand-text">{msg.content}</p>
              {msg.options && msg.options.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {msg.options.map((option, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      size="sm"
                      className="bg-brand-accent/20 text-brand-accent border-brand-accent/30 hover:bg-brand-accent/30 text-xs"
                      onClick={() => handleOptionSelect(option)}
                      disabled={isSendingMessage}
                    >
                      {option}
                    </Button>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}

        {(isSendingMessage || isGeneratingPackages) && (
          <div className="flex items-start space-x-3">
            <div className="w-8 h-8 bg-brand-accent rounded-full flex items-center justify-center flex-shrink-0">
              <Bot className="text-brand-bg w-4 h-4" />
            </div>
            <div className="bg-brand-bg/50 rounded-2xl rounded-tl-sm px-4 py-3">
              <div className="flex items-center space-x-2">
                <LoadingSpinner size="sm" />
                <p className="text-sm text-brand-text">
                  {isGeneratingPackages ? "Creating your travel packages..." : "Thinking..."}
                </p>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </CardContent>

      <div className="p-4 border-t border-brand-border">
        <div className="flex space-x-2">
          <Input
            type="text"
            placeholder="Type your message..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            className="flex-1 bg-brand-bg border-brand-border text-brand-text placeholder:text-brand-mute focus:border-brand-accent"
            disabled={isSendingMessage || isGeneratingPackages}
          />
          <Button
            onClick={handleSendMessage}
            disabled={!message.trim() || isSendingMessage || isGeneratingPackages}
            className="bg-brand-accent text-brand-bg hover:bg-yellow-500"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
}
