import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "LUCAresume Pro | Premium AI Resume Builder",
  description: "Create stunning, ATS-friendly, professional resumes with AI assistance, live previews, and premium design templates.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
      </head>
      <body>
        {children}
      </body>
    </html>
  );
}
