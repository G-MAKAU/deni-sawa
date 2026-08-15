'use client';

import { Component, type ReactElement, type ReactNode } from 'react';

interface LexicalErrorBoundaryProps {
  children: ReactElement;
  fallback?: ReactNode;
  onError: (error: Error) => void;
}

interface LexicalErrorBoundaryState {
  hasError: boolean;
}

/** Error boundary required by the Lexical RichTextPlugin. */
export class LexicalErrorBoundary extends Component<LexicalErrorBoundaryProps, LexicalErrorBoundaryState> {
  state = { hasError: false };

  static getDerivedStateFromError(): LexicalErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    this.props.onError(error);
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback ?? (
          <div className="rounded-lg border border-card-border bg-bgalt p-6 text-sm text-muted-foreground">
            This content could not be rendered.
          </div>
        )
      );
    }
    return this.props.children;
  }
}
