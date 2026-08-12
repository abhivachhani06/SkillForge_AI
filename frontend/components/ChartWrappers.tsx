"use client";

import {
  RadialBarChart, RadialBar, ResponsiveContainer,
  LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid,
  BarChart, Bar, Cell,
} from "recharts";

// ─── Radial / Gauge Chart ─────────────────────────────────────────────────────
interface GaugeChartProps {
  value: number;   // 0–100
  size?: number;
}

export function GaugeChart({ value, size = 200 }: GaugeChartProps) {
  const data = [
    { name: "Score", value, fill: "url(#gaugeGradient)" },
    { name: "Remaining", value: 100 - value, fill: "transparent" },
  ];

  const color =
    value >= 75 ? "#10b981" :
    value >= 50 ? "#6366f1" :
    value >= 25 ? "#f59e0b" : "#f43f5e";

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <ResponsiveContainer width="100%" height="100%">
        <RadialBarChart
          cx="50%"
          cy="50%"
          innerRadius="70%"
          outerRadius="90%"
          startAngle={220}
          endAngle={-40}
          data={[{ value, fill: color }]}
          barSize={12}
        >
          <defs>
            <linearGradient id="gaugeGradient" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%"   stopColor="#6366f1" />
              <stop offset="100%" stopColor="#a855f7" />
            </linearGradient>
          </defs>
          <RadialBar
            background={{ fill: "#2a2a45" }}
            dataKey="value"
            cornerRadius={6}
          />
        </RadialBarChart>
      </ResponsiveContainer>
      {/* Center label */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-bold text-slate-100" style={{ color }}>
          {value}
        </span>
        <span className="text-xs text-slate-500">/ 100</span>
      </div>
    </div>
  );
}

// ─── Line Chart ───────────────────────────────────────────────────────────────
interface ProgressLineChartProps {
  data: { week: string; score: number }[];
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload?.length) {
    return (
      <div className="glass-card px-3 py-2 text-sm shadow-xl">
        <p className="text-slate-400">{label}</p>
        <p className="font-semibold text-brand-300">{payload[0].value}</p>
      </div>
    );
  }
  return null;
};

export function ProgressLineChart({ data }: ProgressLineChartProps) {
  return (
    <ResponsiveContainer width="100%" height={200}>
      <LineChart data={data} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
        <defs>
          <linearGradient id="lineGradient" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%"   stopColor="#6366f1" />
            <stop offset="100%" stopColor="#a855f7" />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#2a2a45" />
        <XAxis dataKey="week" tick={{ fill: "#64748b", fontSize: 12 }} axisLine={false} tickLine={false} />
        <YAxis domain={[0, 100]} tick={{ fill: "#64748b", fontSize: 12 }} axisLine={false} tickLine={false} />
        <Tooltip content={<CustomTooltip />} />
        <Line
          type="monotone"
          dataKey="score"
          stroke="url(#lineGradient)"
          strokeWidth={3}
          dot={{ fill: "#6366f1", strokeWidth: 2, r: 4 }}
          activeDot={{ r: 6, fill: "#a855f7" }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

// ─── Bar Chart (skill breakdown) ──────────────────────────────────────────────
interface SkillBarChartProps {
  data: { skill: string; score: number }[];
}

const COLORS = ["#6366f1", "#8b5cf6", "#a855f7", "#ec4899", "#06b6d4"];

export function SkillBarChart({ data }: SkillBarChartProps) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 60 }} barSize={24}>
        <CartesianGrid strokeDasharray="3 3" stroke="#2a2a45" vertical={false} />
        <XAxis
          dataKey="skill"
          tick={{ fill: "#64748b", fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          angle={-35}
          textAnchor="end"
          interval={0}
        />
        <YAxis domain={[0, 100]} tick={{ fill: "#64748b", fontSize: 12 }} axisLine={false} tickLine={false} />
        <Tooltip content={<CustomTooltip />} />
        <Bar dataKey="score" radius={[6, 6, 0, 0]}>
          {data.map((_, i) => (
            <Cell key={i} fill={COLORS[i % COLORS.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
