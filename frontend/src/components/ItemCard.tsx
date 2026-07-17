"use client";

import Image from "next/image";
import { Sparkles, Users, MessageSquare } from "lucide-react";
import { motion } from "framer-motion";
import { Item } from "@/lib/api";

interface ItemCardProps {
  item: Item;
  onOpenDetails: (item: Item) => void;
}

export default function ItemCard({ item, onOpenDetails }: ItemCardProps) {
  // Determine card height variance based on ID hash to give a stable Pinterest masonry feel
  const getCardHeightClass = (id: string) => {
    const hash = id.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const mod = hash % 3;
    if (mod === 0) return "aspect-[3/4]";
    if (mod === 1) return "aspect-[4/5]";
    return "aspect-square";
  };

  return (
    <motion.div
      layoutId={`item-card-${item.id}`}
      whileHover={{ y: -6, scale: 1.01 }}
      onClick={() => onOpenDetails(item)}
      className="bg-white rounded-[24px] overflow-hidden border border-silver/40 shadow-[0_4px_24px_rgba(47,58,85,0.02)] hover:shadow-[0_12px_36px_rgba(47,58,85,0.06)] cursor-pointer transition-all duration-300 flex flex-col group relative"
    >
      {/* Item Image with custom height */}
      <div className={`relative w-full overflow-hidden bg-silver/20 ${getCardHeightClass(item.id)}`}>
        <img
          src={item.image_url}
          alt={item.title}
          className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
          loading="lazy"
        />
        
        {/* Category Indicator Tag */}
        <div className="absolute top-3 left-3 bg-white/80 backdrop-blur-md px-2.5 py-1 rounded-full text-[11px] font-medium text-blueberry/80 tracking-wide border border-white/50">
          {item.category}
        </div>

        {/* Duplicate/Recommendations Tag */}
        {item.recommendations_count > 1 && (
          <div className="absolute bottom-3 left-3 bg-blueberry/90 backdrop-blur-md px-2.5 py-1 rounded-full text-[10px] font-medium text-plate flex items-center gap-1 shadow-md">
            <Users className="w-3 h-3" />
            <span>{item.recommendations_count} creators</span>
          </div>
        )}
      </div>

      {/* Info details */}
      <div className="p-4 flex flex-col flex-grow">
        <div className="flex items-start justify-between gap-2">
          <div>
            {item.subtitle && (
              <span className="text-[11px] font-medium text-stem tracking-wider uppercase">
                {item.subtitle}
              </span>
            )}
            <h4 className="text-sm font-semibold text-blueberry leading-tight tracking-tight mt-0.5 group-hover:text-berry transition-colors duration-200">
              {item.title}
            </h4>
          </div>
          
          {item.price !== undefined && (
            <span className="text-xs font-semibold text-blueberry bg-puffy/40 px-2 py-0.5 rounded-md whitespace-nowrap">
              {item.currency === "INR" ? "₹" : "$"}{item.price.toLocaleString()}
            </span>
          )}
        </div>

        {/* Short Description */}
        {item.description && (
          <p className="text-[11px] text-stem/90 leading-snug line-clamp-2 mt-2">
            {item.description}
          </p>
        )}

        {/* Tags */}
        <div className="flex flex-wrap gap-1 mt-3">
          {item.tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="text-[9px] font-medium text-berry/80 bg-silver/30 px-2 py-0.5 rounded-full"
            >
              #{tag.toLowerCase()}
            </span>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
