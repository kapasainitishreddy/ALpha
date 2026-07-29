import { Component, type ErrorInfo, type ReactNode } from 'react'

// Without this, one bad render unmounts the whole app and the user sees a blank white screen
// with no way back. A trainee who hits that assumes they broke something and stops using it.
// Keeps the shell alive and offers a route out.

interface Props { children: ReactNode }
interface State { error: Error | null }

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // No telemetry in this app by design — log locally so it's visible in devtools.
    console.error('Screen crashed:', error, info.componentStack)
  }

  render() {
    if (!this.state.error) return this.props.children

    return (
      <div className="card !p-6 space-y-4 text-center">
        <div>
          <div className="font-bold">This screen hit a problem</div>
          <p className="text-sm text-muted mt-1 leading-relaxed">
            Nothing is lost — your practice balance, journal and settings are all safe. Go back and try
            again, or use another screen.
          </p>
        </div>
        <div className="flex gap-3">
          <button className="btn-ghost flex-1" onClick={() => this.setState({ error: null })}>
            Try again
          </button>
          <button
            className="btn-primary flex-1"
            onClick={() => { this.setState({ error: null }); window.location.hash = '#/' }}
          >
            Go home
          </button>
        </div>
        <details className="text-left">
          <summary className="text-[11px] text-muted cursor-pointer">Technical detail</summary>
          <pre className="mt-2 overflow-x-auto rounded-lg bg-panel2 p-2 text-[10px] text-muted">
            {this.state.error.message}
          </pre>
        </details>
      </div>
    )
  }
}
