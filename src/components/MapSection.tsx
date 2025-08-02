import React, { useRef, useState } from 'react';
import Map, { Marker, MapRef } from 'react-map-gl';
import { MapPin, Map as MapIcon, Satellite } from 'lucide-react';
import * as maplibregl from 'maplibre-gl';

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
  const [mapStyle, setMapStyle] = useState<'streets' | 'satellite'>('streets');
  const [isLoading, setIsLoading] = useState(false);
  const mapRef = useRef<MapRef>(null);

  const defaultCenter = { lat: 37.7749, lng: -122.4194 };
  const mapCenter = coordinates || defaultCenter;

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

  const getMapStyleUrl = () => {
    const style = mapStyle === 'satellite' ? 'satellite' : 'streets-v2';
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
            <button
              onClick={() => setMapStyle('streets')}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors flex items-center ${
                mapStyle === 'streets'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <MapIcon className="w-4 h-4 mr-1" />
              Map
            </button>
            <button
              onClick={() => setMapStyle('satellite')}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors flex items-center ${
                mapStyle === 'satellite'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Satellite className="w-4 h-4 mr-1" />
              Satellite
            </button>
          </div>
        </div>
        
        <div className="text-sm text-gray-600 mb-3">
          Click on the map to select your project location or use the button below to center on the address.
        </div>
        
        <button
          onClick={handleCenterOnAddress}
          disabled={!address.trim() || isLoading}
          className="w-full sm:w-auto px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 
                     disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors text-sm font-medium"
        >
          {isLoading ? 'Locating...' : 'Center Map on Address'}
        </button>
      </div>

      <div className="relative">
        <div className="h-80 sm:h-96 relative z-0">
          <Map
            ref={mapRef}
            mapLib={maplibregl}
            initialViewState={{
              longitude: mapCenter.lng,
              latitude: mapCenter.lat,
              zoom: coordinates ? 16 : 10,
            }}
            style={{ width: '100%', height: '100%' }}
            mapStyle={getMapStyleUrl()}
            onClick={(e) => onLocationSelect(e.lngLat.lat, e.lngLat.lng)}
          >
            {coordinates && (
              <Marker longitude={coordinates.lng} latitude={coordinates.lat} />
            )}
          </Map>
        </div>
        
        {coordinates && (
          <div className="absolute top-2 left-2 bg-white/90 backdrop-blur-sm px-3 py-2 rounded-lg shadow-sm text-xs">
            <div className="font-medium text-gray-800">Selected Location:</div>
            <div className="text-gray-600">
              {coordinates.lat.toFixed(4)}, {coordinates.lng.toFixed(4)}
            </div>
          </div>
        )}
        
        <div className="absolute bottom-2 left-2 bg-white/90 backdrop-blur-sm px-2 py-1 rounded text-xs text-gray-600">
          Map powered by MapTiler
        </div>
      </div>
    </div>
  );
};

export default MapSection;