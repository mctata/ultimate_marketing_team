/**
 * Performance utilities for React components
 */

// Type-safe memoize function for any function type
export function memoize<Args extends unknown[], Result>(
  fn: (...args: Args) => Result
): (...args: Args) => Result {
  const cache = new Map<string, Result>();
  
  return (...args: Args): Result => {
    // Create a cache key from the stringified arguments
    const key = JSON.stringify(args);
    
    if (cache.has(key)) {
      return cache.get(key) as Result;
    }
    
    const result = fn(...args);
    cache.set(key, result);
    return result;
  };
}

// Memoize with a limited cache size (LRU)
export function memoizeLRU<Args extends unknown[], Result>(
  fn: (...args: Args) => Result,
  maxSize: number = 100
): (...args: Args) => Result {
  const cache = new Map<string, Result>();
  const keyTimestamps = new Map<string, number>();
  
  return (...args: Args): Result => {
    const key = JSON.stringify(args);
    
    if (cache.has(key)) {
      // Update timestamp on access to implement LRU
      keyTimestamps.set(key, Date.now());
      return cache.get(key) as Result;
    }
    
    // Evict oldest entry if we've reached the limit
    if (cache.size >= maxSize) {
      let oldestKey: string | null = null;
      let oldestTime = Infinity;
      
      for (const [k, time] of keyTimestamps.entries()) {
        if (time < oldestTime) {
          oldestTime = time;
          oldestKey = k;
        }
      }
      
      if (oldestKey) {
        cache.delete(oldestKey);
        keyTimestamps.delete(oldestKey);
      }
    }
    
    // Calculate and cache the result
    const result = fn(...args);
    cache.set(key, result);
    keyTimestamps.set(key, Date.now());
    return result;
  };
}

// Measured function execution time - useful for debugging performance issues
export function measureTime<T>(fn: () => T, label: string): T {
  if (import.meta.env.DEV) {
    console.time(label);
    const result = fn();
    console.timeEnd(label);
    return result;
  } else {
    return fn();
  }
}

// Throttle a function call to limit execution frequency
export function throttle<Args extends unknown[]>(
  fn: (...args: Args) => void,
  limit: number
): (...args: Args) => void {
  let inThrottle: boolean = false;
  let lastArgs: Args | null = null;
  
  return (...args: Args): void => {
    if (!inThrottle) {
      fn(...args);
      inThrottle = true;
      
      setTimeout(() => {
        inThrottle = false;
        if (lastArgs) {
          const currentArgs = lastArgs;
          lastArgs = null;
          fn(...currentArgs);
        }
      }, limit);
    } else {
      lastArgs = args;
    }
  };
}

// Debounce a function call to wait until activity stops
export function debounce<Args extends unknown[]>(
  fn: (...args: Args) => void,
  delay: number
): (...args: Args) => void {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  
  return (...args: Args): void => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    
    timeoutId = setTimeout(() => {
      fn(...args);
      timeoutId = null;
    }, delay);
  };
}

// Function to measure React component render time for performance debugging
export function useRenderTimer(componentName: string): void {
  if (import.meta.env.DEV) {
    const startTime = performance.now();
    
    return () => {
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      if (duration > 5) { // Only log slow renders (> 5ms)
        console.log(`[Render Timer] ${componentName}: ${duration.toFixed(2)}ms`);
      }
    };
  }
  
  return () => {}; // No-op for production
}

// Custom hook for detecting slow renders in development
// Usage: useSlowRenderWarning('ComponentName');
export function useSlowRenderWarning(componentName: string, threshold: number = 10): void {
  if (import.meta.env.DEV) {
    const startTime = performance.now();
    
    // This runs after render
    setTimeout(() => {
      const duration = performance.now() - startTime;
      if (duration > threshold) {
        console.warn(`Slow render detected: ${componentName} took ${duration.toFixed(2)}ms to render. Consider optimizing.`);
      }
    }, 0);
  }
}