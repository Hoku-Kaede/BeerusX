export default function MissedCallLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <main id="content" className="min-h-screen">
      {children}
    </main>
  );
}
