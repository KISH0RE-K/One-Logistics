import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Lock, Mail, User } from 'lucide-react';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { FormError } from '../../components/ui/States';
import GoogleButton from '../../components/GoogleButton';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { validateEmail, validateName, validatePassword } from '../../utils/validation';
import './auth.css';

export default function Register() {
  const { signUp } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  useDocumentTitle('Create an account');

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function update(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
    if (errors[field]) setErrors((current) => ({ ...current, [field]: null }));
    if (formError) setFormError(null);
  }

  function validate() {
    const next = {};

    const name = validateName(form.name);
    if (name) next.name = name;

    const email = validateEmail(form.email);
    if (email) next.email = email;

    const password = validatePassword(form.password);
    if (password) next.password = password;

    if (!form.confirmPassword) {
      next.confirmPassword = 'Confirm your password';
    } else if (form.confirmPassword !== form.password) {
      next.confirmPassword = 'Passwords do not match';
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    setFormError(null);

    try {
      // Role is intentionally not sent - the backend assigns 'customer'.
      const user = await signUp({
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
      });
      toast.success(`Welcome, ${user.name.split(' ')[0]}. Your account is ready.`);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setFormError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="auth-card">
      <header className="auth-card__head">
        <h1 className="auth-card__title">Create your account</h1>
        <p className="auth-card__subtitle">
          Book, track and manage shipments in one place.
        </p>
      </header>

      <form className="auth-form" onSubmit={handleSubmit} noValidate>
        <FormError message={formError} />

        <Input
          label="Full name"
          name="name"
          autoComplete="name"
          placeholder="Alex Menon"
          iconLeft={User}
          value={form.name}
          onChange={(e) => update('name', e.target.value)}
          error={errors.name}
          required
        />

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

        <Input
          label="Password"
          type="password"
          name="password"
          autoComplete="new-password"
          placeholder="At least 8 characters"
          iconLeft={Lock}
          value={form.password}
          onChange={(e) => update('password', e.target.value)}
          error={errors.password}
          hint="Use at least 8 characters."
          required
        />

        <Input
          label="Confirm password"
          type="password"
          name="confirmPassword"
          autoComplete="new-password"
          placeholder="Re-enter your password"
          iconLeft={Lock}
          value={form.confirmPassword}
          onChange={(e) => update('confirmPassword', e.target.value)}
          error={errors.confirmPassword}
          required
        />

        <Button
          type="submit"
          size="lg"
          fullWidth
          isLoading={isSubmitting}
          loadingText="Creating account"
        >
          Create account
        </Button>
      </form>

      <div className="auth-divider">
        <span>or</span>
      </div>

      <GoogleButton label="Continue with Google" />

      <p className="auth-card__foot">
        Already have an account? <Link to="/login">Sign in</Link>
      </p>
    </div>
  );
}
