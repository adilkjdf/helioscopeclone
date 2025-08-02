import React, { useState, useEffect, useCallback } from 'react';
import { ProjectData, Design, FieldSegment, Module } from '../types/project';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import DesignEditorSidebar from './DesignEditorSidebar';
import MapDrawingLayer from './MapDrawingLayer';
import FieldSegmentLayer from './FieldSegmentLayer';
import { ArrowLeft } from 'lucide-react';
import 'leaflet/dist/leaflet.css';
import { LatLngTuple } from 'leaflet';
import { supabase } from '../integrations/supabase/client';

interface DesignEditorPageProps {
  project: ProjectData;
  design: Design;
  onBack: () => void;
}

const MAPTILER_API_KEY = 'aTChQEvBqKVcP0AXd2bH';

const MapResizer: React.FC<{ isSidebarOpen: boolean }> = ({ isSidebarOpen }) => {
  const map = useMap();
  useEffect(() => {
    const timer = setTimeout(() => { map.invalidateSize(); }, 300);
    return () => clearTimeout(timer);
  }, [isSidebarOpen, map]);
  return null;
};

const DesignEditorPage: React.FC<DesignEditorPageProps> = ({ project, design, onBack }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawingPoints, setDrawingPoints] = useState<LatLngTuple[]>([]);
  const [drawingArea, setDrawingArea] = useState(0);
  const [fieldSegments, setFieldSegments] = useState<FieldSegment[]>([]);
  const [selectedSegment, setSelectedSegment] = useState<FieldSegment | null>(null);
  const [modules, setModules] = useState<Module[]>([]);
  const [isRotating, setIsRotating] = useState(false);

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
      if (e.key === 'Control' && selectedSegment) {
        setIsRotating(true);
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'Control') {
        setIsRotating(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [selectedSegment]);

  const saveFieldSegments = async (segmentsToSave: FieldSegment[]) => {
    try {
      const { error } = await supabase
        .from('designs')
        .update({ field_segments: segmentsToSave, last_modified: new Date().toISOString() })
        .eq('id', design.id);

      if (error) {
        console.error('Error saving field segments:', error);
      }
    } catch (error) {
      console.error('Failed to save field segments:', error);
    }
  };

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
        area: 0,
        nameplate: 0,
        moduleCount: 0,
        azimuth: 180,
        description: `Field Segment ${fieldSegments.length + 1}`,
        rackingType: 'Fixed Tilt',
        moduleTilt: 10,
        orientation: 'Portrait',
        rowSpacing: 2,
        moduleSpacing: 0.041,
        setback: 0,
        surfaceHeight: 0,
        rackingHeight: 0,
        frameSizeUp: 1,
        frameSizeWide: 1,
        frameSpacing: 0,
        spanRise: 0,
        alignment: 'center',
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
        
        setSelectedSegment(currentSelected => {
            if (currentSelected?.id === id) {
                return updatedSegments.find(seg => seg.id === id) || null;
            }
            return currentSelected;
        });

        return updatedSegments;
    });
  }, [design.id]);

  const handleDeleteSegment = (id: string) => {
    const updatedSegments = fieldSegments.filter(seg => seg.id !== id);
    setFieldSegments(updatedSegments);
    saveFieldSegments(updatedSegments);
    if (selectedSegment?.id === id) {
      setSelectedSegment(null);
    }
  };

  const mapCenter: [number, number] = project.coordinates ? [project.coordinates.lat, project.coordinates.lng] : [37.7749, -122.4194];

  return (
    <div className="flex h-full w-full bg-gray-100">
      <DesignEditorSidebar
        design={design}
        isOpen={isSidebarOpen}
        onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
        isDrawing={isDrawing}
        onStartDrawing={handleStartDrawing}
        onStopDrawing={handleStopDrawing}
        onClearDrawing={handleClearDrawing}
        drawingArea={drawingArea}
        modules={modules}
        fieldSegments={fieldSegments}
        selectedSegment={selectedSegment}
        onSelectSegment={setSelectedSegment}
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
        <MapContainer center={mapCenter} zoom={19} maxZoom={24} className="h-full w-full" scrollWheelZoom={true} doubleClickZoom={false}>
          <TileLayer url={`https://api.maptiler.com/maps/satellite/{z}/{x}/{y}.jpg?key=${MAPTILER_API_KEY}`} attribution='&copy; <a href="https://www.maptiler.com/copyright/" target="_blank">MapTiler</a> &copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a> contributors' maxNativeZoom={20} maxZoom={24} />
          <MapResizer isSidebarOpen={isSidebarOpen} />
          
          {isDrawing && (
            <MapDrawingLayer 
              points={drawingPoints} 
              onPointsChange={setDrawingPoints} 
              onShapeComplete={handleStopDrawing}
              onAreaChange={setDrawingArea}
            />
          )}

          {fieldSegments.map(segment => (
            <FieldSegmentLayer 
              key={segment.id} 
              segment={segment} 
              modules={modules} 
              onUpdate={handleUpdateSegment}
              onSelect={() => setSelectedSegment(segment)}
              isSelected={selectedSegment?.id === segment.id}
              isRotating={isRotating && selectedSegment?.id === segment.id}
            />
          ))}
        </MapContainer>
      </div>
    </div>
  );
};

export default DesignEditorPage;