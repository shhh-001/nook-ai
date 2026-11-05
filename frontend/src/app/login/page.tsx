"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Sparkles, Mail, Lock, ShieldCheck, ArrowRight, Loader2, KeyRound } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase, isSupabaseConfigured } from "@/lib/supabaseClient";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTab = searchParams.get("tab") || "login";
  
  const [isLogin, setIsLogin] = useState(initialTab === "login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Check if session already exists
  useEffect(() => {
    const checkSession = async () => {
      if (!isSupabaseConfigured) return;
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        router.push("/home");
      }
    };
    checkSession();
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setIsLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    if (!isSupabaseConfigured) {
      // Graceful local development warning if env is missing
      setErrorMsg("Supabase is not configured. Please add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to your .env.local file.");
      setIsLoading(false);
      return;
    }

    try {
      if (isLogin) {
        // Real Supabase Login
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        
        setSuccessMsg("Logged in successfully!");
        setTimeout(() => {
          router.push("/home");
        }, 800);
      } else {
        // Real Supabase Sign Up
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;
        
        if (data.session) {
          setSuccessMsg("Account created and logged in successfully!");
          setTimeout(() => {
            router.push("/home");
          }, 1000);
        } else {
          setSuccessMsg("Sign-up successful! Please check your email for a verification link.");
        }
      }
    } catch (err: any) {
      setErrorMsg(err.message || "An authentication error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setErrorMsg("");
    if (!isSupabaseConfigured) {
      setErrorMsg("Supabase is not configured.");
      return;
    }
    
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/home`
        }
      });
      if (error) throw error;
    } catch (err: any) {
      setErrorMsg(err.message || "OAuth login failed");
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      setErrorMsg("Please enter your email address first.");
      return;
    }
    setIsLoading(true);
    setErrorMsg("");
    setSuccessMsg("");
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/login?tab=reset`
      });
      if (error) throw error;
      setSuccessMsg("Password reset email sent! Check your inbox.");
    } catch (err: any) {
      setErrorMsg(err.message || "Error sending password reset.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="flex-grow flex flex-col justify-center px-6 py-12 max-w-sm mx-auto min-h-screen">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 100 }}
        className="space-y-8 bg-white border border-silver/50 rounded-[32px] p-8 shadow-[0_16px_50px_rgba(47,58,85,0.04)]"
      >
        {/* Brand Sign */}
        <div className="flex flex-col items-center gap-1">
          <div className="w-10 h-10 bg-blueberry rounded-xl flex items-center justify-center shadow-md">
            <Sparkles className="w-5 h-5 text-plate fill-plate" />
          </div>
          <h2 className="text-sm font-bold text-blueberry uppercase tracking-[0.25em] mt-3">
            Nook AI
          </h2>
        </div>

        {/* Toggles */}
        <div className="flex bg-plate rounded-full p-1 border border-silver/50">
          <button
            onClick={() => { setIsLogin(true); setErrorMsg(""); setSuccessMsg(""); }}
            className={`flex-1 text-center py-2 rounded-full text-xs font-bold transition-all duration-300 ${
              isLogin ? "bg-white text-blueberry shadow-sm" : "text-stem"
            }`}
          >
            Sign In
          </button>
          <button
            onClick={() => { setIsLogin(false); setErrorMsg(""); setSuccessMsg(""); }}
            className={`flex-1 text-center py-2 rounded-full text-xs font-bold transition-all duration-300 ${
              !isLogin ? "bg-white text-blueberry shadow-sm" : "text-stem"
            }`}
          >
            Create Account
          </button>
        </div>

        {/* Success/Error Alerts */}
        <AnimatePresence mode="wait">
          {errorMsg && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-red-50 text-red-600 p-3 rounded-2xl text-[11px] font-medium leading-relaxed border border-red-100"
            >
              {errorMsg}
            </motion.div>
          )}
          {successMsg && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-green-50 text-green-700 p-3 rounded-2xl text-[11px] font-medium leading-relaxed border border-green-100"
            >
              {successMsg}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Form Content */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-stem uppercase tracking-wider block pl-2">
              Email Address
            </label>
            <div className="relative flex items-center border border-silver/60 rounded-2xl px-4 py-3 bg-plate focus-within:border-blueberry/30 transition-all duration-200">
              <Mail className="w-4 h-4 text-stem mr-2.5" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@domain.com"
                className="w-full bg-transparent outline-none text-xs font-medium text-blueberry placeholder:text-stem/50"
              />
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex justify-between items-center pl-2">
              <label className="text-[10px] font-bold text-stem uppercase tracking-wider block">
                Password
              </label>
              {isLogin && (
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  className="text-[10px] font-semibold text-berry hover:text-blueberry cursor-pointer"
                >
                  Forgot Password?
                </button>
              )}
            </div>
            <div className="relative flex items-center border border-silver/60 rounded-2xl px-4 py-3 bg-plate focus-within:border-blueberry/30 transition-all duration-200">
              <Lock className="w-4 h-4 text-stem mr-2.5" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-transparent outline-none text-xs font-medium text-blueberry placeholder:text-stem/50"
              />
            </div>
          </div>

          {isLogin && (
            <div className="flex items-center pl-1">
              <button
                type="button"
                onClick={() => setRememberMe(!rememberMe)}
                className="flex items-center gap-2 text-[10px] font-bold text-stem hover:text-blueberry cursor-pointer"
              >
                <div
                  className={`w-3.5 h-3.5 rounded border transition-colors flex items-center justify-center ${
                    rememberMe ? "bg-blueberry border-blueberry" : "border-silver/80"
                  }`}
                >
                  {rememberMe && <ShieldCheck className="w-2.5 h-2.5 text-white" />}
                </div>
                <span>Remember me for 30 days</span>
              </button>
            </div>
          )}

          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            type="submit"
            disabled={isLoading}
            className="w-full bg-blueberry text-plate font-bold py-3.5 px-6 rounded-2xl shadow-md flex items-center justify-center gap-2 cursor-pointer hover:bg-berry transition-colors duration-200 disabled:opacity-50 mt-6"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <span>{isLogin ? "Sign In" : "Sign Up"}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </motion.button>
        </form>

        {/* Divider */}
        <div className="relative flex py-2 items-center">
          <div className="flex-grow border-t border-silver/50"></div>
          <span className="flex-shrink mx-3 text-[10px] font-bold text-stem uppercase tracking-wider">
            or connect with
          </span>
          <div className="flex-grow border-t border-silver/50"></div>
        </div>

        {/* Google Login Option */}
        <motion.button
          whileHover={{ y: -1 }}
          onClick={handleGoogleLogin}
          disabled={isLoading}
          className="w-full border border-silver/70 hover:border-blueberry/30 bg-white text-blueberry font-bold py-3 px-6 rounded-2xl flex items-center justify-center gap-2 cursor-pointer shadow-sm"
        >
          <svg className="w-4 h-4 text-blueberry fill-current" viewBox="0 0 24 24">
            <path d="M12.24 10.285V13.4h6.887c-.275 1.565-1.88 4.604-6.887 4.604-4.33 0-7.859-3.579-7.859-7.989 0-4.41 3.53-7.989 7.859-7.989 2.46 0 4.105 1.025 5.047 1.926l2.427-2.334C17.955 2.192 15.34 1 12.24 1 5.922 1 1 5.93 1 12s4.922 11 11.24 11c6.59 0 10.97-4.63 10.97-11.16 0-.75-.08-1.32-.177-1.555H12.24z"/>
          </svg>
          <span className="text-xs">Continue with Google</span>
        </motion.button>

        <p className="text-[10px] font-bold text-stem text-center max-w-[200px] mx-auto leading-relaxed">
          Secure authentication powered by Supabase.
        </p>
      </motion.div>
    </main>
  );
}
