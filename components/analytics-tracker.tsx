'use client';

import { useEffect } from 'react';
import { trackEvent } from '@/lib/analytics';

export function LandingPageViewTracker() {
  useEffect(() => {
    trackEvent('landing_page_view', undefined, { deduplicate: true, dedupeKey: 'landing_page_view_session' });
    trackEvent('page_view', { page: 'landing' }, { deduplicate: true, dedupeKey: 'page_view_landing' });

    if (typeof document !== 'undefined' && document.referrer) {
      try {
        const refUrl = new URL(document.referrer);
        if (refUrl.hostname !== window.location.hostname) {
          trackEvent('referral_visit', undefined, { deduplicate: true, dedupeKey: 'referral_visit_session' });
        }
      } catch {
        // Ignore URL parsing errors
      }
    }
  }, []);

  return null;
}

export function PageViewTracker({ pageName }: { pageName: string }) {
  useEffect(() => {
    trackEvent('page_view', { page: pageName }, { deduplicate: true, dedupeKey: `page_view_${pageName}` });
  }, [pageName]);

  return null;
}
