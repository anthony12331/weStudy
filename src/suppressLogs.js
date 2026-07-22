// This file executes before any React or Puter imports can run.
if (typeof window !== "undefined") {
  // 1. Block React DevTools prompt
  window.puter = window.puter || {};
  window.puter.quiet = true;
  window.__REACT_DEVTOOLS_GLOBAL_HOOK__ = {
    isDisabled: true,
    supportsFiber: true,
    inject: () => {},
    onCommitFiberRoot: () => {},
    onCommitFiberUnmount: () => {},
  };

  // 2. Wrap console methods to filter out unwanted logs
  const origError = console.error;
  const origWarn = console.warn;
  const origLog = console.log;

  console.error = function (...args) {
    const text = args.map((a) => String(a || "")).join(" ");
    if (
      text.includes("WebSocket") ||
      text.includes("puter.com") ||
      text.includes("wss://")
    )
      return;
    origError.apply(console, args);
  };

  console.warn = function (...args) {
    const text = args.map((a) => String(a || "")).join(" ");
    if (
      text.includes("WebSocket") ||
      text.includes("puter.com") ||
      text.includes("React DevTools")
    )
      return;
    origWarn.apply(console, args);
  };

  console.log = function (...args) {
    const text = args.map((a) => String(a || "")).join(" ");
    if (
      text.includes("____") ||
      text.includes("Puter App Store") ||
      text.includes("puter.quiet")
    )
      return;
    origLog.apply(console, args);
  };
}
