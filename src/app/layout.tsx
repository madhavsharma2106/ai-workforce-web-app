import type { Metadata } from "next";
import { Lora, Nunito_Sans } from "next/font/google";
import NextTopLoader from "nextjs-toploader";
import { PostHogProvider } from "@/components/analytics/PostHogProvider";
import "./globals.css";

const nunitoSans = Nunito_Sans({
  variable: "--font-nunito-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

const lora = Lora({
  variable: "--font-lora",
  subsets: ["latin"],
  style: ["normal", "italic"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Workforce · AI Employees",
  description: "Hire and manage AI employees that work every morning.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${nunitoSans.variable} ${lora.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <PostHogProvider>
          <NextTopLoader color="#5b7a45" showSpinner={false} />
          {children}
        </PostHogProvider>
      </body>
    </html>
  );
}
