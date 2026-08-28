/**
 * Shared visual language with the web app: deep brown, golden yellow, warm
 * neutrals. Kept as one small object rather than a styling framework.
 */
export const colors = {
  gold: '#F6B400',
  goldDark: '#DC9E00',
  goldSoft: '#FFF1CC',

  brown: '#241A0F',
  brownRaised: '#33240F',
  brownMid: '#4A3520',
  brownSoft: '#A68D6F',

  white: '#FFFFFF',
  page: '#FAF9F7',
  card: '#FFFFFF',
  sunken: '#F4F2EE',

  border: '#E8E4DD',
  borderStrong: '#D6D1C7',

  text: '#1A1A1A',
  textBody: '#403B34',
  textMuted: '#7C756A',
  onDark: '#F7F3EE',
  onDarkMuted: '#CDBBA4',

  success: '#10653A',
  successBg: '#E6F4EC',
  info: '#14508F',
  infoBg: '#E7F0FA',
  warning: '#8A5A00',
  warningBg: '#FFF4DC',
  danger: '#A01A13',
  dangerBg: '#FDECEB',
};

export const space = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
};

export const radius = {
  sm: 8,
  md: 12,
  lg: 18,
  xl: 24,
  pill: 999,
};

/** Status pill colours, matching the web app's vocabulary. */
export const statusTone = {
  draft: { bg: colors.sunken, fg: colors.textBody, label: 'Draft' },
  booked: { bg: colors.infoBg, fg: colors.info, label: 'Booked' },
  in_transit: { bg: colors.infoBg, fg: colors.info, label: 'In Transit' },
  out_for_delivery: { bg: colors.warningBg, fg: colors.warning, label: 'Out for Delivery' },
  delivered: { bg: colors.successBg, fg: colors.success, label: 'Delivered' },
  cancelled: { bg: colors.dangerBg, fg: colors.danger, label: 'Cancelled' },
};

export function toneFor(status) {
  return statusTone[status] || { bg: colors.sunken, fg: colors.textBody, label: status || '—' };
}
