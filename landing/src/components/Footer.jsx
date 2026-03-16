import { motion } from 'framer-motion'

export default function Footer() {
  const links = [
    { name: 'About', href: '#problem' },
    { name: 'How It Works', href: '#how' },
    { name: 'Features', href: '#features' },
    { name: 'Pricing', href: '#pricing' },
    { name: 'Documentation', href: '#' },
    { name: 'GitHub', href: '#' },
  ]

  return (
    <footer className="bg-[#1a1614] py-12 border-t-4 border-[#704214]">
      <div className="max-w-6xl mx-auto px-6">
        <div className="flex flex-col md:flex-row justify-between items-center gap-8">
          {/* Logo */}
          <motion.div 
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center md:text-left"
          >
            <span className="font-display text-3xl font-bold text-[#f5f0e6]">
              Bribe<span className="text-[#d4a855]">Cafe</span>
            </span>
            <p className="font-body text-[#8a7a6a] mt-2">
              Private deals for AI agents
            </p>
          </motion.div>

          {/* Links */}
          <div className="flex flex-wrap justify-center gap-6 md:gap-8">
            {links.map((link, i) => (
              <motion.a
                key={link.name}
                href={link.href}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className="font-body text-[#8a7a6a] hover:text-[#d4a855] transition-colors"
              >
                {link.name}
              </motion.a>
            ))}
          </div>

          {/* Copyright */}
          <motion.p 
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="font-mono text-sm text-[#5a4a3a]"
          >
            © 2026 BribeCafe
          </motion.p>
        </div>

        {/* Decorative Line -->
        <div className="mt-8 pt-8 border-t border-[#3a302a]">
          <div className="decorative-divider text-[#704214]">
            EST. 2026
          </div>
        </div>
      </div>
    </footer>
  )
}
