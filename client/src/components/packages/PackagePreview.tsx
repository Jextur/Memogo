import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { getPackagesByConversation } from "@/lib/api";
import { TravelPackage } from "@/types/travel";
import { Sparkles, MapPin, Utensils, Camera, Plane } from "lucide-react";

interface PackagePreviewProps {
  conversationId?: string;
  onViewAllPackages?: () => void;
  onSelectPackage?: (pkg: TravelPackage) => void;
}

export function PackagePreview({ 
  conversationId, 
  onViewAllPackages, 
  onSelectPackage 
}: PackagePreviewProps) {
  const [selectedPackageId, setSelectedPackageId] = useState<string>();

  const { data: packages = [], isLoading, error } = useQuery<TravelPackage[]>({
    queryKey: ['/api/conversation', conversationId, 'packages'],
    enabled: !!conversationId,
  });

  // Debug logging
  console.log("PackagePreview state:", { 
    conversationId, 
    packagesCount: packages.length, 
    isLoading, 
    error 
  });

  const getPackageGradient = (type: string) => {
    switch (type) {
      case "classic":
        return "bg-gradient-to-br from-blue-500 to-purple-600";
      case "foodie":
        return "bg-gradient-to-br from-orange-500 to-red-600";
      case "budget":
        return "bg-gradient-to-br from-green-500 to-teal-600";
      default:
        return "bg-brand-accent";
    }
  };

  const getPackageIcon = (type: string) => {
    switch (type) {
      case "foodie":
        return <Utensils className="w-4 h-4" />;
      case "budget":
        return <Plane className="w-4 h-4" />;
      default:
        return <Camera className="w-4 h-4" />;
    }
  };

  const handlePackageClick = (pkg: TravelPackage) => {
    setSelectedPackageId(pkg.id);
    onSelectPackage?.(pkg);
  };

  if (!conversationId) {
    return (
      <Card className="bg-brand-card border-brand-border">
        <CardHeader className="border-b border-brand-border">
          <CardTitle className="text-brand-text">Travel Packages</CardTitle>
          <p className="text-brand-mute text-sm">AI-generated options for your trip</p>
        </CardHeader>
        <CardContent className="p-4">
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-brand-accent/10 rounded-2xl mx-auto mb-4 flex items-center justify-center">
              <Sparkles className="text-brand-accent text-2xl w-8 h-8" />
            </div>
            <h3 className="text-lg font-semibold mb-2 text-brand-text">Packages will appear here</h3>
            <p className="text-brand-mute text-sm">Continue chatting to generate your travel options</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card className="bg-brand-card border-brand-border">
        <CardHeader className="border-b border-brand-border">
          <CardTitle className="text-brand-text">Travel Packages</CardTitle>
          <p className="text-brand-mute text-sm">AI-generated options for your trip</p>
        </CardHeader>
        <CardContent className="p-4 flex items-center justify-center">
          <div className="text-center py-12">
            <LoadingSpinner className="mx-auto mb-4" />
            <p className="text-brand-mute">Loading packages...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (packages.length === 0) {
    return (
      <Card className="bg-brand-card border-brand-border">
        <CardHeader className="border-b border-brand-border">
          <CardTitle className="text-brand-text">Travel Packages</CardTitle>
          <p className="text-brand-mute text-sm">AI-generated options for your trip</p>
        </CardHeader>
        <CardContent className="p-4">
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-brand-accent/10 rounded-2xl mx-auto mb-4 flex items-center justify-center">
              <Sparkles className="text-brand-accent text-2xl w-8 h-8" />
            </div>
            <h3 className="text-lg font-semibold mb-2 text-brand-text">Packages will appear here</h3>
            <p className="text-brand-mute text-sm">Continue chatting to generate your travel options</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-brand-card border-brand-border">
      <CardHeader className="border-b border-brand-border">
        <CardTitle className="text-brand-text">Travel Packages</CardTitle>
        <p className="text-brand-mute text-sm">AI-generated options for your trip</p>
      </CardHeader>

      <CardContent className="p-4">
        <div className="space-y-4 mb-6">
          {packages.map((pkg: TravelPackage, index: number) => (
            <div
              key={pkg.id}
              className={`bg-brand-bg/30 border rounded-xl p-4 hover:border-brand-accent/50 transition-colors cursor-pointer ${
                selectedPackageId === pkg.id ? "border-brand-accent" : "border-brand-border"
              }`}
              onClick={() => handlePackageClick(pkg)}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold ${getPackageGradient(pkg.type)}`}>
                    {String.fromCharCode(65 + index)}
                  </div>
                  <div>
                    <h3 className="font-semibold text-brand-text">{pkg.name}</h3>
                    <p className="text-brand-mute text-sm">{pkg.description}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-brand-accent">{pkg.budget}</p>
                  <p className="text-brand-mute text-xs">{pkg.days} days</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-4 text-xs text-brand-mute mb-3">
                <span className="flex items-center">
                  <MapPin className="w-3 h-3 mr-1" />
                  {pkg.route}
                </span>
                <span className="flex items-center">
                  <Utensils className="w-3 h-3 mr-1" />
                  {pkg.diningCount} dining experiences
                </span>
                <span className="flex items-center">
                  {getPackageIcon(pkg.type)}
                  <span className="ml-1">{pkg.attractionCount} attractions</span>
                </span>
              </div>

              <div className="flex flex-wrap gap-2">
                {pkg.highlights?.slice(0, 3).map((highlight: string, idx: number) => (
                  <Badge
                    key={idx}
                    variant="outline"
                    className="bg-brand-accent/10 text-brand-accent border-brand-accent/30 text-xs"
                  >
                    {highlight}
                  </Badge>
                ))}
              </div>
            </div>
          ))}
        </div>

        <Button
          onClick={onViewAllPackages}
          className="w-full bg-brand-accent text-brand-bg py-3 font-semibold hover:bg-yellow-500"
        >
          Compare All Packages
        </Button>
      </CardContent>
    </Card>
  );
}
