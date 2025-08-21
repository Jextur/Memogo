import { useLocation, useRoute } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TravelPackage } from "@/types/travel";
import { Star } from "lucide-react";
import { usePackageStore } from "@/lib/packageStore";
import {
  ArrowLeft,
  MapPin,
  Clock,
  DollarSign,
  Calendar,
  Utensils,
  Camera,
  Hotel,
  Map,
  ExternalLink
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";

export function ItineraryDetail() {
  const [match, params] = useRoute("/itinerary/:id");
  const [, setLocation] = useLocation();
  const { getPackageById } = usePackageStore();
  
  // Try to get package from store first
  const storedPackage = params?.id ? getPackageById(params.id) : undefined;
  
  // Fallback to API if not in store
  const { data: fetchedPackage, isLoading } = useQuery<TravelPackage>({
    queryKey: [`/api/packages/${params?.id}`],
    enabled: !!params?.id && !storedPackage,
  });
  
  const packageDetails = storedPackage || fetchedPackage;

  if (!match || !params?.id) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading itinerary...</p>
        </div>
      </div>
    );
  }

  if (!packageDetails) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-gray-600">Package not found</p>
          <Button
            onClick={() => setLocation("/")}
            className="mt-4"
          >
            Go back home
          </Button>
        </div>
      </div>
    );
  }

  const pkg = packageDetails;
  
  // Helper function to get activity icon
  const getActivityIcon = (type: string) => {
    if (type.toLowerCase().includes('food') || type.toLowerCase().includes('restaurant')) {
      return <Utensils className="w-4 h-4" />;
    }
    if (type.toLowerCase().includes('hotel') || type.toLowerCase().includes('accommodation')) {
      return <Hotel className="w-4 h-4" />;
    }
    return <Camera className="w-4 h-4" />;
  };

  // Helper function to get category color
  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      food: "bg-red-100 text-red-700",
      culture: "bg-purple-100 text-purple-700",
      nature: "bg-green-100 text-green-700",
      shopping: "bg-blue-100 text-blue-700",
      nightlife: "bg-indigo-100 text-indigo-700",
      attraction: "bg-orange-100 text-orange-700",
    };
    return colors[category] || "bg-gray-100 text-gray-700";
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="relative h-80 bg-gradient-to-br from-purple-600 to-blue-600">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative max-w-7xl mx-auto px-4 h-full flex flex-col justify-center">
          <Button
            variant="ghost"
            onClick={() => setLocation("/packages")}
            className="text-white hover:text-white/80 mb-4 p-0 w-fit"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to packages
          </Button>
          
          <h1 className="text-4xl font-bold text-white mb-3">{pkg.name}</h1>
          <p className="text-white/90 text-lg mb-4">{pkg.description}</p>
          
          <div className="flex flex-wrap gap-4 text-white">
            <div className="flex items-center">
              <MapPin className="w-5 h-5 mr-2" />
              <span>{pkg.destination || pkg.route}</span>
            </div>
            <div className="flex items-center">
              <Calendar className="w-5 h-5 mr-2" />
              <span>{pkg.days} days</span>
            </div>
            <div className="flex items-center">
              <DollarSign className="w-5 h-5 mr-2" />
              <span className="font-semibold">{pkg.budget}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="max-w-7xl mx-auto px-4 -mt-10 mb-8">
        <Card className="bg-white p-6 shadow-xl">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-gray-900">{pkg.days}</div>
              <div className="text-sm text-gray-600">Days</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-gray-900">{pkg.attractionCount}</div>
              <div className="text-sm text-gray-600">Attractions</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-gray-900">{pkg.diningCount}</div>
              <div className="text-sm text-gray-600">Dining Experiences</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-gray-900">{pkg.highlights?.length || 0}</div>
              <div className="text-sm text-gray-600">Key Highlights</div>
            </div>
          </div>
        </Card>
      </div>

      {/* Breadcrumbs */}
      <div className="max-w-7xl mx-auto px-4 pb-4">
        <nav className="flex items-center space-x-2 text-sm">
          <button
            onClick={() => setLocation("/chat")}
            className="text-gray-600 hover:text-gray-900"
          >
            Chat
          </button>
          <span className="text-gray-400">/</span>
          <button
            onClick={() => setLocation("/packages")}
            className="text-gray-600 hover:text-gray-900"
          >
            Packages
          </button>
          <span className="text-gray-400">/</span>
          <span className="text-gray-900 font-medium">Itinerary</span>
        </nav>
      </div>
      
      {/* Day-by-Day Itinerary */}
      <div className="max-w-7xl mx-auto px-4 pb-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Day-by-Day Itinerary</h2>
        
        <div className="space-y-6">
          {pkg.itinerary?.map((day: any, index: number) => (
            <Card key={index} className="bg-white overflow-hidden">
              <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-4 border-b">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      Day {day.day} - {day.title || day.location}
                    </h3>
                    {day.location && (
                      <div className="flex items-center text-sm text-gray-600 mt-1">
                        <MapPin className="w-4 h-4 mr-1" />
                        {day.location}
                      </div>
                    )}
                  </div>
                  <Badge className="bg-white text-gray-700">
                    {day.activities?.length || 0} activities
                  </Badge>
                </div>
              </div>
              
              <div className="p-6">
                <div className="space-y-4">
                  {day.pois?.map((poi: any, poiIndex: number) => (
                    <div key={poiIndex} className="flex gap-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                      <div className="flex-shrink-0">
                        <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                          {getActivityIcon(poi.category || poi.type || '')}
                        </div>
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h4 className="font-semibold text-gray-900">{poi.name}</h4>
                            {poi.rating && (
                              <div className="flex items-center gap-2 mt-1">
                                <div className="flex items-center">
                                  <Star className="w-4 h-4 text-yellow-500 fill-current" />
                                  <span className="text-sm font-medium ml-1">{poi.rating}</span>
                                </div>
                                {poi.reviewCount && (
                                  <span className="text-xs text-gray-500">
                                    ({poi.reviewCount.toLocaleString()} reviews)
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                          {poi.priceLevel && (
                            <span className="text-sm text-gray-600">
                              {'$'.repeat(poi.priceLevel)}
                            </span>
                          )}
                        </div>
                        
                        {poi.description && (
                          <p className="text-sm text-gray-600 mb-2">{poi.description}</p>
                        )}
                        
                        <div className="flex items-center gap-2">
                          {poi.category && (
                            <Badge 
                              variant="secondary" 
                              className={`text-xs ${getCategoryColor(poi.category)}`}
                            >
                              {poi.category}
                            </Badge>
                          )}
                          {poi.duration && (
                            <div className="flex items-center text-xs text-gray-500">
                              <Clock className="w-3 h-3 mr-1" />
                              {poi.duration}
                            </div>
                          )}
                          {poi.placeId && (
                            <a
                              href={`https://www.google.com/maps/place/?q=place_id:${poi.placeId}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center text-xs text-blue-600 hover:text-blue-800"
                            >
                              <ExternalLink className="w-3 h-3 mr-1" />
                              View on Maps
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {/* Fallback to activities if POIs not available */}
                  {!day.pois && day.activities?.map((activity: string, actIndex: number) => (
                    <div key={actIndex} className="flex items-center p-3 bg-gray-50 rounded-lg">
                      <div className="w-2 h-2 bg-purple-500 rounded-full mr-3"></div>
                      <span className="text-gray-700">{activity}</span>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Export Button */}
        <div className="mt-8 flex justify-center">
          <Button
            size="lg"
            className="bg-gradient-to-r from-purple-600 to-blue-600 text-white"
            onClick={() => {
              // Export itinerary as JSON
              const dataStr = JSON.stringify(pkg, null, 2);
              const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
              const exportFileDefaultName = `${pkg.name.replace(/\s+/g, '-')}-itinerary.json`;
              const linkElement = document.createElement('a');
              linkElement.setAttribute('href', dataUri);
              linkElement.setAttribute('download', exportFileDefaultName);
              linkElement.click();
            }}
          >
            <Map className="w-5 h-5 mr-2" />
            Export Itinerary as JSON
          </Button>
        </div>
      </div>
    </div>
  );
}