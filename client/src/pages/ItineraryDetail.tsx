import { useState } from "react";
import { useLocation, useRoute } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TravelPackage, POI } from "@/types/travel";
import { Star } from "lucide-react";
import { usePackageStore } from "@/lib/packageStore";
import { POICard } from "@/components/itinerary/POICard";
import { AddPOIModal } from "@/components/modals/AddPOIModal";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
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
  ExternalLink,
  Sun,
  Moon,
  Plus,
  Search,
  GripVertical
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";

export function ItineraryDetail() {
  const [match, params] = useRoute("/itinerary/:id");
  const [, setLocation] = useLocation();
  const { getPackageById } = usePackageStore();
  const [isAddPOIModalOpen, setIsAddPOIModalOpen] = useState(false);
  const [selectedDayIndex, setSelectedDayIndex] = useState<number | null>(null);
  
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
  
  // Initialize itinerary with IDs for all POIs
  const initializeItinerary = (originalItinerary: any[]) => {
    return originalItinerary?.map((day: any) => ({
      ...day,
      pois: day.pois?.map((poi: any) => ({
        ...poi,
        id: poi.id || `poi-${Date.now()}-${Math.random()}`,
        time: poi.time || poi.timeLabel?.toLowerCase() || 'morning'
      }))
    })) || [];
  };
  
  const [itinerary, setItinerary] = useState<any[]>(initializeItinerary(pkg?.itinerary));

  // Handler for adding POI to itinerary
  const handleAddPOI = (poi: POI, timeSlot: string) => {
    if (selectedDayIndex === null) return;
    
    const newItinerary = [...itinerary];
    const day = newItinerary[selectedDayIndex];
    
    // Create a new POI with time slot information
    const newPOI = {
      ...poi,
      timeLabel: timeSlot.charAt(0).toUpperCase() + timeSlot.slice(1),
      time: timeSlot,
      id: `poi-${Date.now()}-${Math.random()}` // Unique ID for delete functionality
    };
    
    // Add POI to the day's POIs array
    if (!day.pois) {
      day.pois = [];
    }
    day.pois.push(newPOI);
    
    // Sort POIs by time (morning -> afternoon -> evening)
    const timeOrder: Record<string, number> = { morning: 0, afternoon: 1, evening: 2 };
    day.pois.sort((a: any, b: any) => {
      const aTime = timeOrder[a.time?.toLowerCase()] ?? 3;
      const bTime = timeOrder[b.time?.toLowerCase()] ?? 3;
      return aTime - bTime;
    });
    
    setItinerary(newItinerary);
  };

  // Handler for deleting POI from itinerary
  const handleDeletePOI = (dayIndex: number, poiId: string) => {
    const newItinerary = [...itinerary];
    const day = newItinerary[dayIndex];
    
    if (day.pois) {
      day.pois = day.pois.filter((poi: any) => poi.id !== poiId);
    }
    
    setItinerary(newItinerary);
  };

  // Handler for updating POI time
  const handleUpdatePOITime = (dayIndex: number, poiId: string, newTime: string) => {
    const newItinerary = [...itinerary];
    const day = newItinerary[dayIndex];
    
    if (day.pois) {
      const poi = day.pois.find((p: any) => p.id === poiId);
      if (poi) {
        poi.time = newTime;
        poi.timeLabel = newTime.charAt(0).toUpperCase() + newTime.slice(1);
        
        // Re-sort POIs by time
        const timeOrder: Record<string, number> = { morning: 0, afternoon: 1, evening: 2 };
        day.pois.sort((a: any, b: any) => {
          const aTime = timeOrder[a.time?.toLowerCase()] ?? 3;
          const bTime = timeOrder[b.time?.toLowerCase()] ?? 3;
          return aTime - bTime;
        });
      }
    }
    
    setItinerary(newItinerary);
  };

  // Handler for drag and drop
  const handleDragEnd = (result: any) => {
    if (!result.destination) return;
    
    const dayIndex = parseInt(result.destination.droppableId.split('-')[1]);
    const newItinerary = [...itinerary];
    const day = newItinerary[dayIndex];
    
    if (!day.pois) return;
    
    const [reorderedItem] = day.pois.splice(result.source.index, 1);
    day.pois.splice(result.destination.index, 0, reorderedItem);
    
    setItinerary(newItinerary);
  };
  
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
      {/* Compact Hero Section */}
      <div className="bg-gradient-to-br from-purple-600 to-blue-600 pt-safe">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <Button
            variant="ghost"
            onClick={() => setLocation("/packages")}
            className="text-white hover:text-white/80 mb-3 p-0 w-fit"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to packages
          </Button>
          
          <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">{pkg.name}</h1>
          <p className="text-white/90 text-sm md:text-base mb-3 line-clamp-2">
            {pkg.description?.split('.')[0] || `Tailored to your interests. Includes ${pkg.highlights?.length || 4} hand-picked venues matching your preferences plus must-see highlights.`}
          </p>
          
          <div className="flex flex-wrap gap-4 text-white text-sm">
            <div className="flex items-center">
              <MapPin className="w-4 h-4 mr-1" />
              <span>{pkg.destination || pkg.route}</span>
            </div>
            <div className="flex items-center">
              <Calendar className="w-4 h-4 mr-1" />
              <span>{pkg.days} days</span>
            </div>
            <div className="flex items-center">
              <DollarSign className="w-4 h-4 mr-1" />
              <span className="font-semibold">{pkg.budget}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="max-w-4xl mx-auto px-4 -mt-6 mb-6">
        <Card className="bg-white p-5 shadow-lg">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{pkg.days}</div>
              <div className="text-xs text-gray-600">Days</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">
                {pkg.itinerary?.reduce((sum, day: any) => sum + (day.pois?.length || day.activities?.length || 0), 0) || 39}
              </div>
              <div className="text-xs text-gray-600">Attractions</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">
                {pkg.itinerary?.reduce((sum, day: any) => {
                  const count = day.pois?.filter((p: any) => 
                    p.category?.toLowerCase().includes('food') || 
                    p.type?.toLowerCase().includes('restaurant')
                  ).length || 0;
                  return sum + count;
                }, 0) || 17}
              </div>
              <div className="text-xs text-gray-600">Dining Experiences</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{pkg.highlights?.length || 5}</div>
              <div className="text-xs text-gray-600">Key Highlights</div>
            </div>
          </div>
        </Card>
      </div>

      {/* Breadcrumbs */}
      <div className="max-w-4xl mx-auto px-4 pb-3">
        <nav className="flex items-center space-x-2 text-xs md:text-sm">
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
      <div className="max-w-4xl mx-auto px-4 pb-12">
        <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-4">Day-by-Day Itinerary</h2>
        
        <div className="space-y-4">
          {itinerary?.map((day: any, index: number) => (
            <Card key={index} className="bg-white overflow-hidden border-gray-200">
              <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-3 md:p-4 border-b">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base md:text-lg font-semibold text-gray-900">
                      Day {day.day} — {day.location || day.title || `Exploring ${pkg.destination}`}
                    </h3>
                  </div>
                  <Button
                    onClick={() => {
                      setSelectedDayIndex(index);
                      setIsAddPOIModalOpen(true);
                    }}
                    size="sm"
                    className="bg-purple-600 hover:bg-purple-700 text-white"
                  >
                    <Plus className="w-3 h-3 mr-1" />
                    Add POI
                  </Button>
                </div>
              </div>
              
              <div className="p-4 md:p-5">
                {/* Group POIs by time label if available */}
                {day.pois && day.pois.length > 0 ? (
                  <>
                    {['Morning', 'Afternoon', 'Evening'].map((timeLabel) => {
                      const timePois = day.pois?.filter((poi: any) => 
                        poi.timeLabel === timeLabel || 
                        (poi.time && poi.time.toLowerCase().includes(timeLabel.toLowerCase()))
                      ) || [];
                      
                      if (timePois.length === 0) return null;
                      
                      return (
                        <div key={timeLabel} className="mb-6">
                          <div className="flex items-center gap-2 mb-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                              timeLabel === 'Evening' 
                                ? 'bg-gradient-to-r from-purple-500 to-purple-600' 
                                : 'bg-gradient-to-r from-orange-400 to-yellow-500'
                            }`}>
                              {timeLabel === 'Morning' && <Sun className="w-4 h-4 text-white" />}
                              {timeLabel === 'Afternoon' && <Sun className="w-4 h-4 text-white" />}
                              {timeLabel === 'Evening' && <Moon className="w-4 h-4 text-white" />}
                            </div>
                            <span className={`text-sm font-semibold ${
                              timeLabel === 'Evening' ? 'text-purple-600' : 'text-orange-500'
                            }`}>
                              {timeLabel} {timePois[0]?.time && `(${timePois[0].time})`}
                            </span>
                          </div>
                          
                          <div className="space-y-2 ml-8 md:ml-10">
                            {timePois.map((poi: any, poiIndex: number) => (
                              <div key={poiIndex} className="relative group">
                                <POICard 
                                  {...poi} 
                                  onDelete={poi.id ? () => handleDeletePOI(index, poi.id) : undefined}
                                  onTimeChange={poi.id ? (newTime) => handleUpdatePOITime(index, poi.id, newTime) : undefined}
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                    
                    {/* POIs without time labels */}
                    {(() => {
                      const untimedPois = day.pois?.filter((poi: any) => 
                        !poi.timeLabel && 
                        (!poi.time || !['morning', 'afternoon', 'evening'].some(t => 
                          poi.time.toLowerCase().includes(t)
                        ))
                      ) || [];
                      
                      if (untimedPois.length === 0) return null;
                      
                      return (
                        <div className="space-y-2">
                          {untimedPois.map((poi: any, poiIndex: number) => (
                            <div key={`untimed-${poiIndex}`} className="relative group">
                              <POICard 
                                {...poi} 
                                onDelete={poi.id ? () => handleDeletePOI(index, poi.id) : undefined}
                                onTimeChange={poi.id ? (newTime: string) => handleUpdatePOITime(index, poi.id, newTime) : undefined}
                              />
                            </div>
                          ))}
                        </div>
                      );
                    })()}
                  </>
                ) : null}
                  
                {/* Fallback to activities if POIs not available */}
                {!day.pois && day.activities?.map((activity: string | any, actIndex: number) => {
                  // If activity is already an object, use it directly
                  if (typeof activity === 'object' && activity.name) {
                    return <POICard key={actIndex} {...activity} />;
                  }
                  
                  // Parse activity string to extract POI data
                  const activityStr = String(activity);
                  
                  // Try different regex patterns
                  const patterns = [
                    /^(.*?)\s*-\s*(.+?)\s*-\s*rated\s*([\d.]+)★?\s*with\s*([\d,]+)\s*reviews?$/,
                    /^(.*?)\s*-\s*(.+?)\s*-\s*([\d.]+)★?\s*\(([\d,]+)\s*reviews?\)$/,
                    /^(.*?)\s*-\s*(.+?)$/
                  ];
                  
                  for (const pattern of patterns) {
                    const match = activityStr.match(pattern);
                    if (match) {
                      const [, name, description, rating, reviews] = match;
                      const poi = {
                        name: name?.trim() || activityStr,
                        description: description?.trim() || 'Must-visit attraction showcasing local highlights',
                        rating: rating ? parseFloat(rating) : 4.5,
                        reviewCount: reviews ? parseInt(reviews.replace(/,/g, '')) : Math.floor(Math.random() * 50000) + 1000,
                        category: 'Attraction',
                        duration: '~2 hours',
                        placeId: undefined
                      };
                      return <POICard key={actIndex} {...poi} />;
                    }
                  }
                  
                  // Final fallback - create a simple POI from the activity string
                  const poi = {
                    name: activityStr,
                    description: 'Must-visit attraction showcasing local highlights',
                    rating: 4.5,
                    reviewCount: Math.floor(Math.random() * 50000) + 1000,
                    category: 'Attraction',
                    duration: '~2 hours',
                    placeId: undefined
                  };
                  return <POICard key={actIndex} {...poi} />;
                })}
              </div>
            </Card>
          ))}
        </div>

        {/* Export Button */}
        <div className="mt-6 flex justify-center">
          <Button
            size="default"
            className="bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:from-purple-700 hover:to-blue-700"
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

      {/* Add POI Modal */}
      <AddPOIModal
        isOpen={isAddPOIModalOpen}
        onClose={() => {
          setIsAddPOIModalOpen(false);
          setSelectedDayIndex(null);
        }}
        onAddPOI={handleAddPOI}
        conversationId={pkg?.conversationId}
        city={pkg?.destination}
        tags={pkg?.tags || []}
      />
    </div>
  );
}