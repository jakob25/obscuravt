/** Fixed ambient layers behind all page content. Does not affect cards or dossiers. */
export function SiteBackdrop() {
  return (
    <div className="site-backdrop" aria-hidden>
      <div className="site-backdrop-glow" />
      <div className="site-backdrop-grain" />
      <div className="site-backdrop-scan" />
    </div>
  )
}