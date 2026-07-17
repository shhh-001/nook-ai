"use client";

import { useEffect, useState } from "react";
import { FolderOpen, Sparkles, ShoppingBag, Film, Utensils, MapPin, Lightbulb, Book, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { api, Collection, Item } from "@/lib/api";
import AskNook from "@/components/AskNook";
import ItemCard from "@/components/ItemCard";
import ItemDetailsModal from "@/components/ItemDetailsModal";

export default function HomePage() {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [filteredItems, setFilteredItems] = useState<Item[] | null>(null);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Time-based greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  const loadData = async () => {
    try {
      const data = await api.getCollections();
      setCollections(data);
      
      // Flatten all items from collections to get recent feed
      const allItems = data.flatMap(col => col.items)
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      setItems(allItems);
    } catch (e) {
      console.error("Failed to load home data", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenDetails = (item: Item) => {
    setSelectedItem(item);
  };

  const handleCloseDetails = () => {
    setSelectedItem(null);
  };

  const handleItemDeleted = (id: string) => {
    // Remove item from local states to refresh immediately
    setItems(prev => prev.filter(item => item.id !== id));
    if (filteredItems) {
      setFilteredItems(prev => prev ? prev.filter(item => item.id !== id) : null);
    }
    setCollections(prev => prev.map(col => ({
      ...col,
      items: col.items.filter(item => item.id !== id),
      items_count: col.items.filter(item => item.id !== id).length
    })));
  };

  const handleSearchResults = (results: Item[] | null) => {
    setFilteredItems(results);
  };

  // Map collection icons to Lucide components
  const getCollectionIcon = (iconName: string) => {
    switch (iconName) {
      case "ShoppingBag": return ShoppingBag;
      case "Film": return Film;
      case "Utensils": return Utensils;
      case "MapPin": return MapPin;
      case "Lightbulb": return Lightbulb;
      default: return Book;
    }
  };

  return (
    <main className="flex-grow px-4 md:px-8 py-8 max-w-4xl mx-auto space-y-8 w-full">
      {/* Top Welcome Bar */}
      <div className="flex justify-between items-center">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="space-y-1"
        >
          <span className="text-xs font-bold text-stem tracking-wide uppercase">
            Your Second Brain
          </span>
          <h2 className="text-xl md:text-2xl font-bold text-blueberry flex items-center gap-1.5 leading-tight tracking-tight">
            <span>{getGreeting()}, Aayisha</span>
            <span className="animate-pulse">✨</span>
          </h2>
        </motion.div>
        
        {/* Profile Avatar */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-10 h-10 rounded-full overflow-hidden border-2 border-silver shadow-sm cursor-pointer hover:border-blueberry/30 transition-colors"
        >
          <img
            src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80"
            alt="User avatar"
            className="w-full h-full object-cover"
          />
        </motion.div>
      </div>

      {/* Ask Nook Query Component */}
      <AskNook
        onOpenDetails={handleOpenDetails}
        onSearchResults={handleSearchResults}
      />

      {/* Loading State */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Loader2 className="w-8 h-8 text-blueberry animate-spin" />
          <span className="text-xs text-stem font-semibold italic">Reading screenshot brain...</span>
        </div>
      ) : (
        <>
          {/* Quick Collection Shortcuts (Show only when not displaying search query results) */}
          {!filteredItems && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="space-y-3"
            >
              <div className="flex justify-between items-center px-1">
                <h3 className="text-xs font-bold text-stem uppercase tracking-widest">Collections</h3>
                <span className="text-[10px] font-semibold text-berry hover:text-blueberry cursor-pointer">View all</span>
              </div>
              
              {/* Horizontal Scroll Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {collections.slice(0, 6).map((col, idx) => {
                  const Icon = getCollectionIcon(col.icon);
                  return (
                    <motion.div
                      key={col.id}
                      whileHover={{ y: -3, scale: 1.01 }}
                      whileTap={{ scale: 0.98 }}
                      className="rounded-[20px] p-4 flex flex-col justify-between h-28 cursor-pointer shadow-[0_4px_20px_rgba(47,58,85,0.01)] border border-silver/40 transition-all duration-300"
                      style={{ backgroundColor: col.color }}
                    >
                      <div className="w-8 h-8 bg-white/60 rounded-xl flex items-center justify-center border border-white/40">
                        <Icon className="w-4 h-4 text-blueberry stroke-[2.2]" />
                      </div>
                      <div className="text-left space-y-0.5">
                        <h4 className="text-xs font-bold text-blueberry tracking-tight leading-none">
                          {col.name}
                        </h4>
                        <span className="text-[10px] font-bold text-blueberry/50 leading-none">
                          {col.items_count} items
                        </span>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* Pinterest Masonry Feed of Recent Uploads */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-4"
          >
            <div className="flex justify-between items-center px-1">
              <h3 className="text-xs font-bold text-stem uppercase tracking-widest">
                {filteredItems ? "Search Results" : "Recent Uploads"}
              </h3>
              {!filteredItems && (
                <span className="text-[10px] font-bold text-stem/80">
                  {items.length} screenshots saved
                </span>
              )}
            </div>

            {/* Asymmetrical Grid */}
            <div className="masonry-grid">
              {(filteredItems || items).map((item) => (
                <ItemCard
                  key={item.id}
                  item={item}
                  onOpenDetails={handleOpenDetails}
                />
              ))}
            </div>

            {(filteredItems || items).length === 0 && (
              <div className="bg-white/80 border border-silver/50 rounded-[24px] p-10 text-center space-y-2">
                <FolderOpen className="w-8 h-8 text-stem mx-auto stroke-[1.5]" />
                <h4 className="text-xs font-bold text-blueberry">Nothing saved here yet</h4>
                <p className="text-[10px] text-stem max-w-[200px] mx-auto leading-relaxed">
                  Go to the Upload page to process your first set of screenshots.
                </p>
              </div>
            )}
          </motion.div>
        </>
      )}

      {/* Details drawer/overlay modal */}
      <ItemDetailsModal
        item={selectedItem}
        onClose={handleCloseDetails}
        onDeleted={handleItemDeleted}
      />
    </main>
  );
}
