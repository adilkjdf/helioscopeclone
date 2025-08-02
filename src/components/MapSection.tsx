import React, { useRef, useState } from 'react';
import { Map, Marker, MapRef } from 'react-map-gl';
import maplibregl from 'maplibre-gl';
import { MapPin, Map as MapIcon, Satellite } from 'lucide-react';

const MAPTILER_API_KEY = 'aTChQEvBqKVcP0AXd2bH';

interface MapSectionProps {
  address: string;
  coordinates?: { lat: number; lng: number };
  onLocationSelect: (lat: number, lng: number) => void;
  onAddressGeocode: (address: string) => Promise<{ lat: number; lng: number } | null>;
}

const MapSection: React.FC<MapSectionProps> = ({
  address,
  coordinates,
  onLocationSelect,
  onAddressGeocode
}) => {
  const [mapType, setMapType] = useState<'streets' | 'satellite'>('streets');
  const [isLoading, setIsLoading] = useState(false);
  const mapRef = useRef<MapRef>(null);

  const handleCenterOnAddress = async () => {
    if (!address.trim()) return;
    setIsLoading(true);
    try {
      const location = await onAddressGeocode(address);
      if (location && mapRef.current) {
        mapRef.current.flyTo({ center: [location.lng, location.lat], zoom: 16 });
        onLocationSelect(location.lat, location.lng);
      }
    } catch (error) {
      console.error('Geocoding failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getMapStyle = () => {
    const style = mapType === 'satellite' ? 'satellite' : 'streets-v2';
    return `https://api.maptiler.com/maps/${style}/style.json?key=${MAPTILER_API_KEY}`;
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border">
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-gray-800 flex items-center">
            <MapPin className="w-5 h-5 mr-2 text-orange-500" />
            Project Location
          </h3>
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button onClick={() => setMapType('streets')} className={`px-3 py-1 rounded-md text-sm font-medium transition-colors flex items-center ${mapType === 'streets' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}>
              <MapIcon className="w-4 h-4 mr-1" /> Map
            </button>
            <button onClick={() => setMapType('satellite')} className={`px-3 py-1 rounded-md text-sm font-medium transition-colors flex items-center ${mapType === 'satellite' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}>
              <Satellite className="w-4 h-4 mr-1" /> Satellite
            </button>
          </div>
        </div>
        <div className="text-sm text-gray-600 mb-3">Click on the map to select your project location or use the button below to center on the address.</div>
        <button onClick={handleCenterOnAddress} disabled={!address.trim() || isLoading} className="w-full sm:w-auto px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors text-sm font-medium">
          {isLoading ? 'Locating...' : 'Center Map on Address'}
        </button>
      </div>
      <div className="relative h-80 sm:h-96">
        <Map
          ref={mapRef}
          initialViewState={{
            longitude: coordinates?.lng || -122.4194,
            latitude: coordinates?.lat || 37.7749,
            zoom: coordinates ? 16 : 10
          }}
          style={{ width: '100%', height: '100%' }}
          mapStyle={getMapStyle()}
          mapLib={maplibregl}
          onClick={(e) => onLocationSelect(e.lngLat.lat, e.lngLat.lng)}
        >
          {coordinates && <Marker longitude={coordinates.lng} latitude={coordinates.lat} color="#f97316" />}
        </Map>
      </div>
    </div>
  );
};

export default MapSection;