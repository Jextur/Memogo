import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { searchPlaces, getPhotoUrl } from "@/lib/api";
import { POI } from "@/types/travel";
import { Search, Plus, Star, MapPin, Clock, Sun, Sunset, Moon, X } from "lucide-react";

interface AddPOIModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddPOI?: (poi: POI, timeSlot: string) => void;
}

export function AddPOIModal({ isOpen, onClose, onAddPOI }: AddPOIModalProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string>("morning");
  const [searchResults, setSearchResults] = useState<POI[]>([]);

  const searchMutation = useMutation({
    mutationFn: searchPlaces,
    onSuccess: (data) => {
      setSearchResults(data.results);
    },
  });

  const handleSearch = () => {
    if (!searchQuery.trim()) return;
    searchMutation.mutate(searchQuery);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  const handleAddPOI = (poi: POI) => {
    onAddPOI?.(poi, selectedTimeSlot);
    onClose();
    setSearchQuery("");
    setSearchResults([]);
  };

  const getActivityTypeColor = (types?: string[]) => {
    if (!types || types.length === 0) return "bg-gray-500/20 text-gray-400";
    
    if (types.includes("restaurant") || types.includes("food")) {
      return "bg-red-500/20 text-red-400";
    }
    if (types.includes("tourist_attraction") || types.includes("point_of_interest")) {
      return "bg-blue-500/20 text-blue-400";
    }
    if (types.includes("lodging")) {
      return "bg-brand-accent/20 text-brand-accent";
    }
    return "bg-purple-500/20 text-purple-400";
  };

  const getPrimaryType = (types?: string[]) => {
    if (!types || types.length === 0) return "Place";
    
    if (types.includes("restaurant")) return "Restaurant";
    if (types.includes("tourist_attraction")) return "Tourist Attraction";
    if (types.includes("lodging")) return "Accommodation";
    if (types.includes("shopping_mall")) return "Shopping";
    return types[0].replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase());
  };

  const getTimeSlotIcon = (timeSlot: string) => {
    switch (timeSlot) {
      case "morning":
        return <Sun className="w-4 h-4 mr-2" />;
      case "afternoon":
        return <Sunset className="w-4 h-4 mr-2" />;
      case "evening":
        return <Moon className="w-4 h-4 mr-2" />;
      default:
        return <Clock className="w-4 h-4 mr-2" />;
    }
  };

  const getTimeSlotColor = (timeSlot: string, isSelected: boolean) => {
    const baseColors = {
      morning: isSelected ? "bg-amber-500/30 text-amber-500 border-amber-500" : "bg-amber-500/20 text-amber-500 hover:bg-amber-500/30",
      afternoon: isSelected ? "bg-orange-500/30 text-orange-500 border-orange-500" : "bg-orange-500/20 text-orange-500 hover:bg-orange-500/30",
      evening: isSelected ? "bg-purple-500/30 text-purple-500 border-purple-500" : "bg-purple-500/20 text-purple-500 hover:bg-purple-500/30",
    };
    return baseColors[timeSlot as keyof typeof baseColors] || "";
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-brand-card border-brand-border max-w-2xl max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="text-brand-text">Add Points of Interest</DialogTitle>
          <DialogDescription className="text-brand-mute">
            Search for places to add to your itinerary
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-brand-mute w-4 h-4" />
            <Input
              placeholder="Search for restaurants, attractions, activities..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={handleKeyPress}
              className="w-full bg-brand-bg border-brand-border text-brand-text placeholder:text-brand-mute pl-10 pr-20 focus:border-brand-accent"
            />
            <Button
              onClick={handleSearch}
              disabled={!searchQuery.trim() || searchMutation.isPending}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-brand-accent text-brand-bg px-3 py-1.5 text-xs font-semibold hover:bg-yellow-500"
            >
              {searchMutation.isPending ? <LoadingSpinner size="sm" /> : "Search"}
            </Button>
          </div>

          {/* Search Results */}
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {searchMutation.isPending && (
              <div className="text-center py-8">
                <LoadingSpinner className="mx-auto mb-4" />
                <p className="text-brand-mute">Searching for places...</p>
              </div>
            )}

            {searchMutation.isError && (
              <div className="text-center py-8">
                <p className="text-red-400">Failed to search places. Please try again.</p>
              </div>
            )}

            {searchResults.length === 0 && !searchMutation.isPending && searchQuery && (
              <div className="text-center py-8">
                <p className="text-brand-mute">No places found. Try a different search term.</p>
              </div>
            )}

            {searchResults.map((poi) => (
              <div
                key={poi.place_id}
                className="bg-brand-bg/30 border border-brand-border rounded-xl p-4 hover:border-brand-accent/50 transition-colors"
              >
                <div className="flex items-start space-x-3">
                  <div className="w-12 h-12 bg-gray-200 rounded-lg flex-shrink-0 overflow-hidden">
                    {poi.photo_ref ? (
                      <img
                        src={getPhotoUrl(poi.photo_ref, 60)}
                        alt={poi.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-brand-border">
                        <MapPin className="w-6 h-6 text-brand-mute" />
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <h5 className="font-medium text-brand-text">{poi.name}</h5>
                      <div className="flex items-center space-x-2">
                        {poi.rating && (
                          <div className="flex items-center text-xs text-brand-mute">
                            <Star className="w-3 h-3 text-yellow-400 mr-1 fill-current" />
                            <span>{poi.rating}</span>
                            {poi.user_ratings_total && (
                              <span className="ml-1">({poi.user_ratings_total.toLocaleString()})</span>
                            )}
                          </div>
                        )}
                        <Button
                          size="sm"
                          onClick={() => handleAddPOI(poi)}
                          className="bg-brand-accent text-brand-bg px-2 py-1 text-xs font-semibold hover:bg-yellow-500"
                        >
                          Add
                        </Button>
                      </div>
                    </div>
                    <p className="text-brand-mute text-sm mb-2">{poi.address}</p>
                    <div className="flex items-center space-x-2">
                      <Badge
                        variant="outline"
                        className={`text-xs ${getActivityTypeColor(poi.types)}`}
                      >
                        {getPrimaryType(poi.types)}
                      </Badge>
                      {poi.price_level && (
                        <span className="text-xs text-brand-mute">
                          {"$".repeat(poi.price_level)}
                        </span>
                      )}
                      {poi.open_now !== undefined && (
                        <span className={`text-xs ${poi.open_now ? "text-green-400" : "text-red-400"}`}>
                          {poi.open_now ? "Open now" : "Closed"}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Time Slot Selection */}
          <div className="pt-6 border-t border-brand-border">
            <h4 className="font-medium mb-3 text-brand-text">Add to which time?</h4>
            <div className="grid grid-cols-3 gap-2">
              {["morning", "afternoon", "evening"].map((timeSlot) => (
                <Button
                  key={timeSlot}
                  variant="outline"
                  onClick={() => setSelectedTimeSlot(timeSlot)}
                  className={`px-3 py-2 text-sm font-medium transition-colors capitalize ${
                    getTimeSlotColor(timeSlot, selectedTimeSlot === timeSlot)
                  }`}
                >
                  {getTimeSlotIcon(timeSlot)}
                  {timeSlot}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
