interface VitalMetric {
  name: string;
  value: number;
  rating: string;
  timestamp: number;
}

const vitalsLog: VitalMetric[] = [];

function getRating(name: string, value: number): string {
  const thresholds: Record<string, [number, number]> = {
    FCP: [1800, 3000],
    LCP: [2500, 4000],
    CLS: [0.1, 0.25],
  };
  const [good, poor] = thresholds[name] || [Infinity, Infinity];
  if (value <= good) return 'good';
  if (value <= poor) return 'needs-improvement';
  return 'poor';
}

function logVital(name: string, value: number): void {
  const metric: VitalMetric = {
    name,
    value,
    rating: getRating(name, value),
    timestamp: Date.now(),
  };
  vitalsLog.push(metric);
  console.log(`[Vitals] ${name}: ${value.toFixed(2)}ms (${metric.rating})`);
}

export function initVitals(): void {
  try {
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.entryType === 'paint' && entry.name === 'first-contentful-paint') {
          logVital('FCP', entry.startTime);
        }
        if (entry.entryType === 'largest-contentful-paint') {
          logVital('LCP', entry.startTime);
        }
        if (entry.entryType === 'layout-shift' && !(entry as PerformanceEntry & { hadRecentInput: boolean }).hadRecentInput) {
          logVital('CLS', (entry as PerformanceEntry & { value: number }).value);
        }
      }
    });
    observer.observe({ type: 'paint', buffered: true });
    observer.observe({ type: 'largest-contentful-paint', buffered: true });
    observer.observe({ type: 'layout-shift', buffered: true });
  } catch (e) {
    console.warn('[Vitals] PerformanceObserver not supported:', e);
  }
}

export function getVitalsLog(): VitalMetric[] {
  return vitalsLog.slice();
}
