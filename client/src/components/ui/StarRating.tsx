import { Star } from "lucide-react";

interface StarRatingProps {
  rating: number;
  maxRating?: number;
  showScore?: boolean;
  reviewCount?: number;
  size?: "sm" | "md" | "lg";
}

export function StarRating({ 
  rating, 
  maxRating = 5, 
  showScore = true,
  reviewCount,
  size = "sm" 
}: StarRatingProps) {
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating - fullStars >= 0.25 && rating - fullStars < 0.75;
  const emptyStars = maxRating - fullStars - (hasHalfStar ? 1 : 0);
  
  const starSize = size === "sm" ? "w-4 h-4" : size === "md" ? "w-5 h-5" : "w-6 h-6";
  const textSize = size === "sm" ? "text-sm" : size === "md" ? "text-base" : "text-lg";
  
  return (
    <div className="flex items-center gap-1">
      <div className="flex items-center">
        {/* Full stars */}
        {Array.from({ length: fullStars }).map((_, i) => (
          <Star key={`full-${i}`} className={`${starSize} text-yellow-500 fill-current`} />
        ))}
        
        {/* Half star */}
        {hasHalfStar && (
          <div className="relative">
            <Star className={`${starSize} text-gray-300`} />
            <div className="absolute inset-0 overflow-hidden w-1/2">
              <Star className={`${starSize} text-yellow-500 fill-current`} />
            </div>
          </div>
        )}
        
        {/* Empty stars */}
        {Array.from({ length: Math.ceil(emptyStars) }).map((_, i) => (
          <Star key={`empty-${i}`} className={`${starSize} text-gray-300`} />
        ))}
      </div>
      
      {/* Score and review count */}
      {showScore && (
        <div className="flex items-center gap-1 ml-1">
          <span className={`font-medium text-gray-700 ${textSize}`}>
            {rating.toFixed(1)}/5
          </span>
          {reviewCount !== undefined && (
            <span className={`${textSize}`} style={{ color: '#9CA3AF' }}>
              ({reviewCount >= 1000 ? `${(reviewCount / 1000).toFixed(1)}k` : reviewCount.toLocaleString()} reviews)
            </span>
          )}
        </div>
      )}
    </div>
  );
}