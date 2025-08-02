import { Map, latLng, LatLngTuple, Point, bounds } from 'leaflet';

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

export const calculateModuleLayout = (
  polygon: LatLngTuple[],
  moduleWidth: number,
  moduleHeight: number,
  map: Map
): { layout: LatLngTuple[][], count: number, azimuth: number } => {
  if (polygon.length < 3 || !moduleWidth || !moduleHeight) return { layout: [], count: 0, azimuth: 0 };

  const projectedPolygon = polygon.map(p => map.project(latLng(p)));

  let longestEdgeIndex = 0;
  let maxDist = 0;
  for (let i = 0; i < projectedPolygon.length; i++) {
    const p1 = projectedPolygon[i];
    const p2 = projectedPolygon[(i + 1) % projectedPolygon.length];
    const dist = p1.distanceTo(p2);
    if (dist > maxDist) {
      maxDist = dist;
      longestEdgeIndex = i;
    }
  }

  const p1 = projectedPolygon[longestEdgeIndex];
  const p2 = projectedPolygon[(longestEdgeIndex + 1) % projectedPolygon.length];
  const angle = Math.atan2(p2.y - p1.y, p2.x - p1.x);
  const azimuth = (90 - angle * 180 / Math.PI + 360) % 360;

  const cos = Math.cos(-angle);
  const sin = Math.sin(-angle);
  const rotatedPolygon = projectedPolygon.map(p => new Point(
    p.x * cos - p.y * sin,
    p.x * sin + p.y * cos
  ));

  const rotatedBounds = bounds(rotatedPolygon);
  const moduleLayout: LatLngTuple[][] = [];

  const moduleWidthProjected = moduleWidth / map.options.crs!.scale(map.getZoom());
  const moduleHeightProjected = moduleHeight / map.options.crs!.scale(map.getZoom());

  for (let y = rotatedBounds.min!.y; y < rotatedBounds.max!.y; y += moduleHeightProjected) {
    for (let x = rotatedBounds.min!.x; x < rotatedBounds.max!.x; x += moduleWidthProjected) {
      const moduleCenter = new Point(x + moduleWidthProjected / 2, y + moduleHeightProjected / 2);
      if (isPointInPolygon(moduleCenter, rotatedPolygon)) {
        const modulePoints = [
          new Point(x, y),
          new Point(x + moduleWidthProjected, y),
          new Point(x + moduleWidthProjected, y + moduleHeightProjected),
          new Point(x, y + moduleHeightProjected),
        ];
        const cos_a = Math.cos(angle);
        const sin_a = Math.sin(angle);
        const originalPoints = modulePoints.map(p => new Point(
          p.x * cos_a - p.y * sin_a,
          p.x * sin_a + p.y * cos_a
        ));
        moduleLayout.push(originalPoints.map(p => {
          const latLng = map.unproject(p);
          return [latLng.lat, latLng.lng];
        }));
      }
    }
  }

  return { layout: moduleLayout, count: moduleLayout.length, azimuth };
};