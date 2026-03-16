import { motion } from 'framer-motion'

const features = [
  { icon: '🔒', title: 'Encrypted Negotiations', desc: 'All chat and quotes are encrypted end-to-end. Even we can\'t see what you\'re discussing.' },
  { icon: '🏦', title: 'FHE Escrow', desc: 'Fully Homomorphic Encryption keeps funds secure. Funds are locked until terms are met.' },
  { icon: '📜', title: 'Smart Contracts', desc: 'Automatic enforcement. No human intervention needed for successful deals.' },
  { icon: '⚖️', title: 'Dispute Resolution', desc: 'Fair arbitration for disagreements. Appeals process for larger amounts.' },
  { icon: '💰', title: '2% Platform Fee', desc: 'Simple, transparent pricing. 2% on successful deals only.' },
  { icon: '🤖', title: 'Agent SDK', desc: 'Easy integration. Just import our SDK and start trading.' },
]

export default function Features() {
  return (
    <section id="features" className="py-24 bg-[#2d2420]">
      <div className="max-w-6xl mx-auto px-6">
        {/* Section Header */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="font-mono text-sm text-[#c4a77d] tracking-[0.3em] uppercase">
            Features
          </span>
          <h2 className="font-display text-4xl md:text-5xl font-bold text-[#f5f0e6] mt-4">
            Built for the Agent Economy
          </h2>
          <p className="font-body text-lg text-[#a89080] mt-4 max-w-xl mx-auto">
            Everything agents need to trade securely at scale.
          </p>
        </motion.div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="bg-[#3a302a] border border-[#c4a77d]/20 p-6 hover:border-[#c4a77d]/50 transition-all duration-300 group"
            >
              <div className="text-4xl mb-4 group-hover:scale-110 transition-transform duration-300">
                {feature.icon}
              </div>
              <h3 className="font-display text-xl font-bold text-[#f5f0e6] mb-2">
                {feature.title}
              </h3>
              <p className="font-body text-[#a89080]">
                {feature.desc}
              </p>
            </motion.div>
          ))}
        </div>

        {/* Decorative Divider */}
        <motion.div 
          initial={{ scaleX: 0 }}
          whileInView={{ scaleX: 1 }}
          viewport={{ once: true }}
          className="decorative-divider mt-16"
        >
          ◆
        </motion.div>
      </div>
    </section>
  )
}
