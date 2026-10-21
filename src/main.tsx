import React, { Component, ErrorInfo, ReactNode } from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./App.css";

// 全局未捕获异常捕获器
window.addEventListener("error", (event) => {
  console.error("Global window.error:", event.error || event.message);
  const rootEl = document.getElementById("root");
  if (rootEl && !rootEl.hasChildNodes()) {
    rootEl.innerHTML = `
      <div style="padding: 24px; font-family: sans-serif; background: #fff5f5; color: #b91c1c; border: 1px solid #f87171; border-radius: 8px; margin: 20px;">
        <h3 style="margin-top:0;">应用载入错误 (Global Script Error)</h3>
        <p style="font-size: 13px; font-family: monospace;">${event.message}</p>
        <pre style="font-size: 11px; background: #fee2e2; padding: 12px; border-radius: 4px; overflow: auto;">${event.error?.stack || event.filename + ':' + event.lineno}</pre>
        <button onclick="window.location.reload()" style="margin-top: 10px; padding: 6px 14px; background: #b91c1c; color: #fff; border: none; border-radius: 4px; cursor: pointer;">刷新重试</button>
      </div>
    `;
  }
});

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class RootErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("RootErrorBoundary caught:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 28, fontFamily: "sans-serif", background: "#fef2f2", color: "#991b1b", border: "1px solid #fca5a5", borderRadius: 10, margin: 20 }}>
          <h2 style={{ marginTop: 0 }}>界面渲染异常 (React Render Error)</h2>
          <p style={{ fontSize: 13 }}>遇到未处理的异常，已为您隔离保护：</p>
          <pre style={{ fontSize: 12, fontFamily: "monospace", background: "#fee2e2", padding: 12, borderRadius: 6, overflow: "auto" }}>
            {this.state.error?.stack || this.state.error?.message}
          </pre>
          <button
            onClick={() => window.location.reload()}
            style={{ marginTop: 12, padding: "8px 18px", background: "#991b1b", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer", fontWeight: "bold" }}
          >
            刷新重新加载
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <RootErrorBoundary>
      <App />
    </RootErrorBoundary>
  </React.StrictMode>,
);
