"use client";

import { Heart } from "lucide-react";
import { useFavoritesStore } from "@/stores/favorites-store";
import type { RoomTypeData } from "@/hooks/use-data";
import { cn } from "@/lib/utils";

interface FavoriteButtonProps {
  room: {
    slug: string;
    nameAr: string;
    nameEn: string;
    imageUrl: string;
    basePrice: number;
  };
  className?: string;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  variant?: "overlay" | "solid";
}

export function FavoriteButton({
  room,
  className,
  size = "md",
  showLabel = false,
  variant = "overlay",
}: FavoriteButtonProps) {
  const { isFavorite, toggleFavorite } = useFavoritesStore();
  const fav = isFavorite(room.slug);

  const sizeMap = {
    sm: "w-8 h-8",
    md: "w-10 h-10",
    lg: "w-12 h-12",
  };
  const iconSize = size === "sm" ? "w-4 h-4" : size === "lg" ? "w-6 h-6" : "w-5 h-5";

  return (
    <button
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggleFavorite(room);
      }}
      className={cn(
        "rounded-full flex items-center justify-center transition-all duration-300 group/fav",
        variant === "overlay" ? "glass-dark hover:bg-white/20" : "bg-card border border-border hover:border-gold/40",
        fav && "bg-rose-500/90 border-rose-500",
        sizeMap[size],
        className
      )}
      aria-label={fav ? "إزالة من المفضلة" : "إضافة إلى المفضلة"}
    >
      <Heart
        className={cn(
          iconSize,
          "transition-all duration-300",
          fav ? "text-white fill-white scale-110" : variant === "overlay" ? "text-white" : "text-muted-foreground group-hover/fav:text-gold"
        )}
      />
      {showLabel && (
        <span className="ms-1.5 text-xs font-medium">
          {fav ? "في المفضلة" : "أضف للمفضلة"}
        </span>
      )}
    </button>
  );
}

// Re-export for convenience
export type { RoomTypeData };
