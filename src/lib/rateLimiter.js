class RateLimiter {
  constructor(maxCalls = 5, windowMs = 60000) {
    this.maxCalls = maxCalls; // Maximum allowed actions
    this.windowMs = windowMs; // Time window (e.g., 60,000ms = 1 minute)
    this.calls = [];
  }

  canMakeCall() {
    const now = Date.now();
    // Keep only calls made within the active time window
    this.calls = this.calls.filter(
      (timestamp) => now - timestamp < this.windowMs,
    );

    if (this.calls.length >= this.maxCalls) {
      return false; // Limit reached! Block action.
    }

    this.calls.push(now);
    return true; // Action allowed
  }
}

// 🛡️ Custom Limiters for Your App
export const chatLimiter = new RateLimiter(6, 60000); // Max 6 chat messages per minute
export const feedbackLimiter = new RateLimiter(2, 180000); // Max 2 feedback submissions per 3 minutes
