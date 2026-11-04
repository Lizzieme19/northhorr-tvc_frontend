import type { Metadata } from "next";
import { Inter, Poppins } from "next/font/google";
import "./globals.css";
import { SiteChrome } from "@/components/layout/SiteChrome";
import { AuthProvider } from "@/lib/auth";
import { Toaster } from "sonner";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "North Horr Technical and Vocational College",
    template: "%s | NTVC",
  },
  description:
    "North Horr Technical and Vocational College — Igniting a brighter future through quality TVET education in Marsabit, Kenya.",
  keywords: [
    "NTVC",
    "North Horr TVC",
    "TVET Kenya",
    "vocational training",
    "Marsabit college",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${poppins.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-cream text-foreground">
        <AuthProvider>
          <SiteChrome>{children}</SiteChrome>
        </AuthProvider>

        <Toaster position="top-center" toastOptions={{ duration: 5000 }} />
      </body>
    </html>
  );
}
