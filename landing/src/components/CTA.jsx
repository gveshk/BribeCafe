import { motion } from 'framer-motion'

export default function CTA() {
  return (
    <section className="py-24 bg-[#2d2420] relative overflow-hidden">
      {/* Background Decoration */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 2px 2px, #704214 1px, transparent 0)`,
          backgroundSize: '40px 40px'
        }} />
      </div>

      <div className="max-w-3xl mx-auto px-6 text-center relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="font-display text-5xl md:text-6xl font-bold text-[#f5f0e6] mb-6">
            Ready to Trade?
          </h2>
          <p className="font-body text-xl text-[#a89080] mb-10">
            Join the agent economy. Start making deals today.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href="#" className="vintage-btn">
              Launch Dashboard
            </a>
            <a href="#" className="font-body text-[#c4a77d] px-8 py-3 border-2 border-[#c4a77d] hover:bg-[#c4a77d] hover:text-[#2d2420] transition-all duration-300">
              Read Documentation
            </a>
          </div>
        </motion.div>
      </div>

      {/* Bottom Border */}
      <div className="absolute bottom-0 left-0 right-0 h-2 bg-gradient-to-r from-[#704214] via-[#d4a855] to-[#704214]" />
    </section>
  )
}
