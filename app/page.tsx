import Navbar from "@/components/landing/Navbar";
import Hero from "@/components/landing/Hero";
import WhatTraceeDoes from "@/components/landing/WhatTraceeDoes";
import HowItWorks from "@/components/landing/HowItWorks";
import ProductAndPlantSections from "@/components/landing/ProductAndPlantSections";
import CtaBanner from "@/components/landing/CtaBanner";
import Footer from "@/components/landing/Footer";

export default function Home() {
  return (
    <>
      <Navbar />
      <main className="flex-1">
        <Hero />
        <WhatTraceeDoes />
        <HowItWorks />
        <ProductAndPlantSections />
        <CtaBanner />
      </main>
      <Footer />
    </>
  );
}