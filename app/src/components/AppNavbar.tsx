import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router";
import {
  Leaf,
  Menu,
  X,
  LogOut,
  User,
  LayoutDashboard,
  Calculator,
  Users,
  BookOpen,
  ChevronDown,
  Brain,
  Trophy,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";

const navLinks = [
  { path: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { path: "/log", label: "Log Activity", icon: Calculator },
  { path: "/world", label: "Living World", icon: Leaf },
  { path: "/social", label: "Social Hub", icon: Users },
  { path: "/leaderboard", label: "Leaderboard", icon: Trophy },
  { path: "/coach", label: "AI Coach", icon: Brain },
  { path: "/methodology", label: "Methodology", icon: BookOpen },
];

/**
 * AppNavbar component.
 * 
 * @returns {JSX.Element} The rendered component.
 */
export default function AppNavbar() {
  const { user, profile, isAuthenticated, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
    setDropdownOpen(false);
  }, [location.pathname]);

  const isAuthPage = location.pathname === "/auth";
  if (isAuthPage) return null;

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled
            ? "bg-white/95 backdrop-blur-xl shadow-sm border-b border-slate-200/60"
            : "bg-white/85 backdrop-blur-xl border-b border-slate-200/40"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2 group">
              <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center group-hover:bg-emerald-700 transition-colors">
                <Leaf className="w-5 h-5 text-white" />
              </div>
              <span className="text-lg font-bold text-emerald-900 tracking-tight">
                CarbonWise
              </span>
            </Link>

            {/* Desktop Nav */}
            <div className="hidden lg:flex items-center gap-1">
              {navLinks.map(link => {
                const Icon = link.icon;
                const isActive = location.pathname === link.path;
                return (
                  <Link
                    key={link.path}
                    to={link.path}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                      isActive
                        ? "bg-emerald-50 text-emerald-700"
                        : "text-slate-600 hover:text-emerald-700 hover:bg-slate-50"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {link.label}
                  </Link>
                );
              })}
            </div>

            {/* Right side */}
            <div className="flex items-center gap-3">
              {isAuthenticated ? (
                <>
                  <div className="relative">
                    <button
                      onClick={() => setDropdownOpen(!dropdownOpen)}
                      aria-label="Open user menu"
                      aria-expanded={dropdownOpen}
                      className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-slate-100 transition-colors"
                    >
                      <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
                        <User className="w-4 h-4 text-emerald-700" />
                      </div>
                      <span className="hidden sm:block text-sm font-medium text-slate-700 max-w-[120px] truncate">
                        {profile?.full_name ||
                          user?.email?.split("@")[0] ||
                          "User"}
                      </span>
                      <ChevronDown className="w-4 h-4 text-slate-400" />
                    </button>

                    {dropdownOpen && (
                      <div className="absolute right-0 mt-2 w-52 bg-white rounded-xl shadow-lg border border-slate-200 py-1 z-50">
                        <div className="px-4 py-2.5 border-b border-slate-100">
                          <p className="text-xs text-slate-500">Signed in as</p>
                          <p className="text-sm font-semibold text-slate-800 truncate">
                            {user?.email}
                          </p>
                        </div>
                        <button
                          onClick={() => {
                            navigate("/profile");
                            setDropdownOpen(false);
                          }}
                          className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                        >
                          <User className="w-4 h-4 text-slate-500" />
                          My Profile
                        </button>
                        <div className="border-t border-slate-100 my-1" />
                        <button
                          onClick={() => {
                            signOut();
                            navigate("/");
                          }}
                          className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                        >
                          <LogOut className="w-4 h-4" />
                          Sign Out
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Mobile hamburger */}
                  <button
                    onClick={() => setMobileOpen(!mobileOpen)}
                    aria-label="Toggle mobile menu"
                    className="lg:hidden p-2 rounded-lg hover:bg-slate-100 transition-colors"
                  >
                    {mobileOpen ? (
                      <X className="w-5 h-5 text-slate-700" />
                    ) : (
                      <Menu className="w-5 h-5 text-slate-700" />
                    )}
                  </button>
                </>
              ) : (
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate("/auth")}
                    className="border-emerald-600 text-emerald-700 hover:bg-emerald-50"
                  >
                    Sign In
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => navigate("/auth")}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white hidden sm:inline-flex"
                  >
                    Get Started
                  </Button>
                  {/* Mobile hamburger for guest */}
                  <button
                    onClick={() => setMobileOpen(!mobileOpen)}
                    aria-label="Toggle mobile menu"
                    className="lg:hidden p-2 rounded-lg hover:bg-slate-100 transition-colors"
                  >
                    {mobileOpen ? (
                      <X className="w-5 h-5 text-slate-700" />
                    ) : (
                      <Menu className="w-5 h-5 text-slate-700" />
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="absolute inset-0 bg-black/20"
            onClick={() => setMobileOpen(false)}
          />
          <div className="absolute right-0 top-16 bottom-0 w-72 bg-white shadow-xl border-l border-slate-200 p-4 overflow-y-auto">
            <div className="flex flex-col gap-1">
              {navLinks.map(link => {
                const Icon = link.icon;
                const isActive = location.pathname === link.path;
                return (
                  <Link
                    key={link.path}
                    to={link.path}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                      isActive
                        ? "bg-emerald-50 text-emerald-700"
                        : "text-slate-600 hover:text-emerald-700 hover:bg-slate-50"
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    {link.label}
                  </Link>
                );
              })}
              {isAuthenticated && (
                <>
                  <div className="border-t border-slate-200 my-2" />
                  <button
                    onClick={() => {
                      signOut();
                      navigate("/");
                    }}
                    className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <LogOut className="w-5 h-5" />
                    Sign Out
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
