"use client";

export default function Logo({ freeMode = false, onToggleFreeMode }) {
  return (
    <button
      onClick={onToggleFreeMode}
      style={{
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        padding: 0,
        display: 'flex',
        alignItems: 'center',
      }}
      title={freeMode ? 'Free Mode ON - Click to disable' : 'Click to enable Free Mode'}
    >
      <span
        style={{
          fontSize: '15px',
          fontWeight: 600,
          color: freeMode ? '#00d4ff' : '#fff',
        }}
      >
        Cooter
      </span>
    </button>
  );
}
