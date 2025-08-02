import { LatLngTuple } from 'leaflet';

export interface Design {
  id: string;
  created_at?: string;
  project_id?: string;
  name: string;
  lastModified: Date;
  nameplate: string;
}

export interface ProjectData {
  id?: string;
  created_at?: string;
  projectName: string;
  description: string;
  address: string;
  projectType: 'Residential' | 'Commercial' | 'Industrial';
  coordinates?: {
    lat: number;
    lng: number;
  };
}

export interface ValidationErrors {
  [key: string]: string;
}

export interface MapSettings {
  center: [number, number];
  zoom: number;
}

export interface PanFile {
  [key:string]: string | number;
}

export interface Module {
  id: string;
  created_at: string;
  model_name: string;
  manufacturer?: string;
  technology?: string;
  max_power_pmp?: number;
  raw_pan_data?: PanFile;
  width?: number;  // in meters
  height?: number; // in meters
  voc?: number;
  isc?: number;
  vmp?: number;
  imp?: number;
}

export interface FieldSegment {
  id: string;
  points: LatLngTuple[];
  area: number; // in sq feet
  nameplate: number; // in kW
  moduleCount: number;
  moduleId?: string;
  moduleLayout?: LatLngTuple[][]; // Array of polygons for each module
  azimuth: number; // For orientation
  
  // New properties
  description?: string;
  rackingType?: 'Fixed Tilt' | 'Flush Mount';
  moduleTilt?: number;
  orientation?: 'Portrait' | 'Landscape';
  rowSpacing?: number;
  moduleSpacing?: number;
  setback?: number;
}