import React, { useState, useEffect, useCallback } from 'react';
import { ProjectData, Design, FieldSegment, Module } from '../types/project';
import { Map, MapRef, Source, Layer, NavigationControl, FullscreenControl } from 'react-map-gl';
import maplibregl from 'maplibre-gl';
import DesignEditorSidebar from './DesignEditorSidebar';
import { ArrowLeft } from 'lucide-react';
import { LatLngTuple } from 'leaflet';
import { supabase } from '../integrations/supabase/client';
import * as turf from '@turf/turf';
import { Feature, Position } from 'geojson';

interface DesignEditorPageProps {
  project: ProjectData;
  design: Design;
  onBack: () => void;
}

const MAPTILER_API_KEY = 'aTChQEvBqKVcP0AXd2bH';
const MAP_STYLE = `https://api.maptiler.com/maps/satellite/style.json?key=${MAPTILER_API_KEY}`;

const DesignEditorPage: React.FC<DesignEditorPageProps> = ({ project, design, onBack }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawingPoints, setDrawingPoints] = useState<LatLngTuple[]>([]);
  const [drawingArea, setDrawingArea] = useState(0);
  const [fieldSegments, setFieldSegments] = useState<FieldSegment[]>([]);
  const [selectedSegment, setSelectedSegment] = useState<FieldSegment | null>(null);
  const [modules, setModules] = useState<Module[]>([]);
  const [isRotating, setIsRotating] = useState(false);
  const mapRef = React.useRef<MapRef>(null);

  const [viewState, setViewState] = useState({
    longitude: project.coordinates?.lng || -122.4194,
    latitude: project.coordinates?.lat || 37.7749,
    zoom: 18,
    pitch: 45,
    bearing: 0
  });

  useEffect(() => {
    setFieldSegments(design.field_segments || []);
  }, [design]);

  useEffect(() => {
    const fetchModules = async () => {
      const { data, error } = await supabase.from('modules').select('*');
      if (error) console.error('Error fetching modules:', error);
      else setModules(data || []);
    };
    fetchModules();
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Control' && selectedSegment) setIsRotating(true);
      if (e.key === 'Escape' && isDrawing) handleClearDrawing();
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'Control') setIsRotating(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [selectedSegment, isDrawing]);

  const saveFieldSegments = useCallback(async (segmentsToSave: FieldSegment[]) => {
    try {
      const { error } = await supabase
        .from('designs')
        .update({ field_segments: segmentsToSave, last_modified: new Date().toISOString() })
        .eq('id', design.id);
      if (error) console.error('Error saving field segments:', error);
    } catch (error) {
      console.error('Failed to save field segments:', error);
    }
  }, [design.id]);

  const handleStartDrawing = () => {
    setIsDrawing(true);
    setSelectedSegment(null);
    setDrawingPoints([]);
  };

  const handleStopDrawing = () => {
    setIsDrawing(false);
    if (drawingPoints.length > 2) {
      const newSegment: FieldSegment = {
        id: new Date().toISOString(),
        points: drawingPoints,
        area: 0, nameplate: 0, moduleCount: 0, azimuth: 180,
        description: `Field Segment ${fieldSegments.length + 1}`,
        rackingType: 'Fixed Tilt', moduleTilt: 10, orientation: 'Portrait',
        rowSpacing: 2, moduleSpacing: 0.041, setback: 0, surfaceHeight: 0,
        rackingHeight: 0, frameSizeUp: 1, frameSizeWide: 1, frameSpacing: 0,
        spanRise: 0, alignment: 'center',
      };
      const updatedSegments = [...fieldSegments, newSegment];
      setFieldSegments(updatedSegments);
      saveFieldSegments(updatedSegments);
      setSelectedSegment(newSegment);
    }
    setDrawingPoints([]);
  };

  const handleClearDrawing = () => setDrawingPoints([]);

  const handleUpdateSegment = useCallback((id: string, updates: Partial<FieldSegment>) => {
    setFieldSegments(currentSegments => {
      const updatedSegments = currentSegments.map(seg => seg.id === id ? { ...seg, ...updates } : seg);
      saveFieldSegments(updatedSegments);
      if (selectedSegment?.id === id) {
        setSelectedSegment(updatedSegments.find(s => s.id === id) || null);
      }
      return updatedSegments;
    });
  }, [saveFieldSegments, selectedSegment?.id]);

  const handleDeleteSegment = (id: string) => {
    const updatedSegments = fieldSegments.filter(seg => seg.id !== id);
    setFieldSegments(updatedSegments);
    saveFieldSegments(updatedSegments);
    if (selectedSegment?.id === id) setSelectedSegment(null);
  };

  const handleMapClick = (e: maplibregl.MapMouseEvent) => {
    if (!isDrawing) return;
    const { lng, lat } = e.lngLat;
    setDrawingPoints(prev => [...prev, [lat, lng]]);
  };

  const toGeoJSON = (points: LatLngTuple[], type: 'LineString' | 'Polygon'): Feature => ({
    type: 'Feature',
    geometry: {
      type,
      coordinates: type === 'Polygon' ? [[...points.map(p => [p[1], p[0]]), [points[0][1], points[0][0]]]] : points.map(p => [p[1], p[0]]),
    },
    properties: {},
  });

  return (
    <div className="flex h-full w-full bg-gray-100">
      <DesignEditorSidebar
        design={design} isOpen={isSidebarOpen} onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
        isDrawing={isDrawing} onStartDrawing={handleStartDrawing} onStopDrawing={handleStopDrawing}
        onClearDrawing={handleClearDrawing} drawingArea={drawingArea} modules={modules}
        fieldSegments={fieldSegments} selectedSegment={selectedSegment} onSelectSegment={setSelectedSegment}
        onUpdateSegment={handleUpdateSegment} onDeleteSegment={handleDeleteSegment}
      />
      <div className="flex-1 relative">
        <div className="absolute top-0 left-0 z-20 p-4">
          <button onClick={onBack} className="bg-white/80 backdrop-blur-sm text-gray-800 px-4 py-2 rounded-lg font-semibold hover:bg-white transition-colors flex items-center space-x-2 shadow-md">
            <ArrowLeft className="w-5 h-5" />
            <span>Back to Project</span>
          </button>
        </div>
        <Map
          {...viewState}
          ref={mapRef}
          onMove={evt => setViewState(evt.viewState)}
          style={{ width: '100%', height: '100%' }}
          mapStyle={MAP_STYLE}
          mapLib={maplibregl}
          onClick={handleMapClick}
          cursor={isDrawing ? 'crosshair' : 'grab'}
        >
          <FullscreenControl />
          <NavigationControl position="top-right" />
          
          {isDrawing && drawingPoints.length > 0 && (
            <Source id="drawing-source" type="geojson" data={toGeoJSON(drawingPoints, 'LineString')}>
              <Layer id="drawing-line" type="line" paint={{ 'line-color': '#f97316', 'line-width': 3 }} />
              <Layer id="drawing-points" type="circle" paint={{ 'circle-radius': 5, 'circle-color': '#f97316' }} />
            </Source>
          )}

          {fieldSegments.map(segment => (
            <Source key={segment.id} id={`segment-${segment.id}`} type="geojson" data={toGeoJSON(segment.points, 'Polygon')}>
              <Layer id={`segment-fill-${segment.id}`} type="fill" paint={{ 'fill-color': '#f97316', 'fill-opacity': 0.2 }} />
              <Layer id={`segment-outline-${segment.id}`} type="line" paint={{ 'line-color': selectedSegment?.id === segment.id ? '#f59e0b' : '#ca8a04', 'line-width': 3 }} />
            </Source>
          ))}
        </Map>
      </div>
    </div>
  );
};

export default DesignEditorPage;