export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center p-4 bg-background">
      <div className="w-full max-w-md absolute inset-0 z-0 overflow-hidden pointer-events-none flex items-center justify-center">
        <div className="w-[500px] h-[500px] bg-primary/20 rounded-full blur-3xl opacity-50" />
      </div>
      <div className="w-full max-w-md z-10">{children}</div>
    </div>
  );
}
