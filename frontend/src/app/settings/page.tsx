"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Moon, Sun, Monitor, ChevronLeft, LogOut, Loader2, Check, Bell, Shield, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabaseClient";

type Theme = "light" | "dark" | "system";

export default function SettingsPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth(true);
  const [theme, setTheme] = useState<Theme>("system");
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [savedMsg, setSavedMsg] = useState("");

  // Load theme preference from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("nook-theme") as Theme | null;
    if (saved) {
      setTheme(saved);
      applyTheme(saved);
    }
  }, []);

  function applyTheme(t: Theme) {
    const root = document.documentElement;
    if (t === "dark") {
      root.classList.add("dark");
    } else if (t === "light") {
      root.classList.remove("dark");
    } else {
      // system
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      if (prefersDark) {
        root.classList.add("dark");
      } else {
        root.classList.remove("dark");
      }
    }
  }

  const handleThemeChange = (newTheme: Theme) => {
    setTheme(newTheme);
    localStorage.setItem("nook-theme", newTheme);
    applyTheme(newTheme);
    setSavedMsg("Theme saved!");
    setTimeout(() => setSavedMsg(""), 2000);
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await supabase.auth.signOut();
      router.push("/login");
    } catch (e) {
      console.error("Logout error:", e);
      setIsLoggingOut(false);
    }
  };

  if (authLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] gap-3">
        <Loader2 className="w-8 h-8 text-blueberry animate-spin" />
        <span className="text-xs text-stem font-semibold italic">Loading Settings...</span>
      </div>
    );
  }

  const themeOptions: { label: string; value: Theme; icon: React.FC<{ className?: string }> }[] = [
    { label: "Light",  value: "light",  icon: Sun },
    { label: "Dark",   value: "dark",   icon: Moon },
    { label: "System", value: "system", icon: Monitor },
  ];

  return (
    <main className="flex-grow px-4 md:px-8 py-8 max-w-lg mx-auto space-y-8 w-full pb-32">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="bg-white border border-silver/60 p-2.5 rounded-full text-blueberry hover:border-blueberry/30 transition-colors shadow-sm cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <div>
          <span className="text-xs font-bold text-stem tracking-wide uppercase">Account</span>
          <h1 className="text-xl font-bold text-blueberry leading-tight">Settings</h1>
        </div>
      </div>

      {/* Saved toast */}
      <AnimatePresence>
        {savedMsg && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-green-50 border border-green-100 text-green-700 px-4 py-2.5 rounded-2xl text-xs font-semibold flex items-center gap-2"
          >
            <Check className="w-3.5 h-3.5" />
            {savedMsg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Account Info */}
      <div className="bg-white border border-silver/50 rounded-[28px] overflow-hidden shadow-sm">
        <div className="px-5 py-4 border-b border-silver/30">
          <span className="text-[10px] font-bold text-stem uppercase tracking-widest">Account</span>
        </div>
        <div className="px-5 py-4">
          <span className="text-[10px] font-bold text-stem uppercase block tracking-wider mb-1">Email</span>
          <span className="text-sm font-semibold text-blueberry">{user?.email || "Not signed in"}</span>
        </div>
        <div className="px-5 py-4 border-t border-silver/30">
          <span className="text-[10px] font-bold text-stem uppercase block tracking-wider mb-1">User ID</span>
          <span className="text-xs font-mono text-stem/80 break-all">{user?.id || "—"}</span>
        </div>
      </div>

      {/* Appearance */}
      <div className="space-y-3">
        <h2 className="text-xs font-bold text-stem uppercase tracking-widest px-1">Appearance</h2>
        <div className="bg-white border border-silver/50 rounded-[28px] p-5 shadow-sm space-y-4">
          <p className="text-[11px] text-stem/80 font-medium leading-relaxed">
            Choose how Nook AI looks on your device. Dark mode is easier on the eyes at night.
          </p>
          <div className="grid grid-cols-3 gap-2">
            {themeOptions.map(({ label, value, icon: Icon }) => {
              const isActive = theme === value;
              return (
                <motion.button
                  key={value}
                  whileTap={{ scale: 0.96 }}
                  onClick={() => handleThemeChange(value)}
                  className={`relative p-4 rounded-[20px] flex flex-col items-center gap-2 cursor-pointer border transition-all duration-200 ${
                    isActive
                      ? "bg-blueberry text-white border-blueberry shadow-md"
                      : "bg-plate border-silver/60 text-stem hover:border-blueberry/30"
                  }`}
                >
                  <Icon className={`w-5 h-5 ${isActive ? "text-white" : "text-blueberry"}`} />
                  <span className={`text-[10px] font-bold uppercase tracking-wide ${isActive ? "text-white" : "text-blueberry"}`}>
                    {label}
                  </span>
                  {isActive && (
                    <div className="absolute top-1.5 right-1.5 w-4 h-4 bg-white/20 rounded-full flex items-center justify-center">
                      <Check className="w-2.5 h-2.5 text-white" />
                    </div>
                  )}
                </motion.button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Privacy */}
      <div className="space-y-3">
        <h2 className="text-xs font-bold text-stem uppercase tracking-widest px-1">Privacy</h2>
        <div className="bg-white border border-silver/50 rounded-[28px] overflow-hidden shadow-sm">
          <div className="px-5 py-4 flex items-start gap-3">
            <Shield className="w-4 h-4 text-blueberry mt-0.5 shrink-0" />
            <div>
              <span className="text-xs font-bold text-blueberry block mb-0.5">Your data is private</span>
              <span className="text-[10px] text-stem/80 font-medium leading-relaxed">
                Nook AI is not social media. Your screenshots, collections, and searches are completely private and only visible to you.
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="space-y-3">
        <h2 className="text-xs font-bold text-stem uppercase tracking-widest px-1">Account Actions</h2>
        <div className="bg-white border border-silver/50 rounded-[28px] overflow-hidden shadow-sm">
          <motion.button
            whileTap={{ scale: 0.99 }}
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="w-full flex items-center gap-3 px-5 py-4 hover:bg-red-50 transition-colors text-left"
          >
            {isLoggingOut ? (
              <Loader2 className="w-4 h-4 text-red-500 animate-spin shrink-0" />
            ) : (
              <LogOut className="w-4 h-4 text-red-500 shrink-0" />
            )}
            <span className="text-xs font-bold text-red-500">
              {isLoggingOut ? "Signing out..." : "Sign Out"}
            </span>
          </motion.button>
        </div>
      </div>

      {/* App Info */}
      <div className="text-center space-y-1 pt-4">
        <span className="text-[10px] font-bold text-stem uppercase tracking-widest block">Nook AI</span>
        <span className="text-[10px] text-stem/60 font-medium block">Your AI Second Brain · v1.0.0</span>
        <span className="text-[10px] text-stem/40 font-medium block">
          Powered by Groq + Tesseract OCR
        </span>
      </div>
    </main>
  );
}
