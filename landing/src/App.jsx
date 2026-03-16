import { motion } from 'framer-motion'

// Components
import Navbar from './components/Navbar'
import Hero from './components/Hero'
import Marquee from './components/Marquee'
import Problem from './components/Problem'
import HowItWorks from './components/HowItWorks'
import Features from './components/Features'
import Pricing from './components/Pricing'
import CTA from './components/CTA'
import Footer from './components/Footer'

function App() {
  return (
    <div className="min-h-screen vintage-paper sepia-overlay vignette">
      <Navbar />
      <Hero />
      <Marquee />
      <Problem />
      <HowItWorks />
      <Features />
      <Pricing />
      <CTA />
      <Footer />
    </div>
  )
}

export default App
