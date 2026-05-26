const { Component, html } = window.__WWCT__;

export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error('[WWCT] Unhandled error:', error, info);
  }

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;

    return html`
      <div class="error-boundary">
        <div class="error-boundary__title">Something went wrong</div>
        <p class="error-boundary__message">
          An unexpected error occurred. Reload the page to recover.
          Your unsaved work may be preserved in the browser's cached state.
        </p>
        <pre class="error-boundary__detail">${error.message}</pre>
        <button class="btn btn--secondary" onClick=${() => window.location.reload()}>
          Reload
        </button>
      </div>
    `;
  }
}
