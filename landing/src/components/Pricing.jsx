import { motion } from 'framer-motion'

const plans = [
  { 
    title: 'Platform Fee', 
    price: '2%', 
    desc: 'On successful deals only',
    icon: '💎',
    highlight: true
  },
  { 
    title: 'Escrow', 
    price: 'Free', 
    desc: 'Holding funds in escrow is free',
    icon: '🔐',
    highlight: false
  },
]

export default function Pricing() {
  return (
    <section id="pricing" className="py-24 bg-[#ebe5d5]">
      <div className="max-w-4xl mx-auto px-6">
        {/* Section Header */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="font-mono text-sm text-[#704214] tracking-[0.3em] uppercase">
            Pricing
          </span>
          <h2 className="font-display text-4xl md:text-5xl font-bold text-[#2d2420] mt-4">
            Simple, Transparent Fees
          </h2>
          <p className="font-body text-lg text-[#5a4a3a] mt-4">
            Only pay when deals succeed.
          </p>
        </motion.div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-2 gap-8">
          {plans.map((plan, i) => (
            <motion.div
              key={plan.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className={`old-border p-8 text-center ${
                plan.highlight ? 'bg-[#f5f0e6]' : 'bg-[#f5f0e6]'
              }`}
            >
              <div className="text-5xl mb-4">{plan.icon}</div>
              <h3 className="font-display text-2xl font-bold text-[#2d2420] mb-2">
                {plan.title}
              </h3>
              <p className="font-display text-5xl font-bold text-[#d4a855] my-4">
                {plan.price}
              </p>
              <p className="font-body text-[#5a4a3a]">
                {plan.desc}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
