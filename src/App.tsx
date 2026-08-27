import { NavLink, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import { CandlestickChart, Ellipsis, Home as HomeIcon, Network, UserRound } from 'lucide-react'
import { useStore } from '@/store/useStore'
import { inr, pnlColor } from '@/lib/format'
import { MockBadge } from '@/components/common'

import Home from '@/pages/Home'
import FatherMode from '@/pages/FatherMode'
import Coach from '@/pages/Coach'
import ManualTrade from '@/pages/ManualTrade'
import AssistedTrade from '@/pages/AssistedTrade'
import AutoTrade from '@/pages/AutoTrade'
import Swarm from '@/pages/Swarm'
import StrategyLab from '@/pages/StrategyLab'
import BacktestLab from '@/pages/BacktestLab'
import CompoundSim from '@/pages/CompoundSim'
import Journal from '@/pages/Journal'
import Comparison from '@/pages/Comparison'
import MarketSim from '@/pages/MarketSim'
import Watchlist from '@/pages/Watchlist'
import ApiSettings from '@/pages/ApiSettings'
import AiSettings from '@/pages/AiSettings'
import DatasetBuilder from '@/pages/DatasetBuilder'
import RealMode from '@/pages/RealMode'
import More from '@/pages/More'
import RiskTools from '@/pages/RiskTools'
import LivePractice from '@/pages/LivePractice'
import Progress from '@/pages/Progress'
import Challenge from '@/pages/Challenge'
import StrategyBuilder from '@/pages/StrategyBuilder'
import Debate from '@/pages/Debate'
import Insights from '@/pages/Insights'
import ScenarioLab from '@/pages/ScenarioLab'
import Arena from '@/pages/Arena'
import Options from '@/pages/Options'
import PerformanceQuality from '@/pages/PerformanceQuality'
import { ToastHost } from '@/components/Toast'
import { Onboarding } from '@/components/Onboarding'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { Assistant } from '@/components/Assistant'

const NAV = [
  { to: '/', label: 'Home', Icon: HomeIcon },
  { to: '/father', label: 'Father', Icon: UserRound },
  { to: '/manual', label: 'Trade', Icon: CandlestickChart },
  { to: '/swarm', label: 'Swarm', Icon: Network },
  { to: '/more', label: 'More', Icon: Ellipsis },
]

export default function App() {
  const { balance, dailyPnl, fatherMode, startingBalance, onboarded, setOnboarded } = useStore()
  const navigate = useNavigate()
  const location = useLocation()

  return (
    <ToastHost>
    {!onboarded && <Onboarding onDone={() => setOnboarded(true)} />}
    <div className={`min-h-screen mx-auto max-w-md flex flex-col ${fatherMode ? 'father' : ''}`}>
      <header className="sticky top-0 z-10 bg-bg/90 backdrop-blur border-b border-edge px-4 py-3">
        <div className="flex items-center justify-between">
          <button onClick={() => navigate('/')} className="text-left">
            <div className="font-extrabold tracking-tight leading-none">
              BlackScythe <span className="text-accent">Alpha</span>
            </div>
            <div className="text-[10px] text-muted">mock trading trainer for Indian markets</div>
          </button>
          <MockBadge />
        </div>
        <div className="mt-2 flex items-center gap-4 text-sm">
          <div>
            <span className="label mr-1">Mock balance</span>
            <span className="font-bold">{inr(balance)}</span>
          </div>
          <div>
            <span className="label mr-1">Today</span>
            <span className={`font-bold ${pnlColor(dailyPnl)}`}>{inr(dailyPnl)}</span>
          </div>
          <div className="ml-auto text-[10px] text-muted">start {inr(startingBalance)}</div>
        </div>
      </header>

      <main className="flex-1 px-4 py-4 pb-24 space-y-6">
        <ErrorBoundary key={location.pathname}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/father" element={<FatherMode />} />
          <Route path="/coach" element={<Coach />} />
          <Route path="/manual" element={<ManualTrade />} />
          <Route path="/assisted" element={<AssistedTrade />} />
          <Route path="/auto" element={<AutoTrade />} />
          <Route path="/swarm" element={<Swarm />} />
          <Route path="/strategies" element={<StrategyLab />} />
          <Route path="/backtest" element={<BacktestLab />} />
          <Route path="/compound" element={<CompoundSim />} />
          <Route path="/journal" element={<Journal />} />
          <Route path="/comparison" element={<Comparison />} />
          <Route path="/market" element={<MarketSim />} />
          <Route path="/watchlist" element={<Watchlist />} />
          <Route path="/settings/api" element={<ApiSettings />} />
          <Route path="/settings/ai" element={<AiSettings />} />
          <Route path="/settings/llm" element={<AiSettings />} />
          <Route path="/dataset" element={<DatasetBuilder />} />
          <Route path="/real" element={<RealMode />} />
          <Route path="/risk" element={<RiskTools />} />
          <Route path="/live" element={<LivePractice />} />
          <Route path="/progress" element={<Progress />} />
          <Route path="/quality" element={<PerformanceQuality />} />
          <Route path="/challenge" element={<Challenge />} />
          <Route path="/builder" element={<StrategyBuilder />} />
          <Route path="/debate" element={<Debate />} />
          <Route path="/insights" element={<Insights />} />
          <Route path="/scenarios" element={<ScenarioLab />} />
          <Route path="/arena" element={<Arena />} />
          <Route path="/options" element={<Options />} />
          <Route path="/more" element={<More />} />
        </Routes>
        </ErrorBoundary>
      </main>

      <nav className="fixed bottom-0 inset-x-0 mx-auto max-w-md bg-panel/95 backdrop-blur border-t border-edge grid grid-cols-5">
        {NAV.map(({ to, label, Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex flex-col items-center gap-0.5 py-2 text-[11px] ${isActive ? 'text-accent' : 'text-muted'}`
            }
          >
            <Icon size={20} strokeWidth={1.8} />
            {label}
          </NavLink>
        ))}
      </nav>

      <Assistant />
    </div>
    </ToastHost>
  )
}
