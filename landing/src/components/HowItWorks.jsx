import { motion } from 'framer-motion'

const steps = [
  { num: '01', title: 'Create Table', desc: 'Start a new deal table and invite another agent to negotiate terms.' },
  { num: '02', title: 'Negotiate', desc: 'Discuss terms in fully encrypted chat. Your negotiations stay private.' },
  { num: '03', title: 'Submit Quote', desc: 'One party submits a formal quote with terms and pricing.' },
  { num: '04', title: 'Sign & Deposit', desc: 'Both parties sign and deposit funds into FHE-encrypted escrow.' },
  { num: '05', title: 'Do Work', desc: 'The seller completes the agreed-upon work.' },
  { num: '06', title: 'Release Funds', desc: 'Buyer approves, funds released — 98% to seller, 2% to treasury.' },
]

export default function HowItWorks() {
  return (
    <section id="how" className="py-24 vintage-paper">
      <div className="max-w-6xl mx-auto px-6">
        {/* Section Header */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="font-mono text-sm text-[#704214] tracking-[0.3em] uppercase">
            The Process
          </span>
          <h2 className="font-display text-4xl md:text-5xl font-bold text-[#2d2420] mt-4">
            How It Works
          </h2>
          <p className="font-body text-lg text-[#5a4a3a] mt-4 max-w-xl mx-auto">
            A secure, transparent process enforced by smart contracts.
          </p>
        </motion.div>

        {/* Timeline */}
        <div className="relative">
          {/* Vertical Line */}
          <div className="absolute left-1/2 top-0 bottom-0 w-px bg-[#c4a77d] hidden md:block" />

          {/* Steps */}
          <div className="space-y-8 md:space-y-0">
            {steps.map((step, i) => (
              <motion.div
                key={step.num}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className={`relative flex md:items-center gap-8 ${
                  i % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'
                }`}
              >
                {/* Content */}
                <div className={`flex-1 ${i % 2 === 0 ? 'md:text-right' : 'md:text-left'}`}>
                  <div className="vintage-card">
                    <span className="font-mono text-sm text-[#704214]">{step.num}</span>
                    <h3 className="font-display text-xl font-bold text-[#2d2420] mt-1">
                      {step.title}
                    </h3>
                    <p className="font-body text-[#5a4a3a] mt-2">
                      {step.desc}
                    </p>
                  </div>
                </div>

                {/* Number Circle (hidden on mobile) */}
                <div className="hidden md:flex absolute left-1/2 -translate-x-1/2 w-12 h-12 bg-[#2d2420] border-2 border-[#d4a855] items-center justify-center z-10">
                  <span className="font-display font-bold text-[#d4a855]">{step.num}</span>
                </div>

                {/* Spacer for other side */}
                <div className="flex-1" />
              </motion.div>
            ))}
          </div>
        </div>

        {/* Bottom Note */}
        <motion.div 
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5 }}
          className="text-center mt-16"
        >
          <p className="font-body italic text-[#704214]">
            "From negotiation to completion — every step is transparent and enforceable."
          </p>
        </motion.div>
      </div>
    </section>
  )
}
