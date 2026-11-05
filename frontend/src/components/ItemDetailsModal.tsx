"use client";

import { useState } from "react";
import { X, ExternalLink, Calendar, Users, Eye, Trash2, Heart, CheckSquare, Square, Film, Award, Clock, Archive, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Item, api } from "@/lib/api";

interface ItemDetailsModalProps {
  item: Item | null;
  onClose: () => void;
  onDeleted?: (id: string) => void;
}

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function ItemDetailsModal({ item, onClose, onDeleted }: ItemDetailsModalProps) {
  const [showOcr, setShowOcr] = useState(false);
  const [checkedIngredients, setCheckedIngredients] = useState<Record<string, boolean>>({});
  const [isDeleting, setIsDeleting] = useState(false);
  const [isArchiving, setIsArchiving] = useState(false);

  if (!item) return null;

  const toggleIngredient = (ing: string) => {
    setCheckedIngredients(prev => ({
      ...prev,
      [ing]: !prev[ing]
    }));
  };

  const handleDelete = async () => {
    if (confirm("Permanently delete this item? This cannot be undone.")) {
      setIsDeleting(true);
      const success = await api.deleteItem(item.id);
      if (success) {
        if (onDeleted) onDeleted(item.id);
        onClose();
      }
      setIsDeleting(false);
    }
  };

  const handleArchive = async () => {
    if (confirm("Move this item to Archive? You can restore it later.")) {
      setIsArchiving(true);
      const success = await api.archiveItem(item.id);
      if (success) {
        if (onDeleted) onDeleted(item.id);
        onClose();
      }
      setIsArchiving(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop Blur */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-blueberry/30 backdrop-blur-md"
        />

        {/* Content Container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: "spring", stiffness: 300, damping: 26 }}
          className="bg-white rounded-[32px] w-full max-w-2xl overflow-hidden shadow-[0_24px_80px_rgba(47,58,85,0.15)] border border-silver/50 z-10 flex flex-col md:flex-row max-h-[85vh]"
        >
          {/* Close button for mobile */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-20 bg-white/80 backdrop-blur-md p-2 rounded-full border border-silver/40 text-blueberry hover:bg-white shadow-sm cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Left Side: Product Image & Source Screenshots */}
          <div className="w-full md:w-[45%] bg-silver/10 flex flex-col relative border-r border-silver/30 min-h-[300px] md:min-h-0">
            <img
              src={
                item.image_url?.startsWith("http")
                  ? item.image_url
                  : `${API_BASE_URL}${item.image_url}`
             }
            alt={item.title}
            className="w-full h-full object-cover flex-grow max-h-[40vh] md:max-h-none"
          />
            
            {/* Source Screenshots Section */}
            {item.source_screenshots && item.source_screenshots.length > 0 && (
              <div className="p-4 bg-white/70 backdrop-blur-md border-t border-silver/20">
                <span className="text-[10px] font-bold text-blueberry/50 uppercase tracking-widest block mb-2">
                  Source Screenshots ({item.source_screenshots.length})
                </span>
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {item.source_screenshots.map((ss, idx) => (
                    <div
                      key={ss.id || idx}
                      className="w-12 h-16 bg-silver/40 rounded-lg overflow-hidden border border-silver/50 shrink-0 relative group"
                    >
                      {ss.image_url ? (
                        <img
                          src={
                            ss.image_url?.startsWith("http")
                              ? ss.image_url
                            : `${API_BASE_URL}${ss.image_url}`
                          }
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-blueberry/10 flex items-center justify-center text-[10px] text-blueberry/60 font-semibold">
                          #{idx + 1}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Side: Scrollable Details */}
          <div className="w-full md:w-[55%] p-6 md:p-8 overflow-y-auto flex flex-col justify-between">
            <div className="space-y-5">
              {/* Category & Date */}
              <div className="flex items-center justify-between text-[10px] font-bold tracking-wider text-stem uppercase">
                <span>{item.category}</span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  {new Date(item.created_at).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                </span>
              </div>

              {/* Title & Brand */}
              <div>
                {item.subtitle && (
                  <span className="text-xs font-semibold text-berry uppercase tracking-wide">
                    {item.subtitle}
                  </span>
                )}
                <h2 className="text-xl md:text-2xl font-bold text-blueberry leading-tight tracking-tight mt-1">
                  {item.title}
                </h2>
              </div>

              {/* Smart creator references */}
              {item.recommendations_count > 1 && (
                <div className="bg-blueberry/5 border border-puffy/30 px-3 py-2.5 rounded-2xl text-xs text-blueberry/90 font-medium flex items-center gap-2">
                  <Users className="w-4 h-4 text-blueberry" />
                  <span>
                    Recommended by <strong>{item.recommendations_count} creators</strong> including {item.creators.slice(0, 2).join(", ")}.
                  </span>
                </div>
              )}

              {/* Description */}
              {item.description && (
                <p className="text-xs text-stem/90 leading-relaxed font-medium">
                  {item.description}
                </p>
              )}

              {/* CATEGORY SPECIFIC CONTENT */}

              {/* 1. Products & Skincare */}
              {(item.category === "Products" || item.category === "Skincare" || item.category === "Furniture") && (
                <div className="border-t border-silver/40 pt-4 space-y-3">
                  {item.price !== undefined && (
                    <div className="flex items-baseline gap-2">
                      <span className="text-[10px] font-bold text-stem uppercase tracking-wider block">Price</span>
                      <span className="text-lg font-bold text-blueberry">
                        {item.currency === "INR" ? "₹" : "$"}{item.price.toLocaleString()}
                      </span>
                    </div>
                  )}
                  {item.metadata.buy_link && (
                    <a
                      href={item.metadata.buy_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 bg-blueberry text-white px-4 py-2 rounded-full text-xs font-bold shadow-md hover:bg-berry cursor-pointer transition-colors duration-200"
                    >
                      <span>Buy Now</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>
              )}

              {/* 2. Movies & TV Shows */}
              {item.category === "Movies" && (
                <div className="border-t border-silver/40 pt-4 space-y-4">
                  {item.rating && (
                    <div className="flex items-center gap-1.5">
                      <Award className="w-4 h-4 text-amber-500 fill-amber-500" />
                      <span className="text-xs font-bold text-blueberry">IMDb Rating: {item.rating}/10</span>
                    </div>
                  )}
                  
                  {item.metadata.streaming_platforms && (
                    <div className="space-y-1.5">
                      <span className="text-[10px] font-bold text-stem uppercase tracking-wider block">Available to Stream</span>
                      <div className="flex flex-wrap gap-1.5">
                        {item.metadata.streaming_platforms.map((platform: string) => (
                          <span
                            key={platform}
                            className="bg-silver/40 text-blueberry/80 px-2.5 py-1 rounded-md text-[10px] font-bold border border-silver/30"
                          >
                            {platform}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* 3. Recipes */}
              {item.category === "Recipes" && (
                <div className="border-t border-silver/40 pt-4 space-y-4">
                  {item.cooking_time && (
                    <div className="flex items-center gap-1.5 text-xs font-bold text-blueberry">
                      <Clock className="w-4 h-4 text-berry" />
                      <span>Cooking Time: {item.cooking_time}</span>
                    </div>
                  )}

                  {item.ingredients && item.ingredients.length > 0 && (
                    <div className="space-y-2">
                      <span className="text-[10px] font-bold text-stem uppercase tracking-wider block">Ingredients Check-off</span>
                      <div className="space-y-1.5">
                        {item.ingredients.map((ing) => {
                          const isChecked = !!checkedIngredients[ing];
                          return (
                            <button
                              key={ing}
                              onClick={() => toggleIngredient(ing)}
                              className="flex items-center gap-2 w-full text-left text-xs text-blueberry font-medium hover:text-berry transition-colors duration-150 cursor-pointer"
                            >
                              {isChecked ? (
                                <CheckSquare className="w-4 h-4 text-berry shrink-0" />
                              ) : (
                                <Square className="w-4 h-4 text-stem shrink-0" />
                              )}
                              <span className={isChecked ? "line-through text-stem/70" : ""}>{ing}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Collapsible raw OCR data */}
              <div className="border-t border-silver/40 pt-4">
                <button
                  onClick={() => setShowOcr(!showOcr)}
                  className="flex items-center gap-1 text-[10px] font-bold text-stem hover:text-blueberry tracking-widest uppercase cursor-pointer"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>{showOcr ? "Hide raw OCR" : "View raw OCR"}</span>
                </button>
                <AnimatePresence>
                  {showOcr && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden mt-2"
                    >
                      <pre className="bg-plate border border-silver/50 rounded-xl p-3 text-[9px] text-berry/80 font-mono whitespace-pre-wrap max-h-24 overflow-y-auto">
                        {item.ocr_text || "No OCR text extracted."}
                      </pre>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Bottom Actions: Archive, Delete, Close */}
            <div className="flex items-center justify-between border-t border-silver/40 pt-6 mt-8">
              <div className="flex items-center gap-3">
                <button
                  onClick={handleArchive}
                  disabled={isArchiving || isDeleting}
                  className="text-stem hover:text-blueberry flex items-center gap-1 text-xs font-bold disabled:opacity-40 cursor-pointer"
                >
                  {isArchiving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Archive className="w-4 h-4" />}
                  <span>Archive</span>
                </button>
                <button
                  onClick={handleDelete}
                  disabled={isDeleting || isArchiving}
                  className="text-red-500 hover:text-red-600 flex items-center gap-1 text-xs font-bold disabled:opacity-40 cursor-pointer"
                >
                  {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                  <span>Delete</span>
                </button>
              </div>
              <button
                onClick={onClose}
                className="bg-silver text-blueberry px-5 py-2 rounded-full text-xs font-bold hover:bg-silver/80 cursor-pointer transition-colors duration-200"
              >
                Close
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
