import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Card, Label } from '../../src/ui';
import { useAuth } from '../../src/auth';
import { BASE_URL } from '../../src/api';
import { colors, radius, space } from '../../src/theme';

/**
 * Profile.
 *
 * Read-only, like the web app: the API has no profile-update route, so no
 * edit form is offered that could not actually save.
 */
export default function ProfileScreen() {
  const { user, signOut } = useAuth();
  const router = useRouter();

  function confirmSignOut() {
    Alert.alert('Log out?', 'You will need to sign in again on this device.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log out',
        style: 'destructive',
        onPress: async () => {
          await signOut();
          router.replace('/login');
        },
      },
    ]);
  }

  if (!user) return null;

  const initials = user.name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <ScrollView contentContainerStyle={s.scroll}>
        <View style={s.header}>
          <Text style={s.title}>Your profile</Text>
        </View>

        <Card style={s.card}>
          <View style={s.identity}>
            <View style={s.avatar}>
              <Text style={s.avatarText}>{initials}</Text>
            </View>
            <View style={s.flex}>
              <Text style={s.name}>{user.name}</Text>
              <Text style={s.email}>{user.email}</Text>
            </View>
          </View>

          <View style={s.divider} />

          <Row label="Name" value={user.name} />
          <Row label="Email" value={user.email} />
          <Row label="Role" value={user.role === 'admin' ? 'Administrator' : 'Customer'} />

          <Text style={s.note}>
            Profile editing is not available yet - the API has no
            profile-update endpoint.
          </Text>
        </Card>

        {user.role === 'admin' ? (
          <Card style={s.adminCard}>
            <Label>Administrator account</Label>
            <Text style={s.adminText}>
              The operations console - dashboard, audit logs and fleet
              management - is on the web app. This phone app shows the customer
              views only.
            </Text>
          </Card>
        ) : null}

        <Card style={s.card}>
          <Label>Connection</Label>
          <Text style={s.apiUrl}>{BASE_URL}</Text>
          <Text style={s.note}>
            Every request goes through this Express API. The app never contacts
            the database or the ML service directly.
          </Text>
        </Card>

        <Button title="Log out" variant="outline" onPress={confirmSignOut} />
      </ScrollView>
    </SafeAreaView>
  );
}

function Row({ label, value }) {
  return (
    <View style={s.row}>
      <Text style={s.rowLabel}>{label}</Text>
      <Text style={s.rowValue}>{value}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.page },
  scroll: { padding: space.lg, gap: space.lg, paddingBottom: space.xxl },
  flex: { flex: 1 },

  header: { paddingTop: space.sm },
  title: { fontSize: 28, fontWeight: '800', color: colors.text, letterSpacing: -0.8 },

  card: { gap: space.md },

  identity: { flexDirection: 'row', alignItems: 'center', gap: space.lg },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: radius.pill,
    backgroundColor: colors.brown,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: colors.gold, fontSize: 20, fontWeight: '800' },
  name: { fontSize: 19, fontWeight: '800', color: colors.text },
  email: { fontSize: 14, color: colors.textMuted },

  divider: { height: 1, backgroundColor: colors.border },

  row: { flexDirection: 'row', justifyContent: 'space-between', gap: space.md },
  rowLabel: { fontSize: 14, color: colors.textMuted },
  rowValue: { fontSize: 14, fontWeight: '700', color: colors.text, flexShrink: 1, textAlign: 'right' },

  note: { fontSize: 12, color: colors.textMuted, lineHeight: 18 },

  adminCard: { gap: space.sm, backgroundColor: colors.goldSoft, borderColor: colors.gold },
  adminText: { fontSize: 13, color: colors.textBody, lineHeight: 20 },

  apiUrl: { fontSize: 13, fontWeight: '700', color: colors.text },
});
