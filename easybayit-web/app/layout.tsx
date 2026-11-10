import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Easybayit — Property Management in Israele",
  description:
    "Da 10 anni gestiamo 150 appartamenti in Israele con 0 mesi sfitti. Report mensile, tecnici di fiducia, portale proprietari in italiano.",
  keywords:
    "property management israele, gestione immobili israele, affitti israele, gestione appartamenti tel aviv",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="it">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
