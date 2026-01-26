"use client";

import React, { useState } from 'react';
import { Star } from 'lucide-react';

interface StarRatingProps {
  rating: number;
  onRatingChange?: (rating: number) => void;
  max?: number;
  readonly?: boolean;
}

export const StarRating = ({ 
  rating, 
  onRatingChange, 
  max = 5,
  readonly = false 
}: StarRatingProps) => {
  const [hover, setHover] = useState(0);

  return (
    <div className="flex gap-1">
      {[...Array(max)].map((_, i) => {
        const starValue = i + 1;
        return (
          <button
            key={i}
            type="button"
            className={`${readonly ? 'cursor-default' : 'cursor-pointer'} transition-colors`}
            onClick={() => !readonly && onRatingChange?.(starValue)}
            onMouseEnter={() => !readonly && setHover(starValue)}
            onMouseLeave={() => !readonly && setHover(0)}
          >
            <Star
              className={`h-6 w-6 ${
                (hover || rating) >= starValue 
                  ? 'fill-yellow-400 text-yellow-400' 
                  : 'text-muted-foreground'
              }`}
            />
          </button>
        );
      })}
    </div>
  );
};
