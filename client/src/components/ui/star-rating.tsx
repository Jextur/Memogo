import React from 'react';
import { Star, StarHalf } from 'lucide-react';

interface StarRatingProps {
  rating: number;
  maxRating?: number;
  showNumber?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function StarRating({ 
  rating, 
  maxRating = 5, 
  showNumber = true,
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

  return (
    <div className={`flex items-center ${className}`}>
      <div className="flex items-center mr-1">
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
      
      {showNumber && (
        <span className="text-sm font-medium text-gray-700">
          {rating.toFixed(1)} / {maxRating}
        </span>
      )}
    </div>
  );
}