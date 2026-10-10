import { useEffect, lazy, Suspense } from 'react'
import { LANGUAGES, useTranslation, type Language } from '@/lib/i18n'
import { NavLink, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import { CandlestickChart, Ellipsis, Home as HomeIcon, Network, UserRound } from 'lucide-react'
import { useStore } from '@/store/useStore'
import { inr, pnlColor } from '@/lib/format'
import { MockBadge } from '@/components/common'

const Derivatives = lazy(() => import('@/pages/Derivatives'))
const Replay = lazy(() => import('@/pages/Replay'))
const Models = lazy(() => import('@/pages/Models'))
const Portfolio = lazy(() => import('@/pages/Portfolio'))
const Learn = lazy(() => import('@/pages/Learn'))
const Research = lazy(() => import('@/pages/Research'))
const Home = lazy(() => import('@/pages/Home'))
const FatherMode = lazy(() => import('@/pages/FatherMode'))
const Coach = lazy(() => import('@/pages/Coach'))
const ManualTrade = lazy(() => import('@/pages/ManualTrade'))
const AssistedTrade = lazy(() => import('@/pages/AssistedTrade'))
const AutoTrade = lazy(() => import('@/pages/AutoTrade'))
const Swarm = lazy(() => import('@/pages/Swarm'))
const StrategyLab = lazy(() => import('@/pages/StrategyLab'))
const BacktestLab = lazy(() => import('@/pages/BacktestLab'))
const CompoundSim = lazy(() => import('@/pages/CompoundSim'))
const Journal = lazy(() => import('@/pages/Journal'))
const Comparison = lazy(() => import('@/pages/Comparison'))
const MarketSim = lazy(() => import('@/pages/MarketSim'))
const Watchlist = lazy(() => import('@/pages/Watchlist'))
const ApiSettings = lazy(() => import('@/pages/ApiSettings'))
const AiSettings = lazy(() => import('@/pages/AiSettings'))
const DatasetBuilder = lazy(() => import('@/pages/DatasetBuilder'))
const RealMode = lazy(() => import('@/pages/RealMode'))
const More = lazy(() => import('@/pages/More'))
const RiskTools = lazy(() => import('@/pages/RiskTools'))
const LivePractice = lazy(() => import('@/pages/LivePractice'))
const Progress = lazy(() => import('@/pages/Progress'))
const Challenge = lazy(() => import('@/pages/Challenge'))
const StrategyBuilder = lazy(() => import('@/pages/StrategyBuilder'))
const Debate = lazy(() => import('@/pages/Debate'))
const Insights = lazy(() => import('@/pages/Insights'))
const ScenarioLab = lazy(() => import('@/pages/ScenarioLab'))
const Arena = lazy(() => import('@/pages/Arena'))
const Options = lazy(() => import('@/pages/Options'))
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
  const { balance, dailyPnl, fatherMode, startingBalance, stoppedToday, onboarded, setOnboarded } = useStore()
  const { t, language } = useTranslation()
  useEffect(() => { const tick = () => useStore.getState().ensureDay(); tick(); const id = setInterval(tick, 30000); return () => clearInterval(id) }, [])
  useEffect(() => { document.documentElement.lang = language }, [language])
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
          <div className="flex items-center gap-2"><select aria-label={t('language')} className="bg-panel border border-edge rounded p-1 text-xs" value={language} onChange={e => useStore.getState().setLanguage(e.target.value as Language)}>{Object.entries(LANGUAGES).map(([v,n]) => <option value={v} key={v}>{n}</option>)}</select><MockBadge /></div>
        </div>
        <div className="mt-2 flex items-center gap-4 text-sm">
          <div>
            <span className="label mr-1">{t('balance')}</span>
            <span className="font-bold">{inr(balance)}</span>
          </div>
          <div>
            <span className="label mr-1">{t('today')}</span>
            <span className={`font-bold ${pnlColor(dailyPnl)}`}>{inr(dailyPnl)}</span>
          </div>
          <div className="ml-auto text-[10px] text-muted">start {inr(startingBalance)}</div>
        </div>
        {stoppedToday && <p className="text-xs text-warn mt-2">Trading paused for today. Existing stops remain active.</p>}
      </header>

      <main className="flex-1 px-4 py-4 pb-24 space-y-6">
        <ErrorBoundary key={location.pathname}>
        <Suspense fallback={<div className="card">{t('loading')}</div>}><Routes>
          <Route path="/derivatives" element={<Derivatives />} />
          <Route path="/replay" element={<Replay />} /><Route path="/models" element={<Models />} />
          <Route path="/portfolio" element={<Portfolio />} />
          <Route path="/learn" element={<Learn />} /><Route path="/research" element={<Research />} />
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
          <Route path="/challenge" element={<Challenge />} />
          <Route path="/builder" element={<StrategyBuilder />} />
          <Route path="/debate" element={<Debate />} />
          <Route path="/insights" element={<Insights />} />
          <Route path="/scenarios" element={<ScenarioLab />} />
          <Route path="/arena" element={<Arena />} />
          <Route path="/options" element={<Options />} />
          <Route path="/more" element={<More />} />
        </Routes></Suspense>
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
            {t(label.toLowerCase())}
          </NavLink>
        ))}
      </nav>

      <Assistant />
    </div>
    </ToastHost>
  )
}
