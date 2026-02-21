// A provider-agnostic analytics tracking utility
// In a real app, this would route to Google Analytics, Mixpanel, PostHog, etc.

export type EventName =
  | 'book_demo_click'
  | 'pricing_view'
  | 'features_search'
  | 'usecase_view'
  | 'blog_read_depth'
  | 'nav_link_click'
  | 'form_submit';

export const trackEvent = (eventName: EventName, properties?: Record<string, any>) => {
  // Check if we are in browser environment
  if (typeof window !== 'undefined') {
    // 1. Log to console for development verification
    // @ts-ignore
    if (typeof process !== 'undefined' && process.env.NODE_ENV !== 'production') {
      console.log(`[Analytics] Tracked Event: ${eventName}`, properties);
    }

    // 2. GTag (Google Analytics) integration - checking if gtag exists on window
    const win = window as any;
    if (win.gtag) {
      win.gtag('event', eventName, properties);
    }

    // 3. Fallback / Custom Data Layer push
    if (win.dataLayer) {
      win.dataLayer.push({ event: eventName, ...properties });
    }
  }
};
