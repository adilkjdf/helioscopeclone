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
  [key: string]: string | number;
}

export interface Module {
  id: string;
  created_at: string;
  model_name: string;
  manufacturer?: string;
  technology?: string;
  max_power_pmp?: number;
  raw_pan_data?: PanFile;
  width?: number;
  height?: number;
  voc?: number;
  isc?: number;
  vmp?: number;
  imp?: number;
}

export interface LayoutRules {
  orientation: 'landscape' | 'portrait';
  rowSpacing: number;
  moduleSpacing: number;
  setback: number;
  azimuth: number;
  tilt: number;
  frameSizeUp: number;
  frameSizeWide: number;
}

export interface FieldSegment {
  id: string;
  name: string;
  points: LatLngTuple[];
  area: number;
  moduleLayout?: LatLngTuple[][];
  moduleCount: number;
  nameplate: number;
  selectedModuleId?: string;
  layoutRules: LayoutRules;
}