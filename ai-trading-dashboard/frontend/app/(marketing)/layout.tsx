import { MarketingNavbar } from '@/components/marketing/Navbar';

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-canvas">
      <MarketingNavbar />
      {children}
    </div>
  );
}
