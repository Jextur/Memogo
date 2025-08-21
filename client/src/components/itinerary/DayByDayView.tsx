import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { TravelPackage, ItineraryDay, Activity } from "@/types/travel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { StarRating } from "@/components/ui/star-rating";
import { refinePackage, exportPackage } from "@/lib/api";
import { ArrowLeft, Edit, Plus, X, Sun, Sunset, Moon, Star, MapPin, Clock, Utensils, Loader2, Sparkles, ExternalLink, Map } from "lucide-react";

interface DayByDayViewProps {
  package: TravelPackage;
  onBack: () => void;
  onAddPOI?: () => void;
}

export function DayByDayView({ package: pkg, onBack, onAddPOI }: DayByDayViewProps) {
  const [selectedDay, setSelectedDay] = useState<number>(1);
  const [refinementInput, setRefinementInput] = useState("");
  const [refinementDay, setRefinementDay] = useState<number | null>(null);
  const queryClient = useQueryClient();

  const refineMutation = useMutation({
    mutationFn: ({ packageId, refinementRequest }: { packageId: string; refinementRequest: string }) =>
      refinePackage(packageId, refinementRequest),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/packages', pkg.id] });
      queryClient.invalidateQueries({ queryKey: ['/api/conversation', pkg.conversationId, 'packages'] });
      setRefinementInput("");
      setRefinementDay(null);
    },
  });

  const exportMutation = useMutation({
    mutationFn: exportPackage,
  });

  const itinerary = (pkg.itinerary as ItineraryDay[]) || [];
  const currentDay = itinerary.find(day => day.day === selectedDay);

  const getTimeIcon = (time: string) => {
    switch (time) {
      case "morning":
        return <Sun className="w-4 h-4" />;
      case "afternoon":
        return <Sunset className="w-4 h-4" />;
      case "evening":
        return <Moon className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const getTimeColor = (time: string) => {
    switch (time) {
      case "morning":
        return "text-amber-500";
      case "afternoon":
        return "text-orange-500";
      case "evening":
        return "text-purple-500";
      default:
        return "text-brand-accent";
    }
  };

  const getActivityTypeColor = (type: string) => {
    switch (type) {
      case "restaurant":
      case "food":
        return "bg-red-500/10 text-red-600 border-red-200";
      case "attraction":
        return "bg-blue-500/10 text-blue-600 border-blue-200";
      case "accommodation":
        return "bg-purple-500/10 text-purple-600 border-purple-200";
      case "nature":
        return "bg-green-500/10 text-green-600 border-green-200";
      case "shopping":
        return "bg-pink-500/10 text-pink-600 border-pink-200";
      case "culture":
        return "bg-indigo-500/10 text-indigo-600 border-indigo-200";
      case "nightlife":
        return "bg-orange-500/10 text-orange-600 border-orange-200";
      default:
        return "bg-gray-500/10 text-gray-600 border-gray-200";
    }
  };
  
  const formatReviewCount = (count: number): string => {
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}k`;
    }
    return count.toLocaleString();
  };

  const handleRefinement = () => {
    if (!refinementInput.trim() || refineMutation.isPending) return;
    
    // Add day context if refining a specific day
    const request = refinementDay 
      ? `For day ${refinementDay} only: ${refinementInput}`
      : refinementInput;
      
    refineMutation.mutate({
      packageId: pkg.id,
      refinementRequest: request,
    });
  };

  const handleExport = () => {
    exportMutation.mutate(pkg.id);
  };

  const removeActivity = (dayNumber: number, activityId: string, activityName: string) => {
    // Immediately update the UI optimistically
    const updatedItinerary = [...itinerary];
    const dayIndex = updatedItinerary.findIndex(d => d.day === dayNumber);
    if (dayIndex !== -1) {
      updatedItinerary[dayIndex] = {
        ...updatedItinerary[dayIndex],
        activities: updatedItinerary[dayIndex].activities.filter(a => a.id !== activityId)
      };
    }
    
    // Update local state immediately for responsive UI
    queryClient.setQueryData(
      ['/api/conversation', pkg.conversationId, 'packages'],
      (old: any) => {
        if (!old) return old;
        return old.map((p: any) => 
          p.id === pkg.id 
            ? { ...p, itinerary: updatedItinerary }
            : p
        );
      }
    );
    
    // Send the removal request to backend
    const refinementRequest = `Remove "${activityName}" from day ${dayNumber}`;
    refineMutation.mutate({
      packageId: pkg.id,
      refinementRequest,
    });
  };

  return (
    <div className="min-h-[calc(100vh-160px)]">
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={onBack}
          className="text-brand-mute hover:text-brand-accent mb-4 p-0"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to packages
        </Button>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold mb-2 text-brand-text">{pkg.name}</h2>
            <p className="text-brand-mute">{pkg.days}-day detailed itinerary • {pkg.route}</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-brand-accent">{pkg.budget}</p>
            <p className="text-brand-mute text-sm">per person</p>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Day List Navigation */}
        <div className="lg:col-span-1">
          <Card className="bg-brand-card border-brand-border sticky top-24">
            <CardHeader>
              <CardTitle className="text-brand-text">Days Overview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {itinerary.map((day) => (
                <Button
                  key={day.day}
                  variant="ghost"
                  className={`w-full justify-between p-3 h-auto ${
                    selectedDay === day.day
                      ? "bg-brand-accent/20 border border-brand-accent/30 text-brand-text"
                      : "text-brand-text hover:bg-brand-bg/50"
                  }`}
                  onClick={() => setSelectedDay(day.day)}
                >
                  <div className="text-left">
                    <p className="font-medium text-sm">{day.title}</p>
                    <p className="text-brand-mute text-xs">{day.location}</p>
                  </div>
                  <span className="text-xs text-brand-mute">
                    {day.activities?.length || 0} activities
                  </span>
                </Button>
              ))}
              {itinerary.length > 3 && (
                <div className="pt-2">
                  <Button
                    variant="ghost"
                    className="w-full text-center text-brand-mute text-xs hover:text-brand-accent"
                  >
                    View all {pkg.days} days
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Day Detail Content */}
        <div className="lg:col-span-2">
          {currentDay ? (
            <Card className="bg-brand-card border-brand-border">
              <CardHeader className="border-b border-brand-border">
                <div className="flex items-center justify-between mb-2">
                  <CardTitle className="text-brand-text">{currentDay.title}</CardTitle>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-brand-mute hover:text-brand-accent"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      onClick={onAddPOI}
                      className="bg-brand-accent text-brand-bg px-3 py-1 text-xs font-semibold hover:bg-yellow-500"
                    >
                      <Plus className="w-3 h-3 mr-1" />
                      Add POI
                    </Button>
                  </div>
                </div>
                <p className="text-brand-mute text-sm">{currentDay.description}</p>
              </CardHeader>

              <CardContent className="p-6">
                {/* Display activities from the simple string array */}
                {currentDay.activities && currentDay.activities.length > 0 ? (
                  <div className="space-y-6">
                    {/* Map activities to time slots based on their position */}
                    {(currentDay.activities as any[]).map((activity: any, index: number) => {
                      // Handle both string and object types
                      const activityName = typeof activity === 'string' ? activity : activity.name;
                      
                      // Skip empty or placeholder activities
                      if (!activityName || activityName === "Evening leisure time") return null;
                      
                      // Distribute activities across different time slots
                      // For more than 3 activities, spread them out with different times
                      const timeSlots = [
                        { slot: "morning", label: "9:00 AM" },
                        { slot: "morning", label: "11:00 AM" },
                        { slot: "afternoon", label: "1:00 PM" },
                        { slot: "afternoon", label: "3:00 PM" },
                        { slot: "evening", label: "5:00 PM" },
                        { slot: "evening", label: "7:00 PM" },
                        { slot: "evening", label: "9:00 PM" }
                      ];
                      
                      const timeInfo = timeSlots[Math.min(index, timeSlots.length - 1)];
                      const timeSlot = timeInfo.slot;
                      const timeLabel = timeInfo.label;
                      
                      // Parse activity information
                      let activityRating = null;
                      let activityReviews = null;
                      let activityCategory = null;
                      
                      // Extract rating and reviews from activity string if present
                      const ratingMatch = activityName.match(/rated (\d+\.?\d*)★/);
                      if (ratingMatch) {
                        activityRating = parseFloat(ratingMatch[1]);
                      }
                      
                      const reviewMatch = activityName.match(/\((\d+) reviews?\)/);
                      if (reviewMatch) {
                        activityReviews = parseInt(reviewMatch[1]);
                      }
                      
                      // Clean activity name (remove rating/review info)
                      const cleanActivityName = activityName
                        .replace(/\s*-\s*.*$/, '') // Remove everything after dash
                        .trim();
                      
                      // Determine activity type and category based on keywords
                      let activityType = "attraction";
                      const activityLower = activityName.toLowerCase();
                      
                      if (activityLower.includes("restaurant") || activityLower.includes("cafe") || 
                          activityLower.includes("table") || activityLower.includes("kitchen") ||
                          activityLower.includes("dining") || activityLower.includes("food")) {
                        activityType = "food";
                      } else if (activityLower.includes("hotel") || activityLower.includes("palace") ||
                                 activityLower.includes("accommodation")) {
                        activityType = "accommodation";
                      } else if (activityLower.includes("temple") || activityLower.includes("shrine") ||
                                 activityLower.includes("museum") || activityLower.includes("cultural")) {
                        activityType = "culture";
                      } else if (activityLower.includes("park") || activityLower.includes("garden") ||
                                 activityLower.includes("nature") || activityLower.includes("beach")) {
                        activityType = "nature";
                      } else if (activityLower.includes("shop") || activityLower.includes("market") ||
                                 activityLower.includes("mall")) {
                        activityType = "shopping";
                      } else if (activityLower.includes("bar") || activityLower.includes("club") ||
                                 activityLower.includes("night")) {
                        activityType = "nightlife";
                      }
                      
                      // If activity is an object, use its properties
                      if (typeof activity === 'object') {
                        activityRating = activity.rating || activityRating;
                        activityReviews = activity.userRatingsTotal || activity.reviewCount || activityReviews;
                        activityCategory = activity.category || activityType;
                      }
                      
                      return (
                        <div key={`${currentDay.day}-${index}`} className="relative">
                          <div className="flex items-start space-x-4">
                            <div className="flex flex-col items-center">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                timeSlot === "morning" ? "bg-amber-500/20 text-amber-500" :
                                timeSlot === "afternoon" ? "bg-orange-500/20 text-orange-500" :
                                "bg-purple-500/20 text-purple-500"
                              }`}>
                                {getTimeIcon(timeSlot)}
                              </div>
                              {index < currentDay.activities.length - 2 && (
                                <div className="w-px h-16 bg-brand-border mt-2"></div>
                              )}
                            </div>
                            <div className="flex-1">
                              <h4 className={`font-semibold mb-3 capitalize ${getTimeColor(timeSlot)}`}>
                                {timeSlot} ({timeLabel})
                              </h4>
                              <div className="bg-brand-bg/30 border border-brand-border rounded-xl p-4 relative group">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="absolute top-2 right-2 w-6 h-6 p-0 bg-red-500/20 text-red-400 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                  onClick={() => removeActivity(currentDay.day, `activity-${index}`, activityName)}
                                >
                                  <X className="w-3 h-3" />
                                </Button>
                                
                                <div className="flex items-start space-x-3">
                                  <div className="w-12 h-12 bg-gray-200 rounded-lg flex-shrink-0 flex items-center justify-center">
                                    {activityType === "food" ? (
                                      <Utensils className="w-6 h-6 text-red-400" />
                                    ) : activityType === "accommodation" ? (
                                      <Star className="w-6 h-6 text-purple-400" />
                                    ) : (
                                      <MapPin className="w-6 h-6 text-blue-400" />
                                    )}
                                  </div>
                                  
                                  <div className="flex-1">
                                    {/* Title and Map Link */}
                                    <div className="flex items-center justify-between mb-2">
                                      <h5 className="font-bold text-lg text-brand-text">{cleanActivityName}</h5>
                                      {/* Google Maps Link */}
                                      {typeof activity === 'object' && activity.placeId && (
                                        <a
                                          href={`https://www.google.com/maps/place/?q=place_id:${activity.placeId}`}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-blue-500/10 hover:bg-blue-500/20 transition-colors group"
                                          title="View on Google Maps"
                                        >
                                          <Map className="w-4 h-4 text-blue-500 group-hover:text-blue-600" />
                                        </a>
                                      )}
                                    </div>
                                    
                                    {/* Rating and Reviews */}
                                    {activityRating && (
                                      <div className="flex items-center space-x-3 mb-3">
                                        <StarRating 
                                          rating={activityRating} 
                                          size="md"
                                          showNumber={true}
                                        />
                                        {activityReviews && (
                                          <span className="text-sm text-gray-400">
                                            ({formatReviewCount(activityReviews)} reviews)
                                          </span>
                                        )}
                                      </div>
                                    )}
                                    
                                    {/* Category Tags */}
                                    <div className="flex flex-wrap gap-2 mb-3">
                                      {/* Main category tag */}
                                      <Badge
                                        className={`px-3 py-1 text-xs font-medium rounded-full border ${getActivityTypeColor(activityType)}`}
                                      >
                                        {activityType.charAt(0).toUpperCase() + activityType.slice(1)}
                                      </Badge>
                                      
                                      {/* Additional tags based on description */}
                                      {typeof activity === 'object' && activity.description && (
                                        <>
                                          {activity.description.toLowerCase().includes('highly-rated') && (
                                            <Badge className="px-3 py-1 text-xs font-medium rounded-full bg-yellow-500/10 text-yellow-600 border border-yellow-200">
                                              Highly Rated
                                            </Badge>
                                          )}
                                          {activity.description.toLowerCase().includes('must-see') && (
                                            <Badge className="px-3 py-1 text-xs font-medium rounded-full bg-purple-500/10 text-purple-600 border border-purple-200">
                                              Must-See
                                            </Badge>
                                          )}
                                          {activity.description.toLowerCase().includes('cultural') && (
                                            <Badge className="px-3 py-1 text-xs font-medium rounded-full bg-indigo-500/10 text-indigo-600 border border-indigo-200">
                                              Cultural
                                            </Badge>
                                          )}
                                        </>
                                      )}
                                      
                                      {/* Duration tag */}
                                      <Badge className="px-3 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-600 border border-gray-200">
                                        {timeSlot === "morning" ? "~2 hours" : 
                                         timeSlot === "afternoon" ? "~3 hours" : "~2 hours"}
                                      </Badge>
                                    </div>
                                    
                                    {/* Description */}
                                    <p className="text-sm text-gray-500 leading-relaxed">
                                      {typeof activity === 'object' && activity.description ? 
                                        activity.description : 
                                        (activityType === "food" ? "Experience local cuisine at this popular dining spot" : 
                                         activityType === "accommodation" ? "Comfortable lodging with excellent amenities" : 
                                         activityType === "culture" ? "Cultural experience showcasing local heritage" :
                                         activityType === "nature" ? "Natural beauty and outdoor experience" :
                                         activityType === "shopping" ? "Shopping destination for local goods and souvenirs" :
                                         activityType === "nightlife" ? "Evening entertainment and social scene" :
                                         "Must-visit attraction showcasing local highlights")}
                                    </p>
                                    
                                    {/* Fallback Google Maps search link if no place_id */}
                                    {(typeof activity !== 'object' || !activity.placeId) && (
                                      <div className="mt-3">
                                        <a
                                          href={`https://www.google.com/maps/search/${encodeURIComponent(cleanActivityName)}`}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="inline-flex items-center text-xs text-blue-500 hover:text-blue-600"
                                          title="Search on Google Maps"
                                        >
                                          <Map className="w-3 h-3 mr-1" />
                                          Find on Maps
                                        </a>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-brand-mute">No activities planned for this day yet.</p>
                  </div>
                )}

                {/* Day Summary */}
                <div className="mt-6 pt-6 border-t border-brand-border">
                  <div className="grid grid-cols-3 gap-4 text-center text-sm">
                    <div>
                      <p className="text-brand-mute">Total Activities</p>
                      <p className="font-semibold text-brand-accent">{currentDay.activities?.length || 0}</p>
                    </div>
                    <div>
                      <p className="text-brand-mute">Estimated Cost</p>
                      <p className="font-semibold text-brand-accent">$285</p>
                    </div>
                    <div>
                      <p className="text-brand-mute">Walking Distance</p>
                      <p className="font-semibold text-brand-accent">3.2 km</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="bg-brand-card border-brand-border">
              <CardContent className="p-6 text-center">
                <p className="text-brand-mute">Select a day to view details</p>
              </CardContent>
            </Card>
          )}

          {/* Refinement Section */}
          <Card className="mt-6 bg-brand-card border-brand-border">
            <CardHeader>
              <CardTitle className="text-brand-text">Refine Your Itinerary</CardTitle>
              <p className="text-brand-mute text-sm">
                {refinementDay ? `Refining Day ${refinementDay} only` : "Ask our AI to make changes to your trip"}
              </p>
            </CardHeader>
            <CardContent>
              {/* Day selector for targeted refinement */}
              <div className="flex items-center space-x-2 mb-3">
                <span className="text-sm text-brand-mute">Scope:</span>
                <Button
                  size="sm"
                  variant={!refinementDay ? "default" : "outline"}
                  onClick={() => setRefinementDay(null)}
                  className={`h-7 ${!refinementDay ? "bg-brand-accent text-brand-bg" : "text-brand-text border-brand-border"}`}
                >
                  Entire Trip
                </Button>
                <Button
                  size="sm"
                  variant={refinementDay === selectedDay ? "default" : "outline"}
                  onClick={() => setRefinementDay(selectedDay)}
                  className={`h-7 ${refinementDay === selectedDay ? "bg-brand-accent text-brand-bg" : "text-brand-text border-brand-border"}`}
                >
                  Day {selectedDay} Only
                </Button>
              </div>
              
              <div className="flex space-x-2 mb-2">
                <Input
                  placeholder={refinementDay 
                    ? `e.g., Replace morning activity with shopping, Add local market visit...`
                    : `e.g., Add more cultural sites, Include budget-friendly options...`}
                  value={refinementInput}
                  onChange={(e) => setRefinementInput(e.target.value)}
                  className="flex-1 bg-brand-bg border-brand-border text-brand-text placeholder:text-brand-mute focus:border-brand-accent"
                  disabled={refineMutation.isPending}
                />
                <Button
                  onClick={handleRefinement}
                  disabled={!refinementInput.trim() || refineMutation.isPending}
                  className="bg-brand-accent text-brand-bg hover:bg-yellow-500 flex-shrink-0"
                >
                  {refineMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                      Refining...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-1" />
                      {refinementDay ? `Refine Day ${refinementDay}` : "Refine All"}
                    </>
                  )}
                </Button>
              </div>
              <p className="text-xs text-brand-mute">
                {pkg.conversationId ? "2" : "3"} refinement requests remaining
              </p>
            </CardContent>
          </Card>

          {/* Export Button */}
          <Card className="mt-6 bg-brand-card border-brand-border">
            <CardContent className="p-4">
              <Button
                onClick={handleExport}
                disabled={exportMutation.isPending}
                className="w-full bg-brand-accent text-brand-bg hover:bg-yellow-500"
              >
                {exportMutation.isPending ? (
                  <>
                    <LoadingSpinner size="sm" className="mr-2" />
                    Exporting...
                  </>
                ) : (
                  "📥 Export Package"
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
