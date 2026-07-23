"use client";

import { Area, AreaChart, ResponsiveContainer, Tooltip } from "recharts";

type Point = { date: string; volume: number };

export function VolumeSparkline({ data }: { data: Point[] }) {
  return (
    <div className="h-16 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 4, right: 0, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id="volumeFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--color-accent)" stopOpacity={0.4} />
              <stop offset="100%" stopColor="var(--color-accent)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <Tooltip
            contentStyle={{
              background: "var(--color-surface-2)",
              border: "1px solid var(--color-border)",
              borderRadius: 8,
              fontSize: 12,
            }}
            labelStyle={{ color: "var(--color-fg-muted)" }}
            formatter={(value) => [Number(value ?? 0).toLocaleString(), "Volume"]}
          />
          <Area
            type="monotone"
            dataKey="volume"
            stroke="var(--color-accent)"
            strokeWidth={2}
            fill="url(#volumeFill)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
