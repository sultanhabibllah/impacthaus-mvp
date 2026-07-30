export default function AuthLayout({ headline, subtext, children }) {
  return (
    <div className="auth-shell">
      <div className="auth-brand-panel">
        <div className="auth-brand-logo">ImpactHaus</div>
        <h1 className="auth-brand-headline">{headline}</h1>
        <p className="auth-brand-subtext">{subtext}</p>
      </div>

      <div className="auth-form-panel">
        {children}
      </div>
    </div>
  )
}