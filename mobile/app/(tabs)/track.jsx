import { useCallback, useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Check } from 'lucide-react-native';
import { Button, Card, Empty, ErrorBox, Field, Label, Loading, StatusPill } from '../../src/ui';
import * as api from '../../src/api';
import { buildTimeline, formatCurrency, formatDateTime, formatDuration } from '../../src/format';
import { colors, radius, space } from '../../src/theme';

/**
 * Tracking, with a vertical timeline.
 *
 * Data comes from the public GET /api/tracking/:trackingNumber. Milestones
 * that have not happened yet are shown as upcoming with no invented detail.
 */
export default function TrackScreen() {
  const params = useLocalSearchParams();

  const [query, setQuery] = useState('');
  const [inputError, setInputError] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [notFound, setNotFound] = useState(false);

  const lookup = useCallback(async (number) => {
    setLoading(true);
    setError(null);
    setNotFound(false);
    setResult(null);

    try {
      setResult(await api.trackShipment(number));
    } catch (err) {
      if (err.status === 404) setNotFound(true);
      else setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Arriving from Home or after confirming a draft.
  useEffect(() => {
    const incoming = params.number;
    if (typeof incoming === 'string' && incoming) {
      setQuery(incoming);
      lookup(incoming);
    }
  }, [params.number, lookup]);

  function submit() {
    const trimmed = query.trim().toUpperCase();
    if (!/^UPS\d{9}$/.test(trimmed)) {
      setInputError('Tracking numbers look like UPS123456789');
      return;
    }
    setInputError(null);
    lookup(trimmed);
  }

  const timeline = result ? buildTimeline(result.events, result.currentStatus) : [];

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">
        <View style={s.header}>
          <Text style={s.title}>Track your shipment</Text>
          <Text style={s.subtitle}>
            Enter a tracking number to see where it is and where it has been.
          </Text>
        </View>

        <Card style={s.searchCard}>
          <Field
            label="Tracking number"
            value={query}
            onChangeText={(text) => {
              setQuery(text);
              if (inputError) setInputError(null);
            }}
            placeholder="UPS123456789"
            autoCapitalize="characters"
            autoCorrect={false}
            error={inputError}
            onSubmitEditing={submit}
            returnKeyType="search"
          />
          <Button title="Track" onPress={submit} loading={loading} />
        </Card>

        {loading ? <Loading label="Looking up shipment" /> : null}

        {notFound && !loading ? (
          <Empty
            title="We couldn't find that shipment."
            message="Check the number and try again. Tracking numbers are issued when a shipment is confirmed."
          />
        ) : null}

        {error && !loading ? <ErrorBox message={error} onRetry={() => lookup(query)} /> : null}

        {result && !loading ? (
          <>
            <Card style={s.summary}>
              <View style={s.summaryTop}>
                <View style={s.flex}>
                  <Label>Tracking number</Label>
                  <Text style={s.number}>{result.trackingNumber}</Text>
                </View>
                <StatusPill status={result.currentStatus} />
              </View>

              <View style={s.facts}>
                <Fact label="From" value={result.from || '—'} />
                <Fact label="To" value={result.to || '—'} />
              </View>
              <View style={s.facts}>
                <Fact label="Transport" value={result.transportMode || '—'} />
                <Fact label="Service" value={result.deliveryOption || '—'} />
              </View>
              <View style={s.facts}>
                <Fact label="Estimated" value={formatDuration(result.estimatedTime)} />
                <Fact label="Cost" value={formatCurrency(result.cost)} />
              </View>
            </Card>

            <Card>
              <Label>Shipment progress</Label>

              <View style={s.timeline}>
                {timeline.map((step, index) => {
                  const isLast = index === timeline.length - 1;
                  const done = step.state === 'complete';
                  const current = step.state === 'current';
                  const cancelled = step.state === 'cancelled';

                  return (
                    <View key={`${step.status}-${index}`} style={s.step}>
                      <View style={s.gutter}>
                        <View
                          style={[
                            s.marker,
                            done && s.markerDone,
                            current && s.markerCurrent,
                            cancelled && s.markerCancelled,
                          ]}
                        >
                          {done ? <Check size={12} color={colors.white} /> : null}
                          {current ? <View style={s.markerDot} /> : null}
                        </View>
                        {!isLast ? (
                          <View style={[s.line, done && s.lineDone]} />
                        ) : null}
                      </View>

                      <View style={s.stepBody}>
                        <Text
                          style={[
                            s.stepTitle,
                            step.state === 'upcoming' && s.stepTitleMuted,
                            cancelled && s.stepTitleCancelled,
                          ]}
                        >
                          {step.status}
                        </Text>
                        {step.location ? (
                          <Text style={s.stepLocation}>{step.location}</Text>
                        ) : null}
                        <Text style={s.stepTime}>
                          {step.timestamp ? formatDateTime(step.timestamp) : 'Pending'}
                        </Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            </Card>
          </>
        ) : null}
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
  flex: { flex: 1 },

  header: { gap: space.xs, paddingTop: space.sm },
  title: { fontSize: 28, fontWeight: '800', color: colors.text, letterSpacing: -0.8 },
  subtitle: { fontSize: 14, color: colors.textMuted, lineHeight: 21 },

  searchCard: { gap: space.lg },

  summary: { gap: space.lg },
  summaryTop: { flexDirection: 'row', alignItems: 'flex-start', gap: space.md },
  number: { fontSize: 22, fontWeight: '800', color: colors.text, letterSpacing: 0.5 },

  facts: { flexDirection: 'row', gap: space.md },
  fact: { flex: 1, gap: 2 },
  factLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: colors.textMuted,
  },
  factValue: { fontSize: 15, fontWeight: '700', color: colors.text },

  timeline: { marginTop: space.lg },
  step: { flexDirection: 'row', gap: space.md },
  gutter: { alignItems: 'center', width: 28 },
  marker: {
    width: 26,
    height: 26,
    borderRadius: radius.pill,
    borderWidth: 2,
    borderColor: colors.borderStrong,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  markerDone: { backgroundColor: colors.success, borderColor: colors.success },
  markerCurrent: { backgroundColor: colors.gold, borderColor: colors.gold },
  markerCancelled: { backgroundColor: colors.dangerBg, borderColor: colors.danger },
  markerDot: { width: 9, height: 9, borderRadius: radius.pill, backgroundColor: colors.brown },
  line: { flex: 1, width: 2, backgroundColor: colors.borderStrong, marginVertical: 3 },
  lineDone: { backgroundColor: colors.success },

  stepBody: { flex: 1, paddingBottom: space.xl, gap: 1 },
  stepTitle: { fontSize: 15, fontWeight: '800', color: colors.text },
  stepTitleMuted: { color: colors.textMuted },
  stepTitleCancelled: { color: colors.danger },
  stepLocation: { fontSize: 14, color: colors.textBody, fontWeight: '600' },
  stepTime: { fontSize: 12, color: colors.textMuted },
});
