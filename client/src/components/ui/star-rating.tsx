import React from 'react';
import { Star, StarHalf } from 'lucide-react';

interface StarRatingProps {
  rating: number;
  maxRating?: number;
  showNumber?: boolean;
  reviewCount?: number;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function StarRating({ 
  rating, 
  maxRating = 5, 
  showNumber = true,
  reviewCount,
  size = 'md',
  className = ''
}: StarRatingProps) {
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;
  const emptyStars = maxRating - fullStars - (hasHalfStar ? 1 : 0);

  const sizeClasses = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5'
  };

  const starSize = sizeClasses[size];
  
  const formatReviewCount = (count: number): string => {
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M`;
    }
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}k`;
    }
    return count.toLocaleString();
  };

  return (
    <div className={`inline-flex items-center ${className}`}>
      {/* Stars */}
      <div className="flex items-center">
        {/* Full stars */}
        {Array.from({ length: fullStars }).map((_, i) => (
          <Star 
            key={`full-${i}`} 
            className={`${starSize} fill-yellow-500 text-yellow-500`}
          />
        ))}
        
        {/* Half star */}
        {hasHalfStar && (
          <div className="relative">
            <Star className={`${starSize} text-gray-300`} />
            <div className="absolute inset-0 overflow-hidden w-1/2">
              <Star className={`${starSize} fill-yellow-500 text-yellow-500`} />
            </div>
          </div>
        )}
        
        {/* Empty stars */}
        {Array.from({ length: emptyStars }).map((_, i) => (
          <Star 
            key={`empty-${i}`} 
            className={`${starSize} text-gray-300`}
          />
        ))}
      </div>
      
      {/* Rating number */}
      {showNumber && (
        <span className="text-base font-medium text-gray-700 ml-1.5">
          {rating.toFixed(1)}/{maxRating}
        </span>
      )}
      
      {/* Review count - always visible when provided */}
      {reviewCount !== undefined && reviewCount > 0 && (
        <span className="text-xs text-gray-400 ml-2">
          ({formatReviewCount(reviewCount)} reviews)
        </span>
      )}
    </div>
  );
}