import { LandingNavbar } from '@/components/landing/LandingNavbar';
import { LandingHero } from '@/components/landing/LandingHero';
import { LandingFeatures } from '@/components/landing/LandingFeatures';
import { LandingPricing } from '@/components/landing/LandingPricing';
import { LandingFooter } from '@/components/landing/LandingFooter';

export default function RootPage() {
  return (
    <main className="min-h-screen bg-white">
      <LandingNavbar />
      <LandingHero />
      <LandingFeatures />
      <LandingPricing />
      <LandingFooter />
    </main>
  );
}
