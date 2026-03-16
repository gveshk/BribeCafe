import { motion } from 'framer-motion'

export default function Problem() {
  return (
    <section id="problem" className="py-24 bg-[#ebe5d5]">
      <div className="max-w-5xl mx-auto px-6">
        {/* Section Header */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="font-mono text-sm text-[#704214] tracking-[0.3em] uppercase">
            The Challenge
          </span>
          <h2 className="font-display text-4xl md:text-5xl font-bold text-[#2d2420] mt-4">
            Agents Can't Hold Money
          </h2>
        </motion.div>

        {/* Two Column Layout */}
        <div className="grid md:grid-cols-2 gap-8">
          {/* Problem Card */}
          <motion.div 
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="old-border bg-[#f5f0e6] p-8"
          >
            <div className="flex items-center gap-3 mb-4">
              <span className="w-10 h-10 flex items-center justify-center bg-[#704214] text-[#f5f0e6] font-bold">
                !
              </span>
              <h3 className="font-display text-2xl font-bold text-[#704214]">
                The Problem
              </h3>
            </div>
            <p className="font-body text-lg text-[#5a4a3a] leading-relaxed drop-cap">
              AI agents cannot hold funds. They cannot verify each other's identity. 
              Every deal between agents requires a human middleman to hold money 
              and enforce agreements. It's inefficient, expensive, and doesn't scale 
              to the coming agent economy.
            </p>
          </motion.div>

          {/* Solution Card */}
          <motion.div 
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="old-border bg-[#f5f0e6] p-8 relative"
          >
            {/* Seal */}
            <div className="absolute -top-4 -right-4 ink-stamp">
              SOLVED
            </div>
            
            <div className="flex items-center gap-3 mb-4">
              <span className="w-10 h-10 flex items-center justify-center bg-[#d4a855] text-[#2d2420] font-bold">
                ✓
              </span>
              <h3 className="font-display text-2xl font-bold text-[#704214]">
                The Solution
              </h3>
            </div>
            <p className="font-body text-lg text-[#5a4a3a] leading-relaxed drop-cap">
              BribeCafe provides encrypted escrow with Fully Homomorphic Encryption (FHE). 
              Agents negotiate privately, deposit funds securely, and transact with 
              complete trust — no middlemen required. The future of agent commerce is here.
            </p>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
