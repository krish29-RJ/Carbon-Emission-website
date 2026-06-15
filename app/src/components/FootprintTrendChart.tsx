import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from "recharts";
import { format, parseISO } from "date-fns";
import { EmptyState } from "./EmptyState";
import { TrendingUp } from "lucide-react";

interface TrendData {
  date: string;
  total: number;
  transport: number;
  energy: number;
  food: number;
  lifestyle: number;
}

interface Props {
  data: TrendData[];
}

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ value: number }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass-card rounded-xl px-4 py-3 border border-white/10 shadow-2xl">
      <p className="text-[10px] text-slate-400 mb-1">
        {label ? format(parseISO(label), "MMM d, yyyy") : ""}
      </p>
      <p className="text-lg font-bold text-emerald-400">
        {payload[0].value} kg
      </p>
      <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">
        CO₂e/month
      </p>
    </div>
  );
}

export default function FootprintTrendChart({ data }: Props) {
  if (!data || data.length === 0) {
    return (
      <div className="glass-card rounded-2xl p-6 shadow-sm">
        <h3 className="text-lg font-bold text-white mb-0.5">Footprint Trend</h3>
        <p className="text-xs text-slate-400 mb-4 font-medium">
          Your progress over time
        </p>
        <EmptyState
          icon={<TrendingUp className="w-8 h-8 text-slate-500" />}
          title="No data yet"
          description="Take your first carbon footprint calculation to see your trend."
        />
      </div>
    );
  }

  const chartData = data
    .map(d => ({
      ...d,
      formattedDate: format(parseISO(d.date), "MMM d"),
    }))
    .reverse(); // Sort chronological for the trend line

  return (
    <div className="glass-card rounded-2xl p-6 shadow-sm">
      <h3 className="text-lg font-bold text-white mb-0.5">Footprint Trend</h3>
      <p className="text-xs text-slate-400 mb-4 font-medium">
        Your progress over time
      </p>

      <ResponsiveContainer width="100%" height={280}>
        <AreaChart
          data={chartData}
          margin={{ top: 5, right: 10, left: -10, bottom: 5 }}
        >
          <defs>
            <linearGradient id="footprintGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
              <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="rgba(255,255,255,0.06)"
            vertical={false}
          />
          <XAxis
            dataKey="formattedDate"
            tick={{ fontSize: 11, fill: "#94a3b8" }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 11, fill: "#94a3b8" }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip content={<CustomTooltip />} />
          <Area
            type="monotone"
            dataKey="total"
            stroke="#10b981"
            strokeWidth={3}
            fill="url(#footprintGradient)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
