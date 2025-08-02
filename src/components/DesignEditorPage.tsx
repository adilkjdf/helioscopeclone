import React, { useState, useEffect } from 'react';
import { ProjectData, Design } from '../types/project';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import DesignEditorSidebar from './DesignEditorSidebar';
import { ArrowLeft } from 'lucide-react';
import 'leaflet/dist/leaflet.css';

interface DesignEditorPageProps {
  project: ProjectData;
  design: Design;
  onBack: () => void;
}

const MAPTILER_API_KEY = 'aTChQEvBqKVcP0AXd2bH';

// Helper component to invalidate map size on sidebar toggle
const MapResizer: React.FC<{ isSidebarOpen: boolean }> = ({ isSidebarOpen }) => {
  const map = useMap();
  useEffect(() => {
    // Wait for sidebar animation to complete before resizing
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 300); // Adjust timing to match your sidebar's transition duration

    return () => clearTimeout(timer);
  }, [isSidebarOpen, map]);

  return null;
};

const DesignEditorPage: React.FC<DesignEditorPageProps> = ({ project, design, onBack }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const mapCenter: [number, number] = project.coordinates
    ? [project.coordinates.lat, project.coordinates.lng]
    : [37.7749, -122.4194]; // Default fallback

  return (
    <div className="flex h-full w-full bg-gray-100">
      <DesignEditorSidebar
        design={design}
        isOpen={isSidebarOpen}
        onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
      />
      <div className="flex-1 relative">
        <div className="absolute top-0 left-0 z-[1000] p-4">
          <button
            onClick={onBack}
            className="bg-white/80 backdrop-blur-sm text-gray-800 px-4 py-2 rounded-lg font-semibold hover:bg-white 
                       transition-colors flex items-center space-x-2 shadow-md"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back to Project</span>
          </button>
        </div>
        <MapContainer
          center={mapCenter}
          zoom={19}
          maxZoom={21}
          className="h-full w-full"
          scrollWheelZoom={true}
        >
          <TileLayer
            url={`https://api.maptiler.com/maps/satellite/{z}/{x}/{y}.jpg?key=${MAPTILER_API_KEY}`}
            attribution='&copy; <a href="https://www.maptiler.com/copyright/" target="_blank">MapTiler</a> &copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a> contributors'
          />
          <MapResizer isSidebarOpen={isSidebarOpen} />
          {/* Map features like polygons, markers for modules will go here */}
        </MapContainer>
      </div>
    </div>
  );
};

export default DesignEditorPage;