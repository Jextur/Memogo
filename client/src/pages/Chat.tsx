import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { ChatInterface } from "@/components/chat/ChatInterface";
import { PackagePreview } from "@/components/packages/PackagePreview";
import { usePackageStore } from "@/lib/packageStore";
import { useToast } from "@/hooks/use-toast";
import { TravelPackage } from "@/types/travel";
import { useQuery } from "@tanstack/react-query";
import { Plane, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Chat() {
  const [, setLocation] = useLocation();
  const [conversationId, setConversationId] = useState<string | null>(null);
  const { setPackages: setStorePackages } = usePackageStore();
  const { toast } = useToast();
  
  // Query packages when conversation ID changes
  const { data: packages = [] } = useQuery<TravelPackage[]>({
    queryKey: ['/api/conversation', conversationId, 'packages'],
    enabled: !!conversationId,
  });
  
  // Monitor packages and auto-navigate when ready
  useEffect(() => {
    if (packages.length >= 3 && conversationId) {
      // Save to store
      setStorePackages(packages, conversationId);
      
      // Show toast on mobile
      if (window.innerWidth <= 768) {
        toast({
          title: "Travel packages ready!",
          description: "3 personalized packages have been created for you",
          duration: 3000,
        });
      }
      
      // Auto-navigate to packages page
      setTimeout(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        setLocation("/packages?from=chat");
      }, 500);
    }
  }, [packages, conversationId, setStorePackages, toast, setLocation]);
  
  const handlePackagesReady = () => {
    // Packages will be auto-detected through the query
  };
  
  return (
    <div className="min-h-screen bg-brand-bg text-brand-text">
      {/* Header */}
      <header className="border-b border-brand-border bg-brand-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
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
              <Button variant="ghost" className="text-brand-mute hover:text-brand-accent">
                <HelpCircle className="w-4 h-4 mr-2" />
                Help
              </Button>
            </div>
          </div>
        </div>
      </header>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid lg:grid-cols-2 gap-6 min-h-[calc(100vh-160px)]">
          <ChatInterface
            onPackagesReady={handlePackagesReady}
            onConversationIdChange={(id) => setConversationId(id)}
          />
          <PackagePreview
            conversationId={conversationId || undefined}
            onViewAllPackages={() => setLocation("/packages")}
            onSelectPackage={(pkg) => setLocation(`/itinerary/${pkg.id}`)}
          />
        </div>
      </div>
    </div>
  );
}