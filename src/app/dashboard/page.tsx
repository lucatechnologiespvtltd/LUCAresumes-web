"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged, signOut, User } from "firebase/auth";
import { collection, getDocs, addDoc, query, deleteDoc, doc, getDoc, setDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { 
  FileText, 
  Plus, 
  Search, 
  LogOut, 
  Layout, 
  Sparkles, 
  Trash2, 
  Clock, 
  ExternalLink,
  ChevronRight,
  TrendingUp,
  FolderOpen,
  RefreshCw,
  Zap,
  MessageSquare,
  BarChart3,
  FileEdit,
  Briefcase,
  Copy,
  Download,
  Share2
} from "lucide-react";
import "./dashboard.css";

// Interface for Resume
interface Resume {
  id: string;
  fullName: string;
  jobTitle: string;
  updatedAt: string;
  templateName: string;
  completionPercent?: number;
  status?: "Draft" | "Complete" | "Shared";
}

// Initial mock data as safety fallback in offline/dev setup
const MOCK_RESUMES: Resume[] = [
  {
    id: "mock-1",
    fullName: "Pavel G.",
    jobTitle: "Senior Java & Cloud Architect",
    updatedAt: "2026-06-17",
    templateName: "Executive Pro",
    completionPercent: 90,
    status: "Complete"
  },
  {
    id: "mock-2",
    fullName: "Pavel G.",
    jobTitle: "Spring Boot Specialist",
    updatedAt: "2026-06-15",
    templateName: "Modern Free",
    completionPercent: 75,
    status: "Draft"
  }
];

export default function DashboardPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"updatedAt" | "jobTitle" | "templateName">("updatedAt");
  const [activeTab, setActiveTab] = useState<"resumes" | "templates" | "tools">("resumes");
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [activeTool, setActiveTool] = useState<string | null>(null);

  // Premium / Razorpay states
  const [isPro, setIsPro] = useState(false);
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<"monthly" | "yearly" | "lifetime">("lifetime");

  // Authenticate user state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setCurrentUser(user);
        loadUserResumes(user.uid);
        loadUserStatus(user.uid);
      } else {
        // Redirect to login if unauthenticated
        router.push("/login");
      }
    });

    return () => unsubscribe();
  }, [router]);

  // Load user Pro status from Firestore
  const loadUserStatus = async (uid: string) => {
    try {
      const userDocRef = doc(db, "users", uid);
      const userSnap = await getDoc(userDocRef);
      if (userSnap.exists()) {
        const data = userSnap.data();
        setIsPro(!!data.isPro);
      } else {
        // Default to free
        await setDoc(userDocRef, { isPro: false, email: auth.currentUser?.email || "" }, { merge: true });
        setIsPro(false);
      }
    } catch (err) {
      console.warn("Firestore user read error, defaulting to free status:", err);
      setIsPro(false);
    }
  };

  // Dynamically load Razorpay SDK script
  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      if ((window as any).Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handlePayment = async () => {
    if (!currentUser) return;
    setPaymentLoading(true);
    
    // Load Razorpay Script
    const loaded = await loadRazorpayScript();
    if (!loaded) {
      alert("Failed to load Razorpay SDK. Please check your network.");
      setPaymentLoading(false);
      return;
    }

    try {
      // 1. Calculate amount based on selected plan (₹99 monthly, ₹599 yearly, ₹2999 lifetime)
      let amountPaise = 299900; // default lifetime
      let planName = "Lifetime Plan";
      if (selectedPlan === "monthly") {
        amountPaise = 9900;
        planName = "Monthly Plan";
      } else if (selectedPlan === "yearly") {
        amountPaise = 59900;
        planName = "Yearly Plan";
      }

      // Create order on backend
      const orderResponse = await fetch("/api/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: amountPaise,
          currency: "INR",
          receipt: `rcpt_${currentUser.uid.slice(0, 8)}_${Date.now()}`
        })
      });

      if (!orderResponse.ok) {
        const errorData = await orderResponse.json();
        throw new Error(errorData.error || "Failed to create order on backend");
      }

      const orderData = await orderResponse.json();
      const { order_id, key_id } = orderData;

      const keyId = key_id || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "rzp_test_T3Ptu4ooN4x0az";

      // 2. Configure checkout options
      const options = {
        key: keyId,
        amount: amountPaise,
        currency: "INR",
        name: "LUCAresume Pro",
        description: `${planName} - Premium Templates & Feature Unlock`,
        order_id: order_id,
        handler: async function (response: any) {
          setPaymentLoading(true);
          try {
            // 3. Verify payment signature on backend
            const verifyResponse = await fetch("/api/verify-payment", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature
              })
            });

            if (!verifyResponse.ok) {
              const verifyError = await verifyResponse.json();
              throw new Error(verifyError.error || "Signature verification failed");
            }

            // Upgraded successfully, update firestore
            const userDocRef = doc(db, "users", currentUser.uid);
            await setDoc(userDocRef, {
              isPro: true,
              planType: selectedPlan,
              paymentId: response.razorpay_payment_id,
              orderId: response.razorpay_order_id,
              updatedAt: new Date().toISOString()
            }, { merge: true });

            setIsPro(true);
            setIsUpgradeModalOpen(false);
            alert("Success! Your account has been upgraded to Premium Pro.");
          } catch (err: any) {
            console.error("Signature verification / DB update failed:", err);
            alert(`Payment verification failed: ${err.message || "Please contact support if amount was debited."}`);
          } finally {
            setPaymentLoading(false);
          }
        },
        prefill: {
          name: currentUser.displayName || "",
          email: currentUser.email || ""
        },
        theme: {
          color: "#3d5ce0"
        },
        modal: {
          ondismiss: function () {
            setPaymentLoading(false);
            alert("Checkout closed. Payment cancelled by user.");
          }
        }
      };

      const rzp = new (window as any).Razorpay(options);
      
      rzp.on("payment.failed", function (response: any) {
        const diagnostic: any = {};
        try {
          if (response) {
            Object.getOwnPropertyNames(response).forEach(key => {
              diagnostic[key] = response[key];
            });
            if (response.error) {
              diagnostic.error = {};
              Object.getOwnPropertyNames(response.error).forEach(key => {
                diagnostic.error[key] = response.error[key];
              });
              if (response.error.metadata) {
                diagnostic.error.metadata = {};
                Object.getOwnPropertyNames(response.error.metadata).forEach(key => {
                  diagnostic.error.metadata[key] = response.error.metadata[key];
                });
              }
            }
          }
        } catch (e) {
          console.error("Failed to serialize diagnostic details:", e);
        }

        console.error("Payment execution failed. Diagnostic Raw:", response);
        console.error("Payment execution failed. Diagnostic Enumerable:", diagnostic);

        const desc = diagnostic.error?.description || diagnostic.description || "An error occurred during payment.";
        alert(`Payment Failed: ${desc}`);
        setPaymentLoading(false);
      });

      rzp.open();
    } catch (err: any) {
      console.error("Razorpay integration error:", err);
      alert(`Checkout failed: ${err.message || "Failed to initialize payment."}`);
      setPaymentLoading(false);
    }
  };

  // Load resumes from Firestore users/{uid}/resumes
  const loadUserResumes = async (uid: string) => {
    try {
      const q = query(collection(db, "users", uid, "resumes"));
      const querySnapshot = await getDocs(q);
      const list: Resume[] = [];
      querySnapshot.forEach((docSnapshot) => {
        const data = docSnapshot.data();
        const xpCount = data.experience?.length || 0;
        const eduCount = data.education?.length || 0;
        const skillsCount = data.skills?.length || 0;
        let progress = 45;
        if (data.fullName) progress += 10;
        if (data.jobTitle) progress += 10;
        if (data.summary) progress += 10;
        progress += Math.min(xpCount * 10, 15);
        progress += Math.min(eduCount * 5, 5);
        progress += Math.min(skillsCount * 2, 5);

        list.push({
          id: docSnapshot.id,
          fullName: data.fullName || "Untitled Resume",
          jobTitle: data.jobTitle || "No Title",
          updatedAt: data.updatedAt || new Date().toISOString().split('T')[0],
          templateName: data.templateName || "Modern Free",
          completionPercent: Math.min(progress, 100),
          status: data.summary ? "Complete" : "Draft"
        });
      });

      // If database is empty, load mock data for premium developer presentation
      if (list.length === 0) {
        setResumes(MOCK_RESUMES);
      } else {
        setResumes(list);
      }
    } catch (err) {
      console.warn("Firestore access error, loading offline mock data:", err);
      setResumes(MOCK_RESUMES);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateResume = (templateName?: string) => {
    const isProTemplate = templateName === "Executive Pro" || templateName === "Google Style Pro";
    if (isProTemplate && !isPro) {
      setIsUpgradeModalOpen(true);
      return;
    }
    let url = "/builder?new=true";
    if (templateName) {
      url += `&template=${encodeURIComponent(templateName)}`;
    }
    router.push(url);
  };

  const handleDeleteResume = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Stop navigation click
    if (!currentUser) return;
    setIsDeleting(id);
    try {
      if (!id.startsWith("mock-") && !id.startsWith("local-")) {
        await deleteDoc(doc(db, "users", currentUser.uid, "resumes", id));
      }
      setResumes(prev => prev.filter(res => res.id !== id));
    } catch (err) {
      console.error("Delete failed:", err);
      // Fallback local deletion
      setResumes(prev => prev.filter(res => res.id !== id));
    } finally {
      setIsDeleting(null);
    }
  };

  const handleDuplicateResume = async (resumeToDup: Resume, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!currentUser) return;
    setLoading(true);
    try {
      const newId = crypto.randomUUID();
      const newJobTitle = `${resumeToDup.jobTitle} (Copy)`;
      const newResume: Resume = {
        ...resumeToDup,
        id: newId,
        jobTitle: newJobTitle,
        updatedAt: new Date().toISOString().split('T')[0]
      };

      if (!resumeToDup.id.startsWith("mock-")) {
        // Clone Firestore document
        const docRef = doc(db, "users", currentUser.uid, "resumes", resumeToDup.id);
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          const originalData = snap.data();
          const dupData = {
            ...originalData,
            jobTitle: newJobTitle,
            updatedAt: new Date().toISOString().split('T')[0]
          };
          await setDoc(doc(db, "users", currentUser.uid, "resumes", newId), dupData);
        }
      }
      
      setResumes(prev => {
        const index = prev.findIndex(r => r.id === resumeToDup.id);
        const list = [...prev];
        if (index !== -1) {
          list.splice(index + 1, 0, newResume);
        } else {
          list.unshift(newResume);
        }
        return list;
      });
      alert(`Resume "${resumeToDup.jobTitle}" duplicated successfully!`);
    } catch (err) {
      console.error("Duplicate failed:", err);
      alert("Failed to duplicate resume.");
    } finally {
      setLoading(false);
    }
  };

  const handleEditResumeDetails = async (resume: Resume, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!currentUser) return;
    
    const newJobTitle = prompt("Enter new Job Title (e.g. software, designer):", resume.jobTitle);
    if (newJobTitle === null) return;
    
    const newFullName = prompt("Enter new Full Name (e.g. Pavan Kumar):", resume.fullName);
    if (newFullName === null) return;

    if (!newJobTitle.trim() || !newFullName.trim()) {
      alert("Job Title and Full Name cannot be empty.");
      return;
    }

    setLoading(true);
    try {
      if (!resume.id.startsWith("mock-")) {
        const docRef = doc(db, "users", currentUser.uid, "resumes", resume.id);
        await setDoc(docRef, {
          jobTitle: newJobTitle,
          fullName: newFullName,
          updatedAt: new Date().toISOString().split('T')[0]
        }, { merge: true });
      }
      
      setResumes(prev => prev.map(r => r.id === resume.id ? {
        ...r,
        jobTitle: newJobTitle,
        fullName: newFullName,
        updatedAt: new Date().toISOString().split('T')[0]
      } : r));
      
      alert("Resume details updated successfully!");
    } catch (err) {
      console.error("Rename failed:", err);
      alert("Failed to update resume details.");
    } finally {
      setLoading(false);
    }
  };

  const handleShareResume = (resumeToShare: Resume, e: React.MouseEvent) => {
    e.stopPropagation();
    const shareUrl = `${window.location.origin}/builder?id=${resumeToShare.id}`;
    navigator.clipboard.writeText(shareUrl)
      .then(() => {
        alert("Public share link copied to clipboard!");
      })
      .catch(err => {
        console.error("Failed to copy share link:", err);
        alert(`Share Link: ${shareUrl}`);
      });
  };

  const getTemplateDesc = (name: string) => {
    if (name === "Modern Free") return "Clean, ATS-friendly format ideal for freshers.";
    if (name === "Minimalist Clean") return "Simple, ultra-clean design with generous spacing.";
    if (name === "Academic Classic") return "Traditional serif style for researchers and graduates.";
    if (name === "Compact Grid") return "High-density grid layout for short portfolios.";
    if (name === "Executive Pro") return "Premium bold format for managers and architects.";
    if (name === "Google Style Pro") return "High-ATS standard layout mimicking top tech CVs.";
    if (name === "Tech Innovator") return "Console/monospace-accented layout for developers.";
    if (name === "Creative Spark") return "Vibrant, double-accent split layout for creative fields.";
    if (name === "Corporate Solid") return "Traditional Times-serif style for classic corporate firms.";
    if (name === "Startup Edge") return "Clean modern layouts with bold section highlights.";
    return "Premium recruiter-approved layout.";
  };

  const renderMockThumbnail = (templateName: string) => {
    const nameLower = templateName.toLowerCase();
    const isSidebar = nameLower.includes("tech") || nameLower.includes("silicon") || nameLower.includes("skyline") || nameLower.includes("creative") || nameLower.includes("metro") || nameLower.includes("indigo");
    
    if (isSidebar) {
      return (
        <div className="mini-thumbnail sidebar-layout">
          <div className="mini-sidebar">
            <div className="mini-avatar"></div>
            <div className="mini-line short"></div>
            <div className="mini-line short"></div>
          </div>
          <div className="mini-content">
            <div className="mini-header-line"></div>
            <div className="mini-line"></div>
            <div className="mini-line"></div>
            <div className="mini-line medium"></div>
          </div>
        </div>
      );
    }
    
    return (
      <div className="mini-thumbnail classic-layout">
        <div className="mini-header">
          <div className="mini-header-center"></div>
          <div className="mini-header-sub"></div>
        </div>
        <div className="mini-section">
          <div className="mini-section-title"></div>
          <div className="mini-line"></div>
          <div className="mini-line medium"></div>
        </div>
        <div className="mini-section">
          <div className="mini-section-title"></div>
          <div className="mini-line"></div>
          <div className="mini-line short"></div>
        </div>
      </div>
    );
  };

  const handleLogout = async () => {
    setLoading(true);
    try {
      await signOut(auth);
      router.push("/login");
    } catch (err) {
      console.error("Logout failed:", err);
      router.push("/login");
    }
  };

  const handleLaunchTool = (toolName: string) => {
    setActiveTool(toolName);
  };

  // Filter and Sort resumes
  const filteredResumes = resumes
    .filter(res => 
      res.jobTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      res.fullName.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      if (sortBy === "updatedAt") {
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      } else if (sortBy === "jobTitle") {
        return a.jobTitle.localeCompare(b.jobTitle);
      } else {
        return a.templateName.localeCompare(b.templateName);
      }
    });

  if (loading && !currentUser) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-deep" style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100vh", backgroundColor: "var(--bg-deep)", gap: "1rem" }}>
        <RefreshCw className="animate-spin" size={36} style={{ color: "var(--primary-light)" }} />
        <p style={{ color: "var(--text-muted)", fontFamily: "var(--font-outfit)", fontWeight: 500 }}>Securing User Isolation Tunnel...</p>
      </div>
    );
  }

  return (
    <div className="dash-container">
      {/* Top Navigation */}
      <nav className="dash-nav">
        <div className="brand-logo" onClick={() => router.push("/dashboard")}>
          <span className="brand-name">LUCA</span>
          <span className="brand-dot"></span>
          <span className="brand-sub">resume</span>
        </div>

        <div className="dash-nav-user">
          <div className="user-badge">
            <div className="user-avatar">
              {currentUser?.email ? currentUser.email[0].toUpperCase() : "U"}
            </div>
            <span>{currentUser?.email || "pa1velagana@gmail.com"}</span>
            {isPro && <span className="pro-user-badge">PRO</span>}
          </div>
          
          <button 
            type="button" 
            className="btn-secondary" 
            onClick={handleLogout}
            style={{ padding: "0.5rem 1rem", borderRadius: "10px", fontSize: "0.9rem", color: "#fca5a5" }}
          >
            <LogOut size={16} />
            <span>Sign Out</span>
          </button>
        </div>
      </nav>

      {/* Main Dashboard Body */}
      <main className="dash-body">
        {/* Upgrade Pro Banner Banner */}
        {!isPro && (
          <div className="premium-banner">
            <div className="banner-content">
              <h2 className="banner-title flex items-center gap-2" style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <Sparkles size={24} className="text-gradient" />
                <span>Unlock 20+ Premium Pro Resume Layouts</span>
              </h2>
              <p className="banner-desc">
                Upgrade to Pro to access Google, Meta, ATS-Friendly patterns, and unlimited AI assistant requests.
              </p>
            </div>
            <button 
              type="button" 
              className="btn-premium banner-btn"
              onClick={() => setIsUpgradeModalOpen(true)}
            >
              Upgrade to Pro
            </button>
          </div>
        )}

        {/* Section Tabs */}
        <div className="dash-tabs">
          <button 
            type="button" 
            className={`dash-tab-btn ${activeTab === "resumes" ? "active" : ""}`}
            onClick={() => setActiveTab("resumes")}
          >
            My Resumes
            <span className="tab-badge-count">{resumes.length}</span>
          </button>
          <button 
            type="button" 
            className={`dash-tab-btn ${activeTab === "templates" ? "active" : ""}`}
            onClick={() => setActiveTab("templates")}
          >
            Browse Templates
            <span className="tab-badge-count templates-badge">20+</span>
          </button>
          <button 
            type="button" 
            className={`dash-tab-btn ${activeTab === "tools" ? "active" : ""}`}
            onClick={() => setActiveTab("tools")}
          >
            AI Copilot Suite
            <span className="tab-badge-count tools-badge">4</span>
          </button>
        </div>

        {activeTab === "resumes" && (
          <>
            {/* Search and Action Row */}
            <div className="section-header">
              <h3 className="section-title" style={{ fontSize: "2.25rem", fontWeight: 800 }}>
                My Workspace
                <span style={{ fontSize: "1.2rem", fontWeight: 600, color: "var(--text-muted)" }}>({filteredResumes.length})</span>
              </h3>

              <div className="flex gap-4" style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
                <div className="search-box">
                  <Search size={16} className="search-icon" />
                  <input 
                    type="text" 
                    placeholder="Search by job or keyword..." 
                    className="search-input"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <div className="sort-box">
                  <select
                    className="sort-select"
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                  >
                    <option value="updatedAt">Last Edited</option>
                    <option value="jobTitle">Job Title</option>
                    <option value="templateName">Template</option>
                  </select>
                </div>

                <button 
                  type="button" 
                  className="btn-premium" 
                  onClick={() => handleCreateResume()}
                  style={{ padding: "0.55rem 1.25rem", borderRadius: "12px", fontSize: "0.9rem" }}
                >
                  <Plus size={16} />
                  <span>Create Resume</span>
                </button>
              </div>
            </div>

            {/* Resume grid */}
            {filteredResumes.length === 0 ? (
              <div className="empty-state-container glass-panel">
                <FolderOpen size={48} style={{ color: "var(--text-dark)" }} />
                <h4 className="empty-state-title">No matching resumes found</h4>
                <p className="empty-state-desc">
                  Start constructing your professional portfolio now. Click "Create Resume" to select a baseline format.
                </p>
                <button type="button" className="btn-premium" onClick={() => handleCreateResume()}>
                  <Plus size={16} />
                  <span>Bootstrap First Resume</span>
                </button>
              </div>
            ) : (
              <div className="resumes-grid">
                <div className="resume-card-empty" onClick={() => handleCreateResume()}>
                  <Plus size={24} />
                  <span>Create New Resume</span>
                </div>

                {filteredResumes.map((resume) => (
                  <div 
                    key={resume.id} 
                    className="resume-card glass-panel"
                    onClick={() => router.push(`/builder?id=${resume.id}`)}
                  >
                    {/* Hover actions panel overlay */}
                    <div className="card-hover-overlay" onClick={(e) => e.stopPropagation()}>
                      <div className="hover-actions-title">Quick Actions</div>
                      <div className="hover-actions-buttons-grid">
                        <button 
                          type="button" 
                          className="hover-action-btn primary-btn"
                          onClick={() => router.push(`/builder?id=${resume.id}`)}
                        >
                          <FolderOpen size={13} />
                          <span>Open</span>
                        </button>
                        
                        <button 
                          type="button" 
                          className="hover-action-btn secondary-btn"
                          onClick={(e) => handleEditResumeDetails(resume, e)}
                        >
                          <FileEdit size={13} />
                          <span>Edit Details</span>
                        </button>

                        <div className="btn-row-split">
                          <button 
                            type="button" 
                            className="hover-action-btn split-btn"
                            onClick={(e) => handleDuplicateResume(resume, e)}
                          >
                            <Copy size={13} />
                            <span>Copy</span>
                          </button>
                          
                          <button 
                            type="button" 
                            className="hover-action-btn split-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push(`/builder?id=${resume.id}&print=true`);
                            }}
                          >
                            <Download size={13} />
                            <span>Print</span>
                          </button>
                        </div>

                        <div className="btn-row-split">
                          <button 
                            type="button" 
                            className="hover-action-btn split-btn"
                            onClick={(e) => handleShareResume(resume, e)}
                          >
                            <Share2 size={13} />
                            <span>Share</span>
                          </button>
                          
                          <button 
                            type="button" 
                            className="hover-action-btn split-btn delete"
                            onClick={(e) => handleDeleteResume(resume.id, e)}
                            disabled={isDeleting === resume.id}
                          >
                            <Trash2 size={13} />
                            <span>{isDeleting === resume.id ? "..." : "Delete"}</span>
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="card-body-content">
                      {/* Left: Mini Visual Preview */}
                      {renderMockThumbnail(resume.templateName)}
                      
                      {/* Right: Info & Progress */}
                      <div className="card-info-main">
                        <div className="card-details-header">
                          <h4 className="card-title">{resume.jobTitle}</h4>
                          <p className="card-subtitle">{resume.fullName}</p>
                        </div>
                        
                        {/* Completion progress bar */}
                        <div className="card-completion-wrap">
                          <div className="completion-text-row">
                            <span>Progress</span>
                            <span>{resume.completionPercent || 85}%</span>
                          </div>
                          <div className="completion-bar-bg">
                            <div className="completion-bar-fill" style={{ width: `${resume.completionPercent || 85}%` }}></div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="card-footer">
                      <div style={{ display: "flex", gap: "0.4rem", alignItems: "center" }}>
                        <span 
                          className="status-badge" 
                          title={getTemplateDesc(resume.templateName)}
                          style={{ cursor: "help" }}
                        >
                          {resume.templateName}
                        </span>
                        <span className={`status-badge-state ${(resume.status || "Draft").toLowerCase()}`}>
                          {resume.status || "Draft"}
                        </span>
                      </div>
                      <span className="flex items-center gap-1" style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
                        <Clock size={12} />
                        <span>{resume.updatedAt}</span>
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {activeTab === "templates" && (
          <div>
            <div className="section-header">
              <h3 className="section-title">Layout Catalog</h3>
            </div>
            
            <div className="resumes-grid">
              {/* Free Templates */}
              <div className="resume-card glass-panel" style={{ height: "240px", cursor: "default" }}>
                <div className="card-top">
                  <div className="card-icon" style={{ background: "rgba(6, 182, 212, 0.1)", color: "var(--accent-cyan)" }}><Layout size={20} /></div>
                  <span style={{ fontSize: "0.75rem", padding: "0.25rem 0.5rem", borderRadius: "99px", background: "rgba(6, 182, 212, 0.1)", color: "var(--accent-cyan)", fontWeight: 600 }}>FREE</span>
                </div>
                <div className="card-details">
                  <h4 className="card-title">Modern Free</h4>
                  <p className="card-subtitle">Clean, ATS-friendly format ideal for freshers.</p>
                </div>
                <button type="button" className="btn-secondary" style={{ width: "100%", padding: "0.5rem", fontSize: "0.85rem", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.25rem" }} onClick={() => handleCreateResume("Modern Free")}>
                  <span>Use Template</span>
                  <ChevronRight size={14} />
                </button>
              </div>

              <div className="resume-card glass-panel" style={{ height: "240px", cursor: "default" }}>
                <div className="card-top">
                  <div className="card-icon" style={{ background: "rgba(6, 182, 212, 0.1)", color: "var(--accent-cyan)" }}><Layout size={20} /></div>
                  <span style={{ fontSize: "0.75rem", padding: "0.25rem 0.5rem", borderRadius: "99px", background: "rgba(6, 182, 212, 0.1)", color: "var(--accent-cyan)", fontWeight: 600 }}>FREE</span>
                </div>
                <div className="card-details">
                  <h4 className="card-title">Classic Free</h4>
                  <p className="card-subtitle">Traditional layout tailored for corporate veterans.</p>
                </div>
                <button type="button" className="btn-secondary" style={{ width: "100%", padding: "0.5rem", fontSize: "0.85rem", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.25rem" }} onClick={() => handleCreateResume("Classic Free")}>
                  <span>Use Template</span>
                  <ChevronRight size={14} />
                </button>
              </div>

              {/* Premium Pro Templates */}
              <div className="resume-card glass-panel" style={{ height: "240px", cursor: "default", border: "1px solid rgba(139, 92, 246, 0.3)" }}>
                <div className="card-top">
                  <div className="card-icon"><Layout size={20} /></div>
                  <span style={{ fontSize: "0.75rem", padding: "0.25rem 0.5rem", borderRadius: "99px", background: "var(--grad-premium)", color: "#fff", fontWeight: 600 }}>PRO</span>
                </div>
                <div className="card-details">
                  <h4 className="card-title">Executive Pro</h4>
                  <p className="card-subtitle">Designed for tech architects and manager profiles.</p>
                </div>
                <button 
                  type="button" 
                  className={isPro ? "btn-secondary" : "btn-premium"} 
                  style={{ width: "100%", padding: "0.5rem", fontSize: "0.85rem", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.25rem" }}
                  onClick={() => handleCreateResume("Executive Pro")}
                >
                  {!isPro && <Sparkles size={12} />}
                  <span>{isPro ? "Use Template" : "Unlock Template"}</span>
                </button>
              </div>

              <div className="resume-card glass-panel" style={{ height: "240px", cursor: "default", border: "1px solid rgba(139, 92, 246, 0.3)" }}>
                <div className="card-top">
                  <div className="card-icon"><Layout size={20} /></div>
                  <span style={{ fontSize: "0.75rem", padding: "0.25rem 0.5rem", borderRadius: "99px", background: "var(--grad-premium)", color: "#fff", fontWeight: 600 }}>PRO</span>
                </div>
                <div className="card-details">
                  <h4 className="card-title">Google Style Pro</h4>
                  <p className="card-subtitle">Minimalist single-column high-scoring ATS template.</p>
                </div>
                <button 
                  type="button" 
                  className={isPro ? "btn-secondary" : "btn-premium"} 
                  style={{ width: "100%", padding: "0.5rem", fontSize: "0.85rem", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.25rem" }}
                  onClick={() => handleCreateResume("Google Style Pro")}
                >
                  {!isPro && <Sparkles size={12} />}
                  <span>{isPro ? "Use Template" : "Unlock Template"}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === "tools" && (
          <div className="ai-tools-tab">
            <div className="section-header">
              <h3 className="section-title flex items-center gap-2" style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <Sparkles size={18} style={{ color: "#10b981" }} />
                <span>AI Copilot & Career Tools</span>
              </h3>
            </div>
            
            <div className="resumes-grid" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))" }}>
              {/* Cover Letter Card */}
              <div className="resume-card glass-panel" style={{ height: "auto", cursor: "default", padding: "1.5rem", border: "1px solid rgba(255, 255, 255, 0.08)" }}>
                <div className="card-top" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div className="card-icon" style={{ background: "rgba(139, 92, 246, 0.1)", color: "var(--primary-light)" }}>
                    <FileEdit size={24} />
                  </div>
                  {!isPro && <span className="pro-badge-mini">PRO</span>}
                </div>
                <h4 className="card-title" style={{ marginTop: "1rem", fontSize: "1.1rem", fontWeight: "700", color: "#fff" }}>AI Cover Letter Generator</h4>
                <p className="card-subtitle" style={{ fontSize: "0.82rem", color: "var(--text-muted)", margin: "0.5rem 0 1.25rem 0", lineHeight: "1.4" }}>
                  Instantly generate tailored, high-converting cover letters mapping your resume profile directly to specific job descriptions.
                </p>
                <button 
                  type="button" 
                  className={isPro ? "btn-secondary" : "btn-premium"}
                  style={{ width: "100%", padding: "0.6rem", fontSize: "0.85rem" }}
                  onClick={() => isPro ? handleLaunchTool("Cover Letter") : setIsUpgradeModalOpen(true)}
                >
                  <span>{isPro ? "Generate Cover Letter" : "Upgrade to Unlock"}</span>
                </button>
              </div>

              {/* Job Application Tracker */}
              <div className="resume-card glass-panel" style={{ height: "auto", cursor: "default", padding: "1.5rem", border: "1px solid rgba(255, 255, 255, 0.08)" }}>
                <div className="card-top" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div className="card-icon" style={{ background: "rgba(6, 182, 212, 0.1)", color: "var(--accent-cyan)" }}>
                    <Briefcase size={24} />
                  </div>
                </div>
                <h4 className="card-title" style={{ marginTop: "1rem", fontSize: "1.1rem", fontWeight: "700", color: "#fff" }}>Application Kanban Tracker</h4>
                <p className="card-subtitle" style={{ fontSize: "0.82rem", color: "var(--text-muted)", margin: "0.5rem 0 1.25rem 0", lineHeight: "1.4" }}>
                  Manage and track your active job applications across interview stages, offer stages, and follow-ups.
                </p>
                <button 
                  type="button" 
                  className="btn-secondary"
                  style={{ width: "100%", padding: "0.6rem", fontSize: "0.85rem" }}
                  onClick={() => handleLaunchTool("Kanban Tracker")}
                >
                  <span>Open Kanban Board</span>
                </button>
              </div>

              {/* Mock Interview Prep */}
              <div className="resume-card glass-panel" style={{ height: "auto", cursor: "default", padding: "1.5rem", border: "1px solid rgba(255, 255, 255, 0.08)" }}>
                <div className="card-top" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div className="card-icon" style={{ background: "rgba(236, 72, 153, 0.1)", color: "var(--accent-pink)" }}>
                    <MessageSquare size={24} />
                  </div>
                  {!isPro && <span className="pro-badge-mini">PRO</span>}
                </div>
                <h4 className="card-title" style={{ marginTop: "1rem", fontSize: "1.1rem", fontWeight: "700", color: "#fff" }}>AI Mock Interview Prep</h4>
                <p className="card-subtitle" style={{ fontSize: "0.82rem", color: "var(--text-muted)", margin: "0.5rem 0 1.25rem 0", lineHeight: "1.4" }}>
                  Simulate mock interviews with customized behavior and technical questions matching your specific target job title.
                </p>
                <button 
                  type="button" 
                  className={isPro ? "btn-secondary" : "btn-premium"}
                  style={{ width: "100%", padding: "0.6rem", fontSize: "0.85rem" }}
                  onClick={() => isPro ? handleLaunchTool("Mock Interview") : setIsUpgradeModalOpen(true)}
                >
                  <span>{isPro ? "Start Mock Interview" : "Upgrade to Unlock"}</span>
                </button>
              </div>

              {/* Analytics */}
              <div className="resume-card glass-panel" style={{ height: "auto", cursor: "default", padding: "1.5rem", border: "1px solid rgba(255, 255, 255, 0.08)" }}>
                <div className="card-top" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div className="card-icon" style={{ background: "rgba(16, 185, 129, 0.1)", color: "#10b981" }}>
                    <BarChart3 size={24} />
                  </div>
                  {!isPro && <span className="pro-badge-mini">PRO</span>}
                </div>
                <h4 className="card-title" style={{ marginTop: "1rem", fontSize: "1.1rem", fontWeight: "700", color: "#fff" }}>Resume Views & ATS Score</h4>
                <p className="card-subtitle" style={{ fontSize: "0.82rem", color: "var(--text-muted)", margin: "0.5rem 0 1.25rem 0", lineHeight: "1.4" }}>
                  Track views and downloads on your hosted resumes, and execute real-time ATS optimization scoring.
                </p>
                <button 
                  type="button" 
                  className={isPro ? "btn-secondary" : "btn-premium"}
                  style={{ width: "100%", padding: "0.6rem", fontSize: "0.85rem" }}
                  onClick={() => isPro ? handleLaunchTool("Analytics") : setIsUpgradeModalOpen(true)}
                >
                  <span>{isPro ? "View Analytics" : "Upgrade to Unlock"}</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ── Upgrade Premium Pro Modal ─────────────────────────── */}
      {isUpgradeModalOpen && (
        <div className="modal-overlay" onClick={() => setIsUpgradeModalOpen(false)}>
          <div className="modal-card glass-panel" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title text-gradient">Upgrade to Premium Pro</h3>
              <p className="modal-subtitle">Unlock your full professional potential</p>
            </div>
            
            <div className="modal-features-list">
              <div className="modal-feature-item">
                <Sparkles size={18} style={{ color: "var(--primary-light)" }} />
                <div>
                  <h4>20+ Premium Pro Templates</h4>
                  <p>Access high-scoring ATS-friendly formats approved by recruiters at Google, Meta, and Apple.</p>
                </div>
              </div>

              <div className="modal-feature-item">
                <FileText size={18} style={{ color: "var(--accent-cyan)" }} />
                <div>
                  <h4>High-Fidelity PDF Vector Prints</h4>
                  <p>Export pixel-perfect selectable text files that pass scanner filters with 100% scores.</p>
                </div>
              </div>

              <div className="modal-feature-item">
                <Zap size={18} style={{ color: "var(--accent-pink)" }} />
                <div>
                  <h4>Unlimited AI Engineering Requests</h4>
                  <p>Let our AI rewrite your experience bullets and summaries with high-impact power verbs.</p>
                </div>
              </div>
            </div>

            <div className="plan-selector-container">
              <div 
                className={`plan-selector-card ${selectedPlan === "monthly" ? "active" : ""}`}
                onClick={() => setSelectedPlan("monthly")}
              >
                <div className="plan-card-info">
                  <span className="plan-title">Monthly Access</span>
                  <span className="plan-desc">Great for short-term quick updates</span>
                </div>
                <div className="plan-price">
                  <span className="plan-amt">₹99</span>
                  <span className="plan-period">/ month</span>
                </div>
              </div>

              <div 
                className={`plan-selector-card ${selectedPlan === "yearly" ? "active" : ""}`}
                onClick={() => setSelectedPlan("yearly")}
              >
                <div className="plan-badge yearly">SAVE 50%</div>
                <div className="plan-card-info">
                  <span className="plan-title">Yearly Membership</span>
                  <span className="plan-desc">For year-round career growth</span>
                </div>
                <div className="plan-price">
                  <span className="plan-amt">₹599</span>
                  <span className="plan-period">/ year</span>
                </div>
              </div>

              <div 
                className={`plan-selector-card ${selectedPlan === "lifetime" ? "active" : ""}`}
                onClick={() => setSelectedPlan("lifetime")}
              >
                <div className="plan-badge lifetime">BEST VALUE</div>
                <div className="plan-card-info">
                  <span className="plan-title">Lifetime Access</span>
                  <span className="plan-desc">Pay once, use forever. No renewals.</span>
                </div>
                <div className="plan-price">
                  <span className="plan-amt">₹2999</span>
                  <span className="plan-period">/ one-time</span>
                </div>
              </div>
            </div>

            <div className="modal-action-row">
              <button 
                type="button" 
                className="btn-secondary" 
                onClick={() => setIsUpgradeModalOpen(false)}
                disabled={paymentLoading}
              >
                Cancel
              </button>
              <button 
                type="button" 
                className="btn-premium" 
                onClick={handlePayment}
                disabled={paymentLoading}
                style={{ padding: "0.75rem 2rem" }}
              >
                {paymentLoading ? (
                  <RefreshCw className="animate-spin" size={16} />
                ) : (
                  <>
                    <Sparkles size={14} />
                    <span>Pay & Upgrade</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── AI Tool simulation Modal ─────────────────────────── */}
      {activeTool && (
        <div className="modal-overlay" onClick={() => setActiveTool(null)}>
          <div className="modal-card glass-panel" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "600px", width: "90%" }}>
            <div className="modal-header">
              <h3 className="modal-title text-gradient">{activeTool}</h3>
              <p className="modal-subtitle">Interactive AI Copilot Simulation</p>
            </div>
            
            <div style={{ padding: "1.5rem 0", color: "var(--text-light)", fontSize: "0.9rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
              {activeTool === "Cover Letter" && (
                <>
                  <p>Input target Job Description to generate a tailored cover letter mapping to your <strong>{resumes[0]?.jobTitle || "Resume"}</strong> profile:</p>
                  <textarea 
                    className="builder-textarea" 
                    placeholder="Paste the Job Description here..." 
                    rows={4} 
                    style={{ width: "100%", background: "rgba(255,255,255,0.03)", border: "1px solid var(--border-glass)", borderRadius: "8px", padding: "0.5rem", color: "#fff" }}
                  />
                  <button type="button" className="btn-premium" style={{ alignSelf: "flex-end", padding: "0.5rem 1.5rem" }} onClick={() => alert("Tailored Cover Letter generated successfully! Copied to clipboard.")}>
                    Generate with AI
                  </button>
                </>
              )}
              {activeTool === "Kanban Tracker" && (
                <>
                  <p>Organize your job pipeline:</p>
                  <div style={{ display: "flex", gap: "0.5rem", overflowX: "auto", paddingBottom: "0.5rem" }}>
                    {["Applied (3)", "Interviewing (1)", "Offer Received (0)"].map((col) => (
                      <div key={col} style={{ background: "rgba(0,0,0,0.2)", borderRadius: "8px", padding: "0.75rem", minWidth: "160px", flex: 1 }}>
                        <div style={{ fontSize: "0.75rem", fontWeight: "bold", color: "var(--text-muted)", marginBottom: "0.5rem" }}>{col}</div>
                        {col.startsWith("Applied") && (
                          <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid var(--border-glass)", borderRadius: "6px", padding: "0.4rem", fontSize: "0.75rem", marginBottom: "0.4rem" }}>
                            <strong>Java Engineer</strong>
                            <div style={{ color: "var(--text-muted)" }}>Google · Active</div>
                          </div>
                        )}
                        {col.startsWith("Interviewing") && (
                          <div style={{ background: "rgba(139,92,246,0.08)", border: "1px solid rgba(139,92,246,0.2)", borderRadius: "6px", padding: "0.4rem", fontSize: "0.75rem" }}>
                            <strong>Spring Boot Architect</strong>
                            <div style={{ color: "var(--primary-light)" }}>Meta · June 20</div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </>
              )}
              {activeTool === "Mock Interview" && (
                <>
                  <p>AI Recruiter: <em>"Tell me about a challenging distributed systems bottleneck you resolved using Spring Boot. What was the latency reduction?"</em></p>
                  <textarea 
                    className="builder-textarea" 
                    placeholder="Type your spoken answer here..." 
                    rows={3}
                    style={{ width: "100%", background: "rgba(255,255,255,0.03)", border: "1px solid var(--border-glass)", borderRadius: "8px", padding: "0.5rem", color: "#fff" }}
                  />
                  <button type="button" className="btn-premium" style={{ alignSelf: "flex-end", padding: "0.5rem 1.5rem" }} onClick={() => alert("AI Feedback: Excellent use of STAR method. Scoring 94% on domain technical competence.")}>
                    Evaluate Answer
                  </button>
                </>
              )}
              {activeTool === "Analytics" && (
                <>
                  <p>Resume Performance Statistics:</p>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "0.5rem" }}>
                    <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid var(--border-glass)", padding: "0.75rem", borderRadius: "8px", textAlign: "center" }}>
                      <div style={{ fontSize: "1.5rem", fontWeight: "bold", color: "var(--primary-light)" }}>42</div>
                      <div style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>Total Views</div>
                    </div>
                    <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid var(--border-glass)", padding: "0.75rem", borderRadius: "8px", textAlign: "center" }}>
                      <div style={{ fontSize: "1.5rem", fontWeight: "bold", color: "var(--accent-cyan)" }}>18</div>
                      <div style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>Downloads</div>
                    </div>
                    <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid var(--border-glass)", padding: "0.75rem", borderRadius: "8px", textAlign: "center" }}>
                      <div style={{ fontSize: "1.5rem", fontWeight: "bold", color: "#10b981" }}>92%</div>
                      <div style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>ATS Match Score</div>
                    </div>
                  </div>
                </>
              )}
            </div>
            
            <div className="modal-action-row">
              <button 
                type="button" 
                className="btn-secondary" 
                onClick={() => setActiveTool(null)}
              >
                Close Tool
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
