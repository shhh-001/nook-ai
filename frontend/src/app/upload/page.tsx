"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Upload, Image as ImageIcon, FileText, Clipboard, X, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { api, Item } from "@/lib/api";
import confetti from "canvas-confetti";
import { useAuth } from "@/hooks/useAuth";

interface PreviewFile {
  id: string;
  file: File;
  previewUrl: string;
}

export default function UploadPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth(true);
  const [previews, setPreviews] = useState<PreviewFile[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [statusText, setStatusText] = useState("");
  const [progress, setProgress] = useState(0);

  // Animation States: 'idle' | 'analyzing' | 'clustering' | 'connecting' | 'splitting' | 'done'
  const [animState, setAnimState] = useState<"idle" | "analyzing" | "clustering" | "connecting" | "splitting" | "done">("idle");
  const [finalItems, setFinalItems] = useState<Item[]>([]);


  const fileInputRef = useRef<HTMLInputElement>(null);

  const statusMessages = [
    "Reading screenshots...",
    "Extracting OCR text...",
    "Recognizing items...",
    "Detecting duplicates...",
    "Connecting tags & context...",
    "Grouping into collections...",
    "Finishing..."
  ];

  // Drag handlers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      addFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      addFiles(Array.from(e.target.files));
    }
  };

  const addFiles = (filesList: File[]) => {
    const validImages = filesList.filter(file => file.type.startsWith("image/"));
    
    if (validImages.length === 0) {
      alert("Please upload image files only.");
      return;
    }

    const newPreviews = validImages.map(file => ({
      id: `${file.name}-${Math.random()}`,
      file,
      previewUrl: URL.createObjectURL(file)
    }));

    setPreviews(prev => [...prev, ...newPreviews].slice(0, 100)); // Cap at 100 screenshots
  };

  const removeFile = (id: string) => {
    setPreviews(prev => {
      const target = prev.find(p => p.id === id);
      if (target) URL.revokeObjectURL(target.previewUrl);
      return prev.filter(p => p.id !== id);
    });
  };

  const clearAll = () => {
    previews.forEach(p => URL.revokeObjectURL(p.previewUrl));
    setPreviews([]);
  };

  // Simulate clipboard read
  const handlePaste = async () => {
    try {
      const items = await navigator.clipboard.read();
      for (const item of items) {
        for (const type of item.types) {
          if (type.startsWith("image/")) {
            const blob = await item.getType(type);
            const file = new File([blob], "clipboard_image.png", { type });
            addFiles([file]);
            return;
          }
        }
      }
      alert("No image found on clipboard. Copy an image first!");
    } catch (e) {
      alert("Please grant clipboard permissions to paste screenshots.");
    }
  };

  // Main Signature Animation & Processing Logic
  const handleAnalyze = async () => {
    if (previews.length === 0) return;
    
    setAnimState("analyzing");
    setStatusText(statusMessages[0]);
    setProgress(10);

    try {
      // Step 1: Call API to upload
      const filesToUpload = previews.map(p => p.file);
      const uploadRes = await api.uploadScreenshots(filesToUpload);
      
      // Update progress
      setProgress(30);
      setStatusText(statusMessages[1]);
      
      // Step 2: Trigger clustering animation (Visual Stage 1)
      await new Promise(resolve => setTimeout(resolve, 800));
      setAnimState("clustering");
      setStatusText(statusMessages[2]);
      setProgress(50);

      // Step 3: Trigger connecting lines (Visual Stage 2)
      await new Promise(resolve => setTimeout(resolve, 1000));
      setAnimState("connecting");
      setStatusText(statusMessages[3]);
      setProgress(70);

      // Call API to analyze
      const items = await api.analyzeScreenshots(uploadRes.temp_tokens);
      setFinalItems(items);

      // Step 4: Split into category cards (Visual Stage 3)
      await new Promise(resolve => setTimeout(resolve, 1200));
      setAnimState("splitting");
      setStatusText(statusMessages[5]);
      setProgress(90);

      // Final complete state
      await new Promise(resolve => setTimeout(resolve, 1200));
      setAnimState("done");
      setStatusText("Analysis complete!");
      setProgress(100);

      // Confetti burst for magic moment!
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.6 },
        colors: ["#2F3A55", "#5C6B8A", "#D3DFF2", "#93A4C1"]
      });

      // Redirect back home to see organized items after brief complete showing
      setTimeout(() => {
        router.push("/home");
      }, 1500);

    } catch (error) {
      console.error(error);
      alert("Something went wrong during screenshot analysis.");
      setAnimState("idle");
    }
  };

  // Clean up ObjectURLs to prevent memory leaks
  useEffect(() => {
    return () => {
      previews.forEach(p => URL.revokeObjectURL(p.previewUrl));
    };
  }, []);

  if (authLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] gap-3">
        <Loader2 className="w-8 h-8 text-blueberry animate-spin" />
        <span className="text-xs text-stem font-semibold italic">Opening Vault...</span>
      </div>
    );
  }

  return (
    <main className="flex-grow px-4 md:px-8 py-8 max-w-4xl mx-auto space-y-8 w-full relative min-h-screen pb-32">
      {/* Animation Overlay Screen (The Signature Interaction UI) */}
      <AnimatePresence>
        {animState !== "idle" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-[#0F1420]/95 z-[100] flex flex-col justify-between items-center py-16 px-6"
          >
            {/* Header: Progress & Loading details */}
            <div className="text-center space-y-3 max-w-sm">
              <span className="text-[10px] font-bold text-puffy/50 tracking-widest uppercase">
                Nook AI Engine
              </span>
              <h3 className="text-lg font-semibold text-white tracking-tight">
                {statusText}
              </h3>
              
              {/* Progress Bar */}
              <div className="w-full bg-white/10 h-1 rounded-full overflow-hidden">
                <motion.div
                  className="bg-puffy h-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>
            </div>

            {/* Middle: Signature Animation Container */}
            <div className="relative w-full max-w-lg h-[45vh] flex items-center justify-center overflow-visible">
              
              {/* SVG Connecting Lines between clustering items */}
              {animState === "connecting" && (
                <svg className="absolute inset-0 w-full h-full pointer-events-none z-10">
                  {/* Drawing connecting lines between centered thumbnails */}
                  <motion.line
                    x1="45%" y1="45%" x2="55%" y2="55%"
                    stroke="#D3DFF2" strokeWidth="2" strokeDasharray="5,5"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1, strokeDashoffset: [0, -10] }}
                    transition={{ repeat: Infinity, duration: 1 }}
                  />
                  <motion.line
                    x1="55%" y1="45%" x2="45%" y2="55%"
                    stroke="#93A4C1" strokeWidth="2" strokeDasharray="5,5"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1, strokeDashoffset: [0, 10] }}
                    transition={{ repeat: Infinity, duration: 1 }}
                  />
                </svg>
              )}

              {/* 1. CLUSTERING STAGE: converge thumbnails to center */}
              {(animState === "analyzing" || animState === "clustering" || animState === "connecting") && (
                <div className="relative w-40 h-40 flex items-center justify-center">
                  {previews.slice(0, 8).map((preview, index) => {
                    // Position calculations for circular spacing or center convergence
                    const total = Math.min(previews.length, 8);
                    const angle = (index / total) * 2 * Math.PI;
                    const radius = animState === "clustering" || animState === "connecting" ? 15 : 90; // converge!
                    const x = Math.cos(angle) * radius;
                    const y = Math.sin(angle) * radius;

                    return (
                      <motion.div
                        key={preview.id}
                        initial={{ opacity: 0, scale: 0.4 }}
                        animate={{
                          opacity: 1,
                          scale: animState === "clustering" || animState === "connecting" ? 0.75 : 1,
                          x,
                          y,
                          rotate: index % 2 === 0 ? 10 : -10,
                          zIndex: index
                        }}
                        transition={{ type: "spring", stiffness: 90, damping: 14 }}
                        className="absolute w-20 h-28 bg-white border border-silver/40 rounded-xl overflow-hidden shadow-2xl p-1 shrink-0"
                      >
                        <img src={preview.previewUrl} className="w-full h-full object-cover rounded-lg" />
                      </motion.div>
                    );
                  })}
                </div>
              )}

              {/* 2. SPLITTING STAGE: morph into category collections */}
              {animState === "splitting" && (
                <div className="flex gap-4">
                  {["col-products", "col-movies", "col-recipes"].map((colId, index) => {
                    const titles = ["Products", "Movies", "Recipes"];
                    const colors = ["#D3DFF2", "#93A4C1", "#E7E8E4"];
                    
                    return (
                      <motion.div
                        key={colId}
                        initial={{ opacity: 0, scale: 0.5, y: 50 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        transition={{ type: "spring", stiffness: 100, delay: index * 0.1 }}
                        className="w-24 h-24 rounded-3xl flex flex-col items-center justify-center p-3 text-blueberry shadow-lg text-xs font-bold"
                        style={{ backgroundColor: colors[index] }}
                      >
                        <span>{titles[index]}</span>
                      </motion.div>
                    );
                  })}
                </div>
              )}

              {/* 3. DONE STAGE: Complete confirmation */}
              {animState === "done" && (
                <motion.div
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="bg-white/10 border border-white/20 p-8 rounded-[32px] flex flex-col items-center gap-3 text-white text-center"
                >
                  <CheckCircle2 className="w-12 h-12 text-puffy animate-bounce" />
                  <div>
                    <h4 className="text-sm font-bold">Successfully Organized!</h4>
                    <p className="text-[10px] text-puffy/80 max-w-[180px] mt-1">
                      {previews.length} screenshots added to Collections.
                    </p>
                  </div>
                </motion.div>
              )}
            </div>

            {/* Footer: branding details */}
            <div className="flex items-center gap-1.5 opacity-55">
              <span className="text-[9px] font-bold text-white uppercase tracking-wider">
                Nook AI Second Brain
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Page Header */}
      <div className="flex justify-between items-center">
        <div className="space-y-1">
          <span className="text-xs font-bold text-stem tracking-wide uppercase">
            Brain Import
          </span>
          <h2 className="text-xl md:text-2xl font-bold text-blueberry leading-tight tracking-tight">
            Import Screenshots
          </h2>
        </div>
      </div>

      {/* Main Drag Drop Zone */}
      <div
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        className={`w-full border-2 border-dashed rounded-[32px] p-10 flex flex-col items-center justify-center text-center space-y-4 transition-all duration-300 ${
          dragActive
            ? "border-blueberry bg-blueberry/5 shadow-innerScale"
            : "border-silver hover:border-blueberry/30 bg-white"
        }`}
      >
        <input
          type="file"
          multiple
          accept="image/*"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
        />

        <div className="w-14 h-14 bg-plate border border-silver/50 rounded-[20px] flex items-center justify-center shadow-sm">
          <Upload className="w-6 h-6 text-blueberry stroke-[2.2]" />
        </div>

        <div className="space-y-1">
          <h3 className="text-xs font-bold text-blueberry uppercase tracking-widest">
            Drag & Drop Screenshots
          </h3>
          <p className="text-[10px] text-stem/80 font-medium">
            or click to browse. Supports files up to 100 images.
          </p>
        </div>

        {/* Action Import Buttons */}
        <div className="flex flex-wrap gap-2 pt-2 justify-center">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1.5 bg-silver/60 hover:bg-silver text-blueberry px-4 py-2 rounded-full text-xs font-bold cursor-pointer transition-colors"
          >
            <ImageIcon className="w-4 h-4" />
            <span>Gallery</span>
          </button>
          
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1.5 bg-silver/60 hover:bg-silver text-blueberry px-4 py-2 rounded-full text-xs font-bold cursor-pointer transition-colors"
          >
            <FileText className="w-4 h-4" />
            <span>Files</span>
          </button>

          <button
            onClick={handlePaste}
            className="flex items-center gap-1.5 bg-silver/60 hover:bg-silver text-blueberry px-4 py-2 rounded-full text-xs font-bold cursor-pointer transition-colors"
          >
            <Clipboard className="w-4 h-4" />
            <span>Clipboard</span>
          </button>
        </div>
      </div>

      {/* Upload Previews Stack */}
      <AnimatePresence>
        {previews.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="space-y-4 bg-white border border-silver/50 rounded-[28px] p-6 shadow-sm"
          >
            <div className="flex justify-between items-center">
              <span className="text-[11px] font-bold text-stem uppercase tracking-wider">
                Imported Screenshots ({previews.length})
              </span>
              <button
                onClick={clearAll}
                className="text-[10px] font-bold text-red-500 hover:text-red-600 cursor-pointer"
              >
                Clear all
              </button>
            </div>

            {/* Previews Grid */}
            <div className="grid grid-cols-4 sm:grid-cols-6 gap-3">
              {previews.map((preview) => (
                <div
                  key={preview.id}
                  className="relative aspect-[3/4] bg-silver/30 border border-silver/50 rounded-xl overflow-hidden group shadow-inner"
                >
                  <img src={preview.previewUrl} className="w-full h-full object-cover" />
                  
                  {/* Remove Button */}
                  <button
                    onClick={() => removeFile(preview.id)}
                    className="absolute top-1.5 right-1.5 bg-blueberry/80 hover:bg-blueberry text-white p-1 rounded-full border border-white/20 transition-all opacity-0 group-hover:opacity-100 cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>

            {/* Process CTA Button */}
            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              onClick={handleAnalyze}
              className="w-full bg-blueberry text-white py-3.5 px-6 rounded-2xl font-bold shadow-lg hover:bg-berry cursor-pointer transition-colors duration-200 text-center flex items-center justify-center gap-2"
            >
              <span>Analyze with AI</span>
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
