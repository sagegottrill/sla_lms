import Navbar from "@/components/landing/Navbar";
import HeroSection from "@/components/landing/HeroSection";
import CategoriesSection from "@/components/landing/CategoriesSection";
import HowItWorksSection from "@/components/landing/HowItWorksSection";
import FeaturedCourses from "@/components/landing/FeaturedCourses";
import WhyConnectaSection from "@/components/landing/WhyConnectaSection";
import ProgramsSection from "@/components/landing/ProgramsSection";
import TestimonialsSection from "@/components/landing/TestimonialsSection";
import OutcomesSection from "@/components/landing/OutcomesSection";
import FAQSection from "@/components/landing/FAQSection";
import CtaSection from "@/components/landing/CtaSection";
import EmailCapture from "@/components/landing/EmailCapture";
import Footer from "@/components/landing/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main>
        <HeroSection />
        <CategoriesSection />
        <HowItWorksSection />
        <FeaturedCourses />
        <WhyConnectaSection />
        <ProgramsSection />
        <TestimonialsSection />
        <OutcomesSection />
        <FAQSection />
        <EmailCapture />
        <CtaSection />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
