import { HomeClient } from "./HomeClient";

export default function Home() {
  return (
    <main
      style={{
        minHeight: "100vh",
        padding: "3rem 1rem",
        maxWidth: "896px",
        margin: "0 auto",
        background: "#ffffff",
        color: "#0d0d0d",
      }}
    >
      <header style={{ textAlign: "center", marginBottom: "2rem" }}>
        <h1 style={{ color: "#0d0d0d", fontSize: "2rem", margin: 0, fontWeight: 600 }}>
          AM I SECURE
        </h1>
        <p style={{ color: "#6e6e80", marginTop: "0.5rem" }}>
          Domain security checker
        </p>
      </header>

      <HomeClient />
    </main>
  );
}
