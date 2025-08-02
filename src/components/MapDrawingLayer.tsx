import React, { useState, useEffect, useCallback } from 'react';
import { useMap, Polygon, Polyline, CircleMarker, Marker } from 'react-leaflet';
import { LatLngTuple, divIcon } from 'leaflet';
import { calculateDistanceInFeet, getMidpoint, getSnappedPoint } from '../utils/geometry';

interface MapDrawingLayerProps {
  points: LatLngTuple[];
  onPointsChange: (points: LatLngTuple[]) => void;
}

const MapDrawingLayer: React.FC<MapDrawingLayerProps> = ({ points, onPointsChange }) => {
  const map = useMap();
  const [mousePos, setMousePos] = useState<LatLngTuple | null>(null);
  const [isShiftPressed, setIsShiftPressed] = useState(false);

  useEffect(() => {
    map.getContainer().style.cursor = 'crosshair';
    return () => {
      map.getContainer().style.cursor = '';
    };
  }, [map]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Shift') setIsShiftPressed(true);
    if (e.key === 'Escape') onPointsChange([]);
  }, [onPointsChange]);

  const handleKeyUp = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Shift') setIsShiftPressed(false);
  }, []);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('keyup', handleKeyUp);
    };
  }, [handleKeyDown, handleKeyUp]);

  map.on('mousemove', (e) => {
    setMousePos([e.latlng.lat, e.latlng.lng]);
  });

  map.on('click', (e) => {
    let newPoint: LatLngTuple = [e.latlng.lat, e.latlng.lng];
    if (isShiftPressed && points.length > 0) {
      newPoint = getSnappedPoint(points[points.length - 1], newPoint, map);
    }
    onPointsChange([...points, newPoint]);
  });

  const ghostLinePoints: LatLngTuple[] = [];
  if (points.length > 0 && mousePos) {
    const lastPoint = points[points.length - 1];
    const dynamicPoint = isShiftPressed ? getSnappedPoint(lastPoint, mousePos, map) : mousePos;
    ghostLinePoints.push(lastPoint, dynamicPoint);
  }

  const renderMarkerForSegment = (p1: LatLngTuple, p2: LatLngTuple) => {
    const length = calculateDistanceInFeet(p1, p2, map);
    const midpoint = getMidpoint(p1, p2);
    const icon = divIcon({
        className: 'leaflet-div-icon-transparent',
        html: `<div class="bg-black text-white text-xs font-bold px-2 py-1 rounded-md shadow-lg">${length.toFixed(1)} ft</div>`
    });
    return <Marker key={`${p1.toString()}-${p2.toString()}`} position={midpoint} icon={icon} />;
  };

  return (
    <>
      {points.length > 0 && (
        <Polygon positions={points} pathOptions={{ color: '#f97316', weight: 3, fillOpacity: 0.1 }} />
      )}
      {ghostLinePoints.length > 0 && (
        <Polyline positions={ghostLinePoints} pathOptions={{ color: '#f97316', weight: 3, dashArray: '5, 10' }} />
      )}
      {points.map((point, index) => (
        <CircleMarker key={index} center={point} radius={5} pathOptions={{ color: 'white', fillColor: '#f97316', fillOpacity: 1, weight: 2 }} />
      ))}
      {points.slice(0, -1).map((p, i) => renderMarkerForSegment(p, points[i+1]))}
      {ghostLinePoints.length === 2 && renderMarkerForSegment(ghostLinePoints[0], ghostLinePoints[1])}
    </>
  );
};

export default MapDrawingLayer;