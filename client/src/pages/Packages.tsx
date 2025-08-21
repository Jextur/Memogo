import { useEffect } from "react";
import { useLocation, useSearch } from "wouter";
import { Button } from "@/components/ui/button";
import { CleanPackageCard } from "@/components/packages/CleanPackageCard";
import { usePackageStore } from "@/lib/packageStore";
import { ArrowLeft, MessageCircle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { TravelPackage } from "@/types/travel";

export default function Packages() {
  const [, setLocation] = useLocation();
  const searchString = useSearch();
  const { packages: storedPackages, conversationId } = usePackageStore();
  const isFromChat = searchString.includes("from=chat");
  
  // Try to fetch packages if not in store (e.g., direct navigation)
  const { data: fetchedPackages } = useQuery<TravelPackage[]>({
    queryKey: ['/api/conversation', conversationId, 'packages'],
    enabled: !!conversationId && storedPackages.length === 0,
  });
  
  const packages = storedPackages.length > 0 ? storedPackages : (fetchedPackages || []);
  
  // Scroll to top on mount, show animation when coming from chat
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (isFromChat) {
      document.body.classList.add('page-transition');
      setTimeout(() => {
        document.body.classList.remove('page-transition');
      }, 500);
    }
  }, [isFromChat]);
  
  const handleSelectPackage = (pkg: TravelPackage) => {
    setLocation(`/itinerary/${pkg.id}`);
  };
  
  const handleBackToChat = () => {
    setLocation("/chat");
  };
  
  if (packages.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">No packages available</h2>
          <p className="text-gray-600 mb-6">Start a conversation to generate travel packages</p>
          <Button
            onClick={() => setLocation("/chat")}
            className="bg-gradient-to-r from-purple-600 to-blue-600 text-white"
          >
            <MessageCircle className="w-4 h-4 mr-2" />
            Start Planning
          </Button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-50 animate-fadeIn">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Breadcrumb Navigation */}
        <nav className="flex items-center space-x-2 text-sm mb-6 animate-slideInTop">
          <button
            onClick={() => setLocation("/chat")}
            className="text-gray-600 hover:text-gray-900 transition-colors"
          >
            Chat
          </button>
          <span className="text-gray-400">/</span>
          <span className="text-gray-900 font-medium">Packages</span>
        </nav>
        
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={handleBackToChat}
            className="text-gray-600 hover:text-gray-900 mb-4 p-0"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to conversation
          </Button>
          
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-3 bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              Choose Your Perfect Journey
            </h1>
            <p className="text-gray-600">Three personalized travel packages designed just for you</p>
          </div>
        </div>

        {/* Package Cards Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 animate-slideInBottom">
          {packages.map((pkg, index) => (
            <div 
              key={pkg.id}
              className="cursor-pointer transform transition-all duration-300 hover:scale-[1.02] animate-fadeIn"
              style={{ animationDelay: `${index * 100}ms` }}
              onClick={() => handleSelectPackage(pkg)}
            >
              <CleanPackageCard
                package={pkg}
                index={index}
                onSelect={handleSelectPackage}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}