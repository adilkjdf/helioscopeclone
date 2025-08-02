import { useEffect, useCallback } from 'react';
import { useMap } from 'react-leaflet';
import { getPolygonCenter } from '../utils/geometry';
import { FieldSegment } from '../types/project';
import { latLng } from 'leaflet';

interface RotationHandlerProps {
  segment: FieldSegment;
  onUpdate: (id: string, updates: Partial<FieldSegment>) => void;
}

const RotationHandler: React.FC<RotationHandlerProps> = ({ segment, onUpdate }) => {
  const map = useMap();

  const handleMouseMove = useCallback((e: MouseEvent) => {
    const center = getPolygonCenter(segment.points);
    const centerPoint = map.latLngToContainerPoint(latLng(center));
    const mousePoint = map.mouseEventToContainerPoint(e);
    
    const angleRad = Math.atan2(mousePoint.y - centerPoint.y, mousePoint.x - centerPoint.x);
    const angleDeg = (angleRad * 180 / Math.PI + 360) % 360;
    const azimuth = (450 - angleDeg) % 360;

    onUpdate(segment.id, { azimuth });
  }, [map, segment.id, segment.points, onUpdate]);

  useEffect(() => {
    map.getContainer().addEventListener('mousemove', handleMouseMove);
    return () => {
      map.getContainer().removeEventListener('mousemove', handleMouseMove);
    };
  }, [map, handleMouseMove]);

  return null;
};

export default RotationHandler;