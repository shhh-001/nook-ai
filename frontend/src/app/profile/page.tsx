"use client";

import { useEffect, useState } from "react";
import { User, Shield, Share2, FolderHeart, Archive, Download, Settings, FileSpreadsheet, FileText, ChevronRight, Loader2, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { api, ProfileResponse } from "@/lib/api";

export default function ProfilePage() {
  const [profile, setProfile] = useState<ProfileResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState<string | null>(null);

  useEffect(() => {
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
  }, []);

  // Functional CSV Export
  const handleExportCSV = async () => {
    if (!profile) return;
    setIsExporting("csv");
    
    // Simulate minor delay
    await new Promise(resolve => setTimeout(resolve, 800));

    try {
      // Fetch fresh collections to extract items
      const collections = await api.getCollections();
      const allItems = collections.flatMap(c => c.items);
      
      let csvContent = "data:text/csv;charset=utf-8,";
      csvContent += "ID,Category,Title,Subtitle,Price,Currency,Created At,Tags\n";
      
      allItems.forEach(item => {
        const row = [
          item.id,
          `"${item.category}"`,
          `"${item.title.replace(/"/g, '""')}"`,
          `"${(item.subtitle || "").replace(/"/g, '""')}"`,
          item.price || "",
          item.currency || "",
          item.created_at,
          `"${item.tags.join(", ")}"`
        ].join(",");
        csvContent += row + "\n";
      });

      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", "nook_ai_screenshots_export.csv");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
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
    
    // Simulate minor delay
    await new Promise(resolve => setTimeout(resolve, 800));

    try {
      const collections = await api.getCollections();
      
      let md = `# Nook AI - Screenshot Brain Export\n`;
      md += `Generated on ${new Date().toLocaleDateString()} for ${profile.name} (${profile.handle})\n\n`;
      md += `## Profile Insights\n`;
      md += `- Saved This Month: ${profile.insights.saved_this_month}\n`;
      md += `- Top Category: ${profile.insights.top_category}\n`;
      md += `- Favorite Brand: ${profile.insights.favorite_brand}\n`;
      md += `- Theme: ${profile.insights.recurring_theme}\n\n`;
      
      collections.forEach(col => {
        md += `## Collection: ${col.name} (${col.items_count} items)\n`;
        md += `${col.description || ""}\n\n`;
        
        col.items.forEach(item => {
          md += `### ${item.title}\n`;
          if (item.subtitle) md += `*${item.subtitle}*\n`;
          md += `- **Category**: ${item.category}\n`;
          if (item.price) md += `- **Price**: ${item.currency === "INR" ? "₹" : "$"}${item.price}\n`;
          md += `- **Tags**: ${item.tags.map(t => `\`#${t}\``).join(", ")}\n`;
          if (item.description) md += `\n> ${item.description}\n`;
          if (item.ocr_text) md += `\n**Raw OCR extracted:**\n\`\`\`\n${item.ocr_text}\n\`\`\`\n`;
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

  // Simulating PDF Export
  const handleExportPDF = async () => {
    setIsExporting("pdf");
    await new Promise(resolve => setTimeout(resolve, 1500));
    window.print(); // Native print allows user to save high quality layouts as PDF easily!
    setIsExporting(null);
  };

  if (isLoading || !profile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] gap-3">
        <Loader2 className="w-8 h-8 text-blueberry animate-spin" />
        <span className="text-xs text-stem font-semibold italic">Opening Vault...</span>
      </div>
    );
  }

  // Profile links
  const links = [
    { name: "Collections", icon: FolderHeart, href: "/results" },
    { name: "Liked Items", icon: Share2, href: "#" },
    { name: "Archive", icon: Archive, href: "#" },
    { name: "Settings", icon: Settings, href: "#" }
  ];

  return (
    <main className="flex-grow px-4 md:px-8 py-8 max-w-lg mx-auto space-y-8 w-full pb-32">
      {/* Profile Header */}
      <div className="flex flex-col items-center text-center space-y-4 pt-4 relative">
        <button className="absolute top-0 right-0 bg-white border border-silver/60 p-2.5 rounded-full text-blueberry hover:border-blueberry/30 transition-colors shadow-sm flex items-center justify-center cursor-pointer">
          <Settings className="w-4 h-4" />
        </button>

        {/* Big Avatar */}
        <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-silver shadow-md">
          <img src={profile.avatar_url} alt={profile.name} className="w-full h-full object-cover" />
        </div>

        {/* Details */}
        <div className="space-y-1">
          <h2 className="text-xl font-bold text-blueberry tracking-tight leading-none">
            {profile.name}
          </h2>
          <span className="text-xs font-semibold text-stem">
            {profile.handle}
          </span>
        </div>

        {/* Stats Grid */}
        <div className="flex gap-8 justify-center pt-2">
          {Object.entries(profile.stats).map(([label, val]) => (
            <div key={label} className="text-center">
              <span className="text-lg font-bold text-blueberry block">{val}</span>
              <span className="text-[10px] font-bold text-stem uppercase tracking-wider">{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Dark Insights Card (Matches mockup exactly) */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-blueberry text-plate rounded-[32px] p-6 space-y-5 shadow-xl relative overflow-hidden"
      >
        {/* Glowing Background Sparkle */}
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

        {/* Detailed Points */}
        <div className="grid grid-cols-3 gap-2 pt-2 text-center border-t border-white/10">
          <div>
            <span className="text-[9px] font-bold text-white/50 uppercase block tracking-wider">Top Category</span>
            <span className="text-xs font-bold text-plate mt-0.5 block">{profile.insights.top_category}</span>
          </div>
          <div>
            <span className="text-[9px] font-bold text-white/50 uppercase block tracking-wider">Favorite Brand</span>
            <span className="text-xs font-bold text-plate mt-0.5 block">{profile.insights.favorite_brand}</span>
          </div>
          <div>
            <span className="text-[9px] font-bold text-white/50 uppercase block tracking-wider">Theme</span>
            <span className="text-xs font-bold text-plate mt-0.5 block">{profile.insights.recurring_theme}</span>
          </div>
        </div>

        {/* SVG Monthly Trend Graph */}
        <div className="pt-2">
          <span className="text-[9px] font-bold text-white/50 uppercase block tracking-wider mb-2">Screenshot Upload Trend</span>
          <svg className="w-full h-14" viewBox="0 0 300 60">
            {/* Horizontal Grid lines */}
            <line x1="0" y1="20" x2="300" y2="20" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
            <line x1="0" y1="40" x2="300" y2="40" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
            
            {/* Animated Trend Line */}
            <motion.path
              d="M 10 50 Q 58 42, 106 35 T 202 20 T 290 10"
              fill="none"
              stroke="#D3DFF2"
              strokeWidth="2.5"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 1.5, ease: "easeInOut" }}
            />
            
            {/* Tooltip Dot */}
            <circle cx="290" cy="10" r="3" fill="#D3DFF2" />
          </svg>
          <div className="flex justify-between text-[8px] text-white/40 uppercase font-bold px-1">
            <span>Feb</span>
            <span>Mar</span>
            <span>Apr</span>
            <span>May</span>
            <span>Jun</span>
            <span>Jul</span>
          </div>
        </div>
      </motion.div>

      {/* Main List Links */}
      <div className="bg-white border border-silver/50 rounded-[28px] overflow-hidden shadow-sm">
        {links.map((link, idx) => (
          <a
            key={link.name}
            href={link.href}
            className={`flex items-center justify-between p-4.5 hover:bg-plate/40 transition-colors ${
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
          {/* CSV */}
          <button
            onClick={handleExportCSV}
            disabled={isExporting !== null}
            className="bg-white border border-silver/50 hover:border-blueberry/30 p-4 rounded-[20px] flex flex-col items-center justify-center text-center gap-1.5 cursor-pointer shadow-sm hover:shadow-md transition-all duration-300 disabled:opacity-40"
          >
            {isExporting === "csv" ? (
              <Loader2 className="w-5 h-5 text-blueberry animate-spin" />
            ) : (
              <FileSpreadsheet className="w-5 h-5 text-green-600" />
            )}
            <span className="text-[10px] font-bold text-blueberry">CSV File</span>
          </button>

          {/* Markdown */}
          <button
            onClick={handleExportMarkdown}
            disabled={isExporting !== null}
            className="bg-white border border-silver/50 hover:border-blueberry/30 p-4 rounded-[20px] flex flex-col items-center justify-center text-center gap-1.5 cursor-pointer shadow-sm hover:shadow-md transition-all duration-300 disabled:opacity-40"
          >
            {isExporting === "md" ? (
              <Loader2 className="w-5 h-5 text-blueberry animate-spin" />
            ) : (
              <FileText className="w-5 h-5 text-blue-500" />
            )}
            <span className="text-[10px] font-bold text-blueberry">Markdown</span>
          </button>

          {/* PDF */}
          <button
            onClick={handleExportPDF}
            disabled={isExporting !== null}
            className="bg-white border border-silver/50 hover:border-blueberry/30 p-4 rounded-[20px] flex flex-col items-center justify-center text-center gap-1.5 cursor-pointer shadow-sm hover:shadow-md transition-all duration-300 disabled:opacity-40"
          >
            {isExporting === "pdf" ? (
              <Loader2 className="w-5 h-5 text-blueberry animate-spin" />
            ) : (
              <Download className="w-5 h-5 text-blueberry" />
            )}
            <span className="text-[10px] font-bold text-blueberry">PDF Document</span>
          </button>
        </div>
      </div>
    </main>
  );
}
