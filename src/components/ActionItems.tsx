"use client";

import type { ActionItem } from "@/lib/riskScore";

interface ActionItemsProps {
  actions: ActionItem[];
}

const severityStyles: Record<string, { borderColor: string; background: string; color: string }> = {
  critical: { borderColor: "#b91c1c", background: "rgba(185, 28, 28, 0.08)", color: "#b91c1c" },
  high: { borderColor: "#92400e", background: "rgba(146, 64, 14, 0.08)", color: "#92400e" },
  medium: { borderColor: "#854d0e", background: "rgba(133, 77, 14, 0.08)", color: "#854d0e" },
  low: { borderColor: "#4b5563", background: "rgba(75, 85, 99, 0.08)", color: "#4b5563" },
};

export function ActionItems({ actions }: ActionItemsProps) {
  if (actions.length === 0) {
    return (
      <div className="rounded-xl border p-6" style={{ borderColor: "#e5e5e5", background: "rgba(22, 101, 52, 0.06)" }}>
        <h2 className="text-lg font-semibold" style={{ color: "#166534" }}>
          No critical issues found
        </h2>
        <p className="mt-2 text-sm" style={{ color: "#6e6e80" }}>
          Your attack surface looks good. Keep monitoring for changes and
          maintain security best practices.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6" style={{ borderColor: "#e5e5e5" }}>
      <h2 className="text-lg font-semibold" style={{ color: "#0d0d0d" }}>
        Remediation Priority ({actions.length})
      </h2>
      <p className="mt-1 text-sm" style={{ color: "#6e6e80" }}>
        Sorted by impact + exploitability — fix in this order
      </p>
      <ul className="mt-4 space-y-3">
        {actions.map((action, i) => (
          <li
            key={action.id}
            className="rounded-lg border p-4"
            style={severityStyles[action.severity]}
          >
            <div className="flex items-start justify-between gap-2 flex-wrap">
              <span className="rounded px-2 py-0.5 text-xs font-bold" style={{ background: "rgba(0,0,0,0.08)", color: "#0d0d0d" }}>
                #{i + 1} Priority
              </span>
              <span className="rounded px-1.5 py-0.5 text-xs font-medium uppercase">
                {action.severity}
              </span>
              {action.count !== undefined && (
                <span className="text-xs opacity-80">{action.count} found</span>
              )}
            </div>
            <h3 className="mt-2 font-medium">{action.title}</h3>
            <p className="mt-1 text-sm opacity-90">{action.description}</p>
            <p className="mt-2 text-sm font-medium">→ {action.fix}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
