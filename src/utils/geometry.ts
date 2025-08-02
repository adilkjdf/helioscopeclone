import { Map, latLng, LatLngTuple, Point, bounds } from 'leaflet';
import { FieldSegment, Module } from '../types/project';

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

  const snappedLatLng = map.containerPointToLatLng(new Point(snappedContainerPoint.x, snappedContainerPoint.y));
  return [snappedLatLng.lat, snappedLatLng.lng];
};

export const calculatePolygonAreaMeters = (points: LatLngTuple[], map: Map): number => {
  if (points.length < 3) return 0;
  const projectedPoints = points.map(p => map.project(latLng(p)));
  let area = 0;
  for (let i = 0; i < projectedPoints.length; i++) {
    const p1 = projectedPoints[i];
    const p2 = projectedPoints[(i + 1) % projectedPoints.length];
    area += p1.x * p2.y - p2.x * p1.y;
  }
  return Math.abs(area / 2);
};

export const calculatePolygonArea = (points: LatLngTuple[], map: Map): number => {
    const areaMeters = calculatePolygonAreaMeters(points, map);
    return areaMeters * FEET_PER_METER * FEET_PER_METER;
};

const isPointInPolygon = (point: Point, polygon: Point[]): boolean => {
    let isInside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
        const xi = polygon[i].x, yi = polygon[i].y;
        const xj = polygon[j].x, yj = polygon[j].y;
        const intersect = ((yi > point.y) !== (yj > point.y))
            && (point.x < (xj - xi) * (point.y - yi) / (yj - yi) + xi);
        if (intersect) isInside = !isInside;
    }
    return isInside;
};

export const calculateAdvancedModuleLayout = (
  segment: FieldSegment,
  module: Module,
  map: Map
): { layout: LatLngTuple[][], count: number, nameplate: number, azimuth: number } => {
  const {
    points: polygon,
    orientation = 'Landscape',
    azimuth: segmentAzimuth,
    rowSpacing = 2,
    moduleSpacing = 0.1,
  } = segment;

  const { width: moduleWidthMeters, height: moduleHeightMeters, max_power_pmp: modulePower } = module;

  if (polygon.length < 3 || !moduleWidthMeters || !moduleHeightMeters || !modulePower) {
    return { layout: [], count: 0, nameplate: 0, azimuth: segment.azimuth };
  }

  const layerPolygon = polygon.map(p => map.latLngToLayerPoint(latLng(p)));

  let longestEdgeIndex = -1, maxDistSq = 0;
  for (let i = 0; i < layerPolygon.length; i++) {
    const p1 = layerPolygon[i];
    const p2 = layerPolygon[(i + 1) % layerPolygon.length];
    const distSq = p1.distanceTo(p2);
    if (distSq > maxDistSq) {
      maxDistSq = distSq;
      longestEdgeIndex = i;
    }
  }

  const p1 = layerPolygon[longestEdgeIndex];
  const p2 = layerPolygon[(longestEdgeIndex + 1) % layerPolygon.length];
  const defaultAngleRad = Math.atan2(p2.y - p1.y, p2.x - p1.x);
  const defaultAzimuth = (90 - defaultAngleRad * 180 / Math.PI + 360) % 360;
  
  const finalAzimuth = segmentAzimuth ?? defaultAzimuth;
  const angle = (90 - finalAzimuth) * (Math.PI / 180);

  const cos = Math.cos(-angle), sin = Math.sin(-angle);
  const origin = layerPolygon[0];
  const rotatedPolygon = layerPolygon.map(p => new Point(
    (p.x - origin.x) * cos - (p.y - origin.y) * sin,
    (p.x - origin.x) * sin + (p.y - origin.y) * cos
  ));

  const rotatedBounds = bounds(rotatedPolygon);
  
  const center = map.getCenter();
  const pA = map.latLngToLayerPoint(center);
  const pB = map.latLngToLayerPoint(map.getBounds().getNorthEast());
  const distMeters = map.distance(center, map.getBounds().getNorthEast());
  const distPixels = pA.distanceTo(pB);
  const pixelsPerMeter = distPixels / distMeters;

  const moduleWidth = orientation === 'Landscape' ? moduleHeightMeters : moduleWidthMeters;
  const moduleHeight = orientation === 'Landscape' ? moduleWidthMeters : moduleHeightMeters;

  const moduleWidthPx = moduleWidth * pixelsPerMeter;
  const moduleHeightPx = moduleHeight * pixelsPerMeter;
  const rowSpacingPx = (rowSpacing / FEET_PER_METER) * pixelsPerMeter;
  const moduleSpacingPx = (moduleSpacing / FEET_PER_METER) * pixelsPerMeter;

  const stepX = moduleWidthPx + moduleSpacingPx;
  const stepY = moduleHeightPx + rowSpacingPx;

  const moduleLayout: LatLngTuple[][] = [];
  let count = 0;

  for (let y = rotatedBounds.min!.y; y < rotatedBounds.max!.y; y += stepY) {
    for (let x = rotatedBounds.min!.x; x < rotatedBounds.max!.x; x += stepX) {
      const moduleCenter = new Point(x + moduleWidthPx / 2, y + moduleHeightPx / 2);
      if (isPointInPolygon(moduleCenter, rotatedPolygon)) {
        const modulePoints = [
          new Point(x, y), new Point(x + moduleWidthPx, y),
          new Point(x + moduleWidthPx, y + moduleHeightPx), new Point(x, y + moduleHeightPx),
        ];
        const cos_a = Math.cos(angle), sin_a = Math.sin(angle);
        const originalPoints = modulePoints.map(p => {
          const rotatedX = p.x * cos_a - p.y * sin_a;
          const rotatedY = p.x * sin_a + p.y * cos_a;
          return new Point(rotatedX + origin.x, rotatedY + origin.y);
        });
        moduleLayout.push(originalPoints.map(p => {
          const latLng = map.layerPointToLatLng(p);
          return [latLng.lat, latLng.lng];
        }));
        count++;
      }
    }
  }

  const nameplate = (count * modulePower) / 1000;
  return { layout: moduleLayout, count, nameplate, azimuth: finalAzimuth };
};