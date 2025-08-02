import React, { useState, useEffect } from 'react';
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
  const [modules, setModules] = useState<Module[]>([]);

  useEffect(() => {
    const fetchModules = async () => {
      const { data, error } = await supabase.from('modules').select('*');
      if (error) console.error('Error fetching modules:', error);
      else setModules(data || []);
    };
    fetchModules();
  }, []);

  const handleStartDrawing = () => {
    setIsDrawing(true);
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
        azimuth: 0,
      };
      setFieldSegments(prev => [...prev, newSegment]);
    }
    setDrawingPoints([]);
  };

  const handleClearDrawing = () => setDrawingPoints([]);

  const handleUpdateSegment = (id: string, updates: Partial<FieldSegment>) => {
    setFieldSegments(prev => prev.map(seg => seg.id === id ? { ...seg, ...updates } : seg));
  };

  const handleDeleteSegment = (id: string) => {
    setFieldSegments(prev => prev.filter(seg => seg.id !== id));
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
            <FieldSegmentLayer key={segment.id} segment={segment} modules={modules} onUpdate={handleUpdateSegment} />
          ))}
        </MapContainer>
      </div>
    </div>
  );
};

export default DesignEditorPage;