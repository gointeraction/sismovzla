import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  moduleName?: string;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State;

  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error(`[ErrorBoundary] ${this.props.moduleName || 'Module'} crashed:`, error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="bg-[#121212] border border-red-500/30 rounded-xl p-8 flex flex-col items-center gap-4 text-center">
          <AlertTriangle className="w-12 h-12 text-red-400" />
          <div>
            <h3 className="font-mono font-bold text-white text-sm uppercase tracking-wider">
              Error en {this.props.moduleName || 'módulo'}
            </h3>
            <p className="text-xs text-white/50 mt-1 max-w-md">
              {this.state.error?.message || 'Ocurrió un error inesperado. Tus datos están seguros en la base de datos local.'}
            </p>
          </div>
          <button onClick={this.handleRetry}
            className="flex items-center gap-1.5 px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg font-mono text-xs font-bold transition-all cursor-pointer">
            <RefreshCw className="w-4 h-4" /> REINTENTAR
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
