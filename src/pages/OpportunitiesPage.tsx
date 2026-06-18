import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import OpportunitiesBoard from "@/components/opportunities/OpportunitiesBoard";

export default function OpportunitiesPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-20">
        <OpportunitiesBoard />
      </main>
      <Footer />
    </div>
  );
}
