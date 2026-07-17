"use client";


import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { FolderHeart, SlidersHorizontal, Loader2, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { api, Collection, Item } from "@/lib/api";
import ItemCard from "@/components/ItemCard";
import ItemDetailsModal from "@/components/ItemDetailsModal";

function ResultsContent() {
  const searchParams = useSearchParams();
  const initialCategory = searchParams.get("category") || "All";

  const [collections, setCollections] = useState<Collection[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [activeCategory, setActiveCategory] = useState(initialCategory);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // List of standard categories for chip selection
  const categoriesList = ["All", "Products", "Movies", "Recipes", "Skincare", "Travel", "Ideas", "Furniture"];

  const loadData = async () => {
    try {
      const data = await api.getCollections();
      setCollections(data);
      
      const allItems = data.flatMap(col => col.items)
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      setItems(allItems);
    } catch (e) {
      console.error(e);
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
    setItems(prev => prev.filter(item => item.id !== id));
  };

  // Filter items based on selected category chip
  const filteredItems = activeCategory === "All" 
    ? items
    : items.filter(item => item.category.toLowerCase() === activeCategory.toLowerCase());

  return (
    <main className="flex-grow px-4 md:px-8 py-8 max-w-4xl mx-auto space-y-6 w-full pb-32">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="space-y-1">
          <span className="text-xs font-bold text-stem tracking-wide uppercase">
            Brain Explore
          </span>
          <h2 className="text-xl md:text-2xl font-bold text-blueberry flex items-baseline gap-2 leading-tight tracking-tight">
            <span>Results</span>
            <span className="text-sm font-semibold text-stem/80">
              ({filteredItems.length} items found)
            </span>
          </h2>
        </div>

        <button className="bg-white border border-silver/60 p-2.5 rounded-full text-blueberry hover:border-blueberry/30 transition-colors shadow-sm flex items-center justify-center cursor-pointer">
          <SlidersHorizontal className="w-4 h-4 stroke-[2.2]" />
        </button>
      </div>

      {/* Horizontal Category Chips */}
      <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-none">
        {categoriesList.map((cat) => {
          const isActive = activeCategory === cat;
          return (
            <motion.button
              key={cat}
              whileTap={{ scale: 0.96 }}
              onClick={() => setActiveCategory(cat)}
              className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all cursor-pointer border flex items-center gap-1 ${
                isActive
                  ? "bg-blueberry text-white border-blueberry shadow-sm"
                  : "bg-white text-stem hover:text-blueberry border-silver/50"
              }`}
            >
              {cat === "All" && <Sparkles className={`w-3.5 h-3.5 ${isActive ? "fill-white" : "fill-none"}`} />}
              <span>{cat}</span>
            </motion.button>
          );
        })}
      </div>

      {/* Loading state */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-3">
          <Loader2 className="w-7 h-7 text-blueberry animate-spin" />
          <span className="text-xs text-stem font-semibold italic">Browsing Collections...</span>
        </div>
      ) : (
        /* Pinterest masonry view */
        <motion.div
          layout
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="masonry-grid pt-2"
        >
          {filteredItems.map((item) => (
            <ItemCard
              key={item.id}
              item={item}
              onOpenDetails={handleOpenDetails}
            />
          ))}
        </motion.div>
      )}

      {/* Empty State */}
      {!isLoading && filteredItems.length === 0 && (
        <div className="bg-white border border-silver/50 rounded-[28px] p-12 text-center max-w-sm mx-auto space-y-3">
          <FolderHeart className="w-8 h-8 text-stem mx-auto stroke-[1.5]" />
          <h4 className="text-xs font-bold text-blueberry uppercase tracking-widest">No Items Found</h4>
          <p className="text-[10px] text-stem/80 max-w-[220px] mx-auto leading-relaxed">
            There are no saved screenshots under the category <strong>{activeCategory}</strong>.
          </p>
        </div>
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
