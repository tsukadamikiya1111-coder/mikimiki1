import { MapCanvas } from './components/MapCanvas'
import { Sidebar } from './components/Sidebar'
import { useStore } from './store'
import type { Tab } from './store'
import { Community } from './tabs/Community'
import { Lineups } from './tabs/Lineups'
import { Matches } from './tabs/Matches'
import { Playbook } from './tabs/Playbook'

const TABS: Tab[] = ['STRATEGY', 'LINEUPS', 'PLAYBOOK', 'COMMUNITY', 'MATCHES']

export default function App() {
  const tab = useStore((s) => s.tab)
  const setTab = useStore((s) => s.setTab)
  const hydrated = useStore((s) => s.hydrated)

  if (!hydrated) return <div className="loading">Loading…</div>

  return (
    <div className="app">
      <header className="topbar">
        <div className="logo">VAL<span>STRAT</span></div>
        <nav>
          {TABS.map((t) => (
            <button key={t} className={tab === t ? 'active' : ''} onClick={() => setTab(t)}>{t}</button>
          ))}
        </nav>
      </header>
      {tab === 'STRATEGY' ? (
        <main className="strategy">
          <Sidebar />
          <MapCanvas />
        </main>
      ) : (
        <main className="pagewrap">
          {tab === 'LINEUPS' && <Lineups />}
          {tab === 'PLAYBOOK' && <Playbook />}
          {tab === 'COMMUNITY' && <Community />}
          {tab === 'MATCHES' && <Matches />}
        </main>
      )}
    </div>
  )
}
