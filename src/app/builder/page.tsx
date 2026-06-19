"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { onAuthStateChanged, User } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import {
  ResumeData,
  ExperienceEntry,
  EducationEntry,
  ProjectEntry,
  BuilderSection,
  createDefaultResume,
  createExperienceEntry,
  createEducationEntry,
  createProjectEntry,
} from "@/lib/types";
import {
  ArrowLeft,
  User as UserIcon,
  Briefcase,
  GraduationCap,
  Wrench,
  FileText,
  Save,
  Check,
  RefreshCw,
  Plus,
  Trash2,
  Eye,
  Mail,
  Phone,
  MapPin,
  Globe,
  Download,
  Sparkles,
  FolderOpen,
} from "lucide-react";
import { TEMPLATES, getTemplateByName } from "@/lib/templates";
import "./builder.css";

// ── Custom LinkedIn Icon Component ──────────────────────────────────
const Linkedin = ({ size = 24, ...props }: React.SVGProps<SVGSVGElement> & { size?: number }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
    <rect width="4" height="12" x="2" y="9" />
    <circle cx="4" cy="4" r="2" />
  </svg>
);

// ── Debounce Hook ──────────────────────────────────────────────
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

// ── Section Tab Definitions ────────────────────────────────────
const SECTIONS: { key: BuilderSection | "templates"; label: string; icon: React.ReactNode }[] = [
  { key: "personal", label: "Personal Info", icon: <UserIcon size={15} /> },
  { key: "experience", label: "Experience", icon: <Briefcase size={15} /> },
  { key: "education", label: "Education", icon: <GraduationCap size={15} /> },
  { key: "projects", label: "Projects", icon: <FolderOpen size={15} /> },
  { key: "skills", label: "Skills", icon: <Wrench size={15} /> },
  { key: "summary", label: "Summary", icon: <FileText size={15} /> },
  { key: "templates", label: "Templates", icon: <Sparkles size={15} /> },
];

