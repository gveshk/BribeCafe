import { motion } from 'framer-motion'
import { useState, useEffect } from 'react'

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <motion.nav 
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? 'bg-[#f5f0e6]/95 shadow-md' : 'bg-transparent'
      }`}
    >
      <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
        <a href="#" className="font-display text-2xl font-bold text-[#2d2420]">
          Bribe<span className="text-[#d4a855]">Cafe</span>
        </a>
        
        <div className="hidden md:flex items-center gap-8">
          <a href="#problem" className="font-body text-[#5a4a3a] hover:text-[#704214] transition-colors">The Problem</a>
          <a href="#how" className="font-body text-[#5a4a3a] hover:text-[#704214] transition-colors">How It Works</a>
          <a href="#features" className="font-body text-[#5a4a3a] hover:text-[#704214] transition-colors">Features</a>
          <a href="#pricing" className="font-body text-[#5a4a3a] hover:text-[#704214] transition-colors">Pricing</a>
        </div>

        <a 
          href="#" 
          className="vintage-btn"
        >
          Launch App
        </a>
      </div>
    </motion.nav>
  )
}
