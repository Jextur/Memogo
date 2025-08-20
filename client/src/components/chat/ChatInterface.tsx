import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { useConversation } from "@/hooks/useConversation";
import { EnhancedTagSelector } from "@/components/chat/EnhancedTagSelector";
import { ChatMessage } from "@/types/travel";
import { Plane, Bot, User, Send } from "lucide-react";

interface ChatInterfaceProps {
  conversationId?: string;
  onPackagesReady?: () => void;
  onConversationIdChange?: (id: string) => void;
}

export function ChatInterface({ conversationId, onPackagesReady, onConversationIdChange }: ChatInterfaceProps) {
  const [message, setMessage] = useState("");
  const [showTagSelector, setShowTagSelector] = useState(false);
  const [selectedCity, setSelectedCity] = useState<{ name: string; countryCode: string } | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
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

  // Auto-focus input on mount and when conversation starts
  useEffect(() => {
    if (!isSendingMessage && !isGeneratingPackages) {
      inputRef.current?.focus();
    }
  }, [currentConversationId, isSendingMessage, isGeneratingPackages]);

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
    // Don't auto-generate if we're waiting for tag selection
    if (showTagSelector) return;
    
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
  }, [nextStep, isGeneratingPackages, currentConversationId, showTagSelector]);

  // Detect when to show tag selector (after city is selected, before themes)
  useEffect(() => {
    if (!conversation) return;
    
    const lastMessage = conversation.messages[conversation.messages.length - 1];
    const lastUserMessage = [...conversation.messages].reverse().find(m => m.role === "user");
    
    // Check if we're at the preferences selection step
    if (lastMessage?.role === "assistant" && 
        (lastMessage.content?.toLowerCase().includes("must-visit places") ||
         lastMessage.content?.toLowerCase().includes("experiences you") ||
         nextStep === "preferences")) {
      
      // Extract city info from conversation
      const cityMessages = conversation.messages.filter(m => m.role === "user");
      let cityName = "";
      let countryCode = "";
      
      // Look for city name in user messages
      for (const msg of cityMessages) {
        // Common city patterns
        const cityPatterns = [
          /^(tokyo|kyoto|osaka|paris|london|new york|barcelona|rome|bangkok|sydney|dubai|singapore)/i,
          /going to ([a-z\s]+)/i,
          /visit ([a-z\s]+)/i,
        ];
        
        for (const pattern of cityPatterns) {
          const match = msg.content.match(pattern);
          if (match) {
            cityName = match[1] || match[0];
            break;
          }
        }
        if (cityName) break;
      }
      
      // Map city to country code (simplified - you might want to enhance this)
      const cityCountryMap: Record<string, string> = {
        'tokyo': 'JP', 'kyoto': 'JP', 'osaka': 'JP', 'okinawa': 'JP',
        'new york': 'US', 'los angeles': 'US', 'san francisco': 'US', 'miami': 'US',
        'paris': 'FR', 'nice': 'FR',
        'london': 'GB', 'edinburgh': 'GB',
        'barcelona': 'ES', 'madrid': 'ES',
        'rome': 'IT', 'venice': 'IT', 'florence': 'IT',
        'bangkok': 'TH', 'phuket': 'TH', 'chiang mai': 'TH',
        'sydney': 'AU', 'melbourne': 'AU',
        'singapore': 'SG',
        'dubai': 'AE',
      };
      
      const normalizedCity = cityName.toLowerCase().trim();
      countryCode = cityCountryMap[normalizedCity] || 'US';
      
      if (cityName) {
        setSelectedCity({ 
          name: cityName.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '), 
          countryCode 
        });
        setShowTagSelector(true);
      }
    }
  }, [conversation]);

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
    // Auto-focus the input after sending a message
    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
  };

  const handleOptionSelect = (option: string) => {
    sendUserMessage(option);
    // Auto-focus the input after selecting an option
    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
  };

  const handleTagsSelected = (tags: string[]) => {
    // Send selected tags as a natural message
    const tagsMessage = `I'm interested in: ${tags.join(', ')}`;
    sendUserMessage(tagsMessage);
    setShowTagSelector(false);
    setSelectedCity(null);
  };

  const handleSkipTags = () => {
    sendUserMessage("Mix of everything");
    setShowTagSelector(false);
    setSelectedCity(null);
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
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-brand-accent rounded-full flex items-center justify-center flex-shrink-0">
                <Bot className="text-brand-bg w-4 h-4" />
              </div>
              <div className="space-y-3">
                <div className="bg-brand-bg/50 rounded-2xl rounded-tl-sm px-4 py-3 max-w-md">
                  <p className="text-sm text-brand-text">
                    Hi! I'm your AI travel consultant. You can tell me about your dream trip in your own words, or I can guide you through a few questions. 🌏
                  </p>
                </div>
                <div className="bg-brand-bg/30 rounded-lg px-4 py-3 max-w-md border border-brand-border/50">
                  <p className="text-xs text-brand-mute mb-2">Try typing something like:</p>
                  <p className="text-xs text-brand-text italic">
                    "I want a 7-day trip to Tokyo with my girlfriend, interested in anime culture and local food"
                  </p>
                </div>
              </div>
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
              {/* Hide generic theme options if we're showing tag selector */}
              {msg.options && msg.options.length > 0 && !showTagSelector && (
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

        {/* Show TagSelector when appropriate */}
        {showTagSelector && selectedCity && !isSendingMessage && (
          <div className="mt-4">
            <EnhancedTagSelector
              cityName={selectedCity.name}
              countryCode={selectedCity.countryCode}
              onTagsSelected={handleTagsSelected}
              onSkip={handleSkipTags}
            />
          </div>
        )}

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
            ref={inputRef}
            type="text"
            placeholder={messages.length === 0 ? "Describe your dream trip or type a destination..." : "Type your message..."}
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
