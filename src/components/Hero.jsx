import React, { useRef } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { Shield, ArrowRight, Zap, Database, Lock, EyeOff } from 'lucide-react';

function MagneticButton({ children, className, href }) {
  const ref = useRef(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  // Dynamic spring physics as requested (stiffness: 100-150, damping: 12-15)
  const springX = useSpring(x, { stiffness: 120, damping: 12, mass: 0.8 });
  const springY = useSpring(y, { stiffness: 120, damping: 12, mass: 0.8 });

  const handleMouseMove = (e) => {
    if (!ref.current) return;
    const { clientX, clientY } = e;
    const { left, top, width, height } = ref.current.getBoundingClientRect();
    const centerX = left + width / 2;
    const centerY = top + height / 2;
    const distanceX = clientX - centerX;
    const distanceY = clientY - centerY;
    
    // Magnetic pull limit (max 25px offset)
    x.set(distanceX * 0.3);
    y.set(distanceY * 0.3);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.a
      ref={ref}
      href={href}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ x: springX, y: springY }}
      className={`inline-flex items-center justify-center relative transition-shadow duration-300 ${className}`}
    >
      {children}
    </motion.a>
  );
}

export default function Hero() {
  const fadeUpVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: (custom) => ({
      opacity: 1,
      y: 0,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 15,
        delay: custom * 0.1,
      },
    }),
  };

  return (
    <section className="relative min-h-[92vh] flex flex-col items-center justify-center px-4 md:px-8 py-20 overflow-hidden" style={{ backgroundColor: 'var(--bg-base)' }}>
      {/* Background Neon Glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-purple-500/10 blur-[120px] pointer-events-none animate-pulse-glow" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-blue-500/10 blur-[120px] pointer-events-none animate-pulse-glow" />

      {/* Grid Pattern Overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff03_1px,transparent_1px),linear-gradient(to_bottom,#ffffff03_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none" />

      <div className="w-full max-w-[95%] xl:max-w-[1600px] 2xl:max-w-[1800px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center z-10">
        
        {/* Text Content */}
        <div className="lg:col-span-7 flex flex-col items-start text-left space-y-6">
          {/* Badge */}
          <motion.div
            custom={0}
            initial="hidden"
            animate="visible"
            variants={fadeUpVariants}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full glass-card text-xs font-semibold text-accent-blue tracking-wide uppercase border border-blue-500/20"
          >
            <Shield className="w-3.5 h-3.5" />
            <span>Local-first · Zero vendor lock</span>
          </motion.div>

          {/* Title */}
          <motion.h1
            custom={1}
            initial="hidden"
            animate="visible"
            variants={fadeUpVariants}
            className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight leading-[1.1] md:leading-[1.05]" style={{ color: 'var(--text-primary)' }}
          >
            Expense intelligence <br />
            <span className="bg-gradient-to-r from-accent-blue via-accent-purple to-accent-pink bg-clip-text text-transparent">
              that stays yours.
            </span>
          </motion.h1>

          {/* Description */}
          <motion.p
            custom={2}
            initial="hidden"
            animate="visible"
            variants={fadeUpVariants}
            className="text-base sm:text-lg max-w-xl leading-relaxed" style={{ color: 'var(--text-muted)' }}
          >
            Logbook Plus combines client‑side encryption, multi‑policy automated backups, and instant cross-device synchronization — all securely anchored on your own private cloud storage.
          </motion.p>

          {/* CTA & Actions */}
          <motion.div
            custom={3}
            initial="hidden"
            animate="visible"
            variants={fadeUpVariants}
            className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full sm:w-auto"
          >
            <MagneticButton
              href="/app/"
              className="px-8 py-4 rounded-xl font-medium text-white shadow-[0_0_20px_rgba(96,165,250,0.3)] bg-gradient-to-r from-accent-blue to-accent-purple border border-white/20 hover:shadow-[0_0_30px_rgba(192,132,252,0.5)] transition-shadow duration-300"
            >
              Start managing expenses
              <ArrowRight className="w-4 h-4 ml-2" />
            </MagneticButton>

            <a
              href="/documentation/"
              className="px-6 py-4 rounded-xl font-medium glass-card hover:bg-white/5 transition-all text-center flex items-center justify-center gap-2" style={{ color: 'var(--text-secondary)' }}
            >
              Read Docs
            </a>
          </motion.div>

          {/* Stats Bar */}
          <motion.div
            custom={4}
            initial="hidden"
            animate="visible"
            variants={fadeUpVariants}
            className="grid grid-cols-3 gap-6 md:gap-8 pt-8 w-full border-t" style={{ borderColor: 'var(--border)' }}
          >
            <div className="flex flex-col">
              <span className="text-2xl md:text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>100%</span>
              <span className="text-xs md:text-sm" style={{ color: 'var(--text-muted)' }}>Encrypted Client-side</span>
            </div>
            <div className="flex flex-col">
              <span className="text-2xl md:text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>3x</span>
              <span className="text-xs md:text-sm" style={{ color: 'var(--text-muted)' }}>Backup Redundancy</span>
            </div>
            <div className="flex flex-col">
              <span className="text-2xl md:text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>24/7</span>
              <span className="text-xs md:text-sm" style={{ color: 'var(--text-muted)' }}>Private Cloud Sync</span>
            </div>
          </motion.div>
        </div>

        {/* Anti-Gravity Floating Application Mockup */}
        <div className="lg:col-span-5 relative w-full h-[350px] md:h-[450px] flex items-center justify-center mt-10 lg:mt-0">
          {/* Main Dashboard Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 80, damping: 15, delay: 0.3 }}
            className="relative w-full max-w-[420px] aspect-[4/3] rounded-2xl glass-card shadow-2xl p-4 overflow-hidden animate-float-medium" style={{ border: '1px solid var(--border)' }}
          >
            {/* Window controls */}
            <div className="flex items-center gap-1.5 mb-4 border-b pb-3" style={{ borderColor: 'var(--border)' }}>
              <div className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
              <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/60" />
              <div className="w-2.5 h-2.5 rounded-full bg-green-500/60" />
              <span className="text-[10px] ml-2 font-mono" style={{ color: 'var(--text-muted)' }}>logbook-dashboard v2.1</span>
            </div>

            {/* Fake layout */}
            <div className="space-y-3">
              <div className="h-6 w-24 rounded-md" style={{ background: 'var(--bg-input)' }} />
              <div className="grid grid-cols-3 gap-2">
                <div className="h-14 rounded-xl p-2 flex flex-col justify-between" style={{ background: 'var(--bg-input)', border: '1px solid var(--border)' }}>
                  <span className="text-[8px]" style={{ color: 'var(--text-muted)' }}>Monthly Spend</span>
                  <span className="text-xs font-semibold text-accent-blue">₹2,481.50</span>
                </div>
                <div className="h-14 rounded-xl p-2 flex flex-col justify-between" style={{ background: 'var(--bg-input)', border: '1px solid var(--border)' }}>
                  <span className="text-[8px]" style={{ color: 'var(--text-muted)' }}>Local Cache</span>
                  <span className="text-xs font-semibold text-accent-purple">Active</span>
                </div>
                <div className="h-14 rounded-xl p-2 flex flex-col justify-between" style={{ background: 'var(--bg-input)', border: '1px solid var(--border)' }}>
                  <span className="text-[8px]" style={{ color: 'var(--text-muted)' }}>Sync Status</span>
                  <span className="text-xs font-semibold text-emerald-400">Secure</span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="h-2 w-full rounded-full overflow-hidden" style={{ background: 'var(--bg-input)' }}>
                  <div className="h-full bg-gradient-to-r from-accent-blue to-accent-purple w-2/3" />
                </div>
                <div className="flex justify-between text-[8px]" style={{ color: 'var(--text-muted)' }}>
                  <span>Quota Utilized: 160MB</span>
                  <span>Limit: 240MB</span>
                </div>
              </div>
              {/* Fake logs list */}
              <div className="space-y-1.5">
                {[
                  { desc: 'AWS Server Infrastructure Backup', amount: '-₹120.00', cat: 'Server', time: 'Just now' },
                  { desc: 'Vercel Pro Subscription', amount: '-₹20.00', cat: 'Hosting', time: '12m ago' }
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2 rounded-lg text-[10px]" style={{ background: 'var(--bg-input)', border: '1px solid var(--border)' }}>
                    <div className="flex flex-col">
                      <span className="font-medium" style={{ color: 'var(--text-primary)' }}>{item.desc}</span>
                      <span className="text-[8px]" style={{ color: 'var(--text-muted)' }}>{item.time} · {item.cat}</span>
                    </div>
                    <span className="font-semibold" style={{ color: 'var(--text-secondary)' }}>{item.amount}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Floating Anti-Gravity Widget 1: Total Privacy */}
          <motion.div
            initial={{ opacity: 0, x: -30, y: 40 }}
            animate={{ opacity: 1, x: 0, y: 0 }}
            transition={{ type: "spring", stiffness: 100, damping: 14, delay: 0.6 }}
            className="absolute top-1/4 left-0 sm:-left-6 md:-left-12 glass-card p-3 rounded-xl border border-emerald-500/20 shadow-xl hidden sm:flex items-center gap-2.5 animate-float-slow"
          >
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
              <Lock className="w-4 h-4" />
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] font-bold leading-tight" style={{ color: 'var(--text-primary)' }}>Private Database</span>
              <span className="text-[8px]" style={{ color: 'var(--text-muted)' }}>Encrypted on device</span>
            </div>
          </motion.div>

          {/* Floating Anti-Gravity Widget 2: Sync Sync */}
          <motion.div
            initial={{ opacity: 0, x: 40, y: -40 }}
            animate={{ opacity: 1, x: 0, y: 0 }}
            transition={{ type: "spring", stiffness: 100, damping: 14, delay: 0.8 }}
            className="absolute bottom-1/4 right-0 sm:-right-6 md:-right-12 glass-card p-3 rounded-xl border border-purple-500/20 shadow-xl hidden sm:flex items-center gap-2.5 animate-float-medium"
          >
            <div className="p-2 rounded-lg bg-purple-500/10 text-accent-purple">
              <Zap className="w-4 h-4" />
            </div>
            <div className="flex flex-col font-sans">
              <span className="text-[10px] font-bold leading-tight" style={{ color: 'var(--text-primary)' }}>Zero-Latency Cache</span>
              <span className="text-[8px]" style={{ color: 'var(--text-muted)' }}>12ms response time</span>
            </div>
          </motion.div>

          {/* Interactive Floating Indicator */}
          <div className="absolute top-[80%] left-1/4 flex items-center gap-1.5 text-[10px] px-2 py-1 rounded-full backdrop-blur-sm pointer-events-none" style={{ color: 'var(--text-muted)', background: 'var(--bg-input)', border: '1px solid var(--border)' }}>
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-ping" />
            <span>Interactive sandbox preview</span>
          </div>
        </div>

      </div>
    </section>
  );
}
