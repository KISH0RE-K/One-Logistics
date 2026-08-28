import { useCallback, useState } from 'react';
import {
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Monitor, Smartphone } from 'lucide-react-native';
import { Button, Card, Empty, ErrorBox, Label, Loading } from '../../src/ui';
import * as api from '../../src/api';
import {
  channelLabel,
  draftProgress,
  formatCurrency,
  formatDuration,
  formatRelative,
  formatWeight,
  isDraftBookable,
  missingSteps,
} from '../../src/format';
import { colors, radius, space } from '../../src/theme';

/**
 * Saved drafts - the point of this app.
 *
 * A draft begun in the browser arrives here because it lives in MongoDB, not
 * on a device. If it has everything the backend needs, it can be confirmed
 * from the phone: that PUT carries X-Channel: mobile, so the shipment's
 * lastChannel flips to mobile and the handover is visible in the data.
 *
 * A draft that is still missing details says exactly what is missing and
 * points back to the web app, rather than offering a button that would fail.
 */
export default function DraftsScreen() {
  const router = useRouter();

  const [drafts, setDrafts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [busyId, setBusyId] = useState(null);

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    setError(null);
    try {
      setDrafts(await api.getDrafts());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  async function confirm(draft) {
    setBusyId(draft._id);
    try {
      const shipment = await api.confirmDraft(draft._id);
      await load();
      Alert.alert(
        'Shipment created',
        `Tracking number ${shipment.trackingNumber}.`,
        [
          { text: 'Later', style: 'cancel' },
          {
            text: 'Track it',
            onPress: () =>
              router.push({
                pathname: '/track',
                params: { number: shipment.trackingNumber },
              }),
          },
        ]
      );
    } catch (err) {
      Alert.alert('Could not confirm', err.message);
    } finally {
      setBusyId(null);
    }
  }

  function askDelete(draft) {
    Alert.alert(
      'Delete this draft?',
      `The draft for ${draft.from || 'an unset pickup'} to ${
        draft.to || 'an unset destination'
      } will be permanently removed.`,
      [
        { text: 'Keep draft', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setBusyId(draft._id);
            try {
              await api.deleteShipment(draft._id);
              await load();
            } catch (err) {
              Alert.alert('Could not delete', err.message);
            } finally {
              setBusyId(null);
            }
          },
        },
      ]
    );
  }

  if (loading) {
    return (
      <SafeAreaView style={s.safe} edges={['top']}>
        <Loading label="Loading your drafts" />
      </SafeAreaView>
    );
  }

  const sorted = [...drafts].sort(
    (a, b) =>
      new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt)
  );

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <ScrollView
        contentContainerStyle={s.scroll}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => load(true)}
            tintColor={colors.gold}
          />
        }
      >
        <View style={s.header}>
          <Text style={s.title}>Saved drafts</Text>
          <Text style={s.subtitle}>
            Bookings you started anywhere. They follow your account, not your
            device.
          </Text>
        </View>

        {error ? <ErrorBox message={error} onRetry={() => load()} /> : null}

        {!error && sorted.length === 0 ? (
          <Empty
            title="No saved drafts."
            message="Start a shipment on the web and save it - it will appear here, ready to finish."
          />
        ) : null}

        {sorted.map((draft) => {
          const bookable = isDraftBookable(draft);
          const missing = missingSteps(draft);
          const pkg = draft.packageId;
          const busy = busyId === draft._id;

          return (
            <Card key={draft._id} style={s.card}>
              <View style={s.cardTop}>
                <Text style={s.route}>
                  {draft.from || 'Pickup not set'} → {draft.to || 'Delivery not set'}
                </Text>
              </View>

              <View style={s.channelBadge}>
                {draft.lastChannel === 'mobile' ? (
                  <Smartphone size={12} color={colors.gold} />
                ) : (
                  <Monitor size={12} color={colors.gold} />
                )}
                <Text style={s.channelBadgeText}>
                  Started on {channelLabel(draft.lastChannel)}
                </Text>
              </View>

              <View style={s.progressRow}>
                <View style={s.track}>
                  <View style={[s.fill, { width: `${draftProgress(draft)}%` }]} />
                </View>
                <Text style={s.progressText}>{draftProgress(draft)}% complete</Text>
              </View>

              <View style={s.facts}>
                <Fact label="Package" value={pkg?.weight ? formatWeight(pkg.weight) : 'Not added'} />
                <Fact label="Service" value={draft.deliveryOption || 'Not chosen'} />
                <Fact label="Transport" value={draft.transportMode || 'Not chosen'} />
              </View>

              {draft.cost !== undefined || draft.estimatedTime !== undefined ? (
                <View style={s.facts}>
                  <Fact label="Cost" value={formatCurrency(draft.cost)} />
                  <Fact label="Delivery" value={formatDuration(draft.estimatedTime)} />
                </View>
              ) : null}

              <Text style={s.edited}>
                Last edited {formatRelative(draft.updatedAt || draft.createdAt)}
              </Text>

              {bookable ? (
                <Button
                  title="Confirm shipment"
                  onPress={() => confirm(draft)}
                  loading={busy}
                />
              ) : (
                <View style={s.blocked}>
                  <Label>Still needed</Label>
                  <Text style={s.blockedText}>
                    {missing.join(', ')} — finish this draft on the web app, then
                    confirm it here.
                  </Text>
                </View>
              )}

              <Button
                title="Delete draft"
                variant="ghost"
                onPress={() => askDelete(draft)}
                disabled={busy}
              />
            </Card>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

function Fact({ label, value }) {
  return (
    <View style={s.fact}>
      <Text style={s.factLabel}>{label}</Text>
      <Text style={s.factValue}>{value}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.page },
  scroll: { padding: space.lg, gap: space.lg, paddingBottom: space.xxl },

  header: { gap: space.xs, paddingTop: space.sm },
  title: { fontSize: 28, fontWeight: '800', color: colors.text, letterSpacing: -0.8 },
  subtitle: { fontSize: 14, color: colors.textMuted, lineHeight: 21 },

  card: { gap: space.md, borderLeftWidth: 4, borderLeftColor: colors.gold },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between' },
  route: { fontSize: 18, fontWeight: '800', color: colors.text, flex: 1 },

  channelBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    backgroundColor: colors.brown,
    paddingHorizontal: space.md,
    paddingVertical: 5,
    borderRadius: radius.pill,
  },
  channelBadgeText: { color: colors.gold, fontSize: 12, fontWeight: '700' },

  progressRow: { gap: 6 },
  track: {
    height: 8,
    borderRadius: radius.pill,
    backgroundColor: colors.sunken,
    overflow: 'hidden',
  },
  fill: { height: '100%', backgroundColor: colors.gold, borderRadius: radius.pill },
  progressText: { fontSize: 12, fontWeight: '700', color: colors.textMuted },

  facts: { flexDirection: 'row', gap: space.md },
  fact: { flex: 1, gap: 2 },
  factLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: colors.textMuted,
  },
  factValue: { fontSize: 14, fontWeight: '700', color: colors.text },

  edited: { fontSize: 12, color: colors.textMuted },

  blocked: {
    gap: 6,
    padding: space.md,
    borderRadius: radius.md,
    backgroundColor: colors.warningBg,
  },
  blockedText: { fontSize: 13, color: colors.warning, lineHeight: 19 },
});
