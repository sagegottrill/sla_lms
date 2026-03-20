import Navbar from "@/components/landing/Navbar";
import HeroSection from "@/components/landing/HeroSection";
import TrustSection from "@/components/landing/TrustSection";
import FeaturedCourses from "@/components/landing/FeaturedCourses";
import ProgramsSection from "@/components/landing/ProgramsSection";
import FAQSection from "@/components/landing/FAQSection";
import CtaSection from "@/components/landing/CtaSection";
import Footer from "@/components/landing/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main>
        <HeroSection />
        <TrustSection />
        <FeaturedCourses />
        <ProgramsSection />
        <FAQSection />
        <CtaSection />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
