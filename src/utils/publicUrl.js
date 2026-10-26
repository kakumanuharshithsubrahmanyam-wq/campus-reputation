/**
 * Public site URL for share links and QR codes.
 * Production: set VITE_PUBLIC_APP_URL (no trailing slash).
 * Development: falls back to current browser origin.
 */
export function getPublicAppBase() {
  const configured = import.meta.env.VITE_PUBLIC_APP_URL?.replace(/\/$/, '')
  if (configured) return configured
  if (typeof window !== 'undefined') {
    return `${window.location.origin}${window.location.pathname}`.replace(/\/$/, '')
  }
  return ''
}

export function publicStudentProfileUrl(wallet) {
  const base = getPublicAppBase()
  if (!base || !wallet) return ''
  return `${base}#/student/${wallet}`
}
