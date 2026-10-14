import { Component } from 'react';
import Button from './Button.jsx';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;

    return (
      <div className="grid min-h-[60vh] place-items-center p-6">
        <div className="card max-w-md p-8 text-center">
          <h2 className="text-lg font-semibold text-slate-900">Something broke on this page</h2>
          <p className="mt-2 text-sm text-slate-600">{error.message}</p>
          <div className="mt-5 flex justify-center gap-2">
            <Button variant="secondary" onClick={() => this.setState({ error: null })}>
              Try again
            </Button>
            <Button onClick={() => window.location.assign('/')}>Go home</Button>
          </div>
        </div>
      </div>
    );
  }
}
