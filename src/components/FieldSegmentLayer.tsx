import React, { useEffect } from 'react';
import { useMap, Polygon, Marker } from 'react-leaflet';
import { FieldSegment, Module } from '../types/project';
import { calculatePolygonArea, calculateAdvancedModuleLayout, calculateDistanceInFeet, getMidpoint } from '../utils/geometry';
import { divIcon, LeafletEvent, LatLngTuple } from 'leaflet';

interface FieldSegmentLayerProps {
  segment: FieldSegment;
  modules: Module[];
  onUpdate: (id: string, updates: Partial<FieldSegment>) => void;
  onSelect: () => void;
}

const DraggableMarker: React.FC<{ position: any, onDrag: any }> = ({ position, onDrag }) => {
  return (
    <Marker
      position={position}
      draggable={true}
      eventHandlers={{
        drag: (e: LeafletEvent) => onDrag(e.target.getLatLng()),
      }}
      icon={divIcon({
        className: 'bg-orange-500 border-2 border-white rounded-full shadow-lg',
        iconSize: [12, 12],
      })}
    />
  );
};

const FieldSegmentLayer: React.FC<FieldSegmentLayerProps> = ({ segment, modules, onUpdate, onSelect }) => {
  const map = useMap();

  useEffect(() => {
    const area = calculatePolygonArea(segment.points, map);
    const module = modules.find(m => m.id === segment.moduleId);

    if (module) {
      const { layout, count, nameplate, azimuth } = calculateAdvancedModuleLayout(segment, module, map);
      onUpdate(segment.id, { area, moduleLayout: layout, moduleCount: count, nameplate, azimuth });
    } else if (segment.moduleCount > 0 || segment.moduleLayout?.length) {
      onUpdate(segment.id, { area, moduleLayout: [], moduleCount: 0, nameplate: 0 });
    } else {
      if (Math.abs(area - segment.area) > 0.1) {
        onUpdate(segment.id, { area });
      }
    }
  }, [segment, modules, map, onUpdate]);

  const handleMarkerDrag = (index: number, newLatLng: { lat: number, lng: number }) => {
    const newPoints = [...segment.points];
    newPoints[index] = [newLatLng.lat, newLatLng.lng];
    onUpdate(segment.id, { points: newPoints });
  };

  const renderLengthMarker = (p1: LatLngTuple, p2: LatLngTuple) => {
    const length = calculateDistanceInFeet(p1, p2, map);
    const midpoint = getMidpoint(p1, p2);
    const icon = divIcon({
      className: 'leaflet-div-icon-transparent',
      html: `<div class="text-white text-sm font-bold" style="text-shadow: 0 0 3px black, 0 0 3px black;">${length.toFixed(1)} ft</div>`
    });
    return <Marker key={`length-${p1.toString()}-${p2.toString()}`} position={midpoint} icon={icon} />;
  };

  return (
    <>
      <Polygon 
        positions={segment.points} 
        pathOptions={{ color: '#ca8a04', weight: 2, fillColor: '#fde047', fillOpacity: 0.3 }} 
        eventHandlers={{ click: onSelect }}
      />
      {segment.moduleLayout?.map((modulePolygon, i) => (
        <Polygon key={i} positions={modulePolygon} pathOptions={{ color: 'white', weight: 1, fillColor: '#3b82f6', fillOpacity: 0.8 }} />
      ))}
      {segment.points.map((p, i) => (
        <DraggableMarker key={i} position={p} onDrag={(newLatLng: any) => handleMarkerDrag(i, newLatLng)} />
      ))}
      {segment.points.map((p1, i) => {
        const p2 = segment.points[(i + 1) % segment.points.length];
        return renderLengthMarker(p1, p2);
      })}
    </>
  );
};

export default FieldSegmentLayer;