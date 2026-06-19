import React from "react";

interface LogoProps {
  variant?: "full" | "icon" | "compact";
  height?: number | string;
  className?: string;
  hideIcon?: boolean;
}

export default function Logo({ variant = "full", height = 48, className = "", hideIcon = false }: LogoProps) {
  // SVG proportions: 
  // Icon only: Aspect Ratio 1:1 (e.g., width 100, height 100)
  // Full logo (Icon + Text): Aspect Ratio ~4.2:1 (e.g., width 420, height 100)
  // Compact (Icon + "LUCA <RESUME/>"): Aspect Ratio ~3:1 (e.g., width 300, height 100)
  
  if (variant === "icon") {
    return (
      <svg
        viewBox="0 0 160 160"
        style={{ height, width: "auto", display: "inline-block" }}
        className={className}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="docGrad" x1="20" y1="20" x2="110" y2="130" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#38BDF8" />
            <stop offset="100%" stopColor="#2563EB" />
          </linearGradient>
          <linearGradient id="orbitGrad" x1="10" y1="90" x2="150" y2="90" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#38BDF8" stopOpacity="0.8" />
            <stop offset="50%" stopColor="#2563EB" stopOpacity="1" />
            <stop offset="100%" stopColor="#10B981" stopOpacity="0.6" />
          </linearGradient>
          <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Orbit / Swoosh Ring */}
        <path
          d="M 15 105 C 15 125, 145 125, 145 105 C 145 85, 15 85, 15 105 Z"
          stroke="url(#orbitGrad)"
          strokeWidth="6"
          strokeLinecap="round"
          fill="none"
          filter="url(#glow)"
        />

        {/* Document Icon Background */}
        <path
          d="M 40 20 H 95 L 120 45 V 130 C 120 135, 115 140, 110 140 H 40 C 35 140, 30 135, 30 130 V 30 C 30 25, 35 20, 40 20 Z"
          fill="#0D1117"
          stroke="url(#docGrad)"
          strokeWidth="5"
          strokeLinejoin="round"
        />

        {/* Document Fold */}
        <path
          d="M 95 20 V 45 H 120"
          fill="none"
          stroke="url(#docGrad)"
          strokeWidth="5"
          strokeLinejoin="round"
        />

        {/* Document lines */}
        <line x1="50" y1="65" x2="85" y2="65" stroke="#F8FAFC" strokeWidth="4" strokeLinecap="round" opacity="0.3" />
        <line x1="50" y1="80" x2="70" y2="80" stroke="#F8FAFC" strokeWidth="4" strokeLinecap="round" opacity="0.3" />

        {/* Orbit / Swoosh Ring (Front half to wrap around the doc) */}
        <path
          d="M 15 105 C 15 125, 145 125, 145 105"
          stroke="url(#orbitGrad)"
          strokeWidth="6"
          strokeLinecap="round"
          fill="none"
          filter="url(#glow)"
        />

        {/* Code Symbol </ > inside doc */}
        <path
          d="M 62 100 L 52 108 L 62 116"
          stroke="#38BDF8"
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M 72 102 L 68 114"
          stroke="#F8FAFC"
          strokeWidth="4"
          strokeLinecap="round"
        />
        <path
          d="M 78 100 L 88 108 L 78 116"
          stroke="#38BDF8"
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Pixels/Particles on top-left */}
        <rect x="15" y="45" width="6" height="6" fill="#38BDF8" />
        <rect x="23" y="37" width="8" height="8" fill="#2563EB" />
        <rect x="15" y="27" width="5" height="5" fill="#10B981" />
        <rect x="25" y="55" width="4" height="4" fill="#38BDF8" />

        {/* Pixels/Particles on bottom-right */}
        <rect x="130" y="75" width="6" height="6" fill="#38BDF8" />
        <rect x="138" y="85" width="5" height="5" fill="#10B981" />
      </svg>
    );
  }

  // Full / Compact Layout
  return (
    <div 
      className={`select-none ${className}`} 
      style={{ 
        height, 
        display: "flex", 
        alignItems: "center", 
        gap: "1rem"
      }}
    >
      {/* Icon portion */}
      {!hideIcon && (
        <svg
          viewBox="0 0 160 160"
          style={{ height: "100%", width: "auto" }}
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
        <defs>
          <linearGradient id="docGrad2" x1="20" y1="20" x2="110" y2="130" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#38BDF8" />
            <stop offset="100%" stopColor="#2563EB" />
          </linearGradient>
          <linearGradient id="orbitGrad2" x1="10" y1="90" x2="150" y2="90" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#38BDF8" stopOpacity="0.8" />
            <stop offset="50%" stopColor="#2563EB" stopOpacity="1" />
            <stop offset="100%" stopColor="#10B981" stopOpacity="0.6" />
          </linearGradient>
          <filter id="glow2" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Orbit / Swoosh Ring */}
        <path
          d="M 15 105 C 15 125, 145 125, 145 105 C 145 85, 15 85, 15 105 Z"
          stroke="url(#orbitGrad2)"
          strokeWidth="6"
          strokeLinecap="round"
          fill="none"
          filter="url(#glow2)"
        />

        {/* Document Icon Background */}
        <path
          d="M 40 20 H 95 L 120 45 V 130 C 120 135, 115 140, 110 140 H 40 C 35 140, 30 135, 30 130 V 30 C 30 25, 35 20, 40 20 Z"
          fill="#0D1117"
          stroke="url(#docGrad2)"
          strokeWidth="5"
          strokeLinejoin="round"
        />

        {/* Document Fold */}
        <path
          d="M 95 20 V 45 H 120"
          fill="none"
          stroke="url(#docGrad2)"
          strokeWidth="5"
          strokeLinejoin="round"
        />

        {/* Document lines */}
        <line x1="50" y1="65" x2="85" y2="65" stroke="#F8FAFC" strokeWidth="4" strokeLinecap="round" opacity="0.3" />
        <line x1="50" y1="80" x2="70" y2="80" stroke="#F8FAFC" strokeWidth="4" strokeLinecap="round" opacity="0.3" />

        {/* Orbit / Swoosh Ring (Front half) */}
        <path
          d="M 15 105 C 15 125, 145 125, 145 105"
          stroke="url(#orbitGrad2)"
          strokeWidth="6"
          strokeLinecap="round"
          fill="none"
          filter="url(#glow2)"
        />

        {/* Code Symbol </ > inside doc */}
        <path
          d="M 62 100 L 52 108 L 62 116"
          stroke="#38BDF8"
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M 72 102 L 68 114"
          stroke="#F8FAFC"
          strokeWidth="4"
          strokeLinecap="round"
        />
        <path
          d="M 78 100 L 88 108 L 78 116"
          stroke="#38BDF8"
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Pixels/Particles */}
        <rect x="15" y="45" width="6" height="6" fill="#38BDF8" />
        <rect x="23" y="37" width="8" height="8" fill="#2563EB" />
        <rect x="15" y="27" width="5" height="5" fill="#10B981" />
        <rect x="25" y="55" width="4" height="4" fill="#38BDF8" />
        <rect x="130" y="75" width="6" height="6" fill="#38BDF8" />
        <rect x="138" y="85" width="5" height="5" fill="#10B981" />
        </svg>
      )}

      {/* Text portion */}
      <div 
        style={{ 
          display: "flex", 
          flexDirection: "column", 
          justifyContent: "center",
          fontFamily: "var(--font-outfit), sans-serif"
        }}
      >
        <div style={{ display: "flex", alignItems: "center", lineHeight: 1, letterSpacing: "0.05em", color: "#fff" }}>
          <span style={{ fontWeight: 800, fontSize: "1.75rem", background: "linear-gradient(to right, #fff, #cbd5e1)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            LUC
          </span>
          {/* Custom Styled "A" resembling the chevron/sparkle */}
          <span style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 2px" }}>
            <svg
              viewBox="0 0 40 40"
              style={{ width: "2.5rem", height: "2.5rem", color: "#38bdf8" }}
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Outer chevron-like structure for the "A" */}
              <path
                d="M 6 34 L 20 6 L 34 34"
                stroke="currentColor"
                strokeWidth="6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {/* 4-point Sparkle star in center */}
              <path
                d="M 20 16 C 20 20, 20 20, 24 20 C 20 20, 20 20, 20 24 C 20 20, 20 20, 16 20 C 20 20, 20 20, 20 16 Z"
                fill="#38BDF8"
                filter="drop-shadow(0px 0px 4px rgba(56, 189, 248, 0.8))"
              />
            </svg>
          </span>
        </div>
        
        {/* <RESUME/> subtitle */}
        <div style={{ display: "flex", alignItems: "center", fontSize: "0.75rem", fontWeight: "bold", color: "#38bdf8", letterSpacing: "0.25em", textTransform: "uppercase", marginTop: "2px" }}>
          <span>&lt;</span>
          <span style={{ color: "#fff", margin: "0 2px" }}>Resume</span>
          <span>/&gt;</span>
        </div>

        {/* LOGIC UNITED CODE AUTOMATION description (Only in full variant) */}
        {variant === "full" && (
          <div style={{ fontSize: "0.5rem", fontWeight: 500, letterSpacing: "0.3em", color: "#34d399", textTransform: "uppercase", marginTop: "4px", opacity: 0.8, whiteSpace: "nowrap" }}>
            Logic United Code Automation
          </div>
        )}
      </div>
    </div>
  );
}
