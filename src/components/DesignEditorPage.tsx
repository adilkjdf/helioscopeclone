import React, { useState } from 'react';
import { ProjectData, Design } from '../types/project';
import { MapContainer, TileLayer } from 'react-leaflet';
import DesignEditorSidebar from './DesignEditorSidebar';
import { ArrowLeft } from 'lucide-react';
import 'leaflet/dist/leaflet.css';

interface DesignEditorPageProps {
  project: ProjectData;
  design: Design;
  onBack: () => void;
}

const MAPTILER_API_KEY = 'aTChQEvBqKVcP0AXd2bH';

const DesignEditorPage: React.FC<DesignEditorPageProps> = ({ project, design, onBack }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const mapCenter: [number, number] = project.coordinates
    ? [project.coordinates.lat, project.coordinates.lng]
    : [37.7749, -122.4194]; // Default fallback

  return (
    <div className="flex h-screen bg-gray-100">
      <DesignEditorSidebar
        design={design}
        isOpen={isSidebarOpen}
        onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
      />
      <main className="flex-1 flex flex-col relative">
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
        <div className="flex-1 h-full">
          <MapContainer
            center={mapCenter}
            zoom={19}
            maxZoom={22}
            className="h-full w-full"
            scrollWheelZoom={true}
          >
            <TileLayer
              url={`https://api.maptiler.com/maps/satellite/{z}/{x}/{y}.jpg?key=${MAPTILER_API_KEY}`}
              attribution='&copy; <a href="https://www.maptiler.com/copyright/" target="_blank">MapTiler</a> &copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a> contributors'
            />
            {/* Map features like polygons, markers for modules will go here */}
          </MapContainer>
        </div>
      </main>
    </div>
  );
};

export default DesignEditorPage;