export default function BuilderPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Auth
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Resume state
  const [resumeId, setResumeId] = useState<string | null>(null);
  const [resume, setResume] = useState<ResumeData>(createDefaultResume());
  const [dataLoading, setDataLoading] = useState(true);
  const [isPro, setIsPro] = useState(false);

  // Editor
  const [activeSection, setActiveSection] = useState<BuilderSection | "templates">("personal");
  const [skillInput, setSkillInput] = useState("");

  // Save
  const [saveStatus, setSaveStatus] = useState<"saved" | "saving" | "unsaved">("saved");
  const saveCounterRef = useRef(0);
  const debouncedResume = useDebounce(resume, 1500);
  const initialLoadDone = useRef(false);

  // ── Auth Guard ─────────────────────────────────────────────
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (user) {
        setCurrentUser(user);
        loadUserStatus(user.uid);
      } else {
        router.push("/login");
      }
      setAuthLoading(false);
    });
    return () => unsub();
  }, [router]);

  const loadUserStatus = async (uid: string) => {
    try {
      const userSnap = await getDoc(doc(db, "users", uid));
      if (userSnap.exists()) {
        setIsPro(!!userSnap.data().isPro);
      }
    } catch (err) {
      console.warn("Failed to load user status in builder:", err);
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

  const handlePaymentUpgrade = async () => {
    if (!currentUser) return;
    const loaded = await loadRazorpayScript();
    if (!loaded) {
      alert("Failed to load Razorpay SDK. Please check your network.");
      return;
    }

    const options = {
      key: "rzp_test_mockkeyLUCA",
      amount: 999 * 100, // ₹999 lifetime or $9.99 in cents
      currency: "INR",
      name: "LUCAresume Pro",
      description: "Lifetime Premium Templates & Feature Unlock",
      handler: async function (response: any) {
        try {
          const userDocRef = doc(db, "users", currentUser.uid);
          await setDoc(userDocRef, {
            isPro: true,
            paymentId: response.razorpay_payment_id || `mock_${Math.random().toString(36).substr(2, 9)}`,
            updatedAt: new Date().toISOString()
          }, { merge: true });
          
          setIsPro(true);
          alert("Success! Your account has been upgraded to Premium Pro.");
        } catch (err) {
          console.error("Subscription update failed:", err);
          alert("Payment completed but status update failed. Please refresh or contact support.");
        }
      },
      prefill: {
        name: currentUser.displayName || "",
        email: currentUser.email || ""
      },
      theme: {
        color: "#4f7df3"
      }
    };

    if (options.key === "rzp_test_mockkeyLUCA" || options.key.includes("mockkey")) {
      const userDocRef = doc(db, "users", currentUser.uid);
      await setDoc(userDocRef, {
        isPro: true,
        paymentId: `dev_upgrade_${Math.random().toString(36).substr(2, 9)}`,
        updatedAt: new Date().toISOString()
      }, { merge: true });
      setIsPro(true);
      alert("Upgraded to Premium Pro successfully (Developer Test Bypass).");
      return;
    }

    try {
      const rzp = new (window as any).Razorpay(options);
      rzp.open();
    } catch (err) {
      console.error("Failed to initialize Razorpay:", err);
      // Fallback dev upgrade
      const userDocRef = doc(db, "users", currentUser.uid);
      await setDoc(userDocRef, {
        isPro: true,
        paymentId: `dev_upgrade_${Math.random().toString(36).substr(2, 9)}`,
        updatedAt: new Date().toISOString()
      }, { merge: true });
      setIsPro(true);
      alert("Upgraded to Premium Pro successfully (Developer Test Bypass).");
    }
  };

  // ── Load Resume from Firestore ─────────────────────────────
  useEffect(() => {
    if (!currentUser) return;

    const idParam = searchParams.get("id");
    const isNew = searchParams.get("new") === "true";

    if (isNew || !idParam) {
      // Create new resume — generate an ID
      const newId = crypto.randomUUID();
      setResumeId(newId);
      const freshResume = createDefaultResume();
      freshResume.fullName = currentUser.displayName || "";
      freshResume.email = currentUser.email || "";
      
      const templateParam = searchParams.get("template");
      if (templateParam) {
        freshResume.templateName = templateParam;
      }
      
      setResume(freshResume);
      setDataLoading(false);
      initialLoadDone.current = true;

      // Immediately save the new document
      saveToFirestore(currentUser.uid, newId, freshResume);
    } else {
      // Load existing
      setResumeId(idParam);
      loadResume(currentUser.uid, idParam);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser, searchParams]);

  const loadResume = async (uid: string, id: string) => {
    try {
      const docRef = doc(db, "users", uid, "resumes", id);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        const data = snap.data() as ResumeData;
        setResume({
          ...createDefaultResume(),
          ...data,
          experience: data.experience || [],
          education: data.education || [],
          projects: data.projects || [],
          skills: data.skills || [],
        });
      }
    } catch (err) {
      console.warn("Failed to load resume from Firestore:", err);
    } finally {
      setDataLoading(false);
      initialLoadDone.current = true;
    }
  };

  // ── Auto-Save with Debounce ────────────────────────────────
  useEffect(() => {
    if (!initialLoadDone.current || !currentUser || !resumeId) return;
    saveCounterRef.current += 1;
    const myCount = saveCounterRef.current;

    setSaveStatus("saving");
    const updatedResume = {
      ...debouncedResume,
      updatedAt: new Date().toISOString().split("T")[0],
    };

    saveToFirestore(currentUser.uid, resumeId, updatedResume).then(() => {
      // Only set saved if no newer save was queued
      if (saveCounterRef.current === myCount) {
        setSaveStatus("saved");
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedResume]);

  useEffect(() => {
    if (searchParams.get("print") === "true" && !dataLoading && !authLoading) {
      const timer = setTimeout(() => {
        handleExportPDF();
      }, 1000);
      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, dataLoading, authLoading]);

  const saveToFirestore = async (uid: string, id: string, data: ResumeData) => {
    try {
      const docRef = doc(db, "users", uid, "resumes", id);
      await setDoc(docRef, data, { merge: true });
    } catch (err) {
      console.error("Firestore save error:", err);
    }
  };

  const handleManualSave = async () => {
    if (!currentUser || !resumeId) return;
    setSaveStatus("saving");
    const updatedResume = {
      ...resume,
      updatedAt: new Date().toISOString().split("T")[0],
    };
    await saveToFirestore(currentUser.uid, resumeId, updatedResume);
    setSaveStatus("saved");
  };

  const handleExportPDF = () => {
    const originalTitle = document.title;
    const cleanName = resume.fullName ? resume.fullName.replace(/\s+/g, "_") : "My";
    document.title = `${cleanName}_Resume`;
    window.print();
    document.title = originalTitle;
  };

  // ── Field Update Helper ────────────────────────────────────
  const updateField = useCallback(
    (field: keyof ResumeData, value: string | string[] | ExperienceEntry[] | EducationEntry[]) => {
      setResume((prev) => ({ ...prev, [field]: value }));
      setSaveStatus("unsaved");
    },
    []
  );

  // ── Experience helpers ─────────────────────────────────────
  const addExperience = () => {
    setResume((prev) => ({
      ...prev,
      experience: [...prev.experience, createExperienceEntry()],
    }));
    setSaveStatus("unsaved");
  };

  const removeExperience = (id: string) => {
    setResume((prev) => ({
      ...prev,
      experience: prev.experience.filter((e) => e.id !== id),
    }));
    setSaveStatus("unsaved");
  };

  const updateExperience = (id: string, field: keyof ExperienceEntry, value: string | boolean) => {
    setResume((prev) => ({
      ...prev,
      experience: prev.experience.map((e) =>
        e.id === id ? { ...e, [field]: value } : e
      ),
    }));
    setSaveStatus("unsaved");
  };

  // ── Education helpers ──────────────────────────────────────
  const addEducation = () => {
    setResume((prev) => ({
      ...prev,
      education: [...prev.education, createEducationEntry()],
    }));
    setSaveStatus("unsaved");
  };

  const removeEducation = (id: string) => {
    setResume((prev) => ({
      ...prev,
      education: prev.education.filter((e) => e.id !== id),
    }));
    setSaveStatus("unsaved");
  };

  const updateEducation = (id: string, field: keyof EducationEntry, value: string) => {
    setResume((prev) => ({
      ...prev,
      education: prev.education.map((e) =>
        e.id === id ? { ...e, [field]: value } : e
      ),
    }));
    setSaveStatus("unsaved");
  };

  // ── Projects helpers ───────────────────────────────────────
  const addProject = () => {
    setResume((prev) => ({
      ...prev,
      projects: [...(prev.projects || []), createProjectEntry()],
    }));
    setSaveStatus("unsaved");
  };

  const removeProject = (id: string) => {
    setResume((prev) => ({
      ...prev,
      projects: (prev.projects || []).filter((p) => p.id !== id),
    }));
    setSaveStatus("unsaved");
  };

  const updateProject = (id: string, field: keyof ProjectEntry, value: string) => {
    setResume((prev) => ({
      ...prev,
      projects: (prev.projects || []).map((p) =>
        p.id === id ? { ...p, [field]: value } : p
      ),
    }));
    setSaveStatus("unsaved");
  };

  // ── Skills helpers ─────────────────────────────────────────
  const addSkill = () => {
    const trimmed = skillInput.trim();
    if (!trimmed || resume.skills.includes(trimmed)) return;
    setResume((prev) => ({
      ...prev,
      skills: [...prev.skills, trimmed],
    }));
    setSkillInput("");
    setSaveStatus("unsaved");
  };

  const removeSkill = (skill: string) => {
    setResume((prev) => ({
      ...prev,
      skills: prev.skills.filter((s) => s !== skill),
    }));
    setSaveStatus("unsaved");
  };

  const handleSkillKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addSkill();
    }
  };

  // ── Loading state ──────────────────────────────────────────
  if (authLoading || dataLoading) {
    return (
      <div className="builder-loading">
        <RefreshCw className="animate-spin" size={36} style={{ color: "var(--primary-light)" }} />
        <p className="builder-loading-text">Loading Resume Builder...</p>
      </div>
    );
  }

  // ── Render helpers for each section ─────────────────────────
  const renderPersonalInfo = () => (
    <>
      <div className="editor-section-header">
        <h2 className="editor-section-title">Personal Information</h2>
        <p className="editor-section-desc">
          Add your contact details so employers can reach you. This appears at the top of your resume.
        </p>
      </div>
      <div className="form-grid">
        <div className="builder-input-group">
          <label className="builder-label">Full Name</label>
          <input
            className="builder-input"
            placeholder="e.g. Pavel Velagana"
            value={resume.fullName}
            onChange={(e) => updateField("fullName", e.target.value)}
          />
        </div>
        <div className="builder-input-group">
          <label className="builder-label">Job Title</label>
          <input
            className="builder-input"
            placeholder="e.g. Senior Java Architect"
            value={resume.jobTitle}
            onChange={(e) => updateField("jobTitle", e.target.value)}
          />
        </div>
        <div className="builder-input-group">
          <label className="builder-label">Email Address</label>
          <input
            className="builder-input"
            type="email"
            placeholder="e.g. pa1velagana@gmail.com"
            value={resume.email}
            onChange={(e) => updateField("email", e.target.value)}
          />
        </div>
        <div className="builder-input-group">
          <label className="builder-label">Phone Number</label>
          <input
            className="builder-input"
            type="tel"
            placeholder="e.g. +91 98765 43210"
            value={resume.phone}
            onChange={(e) => updateField("phone", e.target.value)}
          />
        </div>
        <div className="builder-input-group">
          <label className="builder-label">Location</label>
          <input
            className="builder-input"
            placeholder="e.g. Hyderabad, India"
            value={resume.location}
            onChange={(e) => updateField("location", e.target.value)}
          />
        </div>
        <div className="builder-input-group">
          <label className="builder-label">LinkedIn URL</label>
          <input
            className="builder-input"
            placeholder="e.g. linkedin.com/in/pvelagana"
            value={resume.linkedin}
            onChange={(e) => updateField("linkedin", e.target.value)}
          />
        </div>
        <div className="builder-input-group full-width">
          <label className="builder-label">Portfolio / Website</label>
          <input
            className="builder-input"
            placeholder="e.g. https://pvelagana.dev"
            value={resume.website}
            onChange={(e) => updateField("website", e.target.value)}
          />
        </div>
      </div>
    </>
  );

  const renderExperience = () => (
    <>
      <div className="editor-section-header">
        <h2 className="editor-section-title">Work Experience</h2>
        <p className="editor-section-desc">
          List your professional roles in reverse chronological order. Use bullet points in the description for best ATS parsing.
        </p>
      </div>

      <div className="entries-list">
        {resume.experience.map((exp, idx) => (
          <div className="entry-card" key={exp.id}>
            <div className="entry-card-header">
              <div className="entry-number">
                <div className="entry-number-badge">{idx + 1}</div>
                <span className="entry-number-title">
                  {exp.role || exp.company || `Experience ${idx + 1}`}
                </span>
              </div>
              <button
                type="button"
                className="entry-remove-btn"
                onClick={() => removeExperience(exp.id)}
              >
                <Trash2 size={14} />
              </button>
            </div>

            <div className="entry-grid">
              <div className="builder-input-group">
                <label className="builder-label">Job Title / Role</label>
                <input
                  className="builder-input"
                  placeholder="e.g. Senior Software Engineer"
                  value={exp.role}
                  onChange={(e) => updateExperience(exp.id, "role", e.target.value)}
                />
              </div>
              <div className="builder-input-group">
                <label className="builder-label">Company</label>
                <input
                  className="builder-input"
                  placeholder="e.g. Google"
                  value={exp.company}
                  onChange={(e) => updateExperience(exp.id, "company", e.target.value)}
                />
              </div>
              <div className="builder-input-group">
                <label className="builder-label">Start Date</label>
                <input
                  className="builder-input"
                  placeholder="e.g. Jan 2022"
                  value={exp.startDate}
                  onChange={(e) => updateExperience(exp.id, "startDate", e.target.value)}
                />
              </div>
              <div className="builder-input-group">
                <label className="builder-label">End Date</label>
                <input
                  className="builder-input"
                  placeholder={exp.current ? "Present" : "e.g. Dec 2024"}
                  value={exp.current ? "Present" : exp.endDate}
                  onChange={(e) => updateExperience(exp.id, "endDate", e.target.value)}
                  disabled={exp.current}
                />
                <label className="current-toggle">
                  <input
                    type="checkbox"
                    checked={exp.current}
                    onChange={(e) => updateExperience(exp.id, "current", e.target.checked)}
                  />
                  <span>Currently working here</span>
                </label>
              </div>
              <div className="builder-input-group">
                <label className="builder-label">Location</label>
                <input
                  className="builder-input"
                  placeholder="e.g. Bangalore, India"
                  value={exp.location}
                  onChange={(e) => updateExperience(exp.id, "location", e.target.value)}
                />
              </div>
              <div className="builder-input-group full-width">
                <label className="builder-label">Description (use bullet points)</label>
                <textarea
                  className="builder-textarea"
                  placeholder={"• Led migration of monolith to microservices architecture\n• Improved API response time by 40% using Redis caching\n• Mentored 5 junior engineers on Spring Boot best practices"}
                  value={exp.description}
                  onChange={(e) => updateExperience(exp.id, "description", e.target.value)}
                  rows={4}
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      <button type="button" className="add-entry-btn" onClick={addExperience}>
        <Plus size={16} />
        <span>Add Experience</span>
      </button>
    </>
  );

  const renderEducation = () => (
    <>
      <div className="editor-section-header">
        <h2 className="editor-section-title">Education</h2>
        <p className="editor-section-desc">
          Add your academic qualifications. Recent graduates should place this section higher.
        </p>
      </div>

      <div className="entries-list">
        {resume.education.map((edu, idx) => (
          <div className="entry-card" key={edu.id}>
            <div className="entry-card-header">
              <div className="entry-number">
                <div className="entry-number-badge">{idx + 1}</div>
                <span className="entry-number-title">
                  {edu.degree || edu.institution || `Education ${idx + 1}`}
                </span>
              </div>
              <button
                type="button"
                className="entry-remove-btn"
                onClick={() => removeEducation(edu.id)}
              >
                <Trash2 size={14} />
              </button>
            </div>

            <div className="entry-grid">
              <div className="builder-input-group">
                <label className="builder-label">Degree</label>
                <input
                  className="builder-input"
                  placeholder="e.g. Bachelor of Technology"
                  value={edu.degree}
                  onChange={(e) => updateEducation(edu.id, "degree", e.target.value)}
                />
              </div>
              <div className="builder-input-group">
                <label className="builder-label">Field of Study</label>
                <input
                  className="builder-input"
                  placeholder="e.g. Computer Science"
                  value={edu.field}
                  onChange={(e) => updateEducation(edu.id, "field", e.target.value)}
                />
              </div>
              <div className="builder-input-group">
                <label className="builder-label">Institution</label>
                <input
                  className="builder-input"
                  placeholder="e.g. JNTUH College of Engineering"
                  value={edu.institution}
                  onChange={(e) => updateEducation(edu.id, "institution", e.target.value)}
                />
              </div>
              <div className="builder-input-group">
                <label className="builder-label">GPA / Score</label>
                <input
                  className="builder-input"
                  placeholder="e.g. 8.5/10 or 3.8/4.0"
                  value={edu.gpa}
                  onChange={(e) => updateEducation(edu.id, "gpa", e.target.value)}
                />
              </div>
              <div className="builder-input-group">
                <label className="builder-label">Start Year</label>
                <input
                  className="builder-input"
                  placeholder="e.g. 2018"
                  value={edu.startDate}
                  onChange={(e) => updateEducation(edu.id, "startDate", e.target.value)}
                />
              </div>
              <div className="builder-input-group">
                <label className="builder-label">End Year</label>
                <input
                  className="builder-input"
                  placeholder="e.g. 2022"
                  value={edu.endDate}
                  onChange={(e) => updateEducation(edu.id, "endDate", e.target.value)}
                />
              </div>
              <div className="builder-input-group full-width">
                <label className="builder-label">Additional Notes</label>
                <textarea
                  className="builder-textarea"
                  placeholder="e.g. Dean's List, relevant coursework, thesis topic..."
                  value={edu.description}
                  onChange={(e) => updateEducation(edu.id, "description", e.target.value)}
                  rows={3}
                  style={{ minHeight: "80px" }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      <button type="button" className="add-entry-btn" onClick={addEducation}>
        <Plus size={16} />
        <span>Add Education</span>
      </button>
    </>
  );

  const renderSkills = () => (
    <>
      <div className="editor-section-header">
        <h2 className="editor-section-title">Skills</h2>
        <p className="editor-section-desc">
          Add your technical and professional skills. ATS systems scan for keyword matches, so include relevant technologies.
        </p>
      </div>

      <div className="skills-container">
        {resume.skills.map((skill) => (
          <span className="skill-tag" key={skill}>
            {skill}
            <button
              type="button"
              className="skill-tag-remove"
              onClick={() => removeSkill(skill)}
            >
              ×
            </button>
          </span>
        ))}
        {resume.skills.length === 0 && (
          <span style={{ color: "var(--text-dark)", fontSize: "0.85rem" }}>
            No skills added yet. Use the input below to add them.
          </span>
        )}
      </div>

      <div className="skill-input-row">
        <input
          className="builder-input"
          placeholder="e.g. Java, Spring Boot, React, Docker..."
          value={skillInput}
          onChange={(e) => setSkillInput(e.target.value)}
          onKeyDown={handleSkillKeyDown}
          style={{ flex: 1 }}
        />
        <button type="button" className="skill-add-btn" onClick={addSkill}>
          <Plus size={14} />
          Add
        </button>
      </div>

      <p style={{ color: "var(--text-dark)", fontSize: "0.78rem", marginTop: "0.75rem" }}>
        💡 Tip: Press <strong>Enter</strong> to quickly add skills one at a time.
      </p>
    </>
  );

  const renderSummary = () => (
    <>
      <div className="editor-section-header">
        <h2 className="editor-section-title">Professional Summary</h2>
        <p className="editor-section-desc">
          Write a compelling 3-4 sentence overview highlighting your strongest qualifications and career objectives.
        </p>
      </div>

      <div className="builder-input-group">
        <label className="builder-label">Summary</label>
        <textarea
          className="builder-textarea"
          placeholder="Experienced full-stack developer with 6+ years building scalable cloud-native applications using Java, Spring Boot, and React. Passionate about designing distributed systems and mentoring engineering teams. Proven track record of delivering high-availability microservices processing 10M+ requests daily."
          value={resume.summary}
          onChange={(e) => updateField("summary", e.target.value)}
          rows={8}
          style={{ minHeight: "200px" }}
        />
      </div>

      <p style={{ color: "var(--text-dark)", fontSize: "0.78rem", marginTop: "0.75rem" }}>
        💡 Tip: Keep it under 4 sentences. Use quantifiable metrics (e.g. &ldquo;reduced latency by 40%&rdquo;) for stronger impact.
      </p>
    </>
  );

  const renderProjects = () => (
    <>
      <div className="editor-section-header">
        <h2 className="editor-section-title">Projects</h2>
        <p className="editor-section-desc">
          Highlight key projects you have built. Show the technologies used and provide a short description.
        </p>
      </div>

      <div className="entries-list">
        {(resume.projects || []).map((proj, idx) => (
          <div className="entry-card" key={proj.id}>
            <div className="entry-card-header">
              <div className="entry-number">
                <div className="entry-number-badge">{idx + 1}</div>
                <span className="entry-number-title">
                  {proj.name || `Project ${idx + 1}`}
                </span>
              </div>
              <button
                type="button"
                className="entry-remove-btn"
                onClick={() => removeProject(proj.id)}
              >
                <Trash2 size={14} />
              </button>
            </div>

            <div className="entry-grid">
              <div className="builder-input-group">
                <label className="builder-label">Project Name</label>
                <input
                  className="builder-input"
                  placeholder="e.g. E-Commerce Platform"
                  value={proj.name}
                  onChange={(e) => updateProject(proj.id, "name", e.target.value)}
                />
              </div>
              <div className="builder-input-group">
                <label className="builder-label">Technologies Used</label>
                <input
                  className="builder-input"
                  placeholder="e.g. Next.js, React, Tailwind CSS"
                  value={proj.technologies}
                  onChange={(e) => updateProject(proj.id, "technologies", e.target.value)}
                />
              </div>
              <div className="builder-input-group full-width">
                <label className="builder-label">Project URL / Link</label>
                <input
                  className="builder-input"
                  placeholder="e.g. https://github.com/myusername/myproject"
                  value={proj.link}
                  onChange={(e) => updateProject(proj.id, "link", e.target.value)}
                />
              </div>
              <div className="builder-input-group full-width">
                <label className="builder-label">Project Description (use bullet points)</label>
                <textarea
                  className="builder-textarea"
                  placeholder={"• Developed full-stack app featuring real-time checkout.\n• Integrated Stripe payments and search functionality."}
                  value={proj.description}
                  onChange={(e) => updateProject(proj.id, "description", e.target.value)}
                  rows={4}
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      <button type="button" className="add-entry-btn" onClick={addProject}>
        <Plus size={16} />
        <span>Add Project</span>
      </button>
    </>
  );

  const renderTemplates = () => (
    <>
      <div className="editor-section-header">
        <h2 className="editor-section-title">Select Resume Template</h2>
        <p className="editor-section-desc">
          Choose from 20 professionally crafted, ATS-compliant layouts. Premium templates require a Pro subscription.
        </p>
      </div>

      <div className="templates-selector-grid">
        {TEMPLATES.map((tmpl) => {
          const isSelected = resume.templateName === tmpl.name;
          return (
            <div
              key={tmpl.name}
              className={`template-select-card ${isSelected ? "selected" : ""} ${tmpl.isPremium ? "premium" : "free"}`}
              onClick={() => {
                updateField("templateName", tmpl.name);
              }}
            >
              <div className="template-card-preview" style={{ fontFamily: tmpl.fontFamily }}>
                <div className="template-card-preview-header" style={{ borderTop: `4px solid ${tmpl.primaryColor}` }}>
                  <div className="template-card-preview-name" style={{ color: tmpl.primaryColor }}>{tmpl.name}</div>
                  <div className="template-card-preview-layout">{tmpl.layout}</div>
                </div>
              </div>
              <div className="template-card-info">
                <span className="template-card-title">{tmpl.name}</span>
                {tmpl.isPremium ? (
                  <span className="pro-badge-mini">PRO</span>
                ) : (
                  <span className="free-badge-mini">FREE</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );

  // Section content map
  const sectionContent: Record<BuilderSection | "templates", React.ReactNode> = {
    personal: renderPersonalInfo(),
    templates: renderTemplates(),
    experience: renderExperience(),
    education: renderEducation(),
    projects: renderProjects(),
    skills: renderSkills(),
    summary: renderSummary(),
  };

  // ── Live Preview ───────────────────────────────────────────
  const hasContent = resume.fullName || resume.jobTitle || resume.summary || resume.experience.length > 0 || resume.education.length > 0 || (resume.projects && resume.projects.length > 0) || resume.skills.length > 0;

  const renderLivePreview = () => {
    const config = getTemplateByName(resume.templateName);
    
    // Formatting spacing
    const pagePadding = config.spacing === "tight" ? "1.5rem" : config.spacing === "spacious" ? "3rem" : "2.2rem";
    const sectionMargin = config.spacing === "tight" ? "0.8rem" : config.spacing === "spacious" ? "2.2rem" : "1.5rem";
    const entryMargin = config.spacing === "tight" ? "0.4rem" : config.spacing === "spacious" ? "1rem" : "0.7rem";

    const renderBullets = (text: string, bulletStyle: string) => {
      if (!text) return null;
      const lines = text.split("\n").filter((line) => line.trim() !== "");
      const bulletSymbol = 
        bulletStyle === "square" ? "■" : 
        bulletStyle === "dash" ? "—" : 
        bulletStyle === "arrow" ? "➔" : "•";
      return (
        <ul className="preview-bullet-list" style={{ paddingLeft: "1.2rem", margin: "0.2rem 0 0 0", listStyle: "none" }}>
          {lines.map((line, idx) => {
            const cleanLine = line.replace(/^[•\-\*➔■]\s*/, "");
            return (
              <li key={idx} className="preview-bullet-item" style={{ display: "flex", gap: "0.5rem", alignItems: "flex-start", marginBottom: "0.25rem", fontSize: "0.82rem" }}>
                <span className="bullet-indicator" style={{ color: config.primaryColor, flexShrink: 0, marginTop: "1px" }}>{bulletSymbol}</span>
                <span className="bullet-text" style={{ color: "var(--text-dark)" }}>{cleanLine}</span>
              </li>
            );
          })}
        </ul>
      );
    };

    const renderSectionTitle = (title: string) => {
      const borderStyle = 
        config.sectionHeaderStyle === "underline" ? { borderBottom: `2px solid ${config.primaryColor}`, paddingBottom: "2px" } :
        config.sectionHeaderStyle === "bordered" ? { borderTop: `1px solid ${config.primaryColor}`, borderBottom: `1px solid ${config.primaryColor}`, padding: "4px 0" } :
        config.sectionHeaderStyle === "colored-bg" ? { backgroundColor: config.primaryColor, color: "#ffffff", padding: "6px 10px", borderRadius: "4px" } :
        config.sectionHeaderStyle === "double-line" ? { borderBottom: `3px double ${config.primaryColor}`, paddingBottom: "2px" } : 
        {};

      return (
        <div 
          className={`preview-section-header header-style-${config.sectionHeaderStyle}`} 
          style={{ 
            color: config.sectionHeaderStyle === "colored-bg" ? "#ffffff" : config.primaryColor,
            ...borderStyle,
            marginTop: sectionMargin,
            marginBottom: "0.6rem",
            fontWeight: "700",
            fontSize: "1.05rem",
            textTransform: "uppercase",
            letterSpacing: "0.06em",
            fontFamily: config.fontFamily
          }}
        >
          {title}
        </div>
      );
    };

    const renderHeader = () => (
      <div 
        className="preview-header-wrap" 
        style={{ 
          textAlign: config.headerAlignment === "center" ? "center" : config.headerAlignment === "right" ? "right" : "left",
          borderBottom: config.layout === "classic" ? `1px solid #e2e8f0` : "none",
          paddingBottom: config.layout === "classic" ? "1rem" : "0",
          marginBottom: "0.75rem"
        }}
      >
        <div className="preview-name" style={{ fontFamily: config.fontFamily, color: config.primaryColor, fontSize: "2.2rem", fontWeight: "800", lineHeight: "1.1" }}>
          {resume.fullName || "Your Full Name"}
        </div>
        {resume.jobTitle && (
          <div className="preview-jobtitle" style={{ fontFamily: config.fontFamily, color: "#475569", fontSize: "1.1rem", fontWeight: "600", marginTop: "0.25rem", letterSpacing: "0.05em", textTransform: "uppercase" }}>
            {resume.jobTitle}
          </div>
        )}
        
        {/* Contact Row */}
        <div 
          className="preview-contact-row" 
          style={{ 
            display: "flex", 
            flexWrap: "wrap", 
            gap: "0.75rem", 
            justifyContent: config.headerAlignment === "center" ? "center" : config.headerAlignment === "right" ? "flex-end" : "flex-start",
            marginTop: "0.6rem",
            fontSize: "0.82rem",
            color: "#64748b"
          }}
        >
          {resume.email && (
            <span className="preview-contact-item" style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
              <Mail size={10} /> {resume.email}
            </span>
          )}
          {resume.phone && (
            <span className="preview-contact-item" style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
              <Phone size={10} /> {resume.phone}
            </span>
          )}
          {resume.location && (
            <span className="preview-contact-item" style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
              <MapPin size={10} /> {resume.location}
            </span>
          )}
          {resume.linkedin && (
            <span className="preview-contact-item" style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
              <Linkedin size={10} /> {resume.linkedin}
            </span>
          )}
          {resume.website && (
            <span className="preview-contact-item" style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
              <Globe size={10} /> {resume.website}
            </span>
          )}
        </div>
      </div>
    );

    const renderSingleColumn = () => (
      <div style={{ display: "flex", flexDirection: "column" }}>
        {/* Summary */}
        {resume.summary && (
          <>
            {renderSectionTitle("Professional Summary")}
            <p style={{ fontSize: "0.85rem", lineHeight: "1.5", color: "#1e293b", margin: 0 }}>{resume.summary}</p>
          </>
        )}

        {/* Experience */}
        {resume.experience.length > 0 && (
          <>
            {renderSectionTitle("Work Experience")}
            <div style={{ display: "flex", flexDirection: "column", gap: entryMargin }}>
              {resume.experience.map((exp) => (
                <div key={exp.id} className="preview-exp-item">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", flexWrap: "wrap" }}>
                    <span style={{ fontWeight: "700", fontSize: "0.92rem", color: "#0f172a" }}>{exp.role}</span>
                    <span style={{ fontSize: "0.78rem", color: "#64748b" }}>
                      {exp.startDate} — {exp.current ? "Present" : exp.endDate}
                    </span>
                  </div>
                  <div style={{ fontSize: "0.82rem", color: "#475569", marginBottom: "0.2rem" }}>
                    <strong>{exp.company}</strong> {exp.location ? `· ${exp.location}` : ""}
                  </div>
                  {exp.description && renderBullets(exp.description, config.bulletStyle)}
                </div>
              ))}
            </div>
          </>
        )}

        {/* Projects */}
        {(resume.projects && resume.projects.length > 0) && (
          <>
            {renderSectionTitle("Projects")}
            <div style={{ display: "flex", flexDirection: "column", gap: entryMargin }}>
              {resume.projects.map((proj) => (
                <div key={proj.id} className="preview-proj-item">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", flexWrap: "wrap" }}>
                    <span style={{ fontWeight: "700", fontSize: "0.92rem", color: "#0f172a" }}>
                      {proj.name} {proj.link && <span style={{ fontSize: "0.78rem", color: config.primaryColor, fontWeight: "normal", marginLeft: "0.5rem" }}>({proj.link})</span>}
                    </span>
                    {proj.technologies && <span style={{ fontSize: "0.78rem", color: "#64748b", fontStyle: "italic" }}>{proj.technologies}</span>}
                  </div>
                  {proj.description && renderBullets(proj.description, config.bulletStyle)}
                </div>
              ))}
            </div>
          </>
        )}

        {/* Education */}
        {resume.education.length > 0 && (
          <>
            {renderSectionTitle("Education")}
            <div style={{ display: "flex", flexDirection: "column", gap: entryMargin }}>
              {resume.education.map((edu) => (
                <div key={edu.id} className="preview-edu-item">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", flexWrap: "wrap" }}>
                    <span style={{ fontWeight: "700", fontSize: "0.92rem", color: "#0f172a" }}>
                      {edu.degree} {edu.field ? `in ${edu.field}` : ""}
                    </span>
                    <span style={{ fontSize: "0.78rem", color: "#64748b" }}>
                      {edu.startDate} — {edu.endDate}
                    </span>
                  </div>
                  <div style={{ fontSize: "0.82rem", color: "#475569" }}>
                    {edu.institution} {edu.gpa ? `· GPA: ${edu.gpa}` : ""}
                  </div>
                  {edu.description && (
                    <p style={{ fontSize: "0.8rem", color: "#475569", marginTop: "2px", margin: 0 }}>{edu.description}</p>
                  )}
                </div>
              ))}
            </div>
          </>
        )}

        {/* Skills */}
        {resume.skills.length > 0 && (
          <>
            {renderSectionTitle("Skills")}
            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
              {resume.skills.map((skill) => (
                <span key={skill} style={{ fontSize: "0.78rem", padding: "3px 8px", border: `1px solid ${config.primaryColor}`, borderRadius: "4px", color: "#1e293b", backgroundColor: "#f8fafc" }}>
                  {skill}
                </span>
              ))}
            </div>
          </>
        )}
      </div>
    );

    const renderSplitColumn = () => {
      const isSidebarLeft = config.layout === "sidebar";
      const leftCol = (
        <div style={{ width: "30%", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          {/* Skills */}
          {resume.skills.length > 0 && (
            <>
              {renderSectionTitle("Skills")}
              <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
                {resume.skills.map((skill) => (
                  <span key={skill} style={{ fontSize: "0.72rem", padding: "2px 6px", border: `1px solid ${config.primaryColor}`, borderRadius: "4px", backgroundColor: "#f8fafc", color: "#1e293b" }}>{skill}</span>
                ))}
              </div>
            </>
          )}

          {/* Education */}
          {resume.education.length > 0 && (
            <>
              {renderSectionTitle("Education")}
              <div style={{ display: "flex", flexDirection: "column", gap: entryMargin }}>
                {resume.education.map((edu) => (
                  <div key={edu.id} style={{ fontSize: "0.8rem" }}>
                    <div style={{ fontWeight: "700", color: "#0f172a" }}>{edu.degree}</div>
                    <div style={{ fontSize: "0.78rem", color: "#475569" }}>{edu.field}</div>
                    <div style={{ color: "#64748b", fontSize: "0.75rem" }}>{edu.institution}</div>
                    <div style={{ fontSize: "0.72rem", color: "#64748b", marginTop: "2px" }}>{edu.startDate} - {edu.endDate}</div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      );

      const rightCol = (
        <div style={{ width: "67%", display: "flex", flexDirection: "column" }}>
          {/* Summary */}
          {resume.summary && (
            <>
              {renderSectionTitle("Summary")}
              <p style={{ fontSize: "0.85rem", lineHeight: "1.5", color: "#1e293b", margin: 0 }}>{resume.summary}</p>
            </>
          )}

          {/* Experience */}
          {resume.experience.length > 0 && (
            <>
              {renderSectionTitle("Experience")}
              <div style={{ display: "flex", flexDirection: "column", gap: entryMargin }}>
                {resume.experience.map((exp) => (
                  <div key={exp.id}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", flexWrap: "wrap" }}>
                      <span style={{ fontWeight: "700", fontSize: "0.92rem", color: "#0f172a" }}>{exp.role}</span>
                      <span style={{ fontSize: "0.78rem", color: "#64748b" }}>
                        {exp.startDate} — {exp.current ? "Present" : exp.endDate}
                      </span>
                    </div>
                    <div style={{ fontSize: "0.82rem", color: "#475569", marginBottom: "0.2rem" }}>
                      <strong>{exp.company}</strong> {exp.location ? `· ${exp.location}` : ""}
                    </div>
                    {exp.description && renderBullets(exp.description, config.bulletStyle)}
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Projects */}
          {(resume.projects && resume.projects.length > 0) && (
            <>
              {renderSectionTitle("Projects")}
              <div style={{ display: "flex", flexDirection: "column", gap: entryMargin }}>
                {resume.projects.map((proj) => (
                  <div key={proj.id}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", flexWrap: "wrap" }}>
                      <span style={{ fontWeight: "700", fontSize: "0.92rem", color: "#0f172a" }}>
                        {proj.name} {proj.link && <span style={{ fontSize: "0.78rem", color: config.primaryColor, fontWeight: "normal", marginLeft: "0.5rem" }}>({proj.link})</span>}
                      </span>
                      {proj.technologies && <span style={{ fontSize: "0.78rem", color: "#64748b", fontStyle: "italic" }}>{proj.technologies}</span>}
                    </div>
                    {proj.description && renderBullets(proj.description, config.bulletStyle)}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      );

      return (
        <div style={{ display: "flex", gap: "3%", marginTop: "0.5rem" }}>
          {isSidebarLeft ? leftCol : rightCol}
          {isSidebarLeft ? rightCol : leftCol}
        </div>
      );
    };

    return (
      <div 
        className={`resume-paper template-dynamic`} 
        style={{ 
          fontFamily: config.fontFamily, 
          color: config.textColor, 
          padding: pagePadding,
          border: config.hasBorder ? `6px double ${config.primaryColor}` : "none",
          position: "relative",
          minHeight: "297mm", // A4 Ratio
          backgroundColor: "#ffffff",
          boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
          borderRadius: "4px"
        }}
      >
        {renderHeader()}
        {(config.layout === "sidebar" || config.layout === "split") ? renderSplitColumn() : renderSingleColumn()}

        {/* Empty placeholder */}
        {!hasContent && (
          <div className="preview-placeholder">
            <div className="preview-placeholder-icon">
              <FileText size={48} />
            </div>
            <p className="preview-placeholder-text">Start filling in your details</p>
            <p className="preview-placeholder-desc">
              Your resume will appear here in real-time as you type.
            </p>
          </div>
        )}

        {/* Premium Watermark */}
        {config.isPremium && !isPro && (
          <div className="preview-watermark-overlay">
            <span>LUCAresume Pro Preview ({config.name})</span>
          </div>
        )}
      </div>
    );
  };

  // ── Main Render ────────────────────────────────────────────
  return (
    <div className="builder-shell">
      {/* ── Top Header ──────────────────────────────────────── */}
      <header className="builder-header">
        <div className="builder-header-left">
          <button
            type="button"
            className="back-btn"
            onClick={() => router.push("/dashboard")}
            title="Back to Dashboard"
          >
            <ArrowLeft size={18} />
          </button>
          <div className="builder-title-group">
            <span className="builder-resume-title">
              {resume.fullName
                ? `${resume.fullName}'s Resume`
                : "New Resume"}
            </span>
            <span className="builder-template-badge">
              {resume.templateName}
            </span>
          </div>
        </div>

        <div className="builder-header-right">
          <div className={`save-indicator ${saveStatus}`}>
            {saveStatus === "saved" && <><Check size={14} /><span>Saved</span></>}
            {saveStatus === "saving" && <><RefreshCw size={14} className="animate-spin" /><span>Saving...</span></>}
            {saveStatus === "unsaved" && <><span>●</span><span>Unsaved</span></>}
          </div>
          <button
            type="button"
            className="btn-secondary"
            onClick={handleManualSave}
            style={{ padding: "0.5rem 1rem", borderRadius: "10px", fontSize: "0.85rem" }}
            title="Save changes to database"
          >
            <Save size={14} />
            <span>Save</span>
          </button>
          <button
            type="button"
            className="btn-premium"
            onClick={handleExportPDF}
            style={{ padding: "0.5rem 1rem", borderRadius: "10px", fontSize: "0.85rem", display: "flex", alignItems: "center", gap: "0.4rem" }}
            title="Export resume as vector PDF"
          >
            <Download size={14} />
            <span>Export PDF</span>
          </button>
        </div>
      </header>

      {/* ── Split Body ──────────────────────────────────────── */}
      <div className="builder-body">
        {/* ── Editor Panel ────────────────────────────────── */}
        <div className="editor-panel">
          <div className="section-tabs">
            {SECTIONS.map((sec) => (
              <button
                key={sec.key}
                type="button"
                className={`section-tab ${activeSection === sec.key ? "active" : ""}`}
                onClick={() => setActiveSection(sec.key)}
              >
                <span className="section-tab-icon">{sec.icon}</span>
                {sec.label}
              </button>
            ))}
          </div>

          <div className="editor-content">
            {(() => {
              const currentTemplate = getTemplateByName(resume.templateName);
              if (currentTemplate.isPremium && !isPro) {
                return (
                  <div className="pro-warning-banner">
                    <Sparkles size={16} style={{ color: "var(--primary-light)" }} />
                    <div className="pro-warning-text">
                      <h4>PRO Template: {resume.templateName}</h4>
                      <p>Free accounts will include watermarks on exports. Upgrade to Pro to unlock fully clean vector PDF files.</p>
                    </div>
                    <button type="button" className="btn-premium pro-warning-btn" onClick={handlePaymentUpgrade}>
                      Unlock Pro
                    </button>
                  </div>
                );
              }
              return null;
            })()}
            {sectionContent[activeSection]}
          </div>
        </div>

        {/* ── Preview Panel ───────────────────────────────── */}
        <div className="preview-panel">
          <div className="preview-header">
            <span className="preview-title">
              <Eye size={14} />
              Live Preview
            </span>
          </div>
          <div className="preview-scroll">
            {renderLivePreview()}
          </div>
        </div>
      </div>
    </div>
  );
}
