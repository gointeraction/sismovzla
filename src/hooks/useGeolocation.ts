import { useCallback } from 'react';

export function useGeolocation() {
  const getPosition = useCallback(async (): Promise<{ lat: number; lng: number } | null> => {
    if (!navigator.geolocation) return null;
    try {
      const pos = await new Promise<GeolocationPosition>((res, rej) =>
        navigator.geolocation.getCurrentPosition(res, rej)
      );
      return { lat: pos.coords.latitude, lng: pos.coords.longitude };
    } catch {
      return null;
    }
  }, []);

  return { getPosition };
}

export function getLatLng(pos: { lat: number; lng: number } | null, fallback: { lat: number; lng: number } = { lat: 0, lng: 0 }) {
  return pos ?? fallback;
}
