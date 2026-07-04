import { useEffect, useState } from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import Background from './components/Background.jsx'
import Nav from './components/Nav.jsx'
import AuthModal from './components/AuthModal.jsx'
import SearchOverlay from './components/SearchOverlay.jsx'
import FavoritesDrawer from './components/FavoritesDrawer.jsx'
import Home from './pages/Home.jsx'
import About from './sections/About.jsx'
import Character from './sections/Character.jsx'
import Story from './sections/Story.jsx'
import Shop from './sections/Shop.jsx'

// 換頁淡入轉場
function Page({ children }) {
  return (
    <motion.div
      initial={{ opacity: 0, filter: 'blur(8px)' }}
      animate={{ opacity: 1, filter: 'blur(0px)' }}
      exit={{ opacity: 0, filter: 'blur(8px)' }}
      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  )
}

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])
  return null
}

function AnimatedRoutes() {
  const location = useLocation()
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<Page><About /></Page>} />
        <Route path="/aura" element={<Page><Character /></Page>} />
        <Route path="/story" element={<Page><Story /></Page>} />
        <Route path="/shop" element={<Page><Shop /></Page>} />
        <Route path="*" element={<Home />} />
      </Routes>
    </AnimatePresence>
  )
}

export default function App() {
  const [authOpen, setAuthOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [favOpen, setFavOpen] = useState(false)

  return (
    <>
      <Background />
      <ScrollToTop />
      <Nav
        onAuth={() => setAuthOpen(true)}
        onSearch={() => setSearchOpen(true)}
        onFavorites={() => setFavOpen(true)}
      />

      <main>
        <AnimatedRoutes />
      </main>

      <AnimatePresence>
        {authOpen && <AuthModal key="auth" onClose={() => setAuthOpen(false)} />}
        {searchOpen && (
          <SearchOverlay key="search" onClose={() => setSearchOpen(false)} />
        )}
        {favOpen && (
          <FavoritesDrawer key="fav" onClose={() => setFavOpen(false)} />
        )}
      </AnimatePresence>
    </>
  )
}
