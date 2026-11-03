/*
  Catches render errors so a crash never leaves a blank white page (spec P0-1).
  The error is reported to /api/client-errors, which logs it on the server
  (Vercel function logs act as the error tracker until a hosted one is added).
*/
import { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  /** Short name of the area, sent with the report */
  area?: string;
  /** Optional custom fallback */
  fallback?: ReactNode;
}
interface State {
  error: Error | null;
}

export function reportClientError(error: unknown, area = 'app', extra: Record<string, unknown> = {}) {
  try {
    const e = error instanceof Error ? error : new Error(String(error));
    const body = JSON.stringify({
      area,
      message: e.message.slice(0, 500),
      stack: (e.stack || '').slice(0, 4000),
      path: typeof window !== 'undefined' ? window.location.pathname : '',
      ...extra,
    });
    if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
      navigator.sendBeacon('/api/client-errors', new Blob([body], { type: 'application/json' }));
    } else {
      fetch('/api/client-errors', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body, keepalive: true }).catch(() => null);
    }
  } catch {
    /* reporting must never throw */
  }
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    reportClientError(error, this.props.area, { componentStack: (info.componentStack || '').slice(0, 2000) });
  }

  reset = () => this.setState({ error: null });

  render() {
    if (!this.state.error) return this.props.children;
    if (this.props.fallback) return this.props.fallback;
    return (
      <div role="alert" style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <div style={{ maxWidth: 440, textAlign: 'center', fontFamily: '-apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif', color: '#111' }}>
          <h2 style={{ fontSize: 20, fontWeight: 650, margin: '0 0 8px' }}>This page hit a problem</h2>
          <p style={{ color: '#505050', fontSize: 14, lineHeight: 1.5, margin: '0 0 18px' }}>
            We logged the error so the team can fix it. Your data is safe. Try again, or go back to your AI Analyst.
          </p>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
            <button type="button" className="zd-btn is-primary is-md" onClick={this.reset}>
              Try again
            </button>
            <a className="zd-btn is-secondary is-md" href="/analyst">
              Go to AI Analyst
            </a>
          </div>
        </div>
      </div>
    );
  }
}
