import { MapPin, Clock, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { StarRating } from "@/components/ui/StarRating";

interface POICardProps {
  name: string;
  rating?: number;
  reviewCount?: number;
  reviewsCount?: number;
  user_ratings_total?: number;
  category?: string;
  type?: string;
  duration?: string;
  durationHours?: number;
  durationMinutes?: number;
  description?: string;
  tags?: string[];
  placeId?: string;
  mapsUrl?: string;
  priceLevel?: number;
}

export function POICard({
  name,
  rating,
  reviewCount,
  reviewsCount,
  user_ratings_total,
  category,
  type,
  duration,
  durationHours,
  durationMinutes,
  description,
  tags,
  placeId,
  mapsUrl,
  priceLevel
}: POICardProps) {
  // Get review count from various possible fields
  const totalReviews = reviewCount || reviewsCount || user_ratings_total || 0;
  
  // Format duration
  let formattedDuration = duration;
  if (!formattedDuration) {
    if (durationHours) {
      formattedDuration = `~${durationHours} hour${durationHours > 1 ? 's' : ''}`;
    } else if (durationMinutes) {
      const hours = Math.round(durationMinutes / 60);
      formattedDuration = hours > 0 ? `~${hours} hour${hours > 1 ? 's' : ''}` : `~${durationMinutes} mins`;
    } else {
      formattedDuration = '~2 hours';
    }
  }
  
  // Determine category
  const displayCategory = category || type || 'Attraction';
  
  // Truncate description
  const truncatedDescription = description && description.length > 120
    ? description.substring(0, 117) + '...'
    : description || 'Must-visit attraction showcasing local highlights';
  
  // Format maps URL
  const mapsLink = mapsUrl || (placeId ? `https://www.google.com/maps/place/?q=place_id:${placeId}` : null);
  
  return (
    <div className="border border-purple-200/40 rounded-lg p-3 hover:shadow-md transition-all" style={{ backgroundColor: 'rgba(46, 16, 101, 0.06)' }}>
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
              className="text-[10px] md:text-xs px-2 md:px-2.5 py-0.5 rounded-full bg-purple-600 text-white border-0 font-medium"
            >
              {displayCategory.charAt(0).toUpperCase() + displayCategory.slice(1)}
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
              href={mapsLink || '#'}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center text-xs text-purple-400 hover:text-purple-600 transition-colors font-medium whitespace-nowrap ml-2"
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