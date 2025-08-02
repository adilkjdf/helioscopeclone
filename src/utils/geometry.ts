import { Map } from 'maplibre-gl';
import { FieldSegment, Module } from '../types/project';
import { LatLngTuple } from 'leaflet';
import * as turf from '@turf/turf';
import { Point as TurfPoint, Polygon as TurfPolygon, Feature, Position } from 'geojson';

const FEET_PER_METER = 3.28084;

// Helper to convert LatLngTuple to GeoJSON position
const toLngLat = (point: LatLngTuple): Position => [point[1], point[0]];
const toLatLng = (point: Position): LatLngTuple => [point[1], point[0]];

export const getPolygonCenter = (points: LatLngTuple[]): LatLngTuple => {
    if (points.length === 0) return [0, 0];
    const polygon = turf.polygon([points.map(toLngLat)]);
    const center = turf.centerOfMass(polygon);
    return toLatLng(center.geometry.coordinates);
};

export const calculateDistanceInFeet = (p1: LatLngTuple, p2: LatLngTuple): number => {
  const from = turf.point(toLngLat(p1));
  const to = turf.point(toLngLat(p2));
  const distanceInMeters = turf.distance(from, to, { units: 'meters' });
  return distanceInMeters * FEET_PER_METER;
};

export const getMidpoint = (p1: LatLngTuple, p2: LatLngTuple): LatLngTuple => {
  const from = turf.point(toLngLat(p1));
  const to = turf.point(toLngLat(p2));
  const midpoint = turf.midpoint(from, to);
  return toLatLng(midpoint.geometry.coordinates);
};

export const calculatePolygonArea = (points: LatLngTuple[]): number => {
    if (points.length < 3) return 0;
    const polygon = turf.polygon([[...points.map(toLngLat), toLngLat(points[0])]]);
    const areaMeters = turf.area(polygon);
    return areaMeters * FEET_PER_METER * FEET_PER_METER;
};

export const calculateAdvancedModuleLayout = (
  segment: FieldSegment,
  module: Module,
  map: Map
): { layout: LatLngTuple[][], count: number, nameplate: number, azimuth: number } => {
  // This is a highly complex function. A full port from Leaflet pixel-based logic
  // to a CRS-aware vector logic is a significant undertaking.
  // This simplified version provides a placeholder for the layout logic.
  // A robust implementation would require a dedicated geospatial library and algorithm.
  
  const { points: polygon, azimuth: segmentAzimuth } = segment;
  const { max_power_pmp: modulePower } = module;

  if (polygon.length < 3 || !modulePower) {
    return { layout: [], count: 0, nameplate: 0, azimuth: segment.azimuth };
  }

  // Placeholder: return basic info without a visual layout for now.
  // In a real scenario, this is where the complex module packing algorithm would go.
  const areaSqFeet = calculatePolygonArea(polygon);
  const moduleAreaSqFeet = (module.width || 1) * (module.height || 1.7) * FEET_PER_METER * FEET_PER_METER;
  const estimatedCount = Math.floor(areaSqFeet / (moduleAreaSqFeet * 1.5)); // Estimate with 1.5 spacing factor

  const nameplate = (estimatedCount * modulePower) / 1000;
  return { layout: [], count: estimatedCount, nameplate, azimuth: segmentAzimuth };
};