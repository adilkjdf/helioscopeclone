import React, { useState, useEffect, useCallback } from 'react';
import { ProjectData, Design, FieldSegment, Module, LngLatTuple } from '../types/project';
import Map, { MapProvider, useMap, Source, Layer, Marker } from 'react-map-gl';
import DesignEditorSidebar from './DesignEditorSidebar';
import { ArrowLeft } from 'lucide-react';
import * as maplibregl from 'maplibre-gl';
import { supabase } from '../integrations/supabase/client';
import { polygon as turfPolygon, area as turfArea } from '@turf/helpers';
import booleanPointInPolygon from '@turf/boolean-point-in-polygon';

const MAPTILER_API_KEY = 'aTChQEvBqKVcP0AXd2bH';

const DesignEditorPage: React.FC<{ project: ProjectData; design: Design; onBack: () => void; }> = ({ project, design, onBack }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawingPoints, setDrawingPoints] = useState<LngLatTuple[]>([]);
  const [fieldSegments, setFieldSegments] = useState<FieldSegment[]>([]);
  const [selectedSegmentId, setSelectedSegmentId] = useState<string | null>(null);
  const [modules, setModules] = useState<Module[]>([]);
  const [isRotating, setIsRotating] = useState(false);
  const [viewState, setViewState] = useState({
    longitude: project.coordinates?.lng || -122.4194,
    latitude: project.coordinates?.lat || 37.7749,
    zoom: 19,
    pitch: 60,
    bearing: 0,
  });

  const selectedSegment = fieldSegments.find(s => s.id === selectedSegmentId) || null;

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
      if (e.key === 'Control' && selectedSegmentId) setIsRotating(true);
      if (e.key === 'Escape' && isDrawing) {
        setIsDrawing(false);
        setDrawingPoints([]);
      }
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
  }, [selectedSegmentId, isDrawing]);

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

  const handleUpdateSegment = useCallback((id: string, updates: Partial<FieldSegment>) => {
    setFieldSegments(currentSegments => {
      const updatedSegments = currentSegments.map(seg => seg.id === id ? { ...seg, ...updates } : seg);
      saveFieldSegments(updatedSegments);
      return updatedSegments;
    });
  }, [saveFieldSegments]);

  const handleDeleteSegment = (id: string) => {
    const updatedSegments = fieldSegments.filter(seg => seg.id !== id);
    setFieldSegments(updatedSegments);
    saveFieldSegments(updatedSegments);
    if (selectedSegmentId === id) {
      setSelectedSegmentId(null);
    }
  };

  return (
    <div className="flex h-full w-full bg-gray-100">
      <DesignEditorSidebar
        design={design}
        isOpen={isSidebarOpen}
        onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
        isDrawing={isDrawing}
        onStartDrawing={() => { setIsDrawing(true); setSelectedSegmentId(null); setDrawingPoints([]); }}
        onStopDrawing={() => { setIsDrawing(false); setDrawingPoints([]); }}
        onClearDrawing={() => setDrawingPoints([])}
        drawingArea={0} // Simplified for now
        modules={modules}
        fieldSegments={fieldSegments}
        selectedSegment={selectedSegment}
        onSelectSegment={(segment) => setSelectedSegmentId(segment?.id || null)}
        onUpdateSegment={handleUpdateSegment}
        onDeleteSegment={handleDeleteSegment}
      />
      <div className="flex-1 relative">
        <div className="absolute top-0 left-0 z-[1000] p-4">
          <button onClick={onBack} className="bg-white/80 backdrop-blur-sm text-gray-800 px-4 py-2 rounded-lg font-semibold hover:bg-white transition-colors flex items-center space-x-2 shadow-md">
            <ArrowLeft className="w-5 h-5" />
            <span>Back to Project</span>
          </button>
        </div>
        <MapProvider>
          <Map
            {...viewState}
            onMove={evt => setViewState(evt.viewState)}
            mapLib={maplibregl}
            style={{ width: '100%', height: '100%' }}
            mapStyle={`https://api.maptiler.com/maps/satellite/style.json?key=${MAPTILER_API_KEY}`}
            maxPitch={85}
            cursor={isDrawing ? 'crosshair' : 'grab'}
            onClick={(e) => {
              if (!isDrawing) return;
              const newPoint: LngLatTuple = [e.lngLat.lng, e.lngLat.lat];
              setDrawingPoints([...drawingPoints, newPoint]);
            }}
          >
            {/* All map-related components go here */}
          </Map>
        </MapProvider>
      </div>
    </div>
  );
};

export default DesignEditorPage;