import { useEffect } from 'react';

interface PerformanceMetrics {
  fcp?: number; // First Contentful Paint
  lcp?: number; // Largest Contentful Paint
  cls?: number; // Cumulative Layout Shift
  fid?: number; // First Input Delay
  ttfb?: number; // Time to First Byte
}

export const PerformanceMonitor = () => {
  useEffect(() => {
    // Check if Web Vitals API is available
    if ('web-vital' in window) {
      return;
    }

    const metrics: PerformanceMetrics = {};

    // Measure FCP (First Contentful Paint)
    const paintEntries = performance.getEntriesByType('paint');
    const fcp = paintEntries.find(entry => entry.name === 'first-contentful-paint');
    if (fcp) {
      metrics.fcp = fcp.startTime;
    }

    // Measure TTFB (Time to First Byte)
    const navigationEntries = performance.getEntriesByType('navigation');
    if (navigationEntries.length > 0) {
      const navEntry = navigationEntries[0] as PerformanceNavigationTiming;
      if (navEntry.responseStart && navEntry.fetchStart) {
        metrics.ttfb = navEntry.responseStart - navEntry.fetchStart;
      }
    }

    // Log metrics in development
    if (import.meta.env.DEV) {
      console.log('Performance Metrics:', metrics);
    }

    // Send metrics to analytics service (optional)
    // You can send this to a service like Google Analytics or Sentry
    const sendMetrics = async () => {
      try {
        // Example: Send to your analytics endpoint
        // await fetch('/api/analytics', { method: 'POST', body: JSON.stringify(metrics) });
      } catch (error) {
        console.error('Error sending metrics:', error);
      }
    };

    // Send metrics after a delay to ensure page is fully loaded
    setTimeout(sendMetrics, 3000);

    // Monitor Cumulative Layout Shift
    if ('PerformanceObserver' in window) {
      try {
        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if ((entry as any).hadRecentInput) continue;
            metrics.cls = (metrics.cls || 0) + (entry as any).value;
          }
        });

        observer.observe({ entryTypes: ['layout-shift'] });

        return () => observer.disconnect();
      } catch (error) {
        console.error('Error observing layout shift:', error);
      }
    }
  }, []);

  return null;
};
