"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Archive, ChevronLeft, Loader2, RotateCcw, Trash2, InboxIcon } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabaseClient";
import { Item } from "@/lib/api";

const API_BASE = "http://localhost:8000/api";

async function getAuthHeaders(): Promise<HeadersInit> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.access_token) {
      return { Authorization: `Bearer ${session.access_token}` };
    }
  } catch (e) {
    console.warn("getAuthHeaders:", e);
  }
  return {};
}

export default function ArchivePage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth(true);
  const [items, setItems] = useState<Item[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionItem, setActionItem] = useState<string | null>(null);
  const [toast, setToast] = useState("");

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 2500);
  };

  useEffect(() => {
    if (authLoading) return;
    fetchArchive();
  }, [authLoading]);

  async function fetchArchive() {
    setIsLoading(true);
    try {
      const headers = await getAuthHeaders();
      const res = await fetch(`${API_BASE}/archive`, { headers });
      if (res.ok) {
        const data = await res.json();
        setItems(data);
      }
    } catch (e) {
      console.error("Failed to load archive:", e);
    } finally {
      setIsLoading(false);
    }
  }

  async function restoreItem(id: string) {
    setActionItem(id);
    try {
      const headers = await getAuthHeaders();
      const res = await fetch(`${API_BASE}/item/${id}/restore`, {
        method: "PATCH",
        headers,
      });
      if (res.ok) {
        setItems(prev => prev.filter(i => i.id !== id));
        showToast("Item restored to collections.");
      }
    } catch (e) {
      console.error("Restore error:", e);
    } finally {
      setActionItem(null);
    }
  }

  async function deleteItem(id: string) {
    if (!confirm("Permanently delete this item? This cannot be undone.")) return;
    setActionItem(id);
    try {
      const headers = await getAuthHeaders();
      const res = await fetch(`${API_BASE}/item/${id}`, {
        method: "DELETE",
        headers,
      });
      if (res.ok) {
        setItems(prev => prev.filter(i => i.id !== id));
        showToast("Item permanently deleted.");
      }
    } catch (e) {
      console.error("Delete error:", e);
    } finally {
      setActionItem(null);
    }
  }

  if (authLoading || isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] gap-3">
        <Loader2 className="w-8 h-8 text-blueberry animate-spin" />
        <span className="text-xs text-stem font-semibold italic">Loading Archive...</span>
      </div>
    );
  }

  return (
    <main className="flex-grow px-4 md:px-8 py-8 max-w-2xl mx-auto space-y-6 w-full pb-32">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="bg-white border border-silver/60 p-2.5 rounded-full text-blueberry hover:border-blueberry/30 transition-colors shadow-sm cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <div>
          <span className="text-xs font-bold text-stem tracking-wide uppercase">Archive</span>
          <h1 className="text-xl font-bold text-blueberry leading-tight">
            Archived Items
            <span className="ml-2 text-sm font-semibold text-stem/70">({items.length})</span>
          </h1>
        </div>
      </div>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-green-50 border border-green-100 text-green-700 px-4 py-2.5 rounded-2xl text-xs font-semibold"
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Empty State */}
      {items.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center justify-center py-20 gap-4 text-center"
        >
          <div className="w-16 h-16 bg-plate border border-silver/50 rounded-full flex items-center justify-center">
            <InboxIcon className="w-7 h-7 text-stem/50" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-blueberry mb-1">Archive is Empty</h3>
            <p className="text-xs text-stem/70 max-w-[200px] leading-relaxed">
              Items you archive from your collections will appear here.
            </p>
          </div>
        </motion.div>
      )}

      {/* Item List */}
      <div className="space-y-3">
        <AnimatePresence>
          {items.map(item => (
            <motion.div
              key={item.id}
              layout
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -20, height: 0 }}
              transition={{ duration: 0.2 }}
              className="bg-white border border-silver/50 rounded-[24px] overflow-hidden shadow-sm flex items-center gap-4 p-3"
            >
              {/* Thumbnail */}
              <div className="w-16 h-16 rounded-[16px] overflow-hidden shrink-0 bg-plate">
                <img
                  src={item.image_url}
                  alt={item.title}
                  className="w-full h-full object-cover grayscale-[30%]"
                  onError={(e) => { (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=200&auto=format&fit=crop&q=60"; }}
                />
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <span className="text-[9px] font-bold text-stem uppercase tracking-wider">{item.category}</span>
                <h3 className="text-sm font-bold text-blueberry leading-tight truncate">{item.title}</h3>
                {item.subtitle && (
                  <span className="text-[10px] text-stem/70 font-medium">{item.subtitle}</span>
                )}
                <div className="flex flex-wrap gap-1 mt-1">
                  {item.tags.slice(0, 2).map(tag => (
                    <span key={tag} className="text-[8px] font-bold bg-plate text-stem px-1.5 py-0.5 rounded-full">
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col gap-2 shrink-0">
                <button
                  onClick={() => restoreItem(item.id)}
                  disabled={actionItem === item.id}
                  className="bg-blueberry/10 hover:bg-blueberry/20 text-blueberry p-2 rounded-full transition-colors cursor-pointer disabled:opacity-50"
                  title="Restore"
                >
                  {actionItem === item.id ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <RotateCcw className="w-3.5 h-3.5" />
                  )}
                </button>
                <button
                  onClick={() => deleteItem(item.id)}
                  disabled={actionItem === item.id}
                  className="bg-red-50 hover:bg-red-100 text-red-500 p-2 rounded-full transition-colors cursor-pointer disabled:opacity-50"
                  title="Delete Permanently"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </main>
  );
}
