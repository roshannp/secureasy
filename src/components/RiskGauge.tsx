"use client";

export function RiskGauge({
  score,
  grade,
}: {
  score: number;
  grade: string;
}) {
  const strokeColor =
    score >= 80
      ? "#166534"
      : score >= 60
        ? "#92400e"
        : "#b91c1c";

  const circumference = 2 * Math.PI * 45;
  const strokeDash = (score / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-2">
      <svg className="h-32 w-32 -rotate-90" viewBox="0 0 100 100">
        <circle
          cx="50"
          cy="50"
          r="45"
          fill="none"
          stroke="#e5e5e5"
          strokeWidth="8"
        />
        <circle
          cx="50"
          cy="50"
          r="45"
          fill="none"
          stroke={strokeColor}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference - strokeDash}
          style={{ transition: "stroke-dashoffset 0.8s ease" }}
        />
      </svg>
      <div className="text-4xl font-bold" style={{ color: strokeColor }}>{score}</div>
      <div className="text-sm" style={{ color: "#6e6e80" }}>Security Grade: {grade}</div>
    </div>
  );
}
