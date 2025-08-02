import React from 'react';
import { ArrowLeft, Trash2 } from 'lucide-react';
import { FieldSegment, Module, LayoutRules } from '../types/project';
import FormField from './FormField';
import SelectField from './SelectField';

interface FieldSegmentDetailsProps {
  segment: FieldSegment;
  modules: Module[];
  onBack: () => void;
  onDelete: (id: string) => void;
  onUpdate: (id: string, updates: Partial<FieldSegment>) => void;
}

const FieldSegmentDetails: React.FC<FieldSegmentDetailsProps> = ({ segment, modules, onBack, onDelete, onUpdate }) => {
  
  const handleRuleChange = (field: keyof LayoutRules, value: string | number) => {
    const newRules = { ...segment.layoutRules, [field]: value };
    onUpdate(segment.id, { layoutRules: newRules });
  };

  const handleModuleChange = (moduleId: string) => {
    onUpdate(segment.id, { selectedModuleId: moduleId });
  };

  const moduleOptions = modules.map(m => ({ value: m.id, label: `${m.manufacturer} ${m.model_name}` }));
  const orientationOptions = [
    { value: 'landscape', label: 'Landscape (Horizontal)' },
    { value: 'portrait', label: 'Portrait (Vertical)' },
  ];

  const totalKW = (segment.nameplate / 1000).toFixed(2);

  return (
    <div className="p-4 h-full flex flex-col bg-white overflow-y-auto">
      <div className="flex justify-between items-center mb-4">
        <button onClick={onBack} className="text-sm text-blue-600 hover:underline flex items-center">
          <ArrowLeft className="w-4 h-4 mr-1" />
          back to list
        </button>
        <div>
          <button className="p-2 hover:bg-gray-100 rounded-md">
            <Trash2 className="w-5 h-5 text-red-500" onClick={() => onDelete(segment.id)} />
          </button>
        </div>
      </div>

      <h3 className="text-lg font-semibold text-gray-800">{segment.name}</h3>
      <div className="text-sm text-gray-600 mb-4">
        <p>Modules: {segment.moduleCount} ({totalKW} kW)</p>
        <p>Area: {segment.area.toFixed(2)} ft²</p>
      </div>

      <FormField label="Description" id="desc" value={segment.name} onChange={(val) => onUpdate(segment.id, { name: val })} />
      <SelectField label="Module" id="module" value={segment.selectedModuleId || ''} onChange={handleModuleChange} options={moduleOptions} />
      
      <div className="border-t my-4" />

      <h4 className="font-semibold text-gray-800 mb-2">Automatic Layout Rules</h4>
      <SelectField label="Default Orientation" id="orientation" value={segment.layoutRules.orientation} onChange={(val) => handleRuleChange('orientation', val)} options={orientationOptions} />
      <FormField label="Row Spacing" id="rowSpacing" type="number" value={segment.layoutRules.rowSpacing} onChange={(val) => handleRuleChange('rowSpacing', Number(val))} />
      <FormField label="Module Spacing" id="moduleSpacing" type="number" value={segment.layoutRules.moduleSpacing} onChange={(val) => handleRuleChange('moduleSpacing', Number(val))} />
      <FormField label="Setback" id="setback" type="number" value={segment.layoutRules.setback} onChange={(val) => handleRuleChange('setback', Number(val))} />
      <FormField label="Module Azimuth" id="azimuth" type="number" value={segment.layoutRules.azimuth} onChange={(val) => handleRuleChange('azimuth', Number(val))} />
      <FormField label="Module Tilt" id="tilt" type="number" value={segment.layoutRules.tilt} onChange={(val) => handleRuleChange('tilt', Number(val))} />
    </div>
  );
};

export default FieldSegmentDetails;