"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type Point = { date: string; weight: number; volume: number };

export function ProgressCharts({ data }: { data: Point[] }) {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="mb-2 text-xs uppercase tracking-widest text-fg-muted">
          Top Weight Over Time
        </h2>
        <div className="h-56 rounded-xl border border-border bg-surface p-3">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis
                dataKey="date"
                stroke="var(--color-fg-muted)"
                fontSize={11}
                tickLine={false}
              />
              <YAxis
                stroke="var(--color-fg-muted)"
                fontSize={11}
                tickLine={false}
                width={36}
              />
              <Tooltip
                contentStyle={{
                  background: "var(--color-surface-2)",
                  border: "1px solid var(--color-border)",
                  borderRadius: 8,
                  fontSize: 12,
                }}
              />
              <Line
                type="monotone"
                dataKey="weight"
                stroke="var(--color-accent)"
                strokeWidth={2}
                dot={{ r: 3 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div>
        <h2 className="mb-2 text-xs uppercase tracking-widest text-fg-muted">
          Volume Over Time
        </h2>
        <div className="h-56 rounded-xl border border-border bg-surface p-3">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis
                dataKey="date"
                stroke="var(--color-fg-muted)"
                fontSize={11}
                tickLine={false}
              />
              <YAxis
                stroke="var(--color-fg-muted)"
                fontSize={11}
                tickLine={false}
                width={36}
              />
              <Tooltip
                contentStyle={{
                  background: "var(--color-surface-2)",
                  border: "1px solid var(--color-border)",
                  borderRadius: 8,
                  fontSize: 12,
                }}
              />
              <Line
                type="monotone"
                dataKey="volume"
                stroke="var(--color-steel)"
                strokeWidth={2}
                dot={{ r: 3 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
