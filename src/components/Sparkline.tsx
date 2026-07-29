// Tiny SVG equity-curve sparkline. ponytail: 15 lines beats pulling a second chart config.
export function Sparkline({ data, height = 60 }: { data: number[]; height?: number }) {
  if (data.length < 2) return null
  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1
  const w = 300
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * w},${height - ((v - min) / range) * height}`).join(' ')
  const up = data[data.length - 1] >= data[0]
  return (
    <svg viewBox={`0 0 ${w} ${height}`} className="w-full" preserveAspectRatio="none">
      <polyline points={pts} fill="none" stroke={up ? '#22c55e' : '#ef4444'} strokeWidth={2} vectorEffect="non-scaling-stroke" />
    </svg>
  )
}
