"use client";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0a0f1a",
        color: "#e5e7eb",
        padding: "2rem",
        fontFamily: "system-ui, sans-serif",
      }}
    >
      <h1 style={{ color: "#ef4444", marginBottom: "1rem" }}>
        Something went wrong
      </h1>
      <pre
        style={{
          background: "#1f2937",
          padding: "1rem",
          borderRadius: "8px",
          overflow: "auto",
          marginBottom: "1rem",
        }}
      >
        {error.message}
      </pre>
      <button
        onClick={reset}
        style={{
          background: "#10b981",
          color: "white",
          padding: "0.5rem 1rem",
          border: "none",
          borderRadius: "6px",
          cursor: "pointer",
        }}
      >
        Try again
      </button>
    </div>
  );
}
