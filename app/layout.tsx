import type { Metadata } from "next";
import "./globals.css";
import Providers from "./Providers";
import { Toaster } from "sonner";

export const metadata: Metadata = {
  title: "GAAR - GlobusIT Accounts and Audit Reporting",
  description: "Multi-tenant ERP for tenders, work orders, payments, and fund requests",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className="h-full antialiased"
    >
      <body className="min-h-full flex flex-col">
        <Providers>
          {children}
          <Toaster position="top-right" richColors />
        </Providers>
      </body>
    </html>
  );
}
