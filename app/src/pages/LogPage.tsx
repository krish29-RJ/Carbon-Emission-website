import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Car,
  Zap,
  Apple,
  ShoppingBag,
  Plane,
  AlertTriangle,
  CheckCircle,
  ChevronRight,
  Info,
  X,
  Leaf,
  Flame,
  Train,
  Bike,
  Home,
  Fish,
  Egg,
  TreePine,
  Coffee,
  Package,
  Smartphone,
  Shirt,
} from "lucide-react";
import { useNavigate } from "react-router";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { toast } from "sonner";

// ─── Carbon Emission Factors (kg CO2e per unit) ──────────────────────────────
const FACTORS = {
  transport: {
    car_petrol: 0.192, // per km
    car_electric: 0.053,
    bus: 0.089,
    train: 0.041,
    flight_domestic: 0.255, // per km (seat)
    flight_intl: 0.195,
    bike: 0,
    walk: 0,
    auto: 0.115,
    metro: 0.031,
  },
  food: {
    red_meat: 27, // per 100g
    chicken: 6.9,
    fish: 5.4,
    eggs: 4.5,
    dairy: 3.2,
    vegetables: 2.0,
    vegan: 1.5,
  },
  energy: {
    electricity: 0.82, // per kWh (India grid average)
    ac_hour: 1.5, // per hour of AC usage
    lpg_cylinder: 3.0, // per cylinder
  },
  shopping: {
    clothing: 15, // per item (avg garment)
    electronics: 70, // per device
    package_delivery: 0.8, // per package
    coffee: 0.34, // per cup
  },
};

// ─── Comparison phrases ───────────────────────────────────────────────────────
function getComparison(kg: number): string {
  if (kg <= 0) return "";
  if (kg < 0.5) return `≈ boiling a kettle ${Math.round(kg / 0.03)} times`;
  if (kg < 2) return `≈ ${Math.round(kg * 5.2)} km in an average petrol car`;
  if (kg < 10) return `≈ ${Math.round(kg / 0.9)} plastic bags of waste`;
  if (kg < 50) return `≈ powering a home for ${(kg / 1.5).toFixed(1)} days`;
  if (kg < 200) return `≈ ${Math.round(kg / 0.192)} km driven in a petrol car`;
  return `≈ ${(kg / 150).toFixed(1)}× India's average monthly footprint`;
}

// ─── Nudge Messages ───────────────────────────────────────────────────────────
type NudgeData = {
  message: string;
  alternative: string;
  saving: number;
  icon: React.ElementType;
};

function getNudge(
  category: string,
  subtype: string,
  value: number
): NudgeData | null {
  if (category === "transport" && subtype === "car_petrol" && value > 20) {
    return {
      icon: Train,
      message: `A ${Math.round(value)} km petrol drive emits ${(value * 0.192).toFixed(1)} kg CO₂e.`,
      alternative: "Taking the metro or a train cuts this by 78%.",
      saving: value * (0.192 - 0.031),
    };
  }
  if (
    category === "transport" &&
    (subtype === "flight_domestic" || subtype === "flight_intl") &&
    value > 100
  ) {
    const factor = subtype === "flight_domestic" ? 0.255 : 0.195;
    return {
      icon: Train,
      message: `This flight emits ${(value * factor).toFixed(1)} kg CO₂e — roughly 3× a train trip.`,
      alternative:
        "Consider rail alternatives or direct routes to reduce layover emissions.",
      saving: value * (factor - 0.041),
    };
  }
  if (category === "food" && subtype === "red_meat" && value > 0) {
    return {
      icon: Leaf,
      message: `Red Meat has the highest carbon intensity of any food: ${(value * 0.27).toFixed(1)} kg CO₂e per ${value * 100}g.`,
      alternative:
        "Swapping to chicken reduces food emissions by 75% for this meal.",
      saving: value * (FACTORS.food.red_meat - FACTORS.food.chicken),
    };
  }
  if (category === "energy" && subtype === "ac_hour" && value > 4) {
    return {
      icon: Zap,
      message: `${value}h of AC use today = ${(value * 1.5).toFixed(1)} kg CO₂e from grid power.`,
      alternative:
        "Setting your AC to 26°C instead of 22°C cuts energy use by ~18%.",
      saving: value * 1.5 * 0.18,
    };
  }
  return null;
}

