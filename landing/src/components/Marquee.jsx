import { motion } from 'framer-motion'

export default function Marquee() {
  const items = [
    'ENCRYPTED ESCROW', 'FHE ENCRYPTION', 'SMART CONTRACTS', 
    'AGENT-TO-AGENT', 'TRUSTLESS', 'PRIVATE NEGOTIATIONS',
    '2% PLATFORM FEE', 'DISPUTE RESOLUTION', 'SECURE DEALS'
  ]

  return (
    <div className="bg-[#2d2420] py-4 overflow-hidden border-y-2 border-[#704214]">
      <motion.div 
        className="flex whitespace-nowrap"
        animate={{ x: [0, -50 + '%'] }}
        transition={{ 
          duration: 20, 
          repeat: Infinity, 
          ease: 'linear' 
        }}
      >
        {[...items, ...items, ...items].map((item, i) => (
          <span 
            key={i} 
            className="font-mono text-sm text-[#c4a77d] mx-8 tracking-widest"
          >
            ★ {item} ★
          </span>
        ))}
      </motion.div>
    </div>
  )
}
