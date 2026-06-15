import { useState } from "react";
import { useNavigate, useLocation } from "react-router";
import { motion, AnimatePresence } from "framer-motion";
import { Leaf, Quote, Eye, EyeOff, AlertCircle } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

type Mode = "signin" | "signup";

const SUPABASE_SETUP_MESSAGE =
  "Supabase is not configured for this local app. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to app/.env, then restart the dev server.";

/**
 * AuthPage component.
 * 
 * @returns {JSX.Element} The rendered component.
 */
export default function AuthPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { signIn, signUp, isAuthenticated } = useAuth();
  const [mode, setMode] = useState<Mode>("signin");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [city, setCity] = useState("");

  const from = (location.state as { from?: string })?.from || "/dashboard";

  if (isAuthenticated) {
    navigate(from, { replace: true });
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!isSupabaseConfigured) {
      setError(SUPABASE_SETUP_MESSAGE);
      return;
    }

    setLoading(true);

    if (mode === "signup") {
      if (!fullName.trim()) {
        setError("Please enter your full name.");
        setLoading(false);
        return;
      }
      if (password.length < 6) {
        setError("Password must be at least 6 characters.");
        setLoading(false);
        return;
      }
      const { error } = await signUp(email, password, fullName, city);
      if (error) {
        setError(error.message);
      } else {
        toast.success("Account created! Please check your email to confirm.");
        setMode("signin");
      }
    } else {
      const { error } = await signIn(email, password);
      if (error) {
        setError(error.message);
      } else {
        toast.success("Signed in successfully!");
        navigate(from);
      }
    }

    setLoading(false);
  };

  const fillDemo = () => {
    setEmail("demo@carbonwise.app");
    setPassword("password");
    setError("");
  };

  const signInWithGoogle = async () => {
    setError("");

    if (!isSupabaseConfigured) {
      setError(SUPABASE_SETUP_MESSAGE);
      return;
    }

    setGoogleLoading(true);
    const redirectTo = `${window.location.origin}/auth`;
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo,
      },
    });

    if (error) {
      setError(error.message);
      setGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Hidden on mobile */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-[#0B3D2E] items-center justify-center overflow-hidden">
        <div className="absolute inset-0">
          <img
            src="/hero-bg.jpg"
            alt=""
            className="w-full h-full object-cover opacity-40"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-[#0B3D2E]/80 to-emerald-900/60" />
        </div>

        <div className="relative z-10 max-w-md px-8">
          <div className="flex items-center gap-2 mb-12">
            <Leaf className="w-6 h-6 text-emerald-400" />
            <span className="text-xl font-bold text-white">CarbonWise</span>
          </div>

          <Quote className="w-10 h-10 text-emerald-400/60 mb-6" />
          <blockquote className="text-2xl font-semibold text-white leading-relaxed mb-6">
            &ldquo;The greatest threat to our planet is the belief that someone
            else will save it.&rdquo;
          </blockquote>
          <cite className="text-emerald-300 not-italic">— Robert Swan</cite>

          <p className="mt-8 text-emerald-200/70">
            Start your journey to carbon awareness today.
          </p>
        </div>
      </div>

      {/* Right Panel */}
      <div className="flex-1 flex items-center justify-center bg-white px-4 py-12 light text-foreground">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2 mb-8 justify-center">
            <Leaf className="w-6 h-6 text-emerald-600" />
            <span className="text-xl font-bold text-emerald-900">
              CarbonWise
            </span>
          </div>

          {/* Tabs */}
          <div className="flex p-1 bg-slate-100 rounded-xl mb-8">
            <button
              onClick={() => {
                setMode("signin");
                setError("");
              }}
              className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all ${
                mode === "signin"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => {
                setMode("signup");
                setError("");
              }}
              className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all ${
                mode === "signup"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              Create Account
            </button>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={mode}
              initial={{ opacity: 0, x: mode === "signup" ? 20 : -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: mode === "signup" ? -20 : 20 }}
              transition={{ duration: 0.2 }}
            >
              <h2 className="text-2xl font-bold text-slate-900 mb-2">
                {mode === "signin" ? "Welcome back" : "Create your account"}
              </h2>
              <p className="text-sm text-slate-500 mb-6">
                {mode === "signin"
                  ? "Sign in to continue tracking your carbon footprint."
                  : "Start your journey to carbon awareness."}
              </p>

              <form onSubmit={handleSubmit} className="space-y-4">
                {mode === "signup" && (
                  <>
                    <div>
                      <Label
                        htmlFor="fullName"
                        className="text-sm font-medium text-slate-700"
                      >
                        Full Name
                      </Label>
                      <Input
                        id="fullName"
                        type="text"
                        value={fullName}
                        onChange={e => setFullName(e.target.value)}
                        placeholder="John Doe"
                        className="mt-1.5 text-slate-900 bg-white border-slate-300"
                        required
                      />
                    </div>
                    <div>
                      <Label
                        htmlFor="city"
                        className="text-sm font-medium text-slate-700"
                      >
                        City <span className="text-slate-400">(optional)</span>
                      </Label>
                      <Input
                        id="city"
                        type="text"
                        value={city}
                        onChange={e => setCity(e.target.value)}
                        placeholder="San Francisco"
                        className="mt-1.5 text-slate-900 bg-white border-slate-300"
                      />
                    </div>
                  </>
                )}

                <div>
                  <Label
                    htmlFor="email"
                    className="text-sm font-medium text-slate-700"
                  >
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="mt-1.5 text-slate-900 bg-white border-slate-300"
                    required
                  />
                </div>

                <div>
                  <Label
                    htmlFor="password"
                    className="text-sm font-medium text-slate-700"
                  >
                    Password
                  </Label>
                  <div className="relative mt-1.5">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder={
                        mode === "signup" ? "Min 6 characters" : "Your password"
                      }
                      className="pr-10 text-slate-900 bg-white border-slate-300"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                {error && (
                  <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-100 rounded-lg">
                    <AlertCircle className="w-4 h-4 text-red-500 mt-1 shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm text-red-600 font-medium">
                        {error}
                      </p>
                      {error.toLowerCase().includes("email not confirmed") && (
                        <p className="text-xs text-red-500 mt-1.5 leading-relaxed">
                          <strong>How to solve:</strong> Check your inbox (and
                          spam folder) for a confirmation link. If you want to
                          disable email confirmation for local testing, go to
                          your
                          <span className="font-semibold">
                            {" "}
                            Supabase Dashboard &rarr; Authentication &rarr;
                            Providers &rarr; Email
                          </span>{" "}
                          and toggle off <strong>Confirm email</strong>.
                        </p>
                      )}
                    </div>
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-5 rounded-xl cursor-pointer"
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      {mode === "signin"
                        ? "Signing in..."
                        : "Creating account..."}
                    </span>
                  ) : mode === "signin" ? (
                    "Sign In"
                  ) : (
                    "Create Account"
                  )}
                </Button>
              </form>

              <Button
                type="button"
                variant="outline"
                className="w-full mt-4 border-slate-200 bg-white text-slate-700 hover:bg-slate-50 py-5 rounded-xl font-semibold flex items-center justify-center gap-2 cursor-pointer"
                onClick={signInWithGoogle}
                disabled={googleLoading}
              >
                {googleLoading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-slate-300 border-t-slate-700 rounded-full animate-spin" />
                    Opening Google...
                  </span>
                ) : (
                  <>
                    <svg
                      className="w-4 h-4 shrink-0"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        fill="#4285F4"
                      />
                      <path
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        fill="#34A853"
                      />
                      <path
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                        fill="#FBBC05"
                      />
                      <path
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                        fill="#EA4335"
                      />
                    </svg>
                    Continue with Google
                  </>
                )}
              </Button>

              {!isSupabaseConfigured && (
                <p className="mt-3 text-center text-xs text-slate-500">
                  Connect Supabase to enable email and Google sign-in.
                </p>
              )}

              {/* Divider */}
              <div className="flex items-center gap-3 my-6">
                <div className="flex-1 border-t border-slate-200" />
                <span className="text-xs text-slate-400 font-medium uppercase">
                  or
                </span>
                <div className="flex-1 border-t border-slate-200" />
              </div>

              {/* Demo hint */}
              <button
                onClick={fillDemo}
                className="w-full text-center text-xs text-slate-400 hover:text-emerald-600 transition-colors"
              >
                Try the demo:{" "}
                <span className="font-medium">
                  demo@carbonwise.app / password
                </span>
              </button>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
