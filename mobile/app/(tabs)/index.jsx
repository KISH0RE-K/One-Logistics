import { useCallback, useState } from 'react';
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Monitor, Smartphone } from 'lucide-react-native';
import { Button, Card, ErrorBox, Label, Loading, StatusPill } from '../../src/ui';
import { useAuth } from '../../src/auth';
import * as api from '../../src/api';
import {
  channelLabel,
  draftProgress,
  formatDuration,
  formatRelative,
} from '../../src/format';
import { colors, radius, space } from '../../src/theme';

/**
 * Mobile home.
 *
 * A different shape from the web dashboard: the "continue where you left off"
 * panel comes first, because picking up a booking started elsewhere is the
 * main reason to open this app on a phone.
 */
export default function HomeScreen() {
  const { user } = useAuth();
  const router = useRouter();

  const [active, setActive] = useState([]);
  const [drafts, setDrafts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    setError(null);

    try {
      const [activeList, draftList] = await Promise.all([
        api.getActiveShipments(),
        api.getDrafts(),
      ]);
      setActive(activeList);
      setDrafts(draftList);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Reload on focus so a draft saved on the web shows up on return.
  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const latestDraft = [...drafts].sort(
    (a, b) =>
      new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt)
  )[0];

  const firstName = user?.name?.split(' ')[0] || 'there';

  if (loading) {
    return (
      <SafeAreaView style={s.safe} edges={['top']}>
        <Loading label="Loading your shipments" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <ScrollView
        contentContainerStyle={s.scroll}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={colors.gold} />
        }
      >
        {/* Header */}
        <View style={s.header}>
          <Text style={s.greeting}>Welcome back, {firstName}</Text>
          <Text style={s.headline}>Ship smarter.{'\n'}Track seamlessly.</Text>
        </View>

        {error ? <ErrorBox message={error} onRetry={() => load()} /> : null}

        {/* Continue where you left off - the cross-channel handover. */}
        {latestDraft ? (
          <Card style={s.continueCard}>
            <Label>Continue where you left off</Label>

            <Text style={s.route}>
              {latestDraft.from || 'Pickup not set'} → {latestDraft.to || 'Delivery not set'}
            </Text>

            <View style={s.channelRow}>
              {latestDraft.lastChannel === 'mobile' ? (
                <Smartphone size={13} color={colors.brownMid} />
              ) : (
                <Monitor size={13} color={colors.brownMid} />
              )}
              <Text style={s.channelText}>
                Started on {channelLabel(latestDraft.lastChannel)} ·{' '}
                {formatRelative(latestDraft.updatedAt || latestDraft.createdAt)}
              </Text>
            </View>

            <View style={s.progressRow}>
              <View style={s.track}>
                <View style={[s.fill, { width: `${draftProgress(latestDraft)}%` }]} />
              </View>
              <Text style={s.progressText}>{draftProgress(latestDraft)}% complete</Text>
            </View>

            <Button
              title="Continue shipment"
              onPress={() => router.push('/drafts')}
            />
          </Card>
        ) : null}

        {/* Counts */}
        <View style={s.statRow}>
          <Card style={s.statCard}>
            <Text style={s.statValue}>{active.length}</Text>
            <Text style={s.statLabel}>Active</Text>
          </Card>
          <Card style={s.statCard}>
            <Text style={s.statValue}>{drafts.length}</Text>
            <Text style={s.statLabel}>Drafts</Text>
          </Card>
        </View>

        {/* Active shipments */}
        <View style={s.section}>
          <Label>Active shipments</Label>

          {active.length === 0 ? (
            <Card>
              <Text style={s.emptyText}>
                Nothing in transit right now. Shipments you book will appear here.
              </Text>
            </Card>
          ) : (
            active.map((shipment) => (
              <Card key={shipment._id} style={s.shipmentCard}>
                <View style={s.shipmentTop}>
                  <Text style={s.tracking}>{shipment.trackingNumber}</Text>
                  <StatusPill status={shipment.status} />
                </View>

                <Text style={s.shipmentRoute}>
                  {shipment.from} → {shipment.to}
                </Text>

                <Text style={s.shipmentMeta}>
                  {shipment.transportMode || '—'} ·{' '}
                  {formatDuration(shipment.estimatedTime)}
                </Text>

                <Button
                  title="Track"
                  variant="outline"
                  onPress={() =>
                    router.push({
                      pathname: '/track',
                      params: { number: shipment.trackingNumber },
                    })
                  }
                />
              </Card>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.page },
  scroll: { padding: space.lg, gap: space.lg, paddingBottom: space.xxl },

  header: { gap: space.xs, paddingTop: space.sm },
  greeting: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: colors.goldDark,
  },
  headline: { fontSize: 30, fontWeight: '800', color: colors.text, letterSpacing: -1 },

  continueCard: { gap: space.md, borderColor: colors.gold, borderWidth: 2 },
  route: { fontSize: 20, fontWeight: '800', color: colors.text },

  channelRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  channelText: { fontSize: 13, fontWeight: '600', color: colors.brownMid, flex: 1 },

  progressRow: { gap: 6 },
  track: {
    height: 8,
    borderRadius: radius.pill,
    backgroundColor: colors.sunken,
    overflow: 'hidden',
  },
  fill: { height: '100%', backgroundColor: colors.gold, borderRadius: radius.pill },
  progressText: { fontSize: 12, fontWeight: '700', color: colors.textMuted },

  statRow: { flexDirection: 'row', gap: space.md },
  statCard: { flex: 1, alignItems: 'flex-start', gap: 2 },
  statValue: { fontSize: 34, fontWeight: '800', color: colors.text, lineHeight: 38 },
  statLabel: { fontSize: 13, fontWeight: '700', color: colors.textMuted },

  section: { gap: space.md },
  emptyText: { fontSize: 14, color: colors.textMuted, lineHeight: 21 },

  shipmentCard: { gap: space.md },
  shipmentTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: space.md,
  },
  tracking: { fontSize: 16, fontWeight: '800', color: colors.text, letterSpacing: 0.5 },
  shipmentRoute: { fontSize: 15, fontWeight: '700', color: colors.textBody },
  shipmentMeta: { fontSize: 13, color: colors.textMuted },
});
