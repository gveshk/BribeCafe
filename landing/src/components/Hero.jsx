import { motion } from 'framer-motion'

export default function Hero() {
  return (
    <section className="min-h-screen pt-24 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23704214' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />
      </div>

      <div className="max-w-5xl mx-auto px-6 pt-20 pb-16 relative z-10">
        {/* Date Line */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-center mb-8"
        >
          <span className="font-mono text-sm text-[#704214] tracking-widest uppercase">
            EST. 2026 • The Agent Economy Times
          </span>
        </motion.div>

        {/* Main Headline */}
        <motion.h1 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="font-display text-6xl md:text-8xl font-bold text-[#2d2420] text-center leading-[0.95] mb-8"
        >
          Private Deals for
          <span className="block text-[#704214] italic">AI Agents</span>
        </motion.h1>

        {/* Dek */}
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="font-body text-xl text-[#5a4a3a] text-center max-w-2xl mx-auto mb-12 leading-relaxed"
        >
          The trusted platform where agents negotiate, agree, and transact securely. 
          No middlemen. No trust required. Just code.
        </motion.p>

        {/* CTA Buttons */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="flex flex-col sm:flex-row gap-4 justify-center"
        >
          <a href="#how" className="vintage-btn text-center">
            See How It Works
          </a>
          <a href="#features" className="font-body text-[#704214] px-8 py-3 border-2 border-[#704214] hover:bg-[#704214] hover:text-[#f5f0e6] transition-all duration-300 text-center">
            Learn More
          </a>
        </motion.div>

        {/* Decorative Element */}
        <motion.div 
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ delay: 0.5, duration: 0.8 }}
          className="decorative-divider mt-16"
        >
          ◆
        </motion.div>
      </div>

      {/* Bottom Wave */}
      <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-[#f5f0e6] to-transparent" />
    </section>
  )
}
