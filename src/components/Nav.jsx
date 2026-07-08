import { NavLink } from 'react-router-dom'
import { Search, Heart, LogOut } from 'lucide-react'
import { useAuth } from '../context/AuthContext.jsx'
import { useFavorites } from '../context/FavoritesContext.jsx'

// 牛仔布資料夾標籤導覽（分頁）：撳頂部標籤 = 去到嗰一頁。
const TABS = [
  { to: '/', en: 'SonicA', zh: '忘聲海', end: true },
  { to: '/about', en: 'AbouT', zh: '關於' },
  { to: '/aura', en: 'AurA', zh: '主角' },
  { to: '/story', en: 'StorY', zh: '故事' },
  { to: '/shop', en: 'StyleS', zh: '商店' },
]

export default function Nav({ onSearch, onFavorites, onAuth }) {
  const { user, logout } = useAuth()
  const { count } = useFavorites()

  return (
    <nav className="denim-nav">
      <div className="denim-bar">
        <NavLink to="/" className="brand">
          AURA<span style={{ color: '#c7d5ea' }}>_</span>Sonica
        </NavLink>

        <div className="nav-actions">
          <button className="icon-btn" onClick={onSearch} aria-label="搜尋">
            <Search size={19} />
          </button>
          <button className="icon-btn" onClick={onFavorites} aria-label="收藏">
            <Heart size={19} />
            {count > 0 && <span className="badge">{count}</span>}
          </button>

          {user ? (
            <div className="account-chip">
              <span className="avatar">
                {(user.name || 'A').slice(0, 1).toUpperCase()}
              </span>
              <span>{user.name}</span>
              <button
                className="icon-btn"
                style={{ width: 30, height: 30 }}
                onClick={logout}
                aria-label="登出"
                title="登出"
              >
                <LogOut size={15} />
              </button>
            </div>
          ) : (
            <button
              className="btn ghost"
              onClick={onAuth}
              style={{ padding: '0.55em 1.3em' }}
            >
              登入
            </button>
          )}
        </div>
      </div>

      <div className="denim-tabs" role="navigation" aria-label="牛仔布分頁導覽">
        {TABS.map((t) => (
          <NavLink
            key={t.to}
            to={t.to}
            end={t.end}
            className={({ isActive }) => `dtab${isActive ? ' active' : ''}`}
          >
            <span className="stitch" aria-hidden />
            <span className="en">{t.en}</span>
            <span className="zh">{t.zh}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
