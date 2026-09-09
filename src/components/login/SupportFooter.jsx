/** In-card support line + minimal legal footer.
 *  No routes exist for privacy/terms, so these are toast affordances, not links. */
export default function SupportFooter({ onNotify }) {
  return (
    <div className="lgn-support">
      <p className="lgn-support-help">
        Need help signing in?{' '}
        <button type="button" className="lgn-link"
          onClick={() => onNotify('Contact support: i2p-support@mahindra.com')}>
          Contact Support
        </button>
      </p>
      <div className="lgn-support-legal">
        <span>© 2026 Mahindra</span>
        <button type="button" onClick={() => onNotify('Privacy policy — see the Mahindra intranet.')}>Privacy</button>
        <button type="button" onClick={() => onNotify('Terms of use — see the Mahindra intranet.')}>Terms</button>
      </div>
    </div>
  );
}
