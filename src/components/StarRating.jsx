import { useState } from "react";
import { Star } from "lucide-react";

const StarRating = ({ rating, onRate, disabled = false }) => {
  const [hover, setHover] = useState(0);

  return (
    <div
      className="flex items-center gap-1"
      onClick={(e) => e.stopPropagation()}
    >
      {[1, 2, 3, 4, 5].map((star) => {
        const isActive = star <= (hover || rating);

        return (
          <button
            key={star}
            type="button"
            disabled={disabled}
            className={`transition-all duration-200 focus:outline-none transform ${
              isActive
                ? "text-yellow-400 scale-110"
                : "text-gray-300 dark:text-gray-600 hover:scale-110"
            } ${disabled ? "cursor-default" : "cursor-pointer"}`}
            onMouseEnter={() => !disabled && setHover(star)}
            onMouseLeave={() => !disabled && setHover(0)}
            onClick={() => !disabled && onRate(star)}
          >
            <Star
              size={18}
              fill={isActive ? "currentColor" : "none"}
              strokeWidth={isActive ? 0 : 2}
            />
          </button>
        );
      })}
    </div>
  );
};

export default StarRating;
