import { useEffect } from 'react';
import { setChannel } from '../api/axios';
import { useIsMobile } from './useMediaQuery';

/**
 * Tell the API layer which channel this session is using.
 *
 * The backend stamps `lastChannel` on every shipment it writes, which is what
 * powers the "Started on Web / Started on Mobile" story. Reporting the real
 * viewport keeps that honest: a draft saved from a phone-sized browser is
 * genuinely recorded as mobile.
 */
export function useChannelSync() {
  const isMobile = useIsMobile();

  useEffect(() => {
    setChannel(isMobile ? 'mobile' : 'web');
  }, [isMobile]);

  return isMobile ? 'mobile' : 'web';
}
