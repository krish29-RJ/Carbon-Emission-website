import { BookOpen, Leaf, Calculator, Brain, AlertTriangle } from "lucide-react";

const emissionFactors = [
  {
    category: "Transport",
    activity: "Car (petrol)",
    unit: "km",
    co2e: 0.192,
    source: "EPA",
  },
  {
    category: "Transport",
    activity: "Bus",
    unit: "km",
    co2e: 0.089,
    source: "DEFRA",
  },
  {
    category: "Transport",
    activity: "Train/Metro",
    unit: "km",
    co2e: 0.041,
    source: "DEFRA",
  },
  {
    category: "Transport",
    activity: "Short Flight",
    unit: "hour",
    co2e: 90,
    source: "ICAO",
  },
  {
    category: "Energy",
    activity: "Electricity",
    unit: "kWh",
    co2e: 0.7,
    source: "EIA",
  },
  {
    category: "Energy",
    activity: "AC Usage",
    unit: "hour/day",
    co2e: 1.2,
    source: "EPA",
  },
  {
    category: "Food",
    activity: "Vegan Diet",
    unit: "month",
    co2e: 100,
    source: "Oxford",
  },
  {
    category: "Food",
    activity: "Vegetarian Diet",
    unit: "month",
    co2e: 150,
    source: "Oxford",
  },
  {
    category: "Food",
    activity: "Mixed Diet",
    unit: "month",
    co2e: 220,
    source: "Oxford",
  },
  {
    category: "Food",
    activity: "Meat-Heavy Diet",
    unit: "month",
    co2e: 320,
    source: "Oxford",
  },
  {
    category: "Food",
    activity: "Meat Meal (extra)",
    unit: "meal",
    co2e: 4.5,
    source: "Oxford",
  },
  {
    category: "Food",
    activity: "Food Waste",
    unit: "kg",
    co2e: 2.5,
    source: "FAO",
  },
  {
    category: "Lifestyle",
    activity: "Online Shopping Order",
    unit: "order",
    co2e: 8,
    source: "MIT",
  },
  {
    category: "Lifestyle",
    activity: "Delivery Order",
    unit: "order",
    co2e: 2.5,
    source: "Study",
  },
  {
    category: "Lifestyle",
    activity: "Recycling Benefit",
    unit: "% reduction",
    co2e: 5,
    source: "EPA",
  },
];

/**
 * MethodologyPage component.
 * 
 * @returns {JSX.Element} The rendered component.
 */
