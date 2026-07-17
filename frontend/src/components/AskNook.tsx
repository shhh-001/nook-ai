"use client";

import { useState } from "react";
import { Search, Sparkles, X, CornerDownLeft, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { api, Item, AskResponse } from "@/lib/api";
import ItemCard from "./ItemCard";

interface AskNookProps {
  onOpenDetails: (item: Item) => void;
  onSearchResults?: (items: Item[] | null) => void;
}

export default function AskNook({ onOpenDetails, onSearchResults }: AskNookProps) {
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [response, setResponse] = useState<AskResponse | null>(null);

  const samplePrompts = [
    "Find the white sneakers I saved last month.",
    "Show me restaurants in Bangalore.",
    "Skincare products under ₹1000.",
    "Movies recommended by more than two creators."
  ];

  const handleSearch = async (text: string) => {
    if (!text.trim()) return;
    setQuery(text);
    setIsLoading(true);
    try {
      const data = await api.askNook(text);
      setResponse(data);
      if (onSearchResults) {
        onSearchResults(data.matched_items);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClear = () => {
    setQuery("");
    setResponse(null);
    if (onSearchResults) {
      onSearchResults(null);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto space-y-4">
      {/* AI Query Box */}
      <div className="relative bg-white rounded-[24px] border border-silver/60 shadow-[0_4px_30px_rgba(47,58,85,0.03)] focus-within:shadow-[0_12px_40px_rgba(47,58,85,0.06)] focus-within:border-blueberry/30 transition-all duration-300 px-5 py-3.5 flex items-center gap-3">
        <Search className="w-5 h-5 text-stem stroke-[2.2]" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch(query)}
          placeholder="Ask Nook anything about your screenshots..."
          className="flex-grow bg-transparent border-none outline-none text-blueberry placeholder:text-stem/70 text-sm font-medium"
        />
        
        <AnimatePresence>
          {query && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              onClick={handleClear}
              className="text-stem hover:text-blueberry cursor-pointer"
            >
              <X className="w-4 h-4" />
            </motion.button>
          )}
        </AnimatePresence>

        <button
          onClick={() => handleSearch(query)}
          disabled={isLoading || !query.trim()}
          className="bg-blueberry text-white px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 cursor-pointer disabled:opacity-40"
        >
          {isLoading ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Sparkles className="w-3.5 h-3.5" />
          )}
          <span>Ask</span>
        </button>
      </div>

      {/* Suggestion Chips */}
      {!response && !isLoading && (
        <div className="flex flex-wrap gap-2 justify-center px-2">
          {samplePrompts.map((prompt) => (
            <motion.button
              key={prompt}
              whileHover={{ y: -2, backgroundColor: "#E7E8E4" }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleSearch(prompt)}
              className="text-[11px] font-medium text-berry bg-silver/40 border border-silver/20 px-3.5 py-1.5 rounded-full cursor-pointer transition-colors duration-200"
            >
              {prompt}
            </motion.button>
          ))}
        </div>
      )}

      {/* AI Dialogue Response */}
      <AnimatePresence>
        {isLoading && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-white/50 border border-silver/50 rounded-[24px] p-6 flex items-center justify-center gap-3 shadow-inner"
          >
            <Loader2 className="w-5 h-5 text-blueberry animate-spin" />
            <span className="text-xs font-medium text-blueberry/80 italic">
              Nook is searching, thinking, and connecting dots...
            </span>
          </motion.div>
        )}

        {response && !isLoading && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="bg-blueberry/5 border border-puffy/30 rounded-[28px] p-6 space-y-4 shadow-[0_8px_32px_rgba(47,58,85,0.03)]"
          >
            <div className="flex items-start gap-3">
              <div className="bg-blueberry text-white p-2 rounded-2xl shadow-md">
                <Sparkles className="w-4 h-4 fill-white" />
              </div>
              <div className="space-y-1">
                <span className="text-[11px] font-bold text-blueberry/60 uppercase tracking-widest">
                  Nook AI Response
                </span>
                <p className="text-sm font-medium text-blueberry leading-relaxed">
                  {response.answer}
                </p>
              </div>
            </div>

            {/* Results Grid inside Response */}
            {response.matched_items.length > 0 && (
              <div className="grid grid-cols-2 gap-3 pt-2 max-h-[360px] overflow-y-auto pr-1">
                {response.matched_items.map((item) => (
                  <ItemCard
                    key={item.id}
                    item={item}
                    onOpenDetails={onOpenDetails}
                  />
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