// ─── Category Types ───────────────────────────────────────────────────────────
interface CategoryOption {
  key: string;
  label: string;
  icon: React.ElementType;
  factor: number;
  unit: string;
  max: number;
  step: number;
  color: string;
}

const CATEGORIES: Record<string, CategoryOption[]> = {
  transport: [
    {
      key: "car_petrol",
      label: "Petrol Car",
      icon: Car,
      factor: FACTORS.transport.car_petrol,
      unit: "km",
      max: 200,
      step: 5,
      color: "#ef4444",
    },
    {
      key: "car_electric",
      label: "Electric Car",
      icon: Car,
      factor: FACTORS.transport.car_electric,
      unit: "km",
      max: 200,
      step: 5,
      color: "#10b981",
    },
    {
      key: "bus",
      label: "Bus",
      icon: Car,
      factor: FACTORS.transport.bus,
      unit: "km",
      max: 100,
      step: 5,
      color: "#f59e0b",
    },
    {
      key: "train",
      label: "Train",
      icon: Train,
      factor: FACTORS.transport.train,
      unit: "km",
      max: 500,
      step: 10,
      color: "#06b6d4",
    },
    {
      key: "metro",
      label: "Metro",
      icon: Train,
      factor: FACTORS.transport.metro,
      unit: "km",
      max: 60,
      step: 1,
      color: "#8b5cf6",
    },
    {
      key: "flight_domestic",
      label: "Domestic Flight",
      icon: Plane,
      factor: FACTORS.transport.flight_domestic,
      unit: "km",
      max: 3000,
      step: 50,
      color: "#f97316",
    },
    {
      key: "bike",
      label: "Bicycle",
      icon: Bike,
      factor: 0,
      unit: "km",
      max: 50,
      step: 1,
      color: "#34d399",
    },
  ],
  food: [
    {
      key: "red_meat",
      label: "Red Meat",
      icon: Apple,
      factor: FACTORS.food.red_meat,
      unit: "×100g",
      max: 10,
      step: 1,
      color: "#ef4444",
    },
    {
      key: "chicken",
      label: "Poultry",
      icon: Egg,
      factor: FACTORS.food.chicken,
      unit: "×100g",
      max: 10,
      step: 1,
      color: "#f59e0b",
    },
    {
      key: "fish",
      label: "Seafood",
      icon: Fish,
      factor: FACTORS.food.fish,
      unit: "×100g",
      max: 10,
      step: 1,
      color: "#06b6d4",
    },
    {
      key: "dairy",
      label: "Dairy",
      icon: Coffee,
      factor: FACTORS.food.dairy,
      unit: "×100g",
      max: 20,
      step: 1,
      color: "#a78bfa",
    },
    {
      key: "vegetables",
      label: "Vegetables",
      icon: Leaf,
      factor: FACTORS.food.vegetables,
      unit: "×100g",
      max: 30,
      step: 1,
      color: "#10b981",
    },
    {
      key: "vegan",
      label: "Vegan Meal",
      icon: TreePine,
      factor: FACTORS.food.vegan,
      unit: "meals",
      max: 5,
      step: 1,
      color: "#34d399",
    },
  ],
  energy: [
    {
      key: "electricity",
      label: "Electricity",
      icon: Zap,
      factor: FACTORS.energy.electricity,
      unit: "kWh",
      max: 50,
      step: 1,
      color: "#f59e0b",
    },
    {
      key: "ac_hour",
      label: "AC Usage",
      icon: Home,
      factor: FACTORS.energy.ac_hour,
      unit: "hours",
      max: 24,
      step: 1,
      color: "#38bdf8",
    },
    {
      key: "lpg_cylinder",
      label: "LPG Cylinder",
      icon: Flame,
      factor: FACTORS.energy.lpg_cylinder,
      unit: "cylinders",
      max: 5,
      step: 1,
      color: "#f97316",
    },
  ],
  shopping: [
    {
      key: "clothing",
      label: "Clothing Items",
      icon: Shirt,
      factor: FACTORS.shopping.clothing,
      unit: "items",
      max: 10,
      step: 1,
      color: "#a78bfa",
    },
    {
      key: "electronics",
      label: "Electronics",
      icon: Smartphone,
      factor: FACTORS.shopping.electronics,
      unit: "items",
      max: 5,
      step: 1,
      color: "#06b6d4",
    },
    {
      key: "package_delivery",
      label: "Deliveries",
      icon: Package,
      factor: FACTORS.shopping.package_delivery,
      unit: "pkgs",
      max: 20,
      step: 1,
      color: "#f59e0b",
    },
    {
      key: "coffee",
      label: "Coffee Cups",
      icon: Coffee,
      factor: FACTORS.shopping.coffee,
      unit: "cups",
      max: 10,
      step: 1,
      color: "#78350f",
    },
  ],
};

