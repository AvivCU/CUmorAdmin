"use client";

import { useState } from "react";

type BarChartDatum = {
  label: string;
  value: number;
};

export default function BarChart({ data }: { data: BarChartDatum[] }) {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const max = Math.max(1, ...data.map((d) => d.value));

  return (
    <div className="viz-root">
      <style>{`
        .viz-root {
          --surface-1: #fcfcfb;
          --text-primary: #0b0b0b;
          --text-secondary: #52514e;
          --text-muted: #898781;
          --gridline: #e1e0d9;
          --baseline: #c3c2b7;
          --bar-fill: #2a78d6;
          --tooltip-bg: #0b0b0b;
          --tooltip-text: #f0efec;
        }
        @media (prefers-color-scheme: dark) {
          :root:where(:not([data-theme="light"])) .viz-root {
            --surface-1: #1a1a19;
            --text-primary: #f0efec;
            --text-secondary: #c3c2b7;
            --text-muted: #898781;
            --gridline: #2c2c2a;
            --baseline: #383835;
            --bar-fill: #3987e5;
            --tooltip-bg: #f0efec;
            --tooltip-text: #0b0b0b;
          }
        }
        :root[data-theme="dark"] .viz-root {
          --surface-1: #1a1a19;
          --text-primary: #f0efec;
          --text-secondary: #c3c2b7;
          --text-muted: #898781;
          --gridline: #2c2c2a;
          --baseline: #383835;
          --bar-fill: #3987e5;
          --tooltip-bg: #f0efec;
          --tooltip-text: #0b0b0b;
        }
      `}</style>

      <div
        className="relative flex h-40 items-end gap-1.5 border-b"
        style={{ borderColor: "var(--baseline)" }}
      >
        {data.map((d, i) => {
          const heightPct = (d.value / max) * 100;
          return (
            <div
              key={d.label}
              className="group relative flex h-full min-w-0 flex-1 flex-col items-center justify-end"
              onMouseEnter={() => setHoverIndex(i)}
              onMouseLeave={() => setHoverIndex(null)}
            >
              {hoverIndex === i && (
                <div
                  className="absolute -top-8 z-10 whitespace-nowrap rounded px-2 py-1 text-xs font-medium"
                  style={{
                    background: "var(--tooltip-bg)",
                    color: "var(--tooltip-text)",
                  }}
                >
                  {d.value}
                </div>
              )}
              <div
                className="w-full rounded-t"
                style={{
                  height: `${Math.max(heightPct, d.value > 0 ? 3 : 0)}%`,
                  background: "var(--bar-fill)",
                  opacity: hoverIndex === null || hoverIndex === i ? 1 : 0.55,
                  transition: "opacity 120ms ease",
                }}
              />
            </div>
          );
        })}
      </div>
      <div className="mt-1.5 flex gap-1.5">
        {data.map((d) => (
          <div
            key={d.label}
            className="min-w-0 flex-1 truncate text-center text-[10px]"
            style={{ color: "var(--text-muted)" }}
          >
            {d.label}
          </div>
        ))}
      </div>
    </div>
  );
}
