import { Link, useNavigate } from 'react-router';
import { motion } from 'framer-motion';
import type { Variants } from 'framer-motion';
import {
  Leaf, Calculator, Brain, Target, Sliders, Users,
  ArrowRight, ChevronDown, BookOpen, Github, Twitter
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import EcoWorld from '@/components/EcoWorld';

const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.5, ease: [0, 0, 0.2, 1] },
  }),
};

const features = [
  { icon: Calculator, title: 'Smart Activity Tracker', desc: 'Log your meals, trips, flights, and purchases. Delightful interactive slider inputs show equivalent carbon comparisons.', image: '🌱' },
  { icon: Leaf, title: 'Dynamic 3D Living World', desc: 'Watch your carbon footprint visually reflect on a floating eco-island. Grey skies and smog vanish as you choose green habits.', image: '🏝️' },
  { icon: Target, title: 'Real-Time Nudge System', desc: 'Receive well-timed, contextual, one-line alerts before confirming logs. Zero judgment, just alternatives.', image: '⚡' },
  { icon: Brain, title: 'AI Personal Coach', desc: 'Receive hyper-specific actionable advice and conversational check-ins. Track habits with conversational recommendations.', image: '🤖' },
  { icon: Users, title: 'Social Competition', desc: 'Join collective accountability Circles (hostel floors, design vs engineering). Earn team points and streaks together.', image: '👥' },
  { icon: Sliders, title: 'Gamification Layer', desc: 'Accumulate XP points and level up from Seedling to Forest Guardian. Share beautiful custom report cards.', image: '🏆' },
];

