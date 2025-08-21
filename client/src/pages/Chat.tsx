import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { ChatInterface } from "@/components/chat/ChatInterface";
import { usePackageStore } from "@/lib/packageStore";
import { useToast } from "@/hooks/use-toast";
import { TravelPackage } from "@/types/travel";
import { useQuery } from "@tanstack/react-query";
import { Plane, HelpCircle, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Chat() {
  const [, setLocation] = useLocation();
  const [conversationId, setConversationId] = useState<string | null>(null);
  const { setPackages: setStorePackages } = usePackageStore();
  const { toast } = useToast();
  const hasNavigatedRef = useRef(false);
  
  // Query packages when conversation ID changes
  const { data: packages = [] } = useQuery<TravelPackage[]>({
    queryKey: ['/api/conversation', conversationId, 'packages'],
    enabled: !!conversationId,
  });
  
  // Monitor packages and auto-navigate when ready
  useEffect(() => {
    if (packages.length >= 3 && conversationId && !hasNavigatedRef.current) {
      hasNavigatedRef.current = true;
      
      // Save to store
      setStorePackages(packages, conversationId);
      
      // Show floating toast notification
      toast({
        title: "✨ 3 packages are ready!",
        description: "Redirecting to your personalized travel options...",
        duration: 1500,
        className: "fixed bottom-20 right-4 z-50",
      });
      
      // Auto-navigate to packages page after brief delay
      setTimeout(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        setLocation("/packages?from=chat");
      }, 1000);
    }
  }, [packages, conversationId, setStorePackages, toast, setLocation]);
  
  // Reset navigation flag when conversation changes
  useEffect(() => {
    hasNavigatedRef.current = false;
  }, [conversationId]);
  
  const handlePackagesReady = () => {
    // Packages will be auto-detected through the query
  };
  
  return (
    <div className="min-h-screen bg-brand-bg text-brand-text flex flex-col">
      {/* Header */}
      <header className="border-b border-brand-border bg-brand-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-brand-accent rounded-lg flex items-center justify-center">
                <Plane className="text-brand-bg w-4 h-4" />
              </div>
              <h1 className="text-xl font-bold text-brand-text">Travelify</h1>
              <span className="bg-brand-accent/20 text-brand-accent px-2 py-1 rounded-full text-[14px] font-semibold">
                Your AI Travel Planner ✈️
              </span>
            </div>
            <div className="hidden md:flex items-center space-x-4">
              {packages.length >= 3 && (
                <Button 
                  onClick={() => setLocation("/packages")}
                  size="sm"
                  className="bg-gradient-to-r from-purple-600 to-blue-600 text-white"
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  View Packages
                </Button>
              )}
              <Button variant="ghost" className="text-brand-mute hover:text-brand-accent">
                <HelpCircle className="w-4 h-4 mr-2" />
                Help
              </Button>
            </div>
          </div>
        </div>
      </header>
      
      {/* Main Chat Area - Full Width */}
      <div className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <ChatInterface
          onPackagesReady={handlePackagesReady}
          onConversationIdChange={(id) => setConversationId(id)}
        />
      </div>
    </div>
  );
}