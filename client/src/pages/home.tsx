import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { ChatInterface } from "@/components/chat/ChatInterface";
import { PackagePreview } from "@/components/packages/PackagePreview";
import { PackageComparison } from "@/components/packages/PackageComparison";
import { DayByDayView } from "@/components/itinerary/DayByDayView";
import { AddPOIModal } from "@/components/modals/AddPOIModal";
import { useConversation } from "@/hooks/useConversation";
import { getPackagesByConversation, exportPackage } from "@/lib/api";
import { TravelPackage } from "@/types/travel";
import { Plane, Download, HelpCircle } from "lucide-react";

type ViewType = "conversation" | "comparison" | "itinerary";

export default function Home() {
  const [currentView, setCurrentView] = useState<ViewType>("conversation");
  const [selectedPackage, setSelectedPackage] = useState<TravelPackage | null>(null);
  const [showAddPOIModal, setShowAddPOIModal] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  
  // Debug logging for home page
  console.log("Home page state:", { conversationId });
  
  const { data: packages = [] } = useQuery<TravelPackage[]>({
    queryKey: ['/api/conversation', conversationId, 'packages'],
    enabled: !!conversationId,
  });

  const handlePackagesReady = () => {
    // Packages are ready, no need to change view automatically
    // User can click "Compare All Packages" when ready
  };

  const handleViewAllPackages = () => {
    setCurrentView("comparison");
  };

  const handleSelectPackage = (pkg: TravelPackage) => {
    setSelectedPackage(pkg);
    setCurrentView("itinerary");
  };

  const handleBackToConversation = () => {
    setCurrentView("conversation");
    setSelectedPackage(null);
  };

  const handleBackToComparison = () => {
    setCurrentView("comparison");
    setSelectedPackage(null);
  };

  const handleExportPackage = async () => {
    if (selectedPackage) {
      try {
        await exportPackage(selectedPackage.id);
      } catch (error) {
        console.error("Export failed:", error);
      }
    }
  };

  const handleAddPOI = (poi: any, timeSlot: string) => {
    // This would ideally add the POI to the current day's itinerary
    // For now, we'll just close the modal
    console.log("Adding POI:", poi, "to", timeSlot);
    setShowAddPOIModal(false);
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
              <h1 className="text-xl font-bold text-brand-text">MemoGo</h1>
              <span className="bg-brand-accent/20 text-brand-accent px-2 py-1 rounded-full text-[14px] font-semibold">Create Your Own Memory ✨</span>
            </div>
            <div className="hidden md:flex items-center space-x-4">
              <Button variant="ghost" className="text-brand-mute hover:text-brand-accent">
                <HelpCircle className="w-4 h-4 mr-2" />
                Help
              </Button>
              <Button
                onClick={handleExportPackage}
                disabled={!selectedPackage}
                className="bg-brand-accent text-brand-bg hover:bg-yellow-500"
              >
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </div>
      </header>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Conversation + Package Generation View */}
        {currentView === "conversation" && (
          <div className="grid lg:grid-cols-2 gap-6 min-h-[calc(100vh-160px)]">
            <ChatInterface
              onPackagesReady={handlePackagesReady}
              onConversationIdChange={(id) => setConversationId(id)}
            />
            <PackagePreview
              conversationId={conversationId}
              onViewAllPackages={handleViewAllPackages}
              onSelectPackage={handleSelectPackage}
            />
          </div>
        )}

        {/* Package Comparison Dashboard */}
        {currentView === "comparison" && (
          <PackageComparison
            packages={packages}
            onBack={handleBackToConversation}
            onSelectPackage={handleSelectPackage}
          />
        )}

        {/* Day-by-Day View */}
        {currentView === "itinerary" && selectedPackage && (
          <DayByDayView
            package={selectedPackage}
            onBack={handleBackToComparison}
            onAddPOI={() => setShowAddPOIModal(true)}
          />
        )}
      </div>
      {/* Add POI Modal */}
      <AddPOIModal
        isOpen={showAddPOIModal}
        onClose={() => setShowAddPOIModal(false)}
        onAddPOI={handleAddPOI}
        conversationId={conversationId || undefined}
        city={selectedPackage?.destination}
        tags={packages[0]?.metadata?.selectedTags as string[] | undefined}
      />
      {/* Floating Export Button (mobile) */}
      {selectedPackage && (
        <div className="fixed bottom-6 right-6 z-40 md:hidden">
          <Button
            onClick={handleExportPackage}
            className="bg-brand-accent text-brand-bg w-14 h-14 rounded-full shadow-lg hover:bg-yellow-500 hover:scale-110 transition-all duration-300"
          >
            <Download className="w-5 h-5" />
          </Button>
        </div>
      )}
    </div>
  );
}
