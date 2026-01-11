import { Layout } from '@/components/layout/Layout';
import { HeroSection } from '@/components/home/HeroSection';
import { ServiceCategories } from '@/components/home/ServiceCategories';
import { HowItWorks } from '@/components/home/HowItWorks';
import { FeaturedWorkers } from '@/components/home/FeaturedWorkers';
import { CTASection } from '@/components/home/CTASection';

const Index = () => {
  return (
    <Layout>
      <HeroSection />
      <ServiceCategories />
      <HowItWorks />
      <FeaturedWorkers />
      <CTASection />
    </Layout>
  );
};

export default Index;