export default function Home() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#030712] text-white overflow-hidden">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center pt-24 pb-16 px-4">
        {/* Background Gradients */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full bg-emerald-500/10 blur-[100px]" />
          <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-[350px] h-[350px] rounded-full bg-cyan-500/10 blur-[90px]" />
        </div>

        <div className="max-w-7xl mx-auto w-full grid lg:grid-cols-12 gap-12 items-center relative z-10">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="lg:col-span-6 space-y-6 text-left"
          >
            <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-4 py-1.5 text-emerald-400">
              <Leaf className="w-4 h-4" />
              <span className="text-xs font-semibold uppercase tracking-wider">AI-Powered Carbon Sandbox</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-tight tracking-tight">
              Carbon tracking,
              <br />
              <span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                visually & emotionally alive.
              </span>
            </h1>

            <p className="text-base sm:text-lg text-slate-400 leading-relaxed max-w-xl">
              Don&apos;t just read reports at the end of the month. See your daily choices shape a floating, living world. Get contextual nudges at the point of action, compete in team circles, and level up your eco-footprint.
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-4 pt-2">
              <Button
                size="lg"
                onClick={() => navigate(isAuthenticated ? '/dashboard' : '/auth')}
                className="w-full sm:w-auto bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-slate-950 font-bold px-8 py-6 text-base rounded-full shadow-lg shadow-emerald-500/20 transition-all duration-300"
              >
                Log My First Activity
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
              <Link to="/methodology" className="w-full sm:w-auto">
                <Button
                  size="lg"
                  variant="ghost"
                  className="w-full sm:w-auto border border-slate-700 hover:bg-slate-800 text-white font-semibold px-8 py-6 text-base rounded-full"
                >
                  View Methodology
                </Button>
              </Link>
            </div>

            <div className="pt-6 flex items-center gap-3">
              <div className="flex -space-x-2">
                {[1,2,3,4,5].map(i => (
                  <div key={i} className="w-8 h-8 rounded-full bg-slate-800 border-2 border-[#030712] flex items-center justify-center">
                    <span className="text-[10px] text-emerald-400 font-bold">{String.fromCharCode(64+i)}</span>
                  </div>
                ))}
              </div>
              <p className="text-xs text-slate-500">
                Join <span className="font-semibold text-emerald-400">12,000+</span> builders transforming climate awareness.
              </p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 50, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="lg:col-span-6 flex justify-center"
          >
            <div className="w-full max-w-lg">
              {/* Floating isometric sandbox component */}
              <EcoWorld total={340} transport={80} energy={120} food={90} lifestyle={50} interactive={false} />
            </div>
          </motion.div>
        </div>

        <motion.div
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        >
          <ChevronDown className="w-6 h-6 text-slate-600" />
        </motion.div>
      </section>

      {/* Features Section */}
      <section className="py-24 px-4 bg-slate-950/40 border-t border-slate-900">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-100px' }}
            variants={fadeInUp}
            custom={0}
            className="text-center mb-16 space-y-4"
          >
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
              An experience built to change behaviors
            </h2>
            <p className="text-sm sm:text-base text-slate-400 max-w-xl mx-auto leading-relaxed">
              We pushed past standard carbon charts and checklists. Every feature in CarbonWise is designed for visual, emotional, and social engagement.
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: '-50px' }}
                variants={fadeInUp}
                custom={i}
                className="glass-card rounded-2xl p-6 hover:border-emerald-500/20 transition-all duration-300 group hover:translate-y-[-4px]"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 rounded-xl bg-slate-800/80 flex items-center justify-center border border-slate-700/50">
                    <f.icon className="w-5 h-5 text-emerald-400 group-hover:text-cyan-400 transition-colors" />
                  </div>
                  <span className="text-2xl">{f.image}</span>
                </div>
                <h3 className="text-lg font-bold text-slate-100 mb-2">{f.title}</h3>
                <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Landing CTA Section */}
      <section className="py-24 px-4 relative">
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] rounded-full bg-emerald-500/5 blur-[80px]" />
        </div>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="max-w-3xl mx-auto text-center glass-card rounded-3xl p-12 relative z-10 border border-slate-800"
        >
          <h2 className="text-3xl font-bold tracking-tight mb-4">
            Transform numbers into action.
          </h2>
          <p className="text-slate-400 mb-8 max-w-md mx-auto leading-relaxed">
            Create an account in seconds, calculate your baseline footprint, and explore your living island sandbox.
          </p>
          <Button
            size="lg"
            onClick={() => navigate(isAuthenticated ? '/dashboard' : '/auth')}
            className="bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 font-bold px-10 py-6 text-base rounded-full shadow-lg shadow-emerald-500/15"
          >
            Enter Sandbox — It&apos;s Free
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-950 border-t border-slate-900 py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Leaf className="w-5 h-5 text-emerald-400" />
                <span className="text-lg font-bold tracking-tight text-white">CarbonWise</span>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                Shifting environmental responsibility from standard checklists to immersive emotional sandboxes. Built for modern sustainability campaigns.
              </p>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-slate-300 mb-4">Product</h4>
              <div className="flex flex-col gap-2.5 text-xs text-slate-400">
                <Link to="/log" className="hover:text-emerald-400 transition-colors">Smart Logger</Link>
                <Link to="/world" className="hover:text-emerald-400 transition-colors">Living World</Link>
                <Link to="/social" className="hover:text-emerald-400 transition-colors">Social circles</Link>
                <Link to="/coach" className="hover:text-emerald-400 transition-colors">AI Coach</Link>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-slate-300 mb-4">Science</h4>
              <div className="flex flex-col gap-2.5 text-xs text-slate-400">
                <Link to="/methodology" className="hover:text-emerald-400 transition-colors">EPA Methodology</Link>
                <span className="text-slate-500">DEFRA Factors</span>
                <span className="text-slate-500">ICAO Database</span>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-slate-300 mb-4">Community</h4>
              <div className="flex items-center gap-3">
                <a href="#" className="w-9 h-9 rounded-lg bg-slate-900 flex items-center justify-center border border-slate-800 hover:bg-slate-800 transition-colors">
                  <Github className="w-4 h-4 text-slate-400" />
                </a>
                <a href="#" className="w-9 h-9 rounded-lg bg-slate-900 flex items-center justify-center border border-slate-800 hover:bg-slate-800 transition-colors">
                  <Twitter className="w-4 h-4 text-slate-400" />
                </a>
              </div>
            </div>
          </div>

          <div className="border-t border-slate-900 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-[10px] text-slate-600">© 2026 CarbonWise. Dedicated to environmental restoration.</p>
            <div className="flex items-center gap-1 text-[10px] text-slate-600">
              <BookOpen className="w-3.5 h-3.5" />
              <span>Climate Data Core v2.4</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
