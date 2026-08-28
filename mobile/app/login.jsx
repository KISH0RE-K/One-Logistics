import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, ErrorBox, Field } from '../src/ui';
import { useAuth } from '../src/auth';
import { colors, radius, space } from '../src/theme';

/**
 * Sign in / create account.
 *
 * Both modes hit the existing Express auth routes. `role` is never sent on
 * registration - the backend assigns it, and a client-supplied role must not
 * be trusted.
 */
export default function Login() {
  const { signIn, signUp } = useAuth();
  const router = useRouter();

  const [mode, setMode] = useState('signin');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState(null);
  const [busy, setBusy] = useState(false);

  const isRegister = mode === 'register';

  function validate() {
    const next = {};
    if (isRegister && name.trim().length < 2) next.name = 'Name must be at least 2 characters';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim())) {
      next.email = 'Enter a valid email address';
    }
    if (password.length < (isRegister ? 8 : 1)) {
      next.password = isRegister
        ? 'Password must be at least 8 characters'
        : 'Password is required';
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function submit() {
    if (!validate()) return;

    setBusy(true);
    setFormError(null);

    try {
      const user = isRegister
        ? await signUp(name.trim(), email.trim(), password)
        : await signIn(email.trim(), password);

      // The console is web-only; an admin signing in here still gets the
      // customer views, and the backend refuses admin endpoints regardless.
      if (user) router.replace('/(tabs)');
    } catch (err) {
      setFormError(err.message);
    } finally {
      setBusy(false);
    }
  }

  function switchMode() {
    setMode(isRegister ? 'signin' : 'register');
    setErrors({});
    setFormError(null);
  }

  return (
    <SafeAreaView style={s.safe} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={s.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={s.scroll}
          keyboardShouldPersistTaps="handled"
        >
          <View style={s.brand}>
            <View style={s.mark}>
              <View style={s.markArc} />
            </View>
            <Text style={s.brandName}>One Logistics</Text>
            <Text style={s.brandTag}>EXPERIENCE</Text>
          </View>

          <View style={s.card}>
            <Text style={s.title}>{isRegister ? 'Create your account' : 'Sign in'}</Text>
            <Text style={s.subtitle}>
              {isRegister
                ? 'Book, track and pick up saved drafts from anywhere.'
                : 'Pick up where you left off, on any device.'}
            </Text>

            {formError ? <ErrorBox message={formError} /> : null}

            {isRegister ? (
              <Field
                label="Full name"
                value={name}
                onChangeText={setName}
                placeholder="Alex Menon"
                autoCapitalize="words"
                autoComplete="name"
                error={errors.name}
              />
            ) : null}

            <Field
              label="Email"
              value={email}
              onChangeText={setEmail}
              placeholder="you@example.com"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="email"
              error={errors.email}
            />

            <Field
              label="Password"
              value={password}
              onChangeText={setPassword}
              placeholder={isRegister ? 'At least 8 characters' : 'Your password'}
              secureTextEntry
              autoCapitalize="none"
              autoComplete={isRegister ? 'new-password' : 'current-password'}
              error={errors.password}
              onSubmitEditing={submit}
              returnKeyType="go"
            />

            <Button
              title={isRegister ? 'Create account' : 'Sign in'}
              onPress={submit}
              loading={busy}
            />

            <Button
              title={
                isRegister ? 'I already have an account' : 'New here? Create an account'
              }
              variant="ghost"
              onPress={switchMode}
            />
          </View>

          <Text style={s.footnote}>
            Google sign-in and password reset are not connected to the API yet.
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.brown },
  flex: { flex: 1 },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: space.xl, gap: space.xl },

  brand: { alignItems: 'center', gap: 2 },
  mark: {
    width: 56,
    height: 56,
    borderRadius: radius.lg,
    backgroundColor: colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: space.md,
  },
  markArc: {
    width: 24,
    height: 24,
    borderColor: colors.brown,
    borderWidth: 5,
    borderTopWidth: 0,
    borderBottomLeftRadius: 14,
    borderBottomRightRadius: 14,
  },
  brandName: { color: colors.white, fontSize: 24, fontWeight: '800', letterSpacing: -0.5 },
  brandTag: { color: colors.gold, fontSize: 11, fontWeight: '800', letterSpacing: 3 },

  card: {
    backgroundColor: colors.card,
    borderRadius: radius.xl,
    padding: space.xl,
    gap: space.lg,
  },
  title: { fontSize: 24, fontWeight: '800', color: colors.text },
  subtitle: { fontSize: 14, color: colors.textMuted, marginTop: -space.sm },

  footnote: {
    color: colors.onDarkMuted,
    fontSize: 12,
    textAlign: 'center',
  },
});
