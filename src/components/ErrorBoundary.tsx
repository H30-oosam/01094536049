import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = '/';
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50 dark:bg-slate-900 font-sans">
          <div className="w-full max-w-lg td-card bg-white dark:bg-slate-800 p-8 text-center rounded-3xl border-2 border-slate-900/15">
            <div className="w-20 h-20 bg-rose-50 dark:bg-rose-950/30 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
              <span className="text-4xl text-rose-500">⚠️</span>
            </div>
            
            <h1 className="text-3xl font-black italic tracking-tight text-slate-900 dark:text-white mb-3 font-serif">
              عُذراً، حدث خطأ غير متوقع
            </h1>
            <h2 className="text-lg font-bold text-slate-600 dark:text-slate-300 mb-6">
              Oops, Something went wrong!
            </h2>

            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 text-center max-w-sm mx-auto">
              لقد واجه النظام مشكلة فنية غير متوقعة. يرجى إعادة تحميل التطبيق للعودة إلى لوحة التحكم.
              <span className="block mt-2 font-mono text-xs text-rose-500 bg-rose-50 dark:bg-rose-950/20 p-2.5 rounded-xl border border-rose-100 dark:border-rose-950/50 max-h-24 overflow-y-auto">
                {this.state.error?.message || 'Unknown runtime crash.'}
              </span>
            </p>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={this.handleReset}
                className="td-btn-primary flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>العودة للرئيسية</span>
                <span className="text-xs opacity-80">/ Return Home</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
