"use client";

import dynamic from "next/dynamic";
import { useState, useEffect } from "react";

// Dynamic import to avoid SSR issues with Three.js
const Game = dynamic(
  () => import("@/components/Game").catch(err => {
    console.error("Failed to load Game:", err);
    return () => <GameError error={err.message} />;
  }),
  {
    ssr: false,
    loading: () => <LoadingScreen />,
  }
);

function GameError({ error }) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100vh',
      fontFamily: 'system-ui, sans-serif',
      padding: '2rem',
      textAlign: 'center',
    }}>
      <h1 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: '#c00' }}>
        Failed to Load Game
      </h1>
      <p style={{ color: '#666', maxWidth: '400px', marginBottom: '1rem' }}>
        {error || "Unknown error occurred"}
      </p>
      <button
        onClick={() => window.location.reload()}
        style={{
          padding: '12px 24px',
          background: '#333',
          color: '#fff',
          border: 'none',
          borderRadius: '6px',
          cursor: 'pointer',
          fontSize: '14px',
        }}
      >
        Reload Page
      </button>
    </div>
  );
}

function LoadingScreen() {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setElapsed(e => e + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100vh',
      fontFamily: 'system-ui, sans-serif',
      color: '#999',
      padding: '2rem',
      textAlign: 'center',
    }}>
      <div style={{ marginBottom: '1rem' }}>Loading... ({elapsed}s)</div>
      {elapsed >= 5 && (
        <div style={{ fontSize: '14px', maxWidth: '300px', marginBottom: '1rem' }}>
          This is taking longer than expected.
        </div>
      )}
      {elapsed >= 10 && (
        <button
          onClick={() => window.location.reload()}
          style={{
            padding: '12px 24px',
            background: '#333',
            color: '#fff',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px',
          }}
        >
          Reload Page
        </button>
      )}
    </div>
  );
}

export default function Home() {
  return (
    <div id="game-container">
      <Game />
    </div>
  );
}
