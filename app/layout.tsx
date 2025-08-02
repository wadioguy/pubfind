// app/layout.tsx
import "./globals.css";

export const metadata = {
  title: "Pub Find",
  description: "Find nearby pubs with opening hours and ratings",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased font-sans expansion-alids-init">
        {children}
      </body>
    </html>
  );
}
