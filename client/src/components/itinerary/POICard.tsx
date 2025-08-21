import { useState } from "react";
import { MapPin, Clock, ExternalLink, X, Edit2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { StarRating } from "@/components/ui/StarRating";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { mapGooglePlaceTypeToPOIVariant, getPOIColorStyle } from "@/config/poiTypeConfig";

interface POICardProps {
  name: string;
  rating?: number;
  reviewCount?: number;
  reviewsCount?: number;
  user_ratings_total?: number;
  category?: string;
  type?: string;
  types?: string[];
  duration?: string;
  durationHours?: number;
  durationMinutes?: number;
  description?: string;
  tags?: string[];
  placeId?: string;
  mapsUrl?: string;
  priceLevel?: number;
  time?: string;
  timeLabel?: string;
  onDelete?: () => void;
  onTimeChange?: (newTime: string) => void;
}

export function POICard({
  name,
  rating,
  reviewCount,
  reviewsCount,
  user_ratings_total,
  category,
  type,
  types,
  duration,
  durationHours,
  durationMinutes,
  description,
  tags,
  placeId,
  mapsUrl,
  priceLevel,
  time,
  timeLabel,
  onDelete,
  onTimeChange
}: POICardProps) {
  const [isEditingTime, setIsEditingTime] = useState(false);
  const [categoryHover, setCategoryHover] = useState(false);
  const [categoryPressed, setCategoryPressed] = useState(false);
  
  // Get review count from various possible fields
  const totalReviews = reviewCount || reviewsCount || user_ratings_total || 0;
  
  // Determine category with proper capitalization
  const displayCategory = category || type || 'Attraction';
  
  // Ensure category is properly formatted (capitalize first letter if needed)
  const formattedCategory = displayCategory.charAt(0).toUpperCase() + displayCategory.slice(1);
  
  // Get POI variant for color coding
  const poiVariant = mapGooglePlaceTypeToPOIVariant(types);
  
  // Format duration with more intelligent display
  let formattedDuration = duration;
  if (!formattedDuration) {
    if (durationHours) {
      // Handle decimal hours (e.g., 1.5 hours)
      if (durationHours % 1 !== 0) {
        const hours = Math.floor(durationHours);
        const minutes = Math.round((durationHours % 1) * 60);
        if (hours === 0) {
          formattedDuration = `${minutes} mins`;
        } else if (minutes === 0) {
          formattedDuration = `${hours} hour${hours !== 1 ? 's' : ''}`;
        } else {
          formattedDuration = `${hours}h ${minutes}m`;
        }
      } else {
        formattedDuration = `${durationHours} hour${durationHours !== 1 ? 's' : ''}`;
      }
    } else if (durationMinutes) {
      if (durationMinutes >= 60) {
        const hours = Math.floor(durationMinutes / 60);
        const mins = durationMinutes % 60;
        if (mins === 0) {
          formattedDuration = `${hours} hour${hours !== 1 ? 's' : ''}`;
        } else {
          formattedDuration = `${hours}h ${mins}m`;
        }
      } else {
        formattedDuration = `${durationMinutes} mins`;
      }
    } else {
      // Intelligent fallback based on category
      const categoryDurations: Record<string, string> = {
        'Restaurant': '1-2 hours',
        'Fine Dining': '2-3 hours',
        'Fast Food': '30 mins',
        'Cafe': '1 hour',
        'Coffee Shop': '45 mins',
        'Bar': '2 hours',
        'Museum': '2-3 hours',
        'Art Gallery': '2 hours',
        'Park': '2 hours',
        'Beach': '3-4 hours',
        'Shopping Mall': '2-3 hours',
        'Market': '1-2 hours',
        'Temple': '1 hour',
        'Church': '45 mins',
        'Viewpoint': '30 mins',
        'Theme Park': 'Full day',
        'Amusement Park': 'Full day',
        'Zoo': '4-5 hours',
        'Aquarium': '2-3 hours'
      };
      formattedDuration = categoryDurations[displayCategory] || '1-2 hours';
    }
  }
  
  // Truncate description
  const truncatedDescription = description && description.length > 120
    ? description.substring(0, 117) + '...'
    : description || 'Must-visit attraction showcasing local highlights';
  
  // Format maps URL - Always use place_id when available for accuracy
  // This format opens the exact place in Google Maps app (if installed) or web
  const mapsLink = placeId 
    ? `https://www.google.com/maps/search/?api=1&query_place_id=${placeId}&query=${encodeURIComponent(name)}`
    : mapsUrl || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(name)}`;
  
  return (
    <div className="border border-purple-200/40 rounded-lg p-3 hover:shadow-md transition-all relative" style={{ backgroundColor: 'rgba(46, 16, 101, 0.06)' }}>
      {/* Delete and Time Edit Buttons */}
      {(onDelete || onTimeChange) && (
        <div className="absolute top-2 right-2 flex gap-1">
          {onTimeChange && (
            <Button
              size="sm"
              variant="ghost"
              className="h-7 w-7 p-0 opacity-60 hover:opacity-100 transition-opacity"
              onClick={() => setIsEditingTime(!isEditingTime)}
              title="Edit time slot"
            >
              <Edit2 className="h-3 w-3" />
            </Button>
          )}
          {onDelete && (
            <Button
              size="sm"
              variant="ghost"
              className="h-7 w-7 p-0 text-gray-500 hover:bg-red-100 hover:text-red-600 transition-colors"
              onClick={onDelete}
              title="Delete activity"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      )}
      
      <div className="flex gap-3">
        {/* Icon */}
        <div className="flex-shrink-0">
          <div className="w-10 h-10 bg-white/90 rounded-lg flex items-center justify-center shadow-sm">
            <MapPin className="w-5 h-5 text-purple-600" />
          </div>
        </div>
        
        {/* Content */}
        <div className="flex-1">
          {/* Title and Price */}
          <div className="flex items-start justify-between mb-1.5">
            <h4 className="font-medium text-gray-900 text-sm md:text-base flex-1">{name}</h4>
            {priceLevel && (
              <span className="text-xs text-gray-600 ml-3">
                {'$'.repeat(priceLevel)}
              </span>
            )}
          </div>
          
          {/* Time Selector when editing */}
          {isEditingTime && onTimeChange && (
            <div className="mb-2">
              <Select value={time || "morning"} onValueChange={(value) => {
                onTimeChange(value);
                setIsEditingTime(false);
              }}>
                <SelectTrigger className="w-32 h-7 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="morning">Morning</SelectItem>
                  <SelectItem value="afternoon">Afternoon</SelectItem>
                  <SelectItem value="evening">Evening</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
          
          {/* Rating and Reviews */}
          {rating && totalReviews >= 10 && (
            <div className="mb-2">
              <StarRating 
                rating={rating} 
                reviewCount={totalReviews}
                size="sm"
              />
            </div>
          )}
          
          {/* Category and Duration Chips */}
          <div className="flex flex-wrap items-center gap-1.5 mb-2">
            <Badge 
              className="text-[10px] md:text-xs px-2 md:px-2.5 py-0.5 rounded-full border-0 font-medium transition-colors cursor-default"
              style={getPOIColorStyle(
                poiVariant, 
                categoryPressed ? 'pressed' : categoryHover ? 'hover' : 'default'
              )}
              onMouseEnter={() => setCategoryHover(true)}
              onMouseLeave={() => {
                setCategoryHover(false);
                setCategoryPressed(false);
              }}
              onMouseDown={() => setCategoryPressed(true)}
              onMouseUp={() => setCategoryPressed(false)}
            >
              {formattedCategory}
            </Badge>
            <Badge 
              className="text-[10px] md:text-xs px-2 md:px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-700 border-0"
            >
              <Clock className="w-3 h-3 mr-1 inline" />
              {formattedDuration}
            </Badge>
          </div>
          
          {/* Description */}
          <p className="text-xs md:text-sm text-gray-600 mb-2 leading-relaxed">
            {truncatedDescription}
          </p>
          
          {/* Tags and Maps Link */}
          <div className="flex items-center justify-between">
            {/* Optional Tags */}
            <div className="flex flex-wrap gap-1">
              {tags && tags.length > 0 && tags.slice(0, 3).map((tag, index) => (
                <span 
                  key={index}
                  className="text-xs px-2 py-0.5 text-gray-500 bg-gray-50 rounded border border-gray-200"
                >
                  {tag}
                </span>
              ))}
            </div>
            
            {/* Find on Maps */}
            <a
              href={mapsLink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center text-xs text-purple-600 hover:text-purple-800 transition-colors font-medium whitespace-nowrap ml-2"
            >
              <MapPin className="w-3 h-3 mr-1" />
              Find on Maps
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}