export default function MethodologyPage() {
  return (
    <div className="min-h-screen bg-white pt-20 pb-16 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Hero */}
        <div className="relative rounded-3xl overflow-hidden mb-12">
          <img
            src="/methodology-hero.jpg"
            alt=""
            className="w-full h-48 object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0B3D2E]/90 to-[#0B3D2E]/40 flex items-end p-8">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <BookOpen className="w-5 h-5 text-emerald-400" />
                <span className="text-sm text-emerald-300 font-medium">
                  Our Methodology
                </span>
              </div>
              <h1 className="text-3xl font-bold text-white">
                How CarbonWise Works
              </h1>
            </div>
          </div>
        </div>

        {/* What is CO2e */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-slate-900 mb-4 flex items-center gap-2">
            <Leaf className="w-6 h-6 text-emerald-600" />
            What is CO2e?
          </h2>
          <div className="prose prose-slate max-w-none">
            <p className="text-slate-700 leading-relaxed mb-4">
              <strong>CO2e (Carbon Dioxide Equivalent)</strong> is a
              standardized unit that measures the global warming potential of
              different greenhouse gases. Since various gases — like methane
              (CH4) and nitrous oxide (N2O) — have different warming effects,
              CO2e converts them all into an equivalent amount of CO2. This
              allows us to compare and add up emissions from many different
              sources using a single number.
            </p>
            <p className="text-slate-700 leading-relaxed">
              For example, one kilogram of methane has the same warming effect
              as about 25 kilograms of CO2 over a 100-year period, so it would
              be counted as 25 kg CO2e. This makes CO2e the most useful and
              widely adopted metric for personal carbon footprints.
            </p>
          </div>
        </section>

        {/* How We Calculate */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-slate-900 mb-4 flex items-center gap-2">
            <Calculator className="w-6 h-6 text-emerald-600" />
            How We Calculate Your Footprint
          </h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {[
              {
                icon: "🚗",
                title: "Transport",
                desc: "We multiply your weekly distances by emission factors for each mode, then convert to monthly. Flights are calculated per hour of flying time.",
              },
              {
                icon: "⚡",
                title: "Home Energy",
                desc: "Your monthly kWh is multiplied by the grid emission factor. AC usage adds a daily estimate. Renewable energy applies a 25% reduction.",
              },
              {
                icon: "🍎",
                title: "Food",
                desc: "Each diet type has a baseline monthly CO2e. Additional meat meals and food waste are added on top using per-unit factors.",
              },
              {
                icon: "🛍️",
                title: "Lifestyle",
                desc: "Shopping and delivery orders are multiplied by per-order factors. Recycling regularly applies a 5% reduction to lifestyle emissions.",
              },
            ].map(cat => (
              <div
                key={cat.title}
                className="bg-slate-50 rounded-xl p-5 border border-slate-100"
              >
                <div className="text-2xl mb-2">{cat.icon}</div>
                <h3 className="text-base font-semibold text-slate-900 mb-2">
                  {cat.title}
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  {cat.desc}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Emission Factors Table */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-slate-900 mb-4 flex items-center gap-2">
            <Calculator className="w-6 h-6 text-emerald-600" />
            Emission Factors
          </h2>
          <p className="text-sm text-slate-600 mb-4">
            These are the factors we use to convert your activities into kg
            CO2e. All values are sourced from recognized authorities.
          </p>

          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50">
                  <th className="text-left py-3 px-4 font-semibold text-slate-700 border-b border-slate-200">
                    Category
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-700 border-b border-slate-200">
                    Activity
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-700 border-b border-slate-200">
                    Unit
                  </th>
                  <th className="text-right py-3 px-4 font-semibold text-slate-700 border-b border-slate-200">
                    CO2e / Unit
                  </th>
                  <th className="text-right py-3 px-4 font-semibold text-slate-700 border-b border-slate-200">
                    Source
                  </th>
                </tr>
              </thead>
              <tbody>
                {emissionFactors.map((f, i) => (
                  <tr
                    key={i}
                    className={`hover:bg-slate-50/50 transition-colors ${i % 2 === 0 ? "bg-white" : "bg-slate-50/30"}`}
                  >
                    <td className="py-2.5 px-4 text-slate-700 border-b border-slate-100">
                      {f.category}
                    </td>
                    <td className="py-2.5 px-4 text-slate-800 font-medium border-b border-slate-100">
                      {f.activity}
                    </td>
                    <td className="py-2.5 px-4 text-slate-500 border-b border-slate-100">
                      {f.unit}
                    </td>
                    <td className="py-2.5 px-4 text-right font-semibold text-emerald-700 border-b border-slate-100">
                      {f.co2e}{" "}
                      <span className="text-xs font-normal text-slate-400">
                        kg
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-right text-slate-400 border-b border-slate-100">
                      {f.source}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* AI Disclaimer */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-slate-900 mb-4 flex items-center gap-2">
            <Brain className="w-6 h-6 text-emerald-600" />
            How We Use AI
          </h2>

          <div className="bg-gradient-to-br from-emerald-50 to-white rounded-2xl p-6 border border-emerald-100">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center shrink-0">
                <Brain className="w-6 h-6 text-emerald-600" />
              </div>
              <div>
                <p className="text-slate-700 leading-relaxed mb-3">
                  <strong>
                    Your carbon data is calculated with precision.
                  </strong>{" "}
                  AI helps us explain it in a way that motivates action.
                </p>
                <p className="text-slate-700 leading-relaxed">
                  We use artificial intelligence <strong>only</strong> for
                  generating personalized insights, explanations, and
                  recommendations. All raw carbon footprint calculations are
                  entirely deterministic and formula-based. The AI never
                  influences the actual CO2e numbers — those come directly from
                  established emission factors multiplied by your inputs.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Limitations */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-slate-900 mb-4 flex items-center gap-2">
            <AlertTriangle className="w-6 h-6 text-amber-500" />
            Limitations & Disclaimer
          </h2>
          <div className="space-y-3">
            {[
              "CarbonWise provides estimates based on averages and self-reported data. Actual emissions may vary based on vehicle efficiency, local energy grid mix, food sourcing, and other factors.",
              "Regional variations in electricity carbon intensity are not fully accounted for. We use a global average of 0.7 kg CO2e per kWh.",
              "The calculator covers direct emissions from transport, home energy, food, and lifestyle. It does not include embodied emissions in goods, infrastructure, or government services.",
              "We do not sell, share, or use your data for any purpose other than providing you with carbon footprint insights.",
            ].map((text, i) => (
              <div
                key={i}
                className="flex items-start gap-3 p-4 bg-amber-50/50 rounded-xl border border-amber-100"
              >
                <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                <p className="text-sm text-slate-700 leading-relaxed">{text}</p>
              </div>
            ))}
          </div>
        </section>

        {/* How to Reduce */}
        <section>
          <h2 className="text-2xl font-bold text-slate-900 mb-4 flex items-center gap-2">
            <Leaf className="w-6 h-6 text-emerald-600" />
            How You Can Reduce Your Footprint
          </h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {[
              {
                title: "Switch to public transport",
                saving: "~30 kg/mo",
                desc: "Taking the bus or train instead of driving even 2 days a week.",
              },
              {
                title: "Eat less meat",
                saving: "~18 kg/mo",
                desc: "Just one meat-free day per week makes a meaningful difference.",
              },
              {
                title: "Use renewable energy",
                saving: "~120 kg/mo",
                desc: "Switching to a green energy plan if available in your area.",
              },
              {
                title: "Reduce deliveries",
                saving: "~16 kg/mo",
                desc: "Consolidating online orders reduces transport emissions.",
              },
              {
                title: "Adjust your thermostat",
                saving: "~20 kg/mo",
                desc: "Raising AC by 2°C saves significant energy.",
              },
              {
                title: "Reduce food waste",
                saving: "~20 kg/mo",
                desc: "Planning meals and composting can cut waste in half.",
              },
            ].map(item => (
              <div
                key={item.title}
                className="bg-emerald-50/50 rounded-xl p-5 border border-emerald-100"
              >
                <h3 className="text-sm font-semibold text-slate-900 mb-1">
                  {item.title}
                </h3>
                <p className="text-xs text-emerald-700 font-semibold mb-2">
                  {item.saving}
                </p>
                <p className="text-sm text-slate-600">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
