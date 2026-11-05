"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  FolderHeart, Archive, Settings, FileSpreadsheet, FileText,
  Download, ChevronRight, Loader2, Sparkles, LogOut, User
} from "lucide-react";
import { motion } from "framer-motion";
import { api, ProfileResponse } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabaseClient";

export default function ProfilePage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth(true);
  const [profile, setProfile] = useState<ProfileResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState<string | null>(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    if (authLoading) return; // wait for auth before fetching profile
    const loadProfile = async () => {
      try {
        const data = await api.getProfile();
        setProfile(data);
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    };
    loadProfile();
  }, [authLoading]);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await supabase.auth.signOut();
      router.push("/login");
    } catch (e) {
      console.error("Logout error:", e);
    } finally {
      setIsLoggingOut(false);
    }
  };

  // Functional CSV Export
  const handleExportCSV = async () => {
    if (!profile) return;
    setIsExporting("csv");
    await new Promise(resolve => setTimeout(resolve, 500));
    try {
      const collections = await api.getCollections();
      const allItems = collections.flatMap(c => c.items);

      let csv = "ID,Category,Title,Subtitle,Description,Price,Currency,Tags,OCR Text,Image URL,Created At\n";
      allItems.forEach(item => {
        const row = [
          item.id,
          `"${item.category}"`,
          `"${item.title.replace(/"/g, '""')}"`,
          `"${(item.subtitle || "").replace(/"/g, '""')}"`,
          `"${(item.description || "").replace(/"/g, '""')}"`,
          item.price || "",
          item.currency || "",
          `"${item.tags.join(", ")}"`,
          `"${(item.ocr_text || "").replace(/"/g, '""')}"`,
          `"${item.image_url}"`,
          item.created_at,
        ].join(",");
        csv += row + "\n";
      });

      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", "nook_ai_export.csv");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error(e);
    } finally {
      setIsExporting(null);
    }
  };

  // Functional Markdown Export
  const handleExportMarkdown = async () => {
    if (!profile) return;
    setIsExporting("md");
    await new Promise(resolve => setTimeout(resolve, 500));
    try {
      const collections = await api.getCollections();
      let md = `# Nook AI – Screenshot Brain Export\n`;
      md += `*Generated ${new Date().toLocaleDateString()} for ${profile.name} (${profile.handle})*\n\n`;
      md += `## Insights\n`;
      md += `- **Top Category**: ${profile.insights.top_category}\n`;
      md += `- **Theme**: ${profile.insights.recurring_theme}\n`;
      md += `- **Total Saved**: ${profile.stats["Saved"]}\n\n`;

      collections.forEach(col => {
        md += `## ${col.name} (${col.items_count} items)\n\n`;
        col.items.forEach(item => {
          md += `### ${item.title}\n`;
          if (item.subtitle) md += `*${item.subtitle}*\n\n`;
          if (item.description) md += `> ${item.description}\n\n`;
          md += `- **Category**: ${item.category}\n`;
          if (item.price) md += `- **Price**: ₹${item.price}\n`;
          if (item.rating) md += `- **Rating**: ${item.rating}/10\n`;
          md += `- **Tags**: ${item.tags.map(t => `#${t}`).join(" ")}\n`;
          if (item.ocr_text) md += `\n**OCR Text**:\n\`\`\`\n${item.ocr_text}\n\`\`\`\n`;
          md += `\n---\n\n`;
        });
      });

      const blob = new Blob([md], { type: "text/markdown;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", "nook_ai_brain_export.md");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error(e);
    } finally {
      setIsExporting(null);
    }
  };

  const handleExportPDF = async () => {
    setIsExporting("pdf");
    await new Promise(resolve => setTimeout(resolve, 800));
    window.print();
    setIsExporting(null);
  };

  if (authLoading || isLoading || !profile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] gap-3">
        <Loader2 className="w-8 h-8 text-blueberry animate-spin" />
        <span className="text-xs text-stem font-semibold italic">Opening Vault...</span>
      </div>
    );
  }

  // Profile nav links — no social elements
  const links = [
    { name: "Collections", icon: FolderHeart, href: "/results" },
    { name: "Archive", icon: Archive, href: "/archive" },
    { name: "Settings", icon: Settings, href: "/settings" },
  ];

  // Get user initial from email
  const userInitial = (user?.email?.[0] || profile.name[0] || "N").toUpperCase();

  return (
    <main className="flex-grow px-4 md:px-8 py-8 max-w-lg mx-auto space-y-8 w-full pb-32">
      {/* Profile Header */}
      <div className="flex flex-col items-center text-center space-y-4 pt-4 relative">
        {/* Settings shortcut */}
        <button
          onClick={() => router.push("/settings")}
          className="absolute top-0 right-0 bg-white border border-silver/60 p-2.5 rounded-full text-blueberry hover:border-blueberry/30 transition-colors shadow-sm flex items-center justify-center cursor-pointer"
          title="Settings"
        >
          <Settings className="w-4 h-4" />
        </button>

        {/* Avatar — initials fallback */}
        <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-silver shadow-md bg-blueberry flex items-center justify-center">
          {profile.avatar_url ? (
            <img
              src={profile.avatar_url}
              alt={profile.name}
              className="w-full h-full object-cover"
              onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
            />
          ) : (
            <span className="text-2xl font-bold text-white">{userInitial}</span>
          )}
        </div>

        {/* Name / handle from real auth */}
        <div className="space-y-1">
          <h2 className="text-xl font-bold text-blueberry tracking-tight leading-none">
            {profile.name}
          </h2>
          <span className="text-xs font-semibold text-stem">
            {user?.email || profile.handle}
          </span>
        </div>

        {/* Stats — Saved + Collections only (no social) */}
        <div className="flex gap-8 justify-center pt-2">
          {Object.entries(profile.stats).map(([label, val]) => (
            <div key={label} className="text-center">
              <span className="text-lg font-bold text-blueberry block">{val}</span>
              <span className="text-[10px] font-bold text-stem uppercase tracking-wider">{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Nook Insights Card */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-blueberry text-plate rounded-[32px] p-6 space-y-5 shadow-xl relative overflow-hidden"
      >
        <div className="absolute -right-4 -bottom-4 opacity-15 text-white scale-[2.5]">
          <Sparkles className="w-20 h-20 fill-white" />
        </div>

        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-puffy fill-puffy" />
            <h3 className="text-xs font-bold uppercase tracking-widest text-puffy">Nook Insights</h3>
          </div>
          <span className="text-[10px] font-bold text-white/50 uppercase">This Month</span>
        </div>

        <p className="text-[11px] text-plate/90 leading-relaxed font-medium">
          {profile.insights.summary}
        </p>

        <div className="grid grid-cols-2 gap-2 pt-2 text-center border-t border-white/10">
          <div>
            <span className="text-[9px] font-bold text-white/50 uppercase block tracking-wider">Top Category</span>
            <span className="text-xs font-bold text-plate mt-0.5 block">{profile.insights.top_category}</span>
          </div>
          <div>
            <span className="text-[9px] font-bold text-white/50 uppercase block tracking-wider">Theme</span>
            <span className="text-xs font-bold text-plate mt-0.5 block">{profile.insights.recurring_theme}</span>
          </div>
        </div>

        {/* Animated Trend Graph */}
        <div className="pt-2">
          <span className="text-[9px] font-bold text-white/50 uppercase block tracking-wider mb-2">Upload Trend</span>
          <svg className="w-full h-14" viewBox="0 0 300 60">
            <line x1="0" y1="20" x2="300" y2="20" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
            <line x1="0" y1="40" x2="300" y2="40" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
            <motion.path
              d="M 10 50 Q 58 42, 106 35 T 202 20 T 290 10"
              fill="none" stroke="#D3DFF2" strokeWidth="2.5"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 1.5, ease: "easeInOut" }}
            />
            <circle cx="290" cy="10" r="3" fill="#D3DFF2" />
          </svg>
          <div className="flex justify-between text-[8px] text-white/40 uppercase font-bold px-1">
            {profile.insights.monthly_trend.map(t => <span key={t.month}>{t.month}</span>)}
          </div>
        </div>
      </motion.div>

      {/* Nav Links */}
      <div className="bg-white border border-silver/50 rounded-[28px] overflow-hidden shadow-sm">
        {links.map((link, idx) => (
          <a
            key={link.name}
            href={link.href}
            className={`flex items-center justify-between px-5 py-4 hover:bg-plate/40 transition-colors ${
              idx !== links.length - 1 ? "border-b border-silver/30" : ""
            }`}
          >
            <div className="flex items-center gap-3">
              <link.icon className="w-4 h-4 text-blueberry stroke-[2]" />
              <span className="text-xs font-bold text-blueberry">{link.name}</span>
            </div>
            <ChevronRight className="w-4 h-4 text-stem" />
          </a>
        ))}
      </div>

      {/* Export Section */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold text-stem uppercase tracking-widest px-1">Export Screenshot Brain</h3>
        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={handleExportCSV}
            disabled={isExporting !== null}
            className="bg-white border border-silver/50 hover:border-blueberry/30 p-4 rounded-[20px] flex flex-col items-center justify-center gap-1.5 cursor-pointer shadow-sm hover:shadow-md transition-all duration-300 disabled:opacity-40"
          >
            {isExporting === "csv" ? <Loader2 className="w-5 h-5 text-blueberry animate-spin" /> : <FileSpreadsheet className="w-5 h-5 text-green-600" />}
            <span className="text-[10px] font-bold text-blueberry">CSV File</span>
          </button>
          <button
            onClick={handleExportMarkdown}
            disabled={isExporting !== null}
            className="bg-white border border-silver/50 hover:border-blueberry/30 p-4 rounded-[20px] flex flex-col items-center justify-center gap-1.5 cursor-pointer shadow-sm hover:shadow-md transition-all duration-300 disabled:opacity-40"
          >
            {isExporting === "md" ? <Loader2 className="w-5 h-5 text-blueberry animate-spin" /> : <FileText className="w-5 h-5 text-blue-500" />}
            <span className="text-[10px] font-bold text-blueberry">Markdown</span>
          </button>
          <button
            onClick={handleExportPDF}
            disabled={isExporting !== null}
            className="bg-white border border-silver/50 hover:border-blueberry/30 p-4 rounded-[20px] flex flex-col items-center justify-center gap-1.5 cursor-pointer shadow-sm hover:shadow-md transition-all duration-300 disabled:opacity-40"
          >
            {isExporting === "pdf" ? <Loader2 className="w-5 h-5 text-blueberry animate-spin" /> : <Download className="w-5 h-5 text-blueberry" />}
            <span className="text-[10px] font-bold text-blueberry">PDF</span>
          </button>
        </div>
      </div>

      {/* Logout Button */}
      <motion.button
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
        onClick={handleLogout}
        disabled={isLoggingOut}
        className="w-full border border-red-200 bg-red-50 hover:bg-red-100 text-red-600 font-bold py-3.5 px-6 rounded-2xl flex items-center justify-center gap-2 cursor-pointer transition-colors duration-200 disabled:opacity-50"
      >
        {isLoggingOut ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <>
            <LogOut className="w-4 h-4" />
            <span className="text-sm">Sign Out</span>
          </>
        )}
      </motion.button>
    </main>
  );
}
