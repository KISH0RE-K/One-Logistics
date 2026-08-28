import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { colors, radius, space, toneFor } from './theme';

/* -- Button ---------------------------------------------------------------- */

export function Button({
  title,
  onPress,
  variant = 'primary',
  loading = false,
  disabled = false,
  style,
}) {
  const isDisabled = disabled || loading;

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      style={({ pressed }) => [
        s.btn,
        variant === 'primary' && s.btnPrimary,
        variant === 'secondary' && s.btnSecondary,
        variant === 'outline' && s.btnOutline,
        variant === 'ghost' && s.btnGhost,
        pressed && !isDisabled && s.btnPressed,
        isDisabled && s.btnDisabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'primary' ? colors.brown : colors.textBody}
        />
      ) : (
        <Text
          style={[
            s.btnText,
            variant === 'primary' && s.btnTextPrimary,
            variant === 'secondary' && s.btnTextSecondary,
            (variant === 'outline' || variant === 'ghost') && s.btnTextOutline,
          ]}
        >
          {title}
        </Text>
      )}
    </Pressable>
  );
}

/* -- Field ----------------------------------------------------------------- */

export function Field({ label, error, hint, style, ...props }) {
  return (
    <View style={[s.field, style]}>
      <Text style={s.fieldLabel}>{label}</Text>
      <TextInput
        style={[s.input, error && s.inputInvalid]}
        placeholderTextColor={colors.brownSoft}
        accessibilityLabel={label}
        {...props}
      />
      {hint && !error ? <Text style={s.fieldHint}>{hint}</Text> : null}
      {error ? (
        <Text style={s.fieldError} accessibilityLiveRegion="polite">
          {error}
        </Text>
      ) : null}
    </View>
  );
}

/* -- Card ------------------------------------------------------------------ */

export function Card({ children, style, dark = false }) {
  return <View style={[s.card, dark && s.cardDark, style]}>{children}</View>;
}

/* -- Status pill ------------------------------------------------------------ */

export function StatusPill({ status }) {
  const tone = toneFor(status);
  return (
    <View style={[s.pill, { backgroundColor: tone.bg }]}>
      <Text style={[s.pillText, { color: tone.fg }]}>{tone.label}</Text>
    </View>
  );
}

/* -- States ----------------------------------------------------------------- */

export function Loading({ label = 'Loading' }) {
  return (
    <View style={s.centered}>
      <ActivityIndicator color={colors.gold} />
      <Text style={s.centeredText}>{label}…</Text>
    </View>
  );
}

export function Empty({ title, message, action }) {
  return (
    <View style={s.empty}>
      <Text style={s.emptyTitle}>{title}</Text>
      {message ? <Text style={s.emptyMessage}>{message}</Text> : null}
      {action ? <View style={s.emptyAction}>{action}</View> : null}
    </View>
  );
}

export function ErrorBox({ message, onRetry }) {
  return (
    <View style={s.errorBox} accessibilityLiveRegion="polite">
      <Text style={s.errorText}>{message}</Text>
      {onRetry ? (
        <Button title="Try again" variant="outline" onPress={onRetry} style={s.errorBtn} />
      ) : null}
    </View>
  );
}

/* -- Section label ----------------------------------------------------------- */

export function Label({ children, light = false }) {
  return <Text style={[s.label, light && s.labelLight]}>{children}</Text>;
}

const s = StyleSheet.create({
  btn: {
    minHeight: 50,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: space.xl,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  btnPrimary: { backgroundColor: colors.gold },
  btnSecondary: { backgroundColor: colors.brown },
  btnOutline: { borderColor: colors.borderStrong, backgroundColor: 'transparent' },
  btnGhost: { backgroundColor: 'transparent' },
  btnPressed: { opacity: 0.85 },
  btnDisabled: { opacity: 0.5 },
  btnText: { fontSize: 16, fontWeight: '700' },
  btnTextPrimary: { color: colors.brown },
  btnTextSecondary: { color: colors.onDark },
  btnTextOutline: { color: colors.text },

  field: { gap: space.sm },
  fieldLabel: { fontSize: 13, fontWeight: '700', color: colors.text },
  input: {
    minHeight: 52,
    borderWidth: 1.5,
    borderColor: colors.borderStrong,
    borderRadius: radius.md,
    paddingHorizontal: space.lg,
    fontSize: 16,
    color: colors.text,
    backgroundColor: colors.white,
  },
  inputInvalid: { borderColor: colors.danger },
  fieldHint: { fontSize: 12, color: colors.textMuted },
  fieldError: { fontSize: 13, fontWeight: '600', color: colors.danger },

  card: {
    backgroundColor: colors.card,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: space.xl,
  },
  cardDark: { backgroundColor: colors.brown, borderColor: colors.brownMid },

  pill: {
    alignSelf: 'flex-start',
    paddingHorizontal: space.md,
    paddingVertical: 4,
    borderRadius: radius.pill,
  },
  pillText: { fontSize: 12, fontWeight: '800' },

  centered: { padding: space.xxl, alignItems: 'center', gap: space.md },
  centeredText: { color: colors.textMuted, fontSize: 14 },

  empty: {
    padding: space.xxl,
    alignItems: 'center',
    gap: space.md,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.borderStrong,
    backgroundColor: colors.card,
  },
  emptyTitle: { fontSize: 17, fontWeight: '800', color: colors.text, textAlign: 'center' },
  emptyMessage: { fontSize: 14, color: colors.textMuted, textAlign: 'center', lineHeight: 21 },
  emptyAction: { marginTop: space.sm, alignSelf: 'stretch' },

  errorBox: {
    padding: space.lg,
    borderRadius: radius.md,
    backgroundColor: colors.dangerBg,
    borderWidth: 1,
    borderColor: '#F0B3AE',
    gap: space.md,
  },
  errorText: { color: colors.danger, fontWeight: '600', fontSize: 14 },
  errorBtn: { minHeight: 42 },

  label: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: colors.textMuted,
  },
  labelLight: { color: colors.gold },
});
