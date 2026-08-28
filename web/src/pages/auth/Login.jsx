import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Lock, Mail } from 'lucide-react';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { FormError } from '../../components/ui/States';
import GoogleButton from '../../components/GoogleButton';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { validateEmail } from '../../utils/validation';
import './auth.css';

export default function Login() {
  const { signIn, sessionExpired, clearSessionExpired } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();
  useDocumentTitle('Sign in');

  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function update(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
    if (errors[field]) setErrors((current) => ({ ...current, [field]: null }));
    if (formError) setFormError(null);
    if (sessionExpired) clearSessionExpired();
  }

  function validate() {
    const next = {};
    const email = validateEmail(form.email);
    if (email) next.email = email;
    if (!form.password) next.password = 'Password is required';
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    setFormError(null);

    try {
      const user = await signIn({ email: form.email.trim(), password: form.password });
      toast.success(`Welcome back, ${user.name.split(' ')[0]}.`);

      // Return to wherever they were headed, or their role's home.
      const intended = location.state?.from?.pathname;
      const home = user.role === 'admin' ? '/admin' : '/dashboard';
      navigate(intended && intended !== '/login' ? intended : home, { replace: true });
    } catch (err) {
      setFormError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="auth-card">
      <header className="auth-card__head">
        <h1 className="auth-card__title">Sign in</h1>
        <p className="auth-card__subtitle">
          Pick up where you left off, on any device.
        </p>
      </header>

      {sessionExpired && (
        <div className="auth-card__notice" role="status">
          Your session expired. Please sign in again.
        </div>
      )}

      <form className="auth-form" onSubmit={handleSubmit} noValidate>
        <FormError message={formError} />

        <Input
          label="Email"
          type="email"
          name="email"
          autoComplete="email"
          placeholder="you@example.com"
          iconLeft={Mail}
          value={form.email}
          onChange={(e) => update('email', e.target.value)}
          error={errors.email}
          required
        />

        <div className="auth-form__password">
          <Input
            label="Password"
            type="password"
            name="password"
            autoComplete="current-password"
            placeholder="Your password"
            iconLeft={Lock}
            value={form.password}
            onChange={(e) => update('password', e.target.value)}
            error={errors.password}
            required
          />
          {/* Password reset is not implemented by the backend, so this is a
              disabled placeholder rather than a link to nowhere. */}
          <button
            type="button"
            className="auth-form__forgot"
            disabled
            title="Password reset is not available yet"
          >
            Forgot password?
          </button>
        </div>

        <Button type="submit" size="lg" fullWidth isLoading={isSubmitting} loadingText="Signing in">
          Sign in
        </Button>
      </form>

      <div className="auth-divider">
        <span>or</span>
      </div>

      <GoogleButton label="Continue with Google" />

      <p className="auth-card__foot">
        New to One Logistics? <Link to="/register">Create an account</Link>
      </p>
    </div>
  );
}
