import React from 'react';
import { Navbar } from './Navbar';
import { Hero } from './Hero';
import { ProblemStatement } from './ProblemStatement';
import { PlatformCapabilities } from './PlatformCapabilities';
import { HowItWorks } from './HowItWorks';
import { Roles } from './Roles';
import { SecurityEthics } from './SecurityEthics';
import { MultilingualSupport } from './MultilingualSupport';
import { CTASection } from './CTA_Section';
import { KnowledgeGraph } from './KnowledgeGraph';
import { Footer } from './Footer';

const LandingPage = () => {
    return (
        <div className="font-serif antialiased bg-[#0c0c0c] text-white selection:bg-emerald-500/30 selection:text-emerald-200">
            <Navbar />
            <main className="relative overflow-hidden">
                {/* Stunning Ambient Background Architecture */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full pointer-events-none overflow-hidden">
                    <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-500/10 blur-[120px] rounded-full animate-pulse" />
                    <div className="absolute bottom-[20%] right-[-10%] w-[50%] h-[50%] bg-stone-900/40 blur-[100px] rounded-full" />
                </div>
                
                <Hero />
                
                <section className="relative z-10 py-32 bg-white/5 backdrop-blur-3xl border-y border-white/5">
                    <ProblemStatement />
                </section>

                <PlatformCapabilities />
                
                <KnowledgeGraph />
                
                <section className="py-32 bg-stone-950 text-white relative overflow-hidden border-y border-white/5">
                    <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]" />
                    <HowItWorks />
                </section>

                <Roles />
                
                <section className="py-32 border-y border-white/5 bg-white/5 backdrop-blur-xl">
                    <SecurityEthics />
                </section>

                <MultilingualSupport />
                
                <div className="relative isolate px-6 py-32 sm:py-40 lg:px-8 bg-gradient-to-b from-transparent to-black">
                    <CTASection />
                </div>
            </main>
            <Footer />
        </div>
    );
};

export default LandingPage;
