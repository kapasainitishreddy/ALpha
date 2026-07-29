import { useEffect, useRef } from 'react'
import { createChart, ColorType, type IChartApi } from 'lightweight-charts'
import type { Candle } from '@/types'

// Thin wrapper around lightweight-charts. Reuse the lib, do not hand-roll candles.
export function CandleChart({ candles, height = 240 }: { candles: Candle[]; height?: number }) {
  const ref = useRef<HTMLDivElement>(null)
  const chartRef = useRef<IChartApi | null>(null)

  useEffect(() => {
    if (!ref.current) return
    const chart = createChart(ref.current, {
      height,
      layout: { background: { type: ColorType.Solid, color: 'transparent' }, textColor: '#8b98ad' },
      grid: { vertLines: { color: '#1c2330' }, horzLines: { color: '#1c2330' } },
      timeScale: { borderColor: '#28303f', timeVisible: false },
      rightPriceScale: { borderColor: '#28303f' },
      handleScroll: false,
      handleScale: false,
    })
    const series = chart.addCandlestickSeries({
      upColor: '#22c55e', downColor: '#ef4444', wickUpColor: '#22c55e', wickDownColor: '#ef4444', borderVisible: false,
    })
    series.setData(candles.map((c) => ({ time: c.time as never, open: c.open, high: c.high, low: c.low, close: c.close })))
    chart.timeScale().fitContent()
    chartRef.current = chart
    const onResize = () => ref.current && chart.applyOptions({ width: ref.current.clientWidth })
    onResize()
    window.addEventListener('resize', onResize)
    return () => {
      window.removeEventListener('resize', onResize)
      chart.remove()
    }
  }, [candles, height])

  return <div ref={ref} className="w-full rounded-xl overflow-hidden" />
}
