// ─── Resume Data Model ─────────────────────────────────────────
// Shared interfaces for Firestore documents at: users/{uid}/resumes/{resumeId}

export interface ExperienceEntry {
  id: string;
  company: string;
  role: string;
  startDate: string;
  endDate: string;
  current: boolean;
  description: string;   // bullet points as newline-separated text
  location: string;
}

export interface EducationEntry {
  id: string;
  institution: string;
  degree: string;
  field: string;
  startDate: string;
  endDate: string;
  gpa: string;
  description: string;
}

export interface ProjectEntry {
  id: string;
  name: string;
  description: string;
  technologies: string;
  link: string;
}

export interface ResumeData {
  // Personal Info
  fullName: string;
  jobTitle: string;
  email: string;
  phone: string;
  location: string;
  website: string;
  linkedin: string;

  // Professional Summary
  summary: string;

  // Dynamic sections
  experience: ExperienceEntry[];
  education: EducationEntry[];
  projects: ProjectEntry[];
  skills: string[];

  // Metadata
  templateName: string;
  updatedAt: string;
  createdAt: string;
}

// ─── Default Factory ────────────────────────────────────────────

export function createDefaultResume(): ResumeData {
  const now = new Date().toISOString().split("T")[0];
  return {
    fullName: "",
    jobTitle: "",
    email: "",
    phone: "",
    location: "",
    website: "",
    linkedin: "",
    summary: "",
    experience: [],
    education: [],
    projects: [],
    skills: [],
    templateName: "Modern Free",
    updatedAt: now,
    createdAt: now,
  };
}

// ─── Entry Factories ────────────────────────────────────────────

export function createExperienceEntry(): ExperienceEntry {
  return {
    id: crypto.randomUUID(),
    company: "",
    role: "",
    startDate: "",
    endDate: "",
    current: false,
    description: "",
    location: "",
  };
}

export function createEducationEntry(): EducationEntry {
  return {
    id: crypto.randomUUID(),
    institution: "",
    degree: "",
    field: "",
    startDate: "",
    endDate: "",
    gpa: "",
    description: "",
  };
}

export function createProjectEntry(): ProjectEntry {
  return {
    id: crypto.randomUUID(),
    name: "",
    description: "",
    technologies: "",
    link: "",
  };
}

// Builder section tab keys
export type BuilderSection = "personal" | "experience" | "education" | "projects" | "skills" | "summary";

