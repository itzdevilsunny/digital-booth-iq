import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Navbar } from './Navbar';
import { Hero } from './Hero';
import { ProblemStatement } from './ProblemStatement';
import { PlatformCapabilities } from './PlatformCapabilities';
import { HowItWorks } from './HowItWorks';
import { Roles } from './Roles';
import { SecurityEthics } from './SecurityEthics';
import { MultilingualSupport } from './MultilingualSupport';
import { CTA_Section } from './CTA_Section';
import { Footer } from './Footer';

const LandingPage = () => {
    return (
        <div className="font-body antialiased bg-stone-50 text-stone-900 selection:bg-emerald-100 selection:text-emerald-900">
            <Navbar />
            <main className="relative overflow-hidden">
                {/* Decorative Background Glows */}
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-100/30 blur-[120px] rounded-full -mr-64 -mt-64" />
                <div className="absolute top-[20%] left-0 w-[400px] h-[400px] bg-yellow-100/20 blur-[100px] rounded-full -ml-32" />
                
                <Hero />
                
                <section className="relative z-10 py-24 bg-white/40 backdrop-blur-sm border-y border-stone-200/50">
                    <ProblemStatement />
                </section>

                <PlatformCapabilities />
                
                <section className="py-24 bg-stone-900 text-white relative overflow-hidden">
                    <div className="absolute inset-0 opacity-10 bg-grid-pattern" />
                    <HowItWorks />
                </section>

                <Roles />
                
                <section className="py-24 border-y border-stone-200/50 bg-white/30">
                    <SecurityEthics />
                </section>

                <MultilingualSupport />
                
                <div className="relative isolate px-6 py-24 sm:py-32 lg:px-8">
                    <CTA_Section />
                </div>
            </main>
            <Footer />
        </div>
    );
};

export default LandingPage;
