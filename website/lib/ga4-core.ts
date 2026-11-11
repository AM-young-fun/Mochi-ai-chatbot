/** GA4 browser collection. The two app copies stay identical (independent Docker builds). */
export type Consent = 'granted' | 'denied' | 'unknown'
export type EventParams = Record<string, string | number | boolean | undefined>
type AnalyticsWindow = Window & {
  dataLayer?: unknown[]
  gtag?: (...args: unknown[]) => void
}
export const CONSENT_KEY = 'flatkey_analytics_consent'
export const CONSENT_EVENT = 'flatkey:analytics-consent'
const SAFE_KEYS = new Set([
  'page_path',
  'page_location',
  'page_referrer',
  'page_module',
  'page_language',
  'product_surface',
  'business',
  'action_id',
  'target_path',
  'target_host',
  'flow',
  'step',
  'result',
  'error_code',
  'prompt_id',
  'model',
  'scroll_depth',
  'active_time_msec',
  'engagement_time_msec',
  'visit_id',
  'event_id',
  'region_id',
  'region_label',
  'region',
  'gpu',
  'quantity',
  'first_field',
  'source_module',
  'campaign_source',
  'campaign_medium',
  'campaign_name',
  'campaign_id',
])
const EVENTS = new Set([
  'page_view',
  'cta_click',
  'outbound_click',
  'content_engagement',
  'flow_step',
  'flow_error',
  'prompt_copy',
  'model_view',
  'flatkey_compute_region_picked',
  'flatkey_compute_estimator_used',
  'flatkey_compute_quote_requested',
  'flatkey_model_page_view',
  'flatkey_sign_in_to_run_click',
])
export function cleanPath(raw: string): string {
  try {
    const path = new URL(raw, 'https://example.invalid').pathname
    if (/^\/(oauth|api|v1)(\/|$)/.test(path)) return '/[private]'
    return path
      .split('/')
      .map((p) => (/@|%(?:25)*40/i.test(p) || p.length > 100 ? '[redacted]' : p))
      .join('/')
      .slice(0, 300)
  } catch {
    return '/'
  }
}
export function pageContext(raw: string) {
  const path = cleanPath(raw)
  const parts = path.split('/').filter(Boolean)
  const localized = /^(en|zh|ja|es|pt|fr|ru|vi|de|id)(-[A-Za-z]{2})?$/.test(
    parts[0] || ''
  )
  const language = localized ? parts.shift()! : 'en'
  const first = parts[0] || ''
  let pageModule = 'functions'
  if (!first) pageModule = 'home'
  else if (first === 'blog') pageModule = 'blog'
  else if (/prompt/.test(first)) pageModule = 'prompt'
  else if (/model/.test(first)) pageModule = 'models'
  else if (/gpu|compute|rental/.test(path)) pageModule = 'gpu'
  else if (/tool|calculator/.test(first)) pageModule = 'tools'
  else if (/sign-in|sign-up|oauth/.test(first)) pageModule = 'auth'
  else if (/keys|topup|wallet|playground|chat|usage/.test(path))
    pageModule = 'api'
  return {
    page_path: path,
    page_module: pageModule,
    page_language: language,
    business:
      pageModule === 'gpu'
        ? 'gpu'
        : pageModule === 'api' || pageModule === 'models'
          ? 'api'
          : 'shared',
  }
}
export function safeParams(
  params: EventParams,
  additionalKeys: readonly string[] = []
): EventParams {
  const safe: EventParams = {}
  for (const [key, value] of Object.entries(params)) {
    if (
      (!SAFE_KEYS.has(key) && !additionalKeys.includes(key)) ||
      value === undefined
    )
      continue
    if (typeof value === 'number') {
      if (Number.isFinite(value))
        safe[key] = Math.max(0, Math.min(value, 86400000))
      continue
    }
    if (typeof value === 'boolean') {
      safe[key] = value
      continue
    }
    if (
      /@|%(?:25)*40|(?:sk-|Bearer\s|recall_claim|access_token|api_key|password)/i.test(
        value
      )
    )
      continue
    safe[key] = value.slice(0, 300)
  }
  return safe
}
export function getConsent(): Consent {
  if (typeof window === 'undefined') return 'unknown'
  // Staging must not inherit or change the production-domain consent cookie.
  if (location.hostname.startsWith('staging-')) {
    try {
      const value = localStorage.getItem(CONSENT_KEY)
      return value === 'granted' || value === 'denied' ? value : 'unknown'
    } catch {
      return 'unknown'
    }
  }
  // The shared cookie takes precedence over another subdomain's old local value.
  let cookie: string | undefined
  try {
    cookie = document.cookie.match(
      /(?:^|;\s*)flatkey_analytics_consent=(granted|denied)(?:;|$)/
    )?.[1]
  } catch {
    return 'unknown'
  }
  if (cookie) return cookie as Consent
  try {
    const saved = localStorage.getItem(CONSENT_KEY)
    if (saved === 'granted' || saved === 'denied') return saved
  } catch {
    /* disabled storage */
  }
  return 'unknown'
}
export function setConsent(status: Exclude<Consent, 'unknown'>) {
  try {
    localStorage.setItem(CONSENT_KEY, status)
  } catch {
    /* cookie remains authoritative */
  }
  const host = location.hostname
  const domain = [
    'flatkey.ai',
    'www.flatkey.ai',
    'console.flatkey.ai',
  ].includes(host)
    ? '; domain=.flatkey.ai'
    : ''
  try {
    // Remove an older host-only cookie before writing the shared parent-domain value.
    if (domain) document.cookie = `${CONSENT_KEY}=; path=/; max-age=0`
    document.cookie = `${CONSENT_KEY}=${status}; path=/; max-age=31536000; SameSite=Lax${domain}${location.protocol === 'https:' ? '; Secure' : ''}`
  } catch {
    /* storage restrictions must not break the consent control */
  }
  window.dispatchEvent(new CustomEvent(CONSENT_EVENT, { detail: status }))
}
export function createGA4Client(config: {
  measurementId: string
  surface: string
  productionHosts: string[]
  enabled?: boolean
  additionalEvents?: readonly string[]
  additionalParamKeys?: readonly string[]
}) {
  let initialized = false
  let currentPath = ''
  let currentReferrer = ''
  let visitId = ''
  let userId: string | undefined
  const win = () => window as AnalyticsWindow
  const blocked = () =>
    typeof window === 'undefined' ||
    !config.enabled ||
    !/^G-[A-Z0-9]+$/.test(config.measurementId) ||
    !config.productionHosts.includes(location.hostname) ||
    /recall_claim|(?:%25)*3[Dd]recall_claim/.test(location.href) ||
    location.pathname.startsWith('/oauth/')
  const command = (...args: unknown[]) => {
    const w = win()
    w.dataLayer ??= []
    w.gtag ??= function () {
      // Google's gtag queue requires the Arguments object, not a nested array.
      // eslint-disable-next-line prefer-rest-params
      w.dataLayer!.push(arguments)
    }
    w.gtag(...args)
  }
  const pageFields = () => ({
    page_location: `${location.origin}${cleanPath(currentPath || location.pathname)}`,
    page_referrer: currentReferrer || safeReferrer(document.referrer),
  })
  function initialize() {
    if (blocked() || getConsent() !== 'granted') return false
    try {
      if (initialized) return true
      initialized = true
      command('consent', 'update', { analytics_storage: 'granted' })
      command('js', new Date())
      command('config', config.measurementId, {
        send_page_view: false,
        ...pageFields(),
        user_id: userId || null,
      })
      const id = `flatkey-ga4-${config.measurementId}`
      if (!document.getElementById(id)) {
        const script = document.createElement('script')
        script.id = id
        script.async = true
        script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(config.measurementId)}`
        document.head.appendChild(script)
      }
      return true
    } catch {
      initialized = false
      return false
    }
  }
  function track(name: string, params: EventParams = {}) {
    if (
      (!EVENTS.has(name) && !config.additionalEvents?.includes(name)) ||
      !/^[a-z][a-z0-9_]{0,39}$/.test(name) ||
      !initialize()
    )
      return
    try {
      command('event', name, {
        ...pageContext(currentPath || location.pathname),
        product_surface: config.surface,
        visit_id: visitId,
        ...safeParams(params, config.additionalParamKeys),
        // Never let caller fields or automatic enrichment restore the raw URL.
        ...pageFields(),
        send_to: config.measurementId,
        ...(userId ? { user_id: userId } : {}),
      })
    } catch {
      /* blocked tag must not break the product */
    }
  }
  function pageView(path: string) {
    const next = cleanPath(path)
    if (!initialize() || currentPath === next) return
    const previous = currentPath
    currentPath = next
    currentReferrer = previous
      ? `${location.origin}${previous}`
      : safeReferrer(document.referrer)
    command('config', config.measurementId, {
      send_page_view: false,
      ...pageFields(),
      user_id: userId || null,
    })
    visitId = crypto.randomUUID()
    // No query/hash, free-form text, prompt body, email or credentials are collected.
    const query = new URLSearchParams(location.search)
    track('page_view', {
      campaign_source: query.get('utm_source') || undefined,
      campaign_medium: query.get('utm_medium') || undefined,
      campaign_name: query.get('utm_campaign') || undefined,
      campaign_id: query.get('utm_id') || undefined,
    })
  }
  function identify(id?: string | number) {
    userId = id && /^\d+$/.test(String(id)) ? String(id) : undefined
    if (initialize())
      command('config', config.measurementId, {
        send_page_view: false,
        ...pageFields(),
        user_id: userId || null,
      })
  }
  function consentChanged() {
    if (getConsent() === 'granted') {
      if (!blocked())
        command('consent', 'update', { analytics_storage: 'granted' })
      currentPath = ''
      pageView(location.pathname)
    } else {
      currentPath = ''
      userId = undefined
      if (typeof window !== 'undefined') {
        command('consent', 'update', { analytics_storage: 'denied' })
        if (initialized)
          command('config', config.measurementId, {
            send_page_view: false,
            ...pageFields(),
            user_id: null,
          })
      }
    }
  }
  function startJourney() {
    if (typeof window === 'undefined') return () => {}
    let lastTick = Date.now(),
      lastActivity = Date.now(),
      active = 0,
      maxDepth = 0
    const activity = () => {
      lastActivity = Date.now()
    }
    const tick = () => {
      const now = Date.now()
      if (
        getConsent() === 'granted' &&
        !blocked() &&
        document.visibilityState === 'visible' &&
        now - lastActivity < 30000
      )
        active += Math.min(now - lastTick, 5000)
      lastTick = now
    }
    const flush = () => {
      tick()
      if (active >= 1000)
        track('content_engagement', {
          active_time_msec: Math.round(active),
          engagement_time_msec: Math.round(active),
          scroll_depth: maxDepth,
        })
      active = 0
    }
    const scroll = () => {
      activity()
      const room = document.documentElement.scrollHeight - innerHeight
      maxDepth = Math.max(
        maxDepth,
        room > 0 ? Math.min(100, Math.round((scrollY / room) * 100)) : 100
      )
    }
    const click = (event: MouseEvent) => {
      activity()
      const element =
        event.target instanceof Element
          ? event.target.closest('a[href],button,[data-analytics-action]')
          : null
      if (
        !(element instanceof HTMLElement) ||
        element.closest('[data-analytics-ignore]')
      )
        return
      const action =
        element.dataset.analyticsAction ||
        element.getAttribute('type') ||
        element.tagName.toLowerCase()
      const params: EventParams = {
        action_id: /^[a-zA-Z0-9_-]{1,60}$/.test(action) ? action : 'control',
      }
      if (element instanceof HTMLAnchorElement) {
        try {
          const target = new URL(element.href, location.href)
          if (!/^https?:$/.test(target.protocol)) return
          params.target_path = cleanPath(target.href)
          params.target_host = target.hostname
          track(
            target.origin !== location.origin ? 'outbound_click' : 'cta_click',
            params
          )
        } catch {
          /* invalid href */
        }
      } else track('cta_click', params)
    }
    const beforeNavigation = () => {
      flush()
      maxDepth = 0
      lastActivity = Date.now()
    }
    const visibility = () => {
      flush()
      lastActivity = Date.now()
    }
    const consent = () => {
      active = 0
      lastTick = Date.now()
      consentChanged()
    }
    document.addEventListener('click', click)
    document.addEventListener('pointerdown', activity, { passive: true })
    document.addEventListener('keydown', activity)
    document.addEventListener('scroll', scroll, { passive: true })
    document.addEventListener('visibilitychange', visibility)
    window.addEventListener('pagehide', flush)
    window.addEventListener('flatkey:before-page-view', beforeNavigation)
    window.addEventListener(CONSENT_EVENT, consent)
    const clock = setInterval(tick, 5000),
      report = setInterval(flush, 30000)
    return () => {
      flush()
      clearInterval(clock)
      clearInterval(report)
      document.removeEventListener('click', click)
      document.removeEventListener('pointerdown', activity)
      document.removeEventListener('keydown', activity)
      document.removeEventListener('scroll', scroll)
      document.removeEventListener('visibilitychange', visibility)
      window.removeEventListener('pagehide', flush)
      window.removeEventListener('flatkey:before-page-view', beforeNavigation)
      window.removeEventListener(CONSENT_EVENT, consent)
    }
  }
  function navigate(path: string) {
    if (typeof window !== 'undefined')
      window.dispatchEvent(new Event('flatkey:before-page-view'))
    pageView(path)
  }
  return {
    initialize,
    track,
    pageView: navigate,
    identify,
    reset: () => identify(),
    startJourney,
  }
}
function safeReferrer(raw: string) {
  try {
    const url = new URL(raw)
    return `${url.origin}${cleanPath(url.pathname)}`
  } catch {
    return ''
  }
}
