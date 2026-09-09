/** Full-width primary CTA with loading / success / disabled states.
 *  Accessible name stays "Login" (idle) so existing flows/tests are unaffected. */
export default function PrimaryButton({ loading, done, disabled, children = 'Login', ...rest }) {
  return (
    <button type="submit" className="lgn-submit" disabled={disabled || loading || done} {...rest}>
      {loading && <span className="lgn-spinner" aria-hidden="true" />}
      {loading ? 'Signing in…' : done ? 'Signed in' : children}
    </button>
  );
}
