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
  const snappedAngleRad = Math.round(angleRad / (Math.PI / 4)) * (Math.PI / 4);

  const distance = Math.sqrt(dx * dx + dy * dy);

  const snappedContainerPoint = {
    x: startContainerPoint.x + distance * Math.cos(snappedAngleRad),
    y: startContainerPoint.y + distance * Math.sin(snappedAngleRad),
  };

  const snappedLatLng = map.containerPointToLatLng(snappedContainerPoint);
  return [snappedLatLng.lat, snappedLatLng.lng];
};

// Calculate polygon area using the shoelace formula on projected coordinates.
// This gives area in square meters.
export const calculatePolygonAreaMeters = (points: LatLngTuple[], map: Map): number => {
    if (points.length < 3) return 0;
    const containerPoints = points.map(p => map.project(p));
    let area = 0;
    for (let i = 0; i < containerPoints.length; i++) {
        const p1 = containerPoints[i];
        const p2 = containerPoints[(i + 1) % containerPoints.length];
        area += p1.x * p2.y - p2.x * p1.y;
    }
    return Math.abs(area / 2);
};

export const metersToFeet = (meters: number): number => meters * FEET_PER_METER;
export const feetToMeters = (feet: number): number => feet / FEET_PER_METER;

export const metersSqToFeetSq = (metersSq: number): number => {
    return metersSq * (FEET_PER_METER * FEET_PER_METER);
};