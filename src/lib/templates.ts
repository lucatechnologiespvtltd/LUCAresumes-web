export interface TemplateConfig {
  name: string;
  isPremium: boolean;
  fontFamily: string;
  primaryColor: string;
  secondaryColor?: string;
  textColor: string;
  layout: "classic" | "modern" | "sidebar" | "split" | "minimal";
  sectionHeaderStyle: "simple" | "bordered" | "colored-bg" | "underline" | "double-line";
  bulletStyle: "disc" | "square" | "dash" | "arrow";
  spacing: "tight" | "normal" | "spacious";
  headerAlignment: "left" | "center" | "right";
  hasBorder: boolean;
}

export const TEMPLATES: TemplateConfig[] = [
  {
    name: "Modern Free",
    isPremium: false,
    fontFamily: "system-ui, -apple-system, sans-serif",
    primaryColor: "#2563EB", // Blue
    textColor: "#1E293B",
    layout: "classic",
    sectionHeaderStyle: "underline",
    bulletStyle: "disc",
    spacing: "normal",
    headerAlignment: "left",
    hasBorder: false
  },
  {
    name: "Minimalist Clean",
    isPremium: false,
    fontFamily: "system-ui, -apple-system, sans-serif",
    primaryColor: "#475569", // Slate
    textColor: "#334155",
    layout: "minimal",
    sectionHeaderStyle: "simple",
    bulletStyle: "dash",
    spacing: "tight",
    headerAlignment: "center",
    hasBorder: false
  },
  {
    name: "Academic Classic",
    isPremium: false,
    fontFamily: "Georgia, serif",
    primaryColor: "#000000",
    textColor: "#111111",
    layout: "classic",
    sectionHeaderStyle: "double-line",
    bulletStyle: "disc",
    spacing: "normal",
    headerAlignment: "center",
    hasBorder: false
  },
  {
    name: "Compact Grid",
    isPremium: false,
    fontFamily: "system-ui, -apple-system, sans-serif",
    primaryColor: "#059669", // Emerald
    textColor: "#1F2937",
    layout: "minimal",
    sectionHeaderStyle: "simple",
    bulletStyle: "disc",
    spacing: "tight",
    headerAlignment: "left",
    hasBorder: false
  },
  {
    name: "Executive Pro",
    isPremium: true,
    fontFamily: "Georgia, serif",
    primaryColor: "#1E3A8A", // Deep Navy
    textColor: "#111827",
    layout: "classic",
    sectionHeaderStyle: "bordered",
    bulletStyle: "square",
    spacing: "normal",
    headerAlignment: "center",
    hasBorder: true
  },
  {
    name: "Google Style Pro",
    isPremium: true,
    fontFamily: "Arial, sans-serif",
    primaryColor: "#1A73E8", // Google Blue
    textColor: "#202124",
    layout: "classic",
    sectionHeaderStyle: "simple",
    bulletStyle: "disc",
    spacing: "tight",
    headerAlignment: "left",
    hasBorder: false
  },
  {
    name: "Tech Innovator",
    isPremium: true,
    fontFamily: "Consolas, Monaco, monospace",
    primaryColor: "#0EA5E9", // Sky Blue
    textColor: "#0F172A",
    layout: "sidebar",
    sectionHeaderStyle: "underline",
    bulletStyle: "dash",
    spacing: "tight",
    headerAlignment: "left",
    hasBorder: false
  },
  {
    name: "Creative Spark",
    isPremium: true,
    fontFamily: "system-ui, -apple-system, sans-serif",
    primaryColor: "#8B5CF6", // Violet
    secondaryColor: "#EC4899", // Pink
    textColor: "#1E293B",
    layout: "split",
    sectionHeaderStyle: "colored-bg",
    bulletStyle: "arrow",
    spacing: "normal",
    headerAlignment: "left",
    hasBorder: false
  },
  {
    name: "Corporate Solid",
    isPremium: true,
    fontFamily: "Times New Roman, serif",
    primaryColor: "#0F172A", // Slate Dark
    textColor: "#0F172A",
    layout: "classic",
    sectionHeaderStyle: "bordered",
    bulletStyle: "disc",
    spacing: "normal",
    headerAlignment: "left",
    hasBorder: false
  },
  {
    name: "Startup Edge",
    isPremium: true,
    fontFamily: "system-ui, -apple-system, sans-serif",
    primaryColor: "#10B981", // Emerald
    textColor: "#0F172A",
    layout: "modern",
    sectionHeaderStyle: "colored-bg",
    bulletStyle: "square",
    spacing: "normal",
    headerAlignment: "left",
    hasBorder: false
  },
  {
    name: "Royal Crest",
    isPremium: true,
    fontFamily: "Georgia, serif",
    primaryColor: "#B45309", // Gold/Amber
    textColor: "#1E293B",
    layout: "classic",
    sectionHeaderStyle: "double-line",
    bulletStyle: "disc",
    spacing: "spacious",
    headerAlignment: "center",
    hasBorder: true
  },
  {
    name: "Emerald Professional",
    isPremium: true,
    fontFamily: "system-ui, -apple-system, sans-serif",
    primaryColor: "#065F46", // Dark Emerald
    textColor: "#064E3B",
    layout: "modern",
    sectionHeaderStyle: "underline",
    bulletStyle: "disc",
    spacing: "normal",
    headerAlignment: "left",
    hasBorder: false
  },
  {
    name: "Silicon Valley",
    isPremium: true,
    fontFamily: "system-ui, -apple-system, sans-serif",
    primaryColor: "#111827", // Grey-Black
    textColor: "#111827",
    layout: "sidebar",
    sectionHeaderStyle: "simple",
    bulletStyle: "square",
    spacing: "tight",
    headerAlignment: "left",
    hasBorder: false
  },
  {
    name: "Charcoal Elite",
    isPremium: true,
    fontFamily: "Georgia, serif",
    primaryColor: "#374151", // Charcoal
    textColor: "#1F2937",
    layout: "classic",
    sectionHeaderStyle: "underline",
    bulletStyle: "disc",
    spacing: "spacious",
    headerAlignment: "left",
    hasBorder: false
  },
  {
    name: "Metro Grid",
    isPremium: true,
    fontFamily: "system-ui, -apple-system, sans-serif",
    primaryColor: "#EA580C", // Metro Orange
    textColor: "#1F2937",
    layout: "split",
    sectionHeaderStyle: "colored-bg",
    bulletStyle: "arrow",
    spacing: "tight",
    headerAlignment: "left",
    hasBorder: false
  },
  {
    name: "Bold Impact",
    isPremium: true,
    fontFamily: "system-ui, -apple-system, sans-serif",
    primaryColor: "#DC2626", // Red
    textColor: "#111827",
    layout: "modern",
    sectionHeaderStyle: "bordered",
    bulletStyle: "square",
    spacing: "normal",
    headerAlignment: "left",
    hasBorder: true
  },
  {
    name: "Warm Executive",
    isPremium: true,
    fontFamily: "Georgia, serif",
    primaryColor: "#78350F", // Warm Amber
    textColor: "#451A03",
    layout: "classic",
    sectionHeaderStyle: "underline",
    bulletStyle: "disc",
    spacing: "normal",
    headerAlignment: "center",
    hasBorder: false
  },
  {
    name: "Skyline Premium",
    isPremium: true,
    fontFamily: "system-ui, -apple-system, sans-serif",
    primaryColor: "#0284C7", // Sky Accent
    textColor: "#0F172A",
    layout: "sidebar",
    sectionHeaderStyle: "underline",
    bulletStyle: "dash",
    spacing: "normal",
    headerAlignment: "left",
    hasBorder: false
  },
  {
    name: "Midnight Slate",
    isPremium: true,
    fontFamily: "system-ui, -apple-system, sans-serif",
    primaryColor: "#1E293B", // Navy/Slate
    textColor: "#0F172A",
    layout: "minimal",
    sectionHeaderStyle: "bordered",
    bulletStyle: "disc",
    spacing: "normal",
    headerAlignment: "center",
    hasBorder: false
  },
  {
    name: "Indigo Elegant",
    isPremium: true,
    fontFamily: "system-ui, -apple-system, sans-serif",
    primaryColor: "#4F46E5", // Indigo
    textColor: "#111827",
    layout: "split",
    sectionHeaderStyle: "underline",
    bulletStyle: "disc",
    spacing: "normal",
    headerAlignment: "left",
    hasBorder: false
  }
];

export function getTemplateByName(name: string): TemplateConfig {
  return TEMPLATES.find(t => t.name === name) || TEMPLATES[0];
}
