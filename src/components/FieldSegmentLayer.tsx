import React, { useEffect } from 'react';
import { useMap, Polygon, Marker } from 'react-leaflet';
import { FieldSegment, Module } from '../types/project';
import { calculatePolygonArea, calculateModuleLayout } from '../utils/geometry';
import { divIcon, DragEvent } from 'leaflet';

interface FieldSegmentLayerProps {
  segment: FieldSegment;
  modules: Module[];
  onUpdate: (id: string, updates: Partial<FieldSegment>) => void;
}

const DraggableMarker: React.FC<{ position: any, onDrag: any }> = ({ position, onDrag }) => {
  return (
    <Marker
      position={position}
      draggable={true}
      eventHandlers={{
        drag: (e: DragEvent) => onDrag(e.latlng),
      }}
      icon={divIcon({
        className: 'bg-orange-500 border-2 border-white rounded-full shadow-lg',
        iconSize: [12, 12],
      })}
    />
  );
};

const FieldSegmentLayer: React.FC<FieldSegmentLayerProps> = ({ segment, modules, onUpdate }) => {
  const map = useMap();

  useEffect(() => {
    const area = calculatePolygonArea(segment.points, map);
    if (Math.abs(area - segment.area) > 0.1) {
      onUpdate(segment.id, { area });
    }

    const module = modules.find(m => m.id === segment.moduleId);
    if (module && module.width && module.height) {
      const { layout, count, azimuth } = calculateModuleLayout(segment.points, module.width, module.height, map);
      onUpdate(segment.id, { moduleLayout: layout, moduleCount: count, azimuth });
    } else if (segment.moduleCount > 0) {
      onUpdate(segment.id, { moduleLayout: [], moduleCount: 0 });
    }
  }, [segment.points, segment.moduleId, modules, map, onUpdate, segment.id]);

  const handleMarkerDrag = (index: number, newLatLng: { lat: number, lng: number }) => {
    const newPoints = [...segment.points];
    newPoints[index] = [newLatLng.lat, newLatLng.lng];
    onUpdate(segment.id, { points: newPoints });
  };

  return (
    <>
      <Polygon positions={segment.points} pathOptions={{ color: '#f97316', weight: 2, fillOpacity: 0.1 }} />
      {segment.moduleLayout?.map((modulePolygon, i) => (
        <Polygon key={i} positions={modulePolygon} pathOptions={{ color: '#4f46e5', weight: 1, fillColor: '#6366f1', fillOpacity: 0.7 }} />
      ))}
      {segment.points.map((p, i) => (
        <DraggableMarker key={i} position={p} onDrag={(newLatLng: any) => handleMarkerDrag(i, newLatLng)} />
      ))}
    </>
  );
};

export default FieldSegmentLayer;