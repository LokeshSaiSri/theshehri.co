'use client';

function getSessionId(): string {
  if (typeof window === 'undefined') return '';
  let id = sessionStorage.getItem('shehri_session');
  if (!id) {
    id = Math.random().toString(36).substring(2) + Date.now().toString(36);
    sessionStorage.setItem('shehri_session', id);
  }
  return id;
}

function getDevice(): string {
  if (typeof window === 'undefined') return 'unknown';
  const w = window.innerWidth;
  if (w < 768) return 'mobile';
  if (w < 1024) return 'tablet';
  return 'desktop';
}

function parseSource(): { source: string; medium: string; campaign: string; referrer: string } {
  if (typeof window === 'undefined') return { source: '', medium: '', campaign: '', referrer: '' };

  const params = new URLSearchParams(window.location.search);
  const ref = document.referrer;

  let source = params.get('utm_source') || '';
  if (!source) {
    if (!ref) source = 'direct';
    else if (ref.includes('instagram')) source = 'instagram';
    else if (ref.includes('whatsapp')) source = 'whatsapp';
    else if (ref.includes('google')) source = 'google';
    else if (ref.includes('facebook')) source = 'facebook';
    else source = 'other';
  }

  return {
    source,
    medium: params.get('utm_medium') || '',
    campaign: params.get('utm_campaign') || '',
    referrer: ref,
  };
}

export async function track(eventType: string, data?: Record<string, unknown>) {
  if (typeof window === 'undefined') return;
  try {
    await fetch('/api/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event_type: eventType,
        session_id: getSessionId(),
        page: window.location.pathname,
        device: getDevice(),
        ...parseSource(),
        ...data,
      }),
    });
  } catch {
    // silent fail — never break UX for analytics
  }
}
