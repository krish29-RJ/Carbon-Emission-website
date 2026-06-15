import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";

interface BreakdownItem {
  category: string;
  value: number;
  percentage: number;
  color: string;
}

interface Props {
  data: BreakdownItem[];
  total: number;
}

function CustomTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ payload: BreakdownItem }>;
}) {
  if (!active || !payload?.length) return null;
  const item = payload[0].payload;
  return (
    <div className="glass-card rounded-xl px-4 py-3 border border-white/10 shadow-2xl">
      <div className="flex items-center gap-2 mb-1">
        <div
          className="w-3 h-3 rounded-full"
          style={{ backgroundColor: item.color }}
        />
        <span className="text-sm font-semibold text-white">
          {item.category}
        </span>
      </div>
      <p className="text-lg font-bold text-emerald-400">{item.value} kg</p>
      <p className="text-xs text-slate-400">{item.percentage}% of total</p>
    </div>
  );
}

/**
 * CategoryBreakdownChart component.
 * 
 * @returns {JSX.Element} The rendered component.
 */
export default function CategoryBreakdownChart({ data, total }: Props) {
  return (
    <div className="glass-card rounded-2xl p-6 shadow-sm">
      <h3 className="text-lg font-bold text-white mb-0.5">Emission Sources</h3>
      <p className="text-xs text-slate-400 mb-4 font-medium">
        Breakdown by category
      </p>

      <div className="relative">
        <ResponsiveContainer width="100%" height={280}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={70}
              outerRadius={100}
              paddingAngle={4}
              dataKey="value"
              stroke="none"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-3xl font-extrabold text-white leading-none mb-1">
            {total}
          </span>
          <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
            kg CO₂e/mo
          </span>
        </div>
      </div>

      <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 mt-4">
        {data.map(item => (
          <div key={item.category} className="flex items-center gap-2">
            <div
              className="w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: item.color }}
            />
            <span className="text-xs text-slate-400 font-medium">
              {item.category}
            </span>
            <span className="text-xs font-bold text-white">
              {item.percentage}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
