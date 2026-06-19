"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { 
  Sparkles, 
  FileText, 
  ShieldCheck, 
  Check, 
  ArrowRight,
  Zap,
  Star,
  Users
} from "lucide-react";
import "./landing.css";

export default function LandingPage() {
  const router = useRouter();

  const handleGetStarted = () => {
    router.push("/login");
  };

  return (
    <div>
      {/* Navbar */}
      <nav className="dash-nav" style={{ background: "transparent", borderBottom: "none" }}>
        <div className="brand-logo" onClick={() => router.push("/")}>
          <span className="brand-name">LUCA</span>
          <span className="brand-dot"></span>
          <span className="brand-sub">resume</span>
        </div>

        <button 
          type="button" 
          className="btn-secondary"
          onClick={() => router.push("/login")}
          style={{ padding: "0.5rem 1.25rem", borderRadius: "10px", fontSize: "0.9rem" }}
        >
          Sign In
        </button>
      </nav>

      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-badge">
          <Star size={12} className="animate-pulse-glow" fill="currentColor" />
          <span>Deploy ATS-Friendly Resume Layouts</span>
        </div>
        <h1 className="hero-title">
          Build Standout Resumes Powered by <span className="text-gradient">AI Engineering</span>
        </h1>
        <p className="hero-desc">
          Craft beautifully styled, high-scoring ATS-compatible resumes in seconds. Includes real-time rendering, custom template designs, and secure data isolation.
        </p>
        <div className="cta-row">
          <button type="button" className="btn-premium" onClick={handleGetStarted}>
            <span>Get Started Free</span>
            <ArrowRight size={18} />
          </button>
          <button 
            type="button" 
            className="btn-secondary"
            onClick={() => router.push("/login?tab=register")}
            style={{ padding: "0.95rem 2rem" }}
          >
            Create Account
          </button>
        </div>
      </section>

      {/* Features Showcase */}
      <section className="features-section">
        <div className="features-grid">
          <div className="feature-card glass-panel">
            <div className="feature-icon-box">
              <Sparkles size={20} />
            </div>
            <h3 className="feature-title">AI Assistant</h3>
            <p className="feature-desc">
              Generate impactful job summaries and professionally rewrite project descriptions tailored for target employers.
            </p>
          </div>

          <div className="feature-card glass-panel">
            <div className="feature-icon-box" style={{ background: "rgba(6, 182, 212, 0.1)", color: "var(--accent-cyan)" }}>
              <FileText size={20} />
            </div>
            <h3 className="feature-title">PDF Engine</h3>
            <p className="feature-desc">
              Export resumes to vector-perfect, selectable-text PDFs configured strictly to pass scanner checks.
            </p>
          </div>

          <div className="feature-card glass-panel">
            <div className="feature-icon-box" style={{ background: "rgba(16, 185, 129, 0.1)", color: "#10b981" }}>
              <ShieldCheck size={20} />
            </div>
            <h3 className="feature-title">Secure Data Isolation</h3>
            <p className="feature-desc">
              Resumes are strictly partitioned within your own user account, keeping profile details strictly private.
            </p>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="pricing-section">
        <h2 className="pricing-title">Flexible Pricing Plans</h2>
        <p className="pricing-desc">Start building for free or unlock the full premium templates collection.</p>
        
        <div className="pricing-grid">
          {/* Free Tier */}
          <div className="pricing-card glass-panel">
            <h3 className="price-title">Free Plan</h3>
            <div className="price-value">
              $0<span>/lifetime</span>
            </div>
            <ul className="price-features">
              <li>
                <Check size={16} />
                <span>5 Basic Templates</span>
              </li>
              <li>
                <Check size={16} />
                <span>Standard PDF Exports</span>
              </li>
              <li>
                <Check size={16} />
                <span>3 AI Requests / Day</span>
              </li>
              <li>
                <Check size={16} />
                <span>1 Resume Profile</span>
              </li>
            </ul>
            <button 
              type="button" 
              className="btn-secondary" 
              style={{ width: "100%" }}
              onClick={handleGetStarted}
            >
              Sign Up Free
            </button>
          </div>

          {/* Premium Tier */}
          <div className="pricing-card glass-panel premium">
            <h3 className="price-title" style={{ color: "var(--primary-light)" }}>Premium Pro</h3>
            <div className="price-value">
              $9.99<span>/month</span>
            </div>
            <ul className="price-features">
              <li>
                <Check size={16} />
                <span>20+ Premium Pro Templates</span>
              </li>
              <li>
                <Check size={16} />
                <span>Unlimited High-Fidelity Exports</span>
              </li>
              <li>
                <Check size={16} />
                <span>Unlimited AI Assistant requests</span>
              </li>
              <li>
                <Check size={16} />
                <span>Unlimited Resume Portfolios</span>
              </li>
              <li>
                <Check size={16} />
                <span>ATS Score Checker Integration</span>
              </li>
            </ul>
            <button 
              type="button" 
              className="btn-premium" 
              style={{ width: "100%" }}
              onClick={handleGetStarted}
            >
              Get Pro Access
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <p>© {new Date().getFullYear()} LUCAresume. All rights reserved. Created for premium portfolios.</p>
      </footer>
    </div>
  );
}
