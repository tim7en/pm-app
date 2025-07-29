import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/contexts/AuthContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "PM-App - AI-Powered Project Management",
  description: "Transform ideas into actionable results with AI-assisted workflows, intelligent task breakdown, and automated document organization",
  keywords: ["project management", "AI", "task management", "collaboration", "productivity", "automation", "workflow"],
  authors: [{ name: "PM-App Team" }],
  openGraph: {
    title: "PM-App - AI-Powered Project Management",
    description: "Transform ideas into actionable results with AI-assisted workflows",
    url: "http://localhost:3001",
    siteName: "PM-App",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "PM-App - AI-Powered Project Management",
    description: "Transform ideas into actionable results with AI-assisted workflows",
  },
  manifest: "/manifest.json",
  other: {
    "apple-mobile-web-app-capable": "yes",
    "apple-mobile-web-app-status-bar-style": "default",
    "apple-mobile-web-app-title": "PM-App",
  },
};

function ServiceWorkerRegistration() {
  if (typeof window !== 'undefined') {
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
          .then(registration => {
            console.log('ServiceWorker registration successful with scope: ', registration.scope);
          })
          .catch(error => {
            console.log('ServiceWorker registration failed: ', error);
          });
      });
    }
  }
  return null;
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#3b82f6" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="TaskManager" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <AuthProvider>
          {children}
          <Toaster />
          <ServiceWorkerRegistration />
        </AuthProvider>
      </body>
    </html>
  );
}
