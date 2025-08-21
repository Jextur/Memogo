import { useState, useEffect, useRef, useCallback } from "react";
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
import { StarRating } from "@/components/ui/star-rating";
import { searchPlaces, getPhotoUrl } from "@/lib/api";
import { POI } from "@/types/travel";
import { Search, Plus, Star, MapPin, Clock, Sun, Sunset, Moon, X, Map, ExternalLink, DollarSign } from "lucide-react";

interface AddPOIModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddPOI?: (poi: POI, timeSlot: string) => void;
  conversationId?: string;
  city?: string;
  tags?: string[];
}

export function AddPOIModal({ isOpen, onClose, onAddPOI, conversationId, city, tags }: AddPOIModalProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string>("morning");
  const [searchResults, setSearchResults] = useState<POI[]>([]);
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const debounceTimer = useRef<NodeJS.Timeout>();

  const searchMutation = useMutation({
    mutationFn: (query: string) => searchPlaces(query, {
      city,
      tags,
      timeSlot: selectedTimeSlot,
      conversationId
    }),
    onSuccess: (data) => {
      setSearchResults(data.results);
    },
  });

  // Debounce search query (500ms delay)
  useEffect(() => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    debounceTimer.current = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 500);

    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, [searchQuery]);

  // Auto-search when debounced query changes
  useEffect(() => {
    if (debouncedQuery.trim() && debouncedQuery.length >= 2) {
      searchMutation.mutate(debouncedQuery);
    } else if (debouncedQuery === "") {
      setSearchResults([]);
    }
  }, [debouncedQuery]);

  const handleSearch = useCallback(() => {
    if (!searchQuery.trim()) return;
    searchMutation.mutate(searchQuery);
  }, [searchQuery, searchMutation]);

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
    if (!types || types.length === 0) return "bg-gray-500/10 text-gray-600 border-gray-200";
    
    const type = types[0];
    if (types.includes("restaurant") || types.includes("food") || types.includes("cafe") || types.includes("bakery")) {
      return "bg-red-500/10 text-red-600 border-red-200";
    }
    if (types.includes("tourist_attraction") || types.includes("point_of_interest")) {
      return "bg-blue-500/10 text-blue-600 border-blue-200";
    }
    if (types.includes("lodging") || types.includes("hotel")) {
      return "bg-purple-500/10 text-purple-600 border-purple-200";
    }
    if (types.includes("museum") || types.includes("art_gallery")) {
      return "bg-indigo-500/10 text-indigo-600 border-indigo-200";
    }
    if (types.includes("park") || types.includes("natural_feature")) {
      return "bg-green-500/10 text-green-600 border-green-200";
    }
    if (types.includes("shopping_mall") || types.includes("store")) {
      return "bg-pink-500/10 text-pink-600 border-pink-200";
    }
    if (types.includes("bar") || types.includes("night_club")) {
      return "bg-orange-500/10 text-orange-600 border-orange-200";
    }
    return "bg-gray-500/10 text-gray-600 border-gray-200";
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

            {searchResults.length === 0 && !searchMutation.isPending && debouncedQuery && (
              <div className="text-center py-8">
                <p className="text-brand-mute mb-3">No places found for "{debouncedQuery}"</p>
                <p className="text-brand-mute text-sm">
                  Try a broader search term or a different area
                </p>
                {city && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      // Retry without city restriction
                      searchMutation.mutate(searchQuery);
                    }}
                    className="mt-3 text-xs"
                  >
                    Search wider radius
                  </Button>
                )}
              </div>
            )}

            {searchResults.map((poi) => (
              <div
                key={poi.place_id}
                className="bg-brand-bg/30 border border-brand-border rounded-xl p-4 hover:border-brand-accent/50 transition-colors"
              >
                <div className="flex items-start space-x-3">
                  <div className="w-16 h-16 bg-gray-200 rounded-lg flex-shrink-0 overflow-hidden">
                    {poi.photo_ref ? (
                      <img
                        src={getPhotoUrl(poi.photo_ref, 100)}
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
                    {/* Title Row */}
                    <div className="flex items-start justify-between mb-2">
                      <h5 className="font-bold text-base text-brand-text flex-1 mr-2">{poi.name}</h5>
                      <div className="flex items-center space-x-1">
                        <a
                          href={`https://www.google.com/maps/place/?q=place_id:${poi.place_id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-blue-500/10 hover:bg-blue-500/20 transition-colors group"
                          title="View on Google Maps"
                        >
                          <Map className="w-3.5 h-3.5 text-blue-500 group-hover:text-blue-600" />
                        </a>
                        <Button
                          size="sm"
                          onClick={() => handleAddPOI(poi)}
                          className="bg-brand-accent text-brand-bg px-3 py-1 text-xs font-semibold hover:bg-yellow-500"
                        >
                          Add to {selectedTimeSlot}
                        </Button>
                      </div>
                    </div>
                    
                    {/* Rating and Reviews */}
                    {poi.rating && (
                      <div className="mb-2">
                        <StarRating 
                          rating={poi.rating} 
                          size="sm"
                          showNumber={true}
                          reviewCount={poi.user_ratings_total}
                        />
                      </div>
                    )}
                    
                    {/* Price Level and Distance */}
                    <div className="flex items-center gap-3 mb-2">
                      {poi.price_level && (
                        <div className="flex items-center text-sm">
                          {Array.from({ length: 4 }).map((_, i) => (
                            <DollarSign 
                              key={i}
                              className={`w-3.5 h-3.5 ${
                                i < (poi.price_level || 0)
                                  ? 'text-green-500' 
                                  : 'text-gray-300'
                              }`}
                            />
                          ))}
                        </div>
                      )}
                      {poi.location && (
                        <span className="text-xs text-brand-mute">
                          <MapPin className="w-3 h-3 inline mr-1" />
                          {city || 'Nearby'}
                        </span>
                      )}
                      {poi.open_now !== undefined && (
                        <span className={`text-xs font-medium ${poi.open_now ? "text-green-500" : "text-red-500"}`}>
                          {poi.open_now ? "Open now" : "Closed"}
                        </span>
                      )}
                    </div>
                    
                    {/* Category Tags */}
                    <div className="flex flex-wrap gap-1.5">
                      <Badge
                        className={`px-2 py-0.5 text-xs font-medium rounded-full border ${getActivityTypeColor(poi.types)}`}
                      >
                        {getPrimaryType(poi.types)}
                      </Badge>
                      {poi.types && poi.types.slice(1, 3).map((type, idx) => (
                        <Badge
                          key={idx}
                          className="px-2 py-0.5 text-xs font-medium rounded-full bg-gray-100 text-gray-600 border border-gray-200"
                        >
                          {type.replace(/_/g, " ")}
                        </Badge>
                      ))}
                    </div>
                    
                    {/* Address */}
                    {poi.address && (
                      <p className="text-xs text-brand-mute mt-2 line-clamp-1">{poi.address}</p>
                    )}
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
