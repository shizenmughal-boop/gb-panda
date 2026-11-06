import React from "react";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error("App Error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", height: "100vh", textAlign: "center", padding: "20px" }}>
          <h1 style={{ fontSize: "48px", marginBottom: "10px" }}>😵</h1>
          <h2 style={{ fontSize: "24px", marginBottom: "20px" }}>Oops! Something went wrong.</h2>
          <p style={{ color: "#666", marginBottom: "30px", maxWidth: "400px" }}>
            An unexpected error occurred. Our team has been notified.
          </p>
          <button 
            onClick={() => window.location.reload()} 
            className="btn-primary" 
            style={{ width: "auto", padding: "12px 30px" }}
          >
            Reload App
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;