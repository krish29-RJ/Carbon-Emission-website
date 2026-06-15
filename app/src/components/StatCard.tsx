import type { ReactNode } from "react";
import { TrendingDown, TrendingUp, Minus } from "lucide-react";

interface Props {
  icon: ReactNode;
  iconBg: string;
  label: string;
  value: string | number;
  unit?: string;
  trend?: number;
  trendLabel?: string;
  subtext?: string;
}

export default function StatCard({
  icon,
  iconBg,
  label,
  value,
  unit,
  trend,
  trendLabel,
  subtext,
}: Props) {
  const trendPositive = trend !== undefined && trend < 0;
  const trendNeutral = trend !== undefined && trend === 0;

  return (
    <div className="glass-card rounded-2xl p-5 shadow-sm hover:shadow-lg hover:border-emerald-500/20 hover:translate-y-[-2px] transition-all duration-300">
      <div className="flex items-start justify-between mb-3">
        <div
          className={`w-11 h-11 rounded-xl ${iconBg} flex items-center justify-center border border-white/5`}
        >
          {icon}
        </div>
        <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
          {label}
        </span>
      </div>

      <div className="flex items-baseline gap-1.5 mb-2">
        <span className="text-2xl font-bold text-white leading-none tracking-tight">
          {value}
        </span>
        {unit && (
          <span className="text-xs text-slate-400 font-medium">{unit}</span>
        )}
      </div>

      {trend !== undefined && (
        <div className="flex items-center gap-1.5">
          <div
            className={`flex items-center gap-0.5 ${trendPositive ? "text-emerald-400" : trendNeutral ? "text-slate-400" : "text-red-400"}`}
          >
            {trendPositive ? (
              <TrendingDown className="w-3.5 h-3.5" />
            ) : trendNeutral ? (
              <Minus className="w-3.5 h-3.5" />
            ) : (
              <TrendingUp className="w-3.5 h-3.5" />
            )}
            <span className="text-xs font-semibold">{Math.abs(trend)}%</span>
          </div>
          <span className="text-[10px] text-slate-500">
            {trendLabel || "vs previous"}
          </span>
        </div>
      )}

      {subtext && !trend && (
        <p className="text-[10px] text-slate-500 font-medium">{subtext}</p>
      )}
    </div>
  );
}
