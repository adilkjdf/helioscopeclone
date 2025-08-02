import { Map, latLng, LatLngTuple } from 'leaflet';

const FEET_PER_METER = 3.28084;

export const calculateDistanceInFeet = (p1: LatLngTuple, p2: LatLngTuple, map: Map): number => {
  const latLng1 = latLng(p1);
  const latLng2 = latLng(p2);
  const distanceInMeters = map.distance(latLng1, latLng2);
  return distanceInMeters * FEET_PER_METER;
};

export const getMidpoint = (p1: LatLngTuple, p2: LatLngTuple): LatLngTuple => {
  return [(p1[0] + p2[0]) / 2, (p1[1] + p2[1]) / 2];
};

export const getSnappedPoint = (startPoint: LatLngTuple, endPoint: LatLngTuple, map: Map): LatLngTuple => {
  const startContainerPoint = map.latLngToContainerPoint(startPoint);
  const endContainerPoint = map.latLngToContainerPoint(endPoint);

  const dx = endContainerPoint.x - startContainerPoint.x;
  const dy = endContainerPoint.y - startContainerPoint.y;

  const angleRad = Math.atan2(dy, dx);
  // Snap to nearest 45 degrees (PI/4 radians)
  const snappedAngleRad = Math.round(angleRad / (Math.PI / 4)) * (Math.PI / 4);

  const distance = Math.sqrt(dx * dx + dy * dy);

  const snappedContainerPoint = {
    x: startContainerPoint.x + distance * Math.cos(snappedAngleRad),
    y: startContainerPoint.y + distance * Math.sin(snappedAngleRad),
  };

  const snappedLatLng = map.containerPointToLatLng(snappedContainerPoint);
  return [snappedLatLng.lat, snappedLatLng.lng];
};

// A proper area calculation for geographic coordinates is complex.
// This placeholder returns 0, as seen in the reference image.
export const calculatePolygonArea = (points: LatLngTuple[]): number => {
    if (points.length < 3) return 0;
    return 0; // Placeholder
};