const TABS = [
  { id: "transport", label: "Transport", icon: Car, color: "#ef4444" },
  { id: "food", label: "Food", icon: Apple, color: "#10b981" },
  { id: "energy", label: "Energy", icon: Zap, color: "#f59e0b" },
  { id: "shopping", label: "Shopping", icon: ShoppingBag, color: "#8b5cf6" },
];

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function LogPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("transport");
  const [values, setValues] = useState<Record<string, number>>({});
  const [nudge, setNudge] = useState<NudgeData | null>(null);
  const [nudgeDismissed, setNudgeDismissed] = useState(false);
  const [logged, setLogged] = useState(false);

  const setValue = useCallback((key: string, val: number) => {
    setValues(prev => ({ ...prev, [key]: val }));
    setNudgeDismissed(false);

    // find the subtype from all categories
    for (const [cat, opts] of Object.entries(CATEGORIES)) {
      const opt = opts.find(o => o.key === key);
      if (opt) {
        const n = getNudge(cat, key, val);
        if (n) setNudge(n);
        break;
      }
    }
  }, []);

  const totalKg = Object.entries(values).reduce((sum, [key, val]) => {
    for (const opts of Object.values(CATEGORIES)) {
      const opt = opts.find(o => o.key === key);
      if (opt) return sum + opt.factor * val;
    }
    return sum;
  }, 0);

  const categoryTotals = Object.fromEntries(
    Object.entries(CATEGORIES).map(([cat, opts]) => [
      cat,
      opts.reduce((sum, opt) => sum + opt.factor * (values[opt.key] || 0), 0),
    ])
  );

  const { user } = useAuth();

  const handleLog = async () => {
    setLogged(true);
    if (user && isSupabaseConfigured) {
      try {
        const { data: report, error: reportError } = await supabase
          .from("footprint_reports")
          .insert({
            user_id: user.id,
            total_co2e: parseFloat(totalKg.toFixed(2)),
            transport_co2e: parseFloat(
              (categoryTotals.transport || 0).toFixed(2)
            ),
            energy_co2e: parseFloat((categoryTotals.energy || 0).toFixed(2)),
            food_co2e: parseFloat((categoryTotals.food || 0).toFixed(2)),
            lifestyle_co2e: parseFloat(
              (categoryTotals.shopping || 0).toFixed(2)
            ),
            input_data: values,
          })
          .select()
          .single();

        if (reportError) {
          console.error("Failed to save log report:", reportError);
          toast.error(`Failed to save report: ${reportError.message}`);
        } else if (report) {
          // Flatten selected values into user_activities list
          const activitiesList = Object.entries(values)
            .filter(entry => entry[1] > 0)
            .map(([key, val]) => {
              // Find matching category & option
              let category = "lifestyle";
              let label = key;
              let factor = 0.1;
              let unit = "units";
              for (const [cat, opts] of Object.entries(CATEGORIES)) {
                const opt = opts.find(o => o.key === key);
                if (opt) {
                  category = cat === "shopping" ? "lifestyle" : cat;
                  label = opt.label;
                  factor = opt.factor;
                  unit = opt.unit;
                  break;
                }
              }
              return {
                user_id: user.id,
                report_id: report.id,
                category,
                activity: label,
                value: val,
                unit,
                co2e: parseFloat((factor * val).toFixed(2)),
              };
            });

          if (activitiesList.length > 0) {
            const { error: activitiesError } = await supabase
              .from("user_activities")
              .insert(activitiesList);
            if (activitiesError) {
              console.error("Failed to save log activities:", activitiesError);
            }
          }
          toast.success("Activity logged to dashboard successfully!");
        }
      } catch (err) {
        console.error(err);
      }
    } else {
      toast.success("Logged in demo mode.");
    }
    setTimeout(() => navigate("/dashboard"), 1500);
  };

  const currentOpts = CATEGORIES[activeTab] || [];

  return (
    <div className="min-h-screen bg-[#030712] pt-20 pb-20 px-4 text-white">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/15 flex items-center justify-center">
              <Leaf className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">
                Smart Activity Logger
              </h1>
              <p className="text-sm text-slate-400">
                Track your daily footprint with real-time carbon comparisons
              </p>
            </div>
          </div>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left: Input Panel */}
          <div className="lg:col-span-2 space-y-4">
            {/* Tab Bar */}
            <div className="flex gap-2 overflow-x-auto pb-1">
              {TABS.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap transition-all duration-200 ${
                    activeTab === tab.id
                      ? "text-white shadow-lg"
                      : "text-slate-400 hover:text-white glass-card hover:border-white/10"
                  }`}
                  style={
                    activeTab === tab.id
                      ? {
                          background: `${tab.color}25`,
                          border: `1px solid ${tab.color}40`,
                        }
                      : {}
                  }
                >
                  <tab.icon
                    className="w-4 h-4"
                    style={activeTab === tab.id ? { color: tab.color } : {}}
                  />
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Nudge Banner */}
            <AnimatePresence>
              {nudge && !nudgeDismissed && (
                <motion.div
                  initial={{ opacity: 0, y: -10, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.97 }}
                  className="flex items-start gap-3 p-4 rounded-xl border border-amber-500/30 bg-amber-500/8"
                >
                  <AlertTriangle className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-amber-200 font-medium">
                      {nudge.message}
                    </p>
                    <div className="flex items-center gap-1.5 mt-1">
                      <nudge.icon className="w-3.5 h-3.5 text-emerald-400" />
                      <p className="text-xs text-emerald-400">
                        {nudge.alternative}
                      </p>
                    </div>
                    <p className="text-[10px] text-slate-500 mt-0.5">
                      Potential saving: {nudge.saving.toFixed(1)} kg CO₂e
                    </p>
                  </div>
                  <button
                    onClick={() => setNudgeDismissed(true)}
                    className="text-slate-500 hover:text-white transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Activity Sliders */}
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.25 }}
              className="space-y-3"
            >
              {currentOpts.map(opt => {
                const val = values[opt.key] || 0;
                const kg = opt.factor * val;
                const pct = (val / opt.max) * 100;
                return (
                  <motion.div
                    key={opt.key}
                    layout
                    className="glass-card rounded-2xl p-5 border border-white/5 hover:border-white/10 transition-all"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2.5">
                        <div
                          className="w-8 h-8 rounded-lg flex items-center justify-center"
                          style={{ background: `${opt.color}20` }}
                        >
                          <opt.icon
                            className="w-4 h-4"
                            style={{ color: opt.color }}
                          />
                        </div>
                        <div>
                          <span className="text-sm font-semibold text-white">
                            {opt.label}
                          </span>
                          <div className="flex items-center gap-1 mt-0.5">
                            <span className="text-xs text-slate-500">
                              {val} {opt.unit}
                            </span>
                            {kg > 0 && (
                              <span
                                className="text-xs font-medium"
                                style={{ color: opt.color }}
                              >
                                · {kg.toFixed(2)} kg CO₂e
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      {/* Quick buttons */}
                      <div className="flex items-center gap-1">
                        {[
                          0,
                          Math.round(opt.max * 0.25),
                          Math.round(opt.max * 0.5),
                          Math.round(opt.max * 0.75),
                        ].map(preset => (
                          <button
                            key={preset}
                            onClick={() => setValue(opt.key, preset)}
                            className={`text-[9px] px-1.5 py-0.5 rounded font-medium transition-all ${
                              val === preset
                                ? "text-white"
                                : "text-slate-500 hover:text-slate-300"
                            }`}
                            style={
                              val === preset
                                ? {
                                    background: `${opt.color}30`,
                                    color: opt.color,
                                  }
                                : {}
                            }
                          >
                            {preset === 0 ? "None" : `${preset}`}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Slider */}
                    <div className="relative">
                      <div className="relative h-2 rounded-full bg-slate-800">
                        <div
                          className="absolute left-0 top-0 h-full rounded-full transition-all duration-150"
                          style={{
                            width: `${pct}%`,
                            background: `linear-gradient(to right, ${opt.color}80, ${opt.color})`,
                          }}
                        />
                      </div>
                      <input
                        type="range"
                        min={0}
                        max={opt.max}
                        step={opt.step}
                        value={val}
                        onChange={e =>
                          setValue(opt.key, Number(e.target.value))
                        }
                        className="absolute inset-0 w-full opacity-0 cursor-pointer h-2"
                        style={{ height: "8px", top: 0 }}
                        aria-label={`${opt.label} amount`}
                      />
                    </div>

                    {/* Comparison */}
                    {kg > 0.1 && (
                      <p className="text-[10px] text-slate-500 mt-2 flex items-center gap-1">
                        <Info className="w-3 h-3" />
                        {getComparison(kg)}
                      </p>
                    )}
                  </motion.div>
                );
              })}
            </motion.div>
          </div>

          {/* Right: Summary Panel */}
          <div className="space-y-4">
            {/* Total Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="glass-card-neon rounded-2xl p-6 border border-emerald-500/20 sticky top-24"
            >
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-4">
                Activity Summary
              </h3>

              {/* Total */}
              <div className="text-center mb-5">
                <motion.p
                  key={totalKg.toFixed(2)}
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="text-4xl font-extrabold tracking-tight"
                  style={{
                    color:
                      totalKg > 50
                        ? "#ef4444"
                        : totalKg > 20
                          ? "#f59e0b"
                          : "#10b981",
                  }}
                >
                  {totalKg.toFixed(1)}
                </motion.p>
                <p className="text-sm text-slate-400 mt-1">
                  kg CO₂e this entry
                </p>
                {totalKg > 0 && (
                  <p className="text-xs text-slate-500 mt-1 italic">
                    {getComparison(totalKg)}
                  </p>
                )}
              </div>

              {/* Category breakdown */}
              <div className="space-y-2 mb-5">
                {TABS.map(tab => {
                  const catKg = categoryTotals[tab.id] || 0;
                  const maxCat = Math.max(...Object.values(categoryTotals), 1);
                  return (
                    <div key={tab.id}>
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-1.5">
                          <tab.icon
                            className="w-3.5 h-3.5"
                            style={{ color: tab.color }}
                          />
                          <span className="text-xs text-slate-300 capitalize">
                            {tab.label}
                          </span>
                        </div>
                        <span className="text-xs font-medium text-white">
                          {catKg.toFixed(1)} kg
                        </span>
                      </div>
                      <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                        <motion.div
                          className="h-full rounded-full"
                          style={{ background: tab.color }}
                          animate={{
                            width: `${Math.max(0, (catKg / maxCat) * 100)}%`,
                          }}
                          transition={{ duration: 0.3 }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Benchmark */}
              <div className="p-3 rounded-xl bg-slate-800/50 mb-4">
                <p className="text-[10px] text-slate-400 mb-1.5">
                  India avg daily footprint
                </p>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-cyan-500 rounded-full"
                      style={{
                        width: `${Math.min((totalKg / 5) * 100, 100)}%`,
                      }}
                    />
                  </div>
                  <span className="text-[10px] text-slate-400">~5 kg/day</span>
                </div>
              </div>

              {/* Log Button */}
              <AnimatePresence mode="wait">
                {logged ? (
                  <motion.div
                    key="success"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex items-center justify-center gap-2 py-3 rounded-xl bg-emerald-500/20 border border-emerald-500/30"
                  >
                    <CheckCircle className="w-5 h-5 text-emerald-400" />
                    <span className="text-sm font-semibold text-emerald-400">
                      Activity Logged!
                    </span>
                  </motion.div>
                ) : (
                  <motion.div key="btn">
                    <Button
                      onClick={handleLog}
                      disabled={totalKg === 0}
                      className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-slate-950 font-bold py-3 rounded-xl disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                    >
                      Save to Dashboard
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                    <p className="text-[10px] text-slate-500 text-center mt-2">
                      +50 XP for logging today
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
