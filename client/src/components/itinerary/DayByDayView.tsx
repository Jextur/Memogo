import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { TravelPackage, ItineraryDay, Activity } from "@/types/travel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { refinePackage, exportPackage } from "@/lib/api";
import { ArrowLeft, Edit, Plus, X, Sun, Sunset, Moon, Star, MapPin, Clock, Utensils } from "lucide-react";

interface DayByDayViewProps {
  package: TravelPackage;
  onBack: () => void;
  onAddPOI?: () => void;
}

export function DayByDayView({ package: pkg, onBack, onAddPOI }: DayByDayViewProps) {
  const [selectedDay, setSelectedDay] = useState<number>(1);
  const [refinementInput, setRefinementInput] = useState("");
  const queryClient = useQueryClient();

  const refineMutation = useMutation({
    mutationFn: ({ packageId, refinementRequest }: { packageId: string; refinementRequest: string }) =>
      refinePackage(packageId, refinementRequest),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/packages', pkg.id] });
      setRefinementInput("");
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
        return "bg-red-500/20 text-red-400";
      case "attraction":
        return "bg-blue-500/20 text-blue-400";
      case "accommodation":
        return "bg-brand-accent/20 text-brand-accent";
      default:
        return "bg-gray-500/20 text-gray-400";
    }
  };

  const handleRefinement = () => {
    if (!refinementInput.trim() || refineMutation.isPending) return;
    refineMutation.mutate({
      packageId: pkg.id,
      refinementRequest: refinementInput,
    });
  };

  const handleExport = () => {
    exportMutation.mutate(pkg.id);
  };

  const removeActivity = (dayNumber: number, activityId: string) => {
    // This would ideally be handled by a proper mutation
    // For now, we'll trigger a refinement request
    const refinementRequest = `Remove the activity with ID ${activityId} from day ${dayNumber}`;
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
                      
                      // Determine time slot based on index
                      const timeSlot = index === 0 ? "morning" : index === 1 ? "afternoon" : "evening";
                      const timeLabel = index === 0 ? "9:00 AM" : index === 1 ? "2:00 PM" : "6:00 PM";
                      
                      // Determine activity type based on keywords
                      let activityType = "attraction";
                      const activityLower = activityName.toLowerCase();
                      if (activityLower.includes("restaurant") || activityLower.includes("cafe") || 
                          activityLower.includes("table") || activityLower.includes("kitchen") ||
                          activityLower.includes("dining")) {
                        activityType = "restaurant";
                      } else if (activityLower.includes("hotel") || activityLower.includes("palace")) {
                        activityType = "accommodation";
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
                                  onClick={() => removeActivity(currentDay.day, `activity-${index}`)}
                                >
                                  <X className="w-3 h-3" />
                                </Button>
                                
                                <div className="flex items-start space-x-3">
                                  <div className="w-12 h-12 bg-gray-200 rounded-lg flex-shrink-0 flex items-center justify-center">
                                    {activityType === "restaurant" ? (
                                      <Utensils className="w-6 h-6 text-gray-400" />
                                    ) : activityType === "accommodation" ? (
                                      <Star className="w-6 h-6 text-gray-400" />
                                    ) : (
                                      <MapPin className="w-6 h-6 text-gray-400" />
                                    )}
                                  </div>
                                  
                                  <div className="flex-1">
                                    <div className="flex items-center justify-between mb-1">
                                      <h5 className="font-medium text-brand-text">{activityName}</h5>
                                    </div>
                                    <p className="text-brand-mute text-sm">
                                      {activityType === "restaurant" ? "Restaurant" : 
                                       activityType === "accommodation" ? "Hotel" : "Attraction"}
                                    </p>
                                    <div className="flex items-center space-x-2 mt-2">
                                      <Badge
                                        variant="outline"
                                        className={`text-xs ${getActivityTypeColor(activityType)}`}
                                      >
                                        {activityType}
                                      </Badge>
                                      <span className="text-xs text-brand-mute">
                                        {timeSlot === "morning" ? "~2 hours" : 
                                         timeSlot === "afternoon" ? "~3 hours" : "~2 hours"}
                                      </span>
                                    </div>
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
                Not satisfied with this day? Ask our AI to make changes:
              </p>
            </CardHeader>
            <CardContent>
              <div className="flex space-x-2 mb-2">
                <Input
                  placeholder="e.g., Remove the museum and add more food spots..."
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
                    <LoadingSpinner size="sm" className="mr-2" />
                  ) : (
                    "✨ Refine"
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
