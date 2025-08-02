import React, { useState } from 'react';
import { Design, Module, FieldSegment } from '../types/project';
import { Settings, RotateCcw, RotateCw, LayoutGrid, Eye, Zap, TestTube, Plus, PanelLeftClose, PanelLeftOpen, Trash2 } from 'lucide-react';
import DrawingControls from './DrawingControls';
import SelectField from './SelectField';

interface DesignEditorSidebarProps {
  design: Design;
  isOpen: boolean;
  onToggle: () => void;
  isDrawing: boolean;
  onStartDrawing: () => void;
  onStopDrawing: () => void;
  onClearDrawing: () => void;
  drawingArea: number;
  modules: Module[];
  fieldSegments: FieldSegment[];
  onUpdateSegment: (id: string, updates: Partial<FieldSegment>) => void;
  onDeleteSegment: (id: string) => void;
}

type Tab = 'mechanical' | 'keepouts' | 'electrical' | 'advanced';

const DesignEditorSidebar: React.FC<DesignEditorSidebarProps> = ({ 
  design, 
  isOpen, 
  onToggle,
  isDrawing,
  onStartDrawing,
  onStopDrawing,
  onClearDrawing,
  drawingArea,
  modules,
  fieldSegments,
  onUpdateSegment,
  onDeleteSegment
}) => {
  const [activeTab, setActiveTab] = useState<Tab>('mechanical');

  const tabs = [
    { id: 'mechanical', label: 'Mechanical', icon: LayoutGrid },
    { id: 'keepouts', label: 'Keepouts', icon: Eye },
    { id: 'electrical', label: 'Electrical', icon: Zap },
    { id: 'advanced', label: 'Advanced', icon: TestTube },
  ];

  const moduleOptions = modules.map(m => ({ value: m.id, label: m.model_name }));
  const totalModules = fieldSegments.reduce((sum, seg) => sum + seg.moduleCount, 0);

  if (!isOpen) {
    return (
      <div className="bg-white p-2 border-r h-screen">
        <button onClick={onToggle} className="p-2 hover:bg-gray-100 rounded-md">
          <PanelLeftOpen className="w-6 h-6 text-gray-600" />
        </button>
      </div>
    );
  }

  if (isDrawing) {
    return (
      <aside className="w-96 bg-white border-r shadow-lg flex flex-col h-screen">
        <DrawingControls
          area={drawingArea}
          onBack={onStopDrawing}
          onClear={onClearDrawing}
        />
      </aside>
    );
  }

  return (
    <aside className="w-96 bg-white border-r shadow-lg flex flex-col h-screen">
      <div className="p-4 border-b">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-800">{design.name}</h2>
          <div className="flex items-center space-x-2">
            <button className="p-2 hover:bg-gray-100 rounded-md"><Settings className="w-5 h-5 text-gray-600" /></button>
            <button onClick={onToggle} className="p-2 hover:bg-gray-100 rounded-md"><PanelLeftClose className="w-6 h-6 text-gray-600" /></button>
          </div>
        </div>
        <div className="flex items-center justify-between bg-gray-50 p-2 rounded-lg">
          <div className="flex items-center space-x-1"><span className="text-sm font-medium text-green-600">Saved</span><button className="p-1.5 hover:bg-gray-200 rounded-md"><RotateCcw className="w-4 h-4 text-gray-600" /></button><button className="p-1.5 hover:bg-gray-200 rounded-md"><RotateCw className="w-4 h-4 text-gray-600" /></button></div>
          <button className="px-4 py-1.5 bg-orange-500 text-white rounded-md text-sm font-semibold hover:bg-orange-600 flex items-center space-x-2"><span>Array</span><Eye className="w-4 h-4" /></button>
        </div>
      </div>

      <div className="border-b"><nav className="flex justify-around">{tabs.map(tab => { const Icon = tab.icon; return (<button key={tab.id} onClick={() => setActiveTab(tab.id as Tab)} className={`flex-1 py-3 px-2 text-sm font-medium flex flex-col items-center space-y-1 transition-colors ${activeTab === tab.id ? 'text-orange-600 border-b-2 border-orange-600 bg-orange-50' : 'text-gray-500 hover:bg-gray-100'}`}><Icon className="w-5 h-5" /><span>{tab.label}</span></button>);})}</nav></div>

      <div className="flex-grow p-4 overflow-y-auto space-y-6">
        {activeTab === 'mechanical' && (
          <div>
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-semibold text-gray-800">Field Segments</h3>
              <button onClick={onStartDrawing} className="px-3 py-1 bg-gray-200 text-gray-800 rounded-md text-sm font-semibold hover:bg-gray-300 flex items-center space-x-1"><Plus className="w-4 h-4" /><span>New</span></button>
            </div>
            <div className="mb-4"><label className="flex items-center text-sm text-gray-700"><input type="checkbox" defaultChecked className="mr-2 h-4 w-4 rounded border-gray-300 text-orange-600 focus:ring-orange-500" />Field segments cast shadows</label></div>
            
            <div className="space-y-4">
              {fieldSegments.length === 0 ? (
                <div className="text-center p-6 text-gray-500 border-2 border-dashed rounded-lg">No field segments created.</div>
              ) : (
                fieldSegments.map((segment, index) => (
                  <div key={segment.id} className="border rounded-lg p-4 bg-white space-y-3">
                    <div className="flex justify-between items-center">
                      <h4 className="font-semibold text-gray-800">Field Segment {index + 1}</h4>
                      <button onClick={() => onDeleteSegment(segment.id)} className="p-1 text-gray-400 hover:text-red-600"><Trash2 size={16} /></button>
                    </div>
                    <div className="text-sm space-y-1">
                      <div className="flex justify-between"><span>Area:</span> <span className="font-medium">{segment.area.toFixed(1)} ft²</span></div>
                      <div className="flex justify-between"><span>Azimuth:</span> <span className="font-medium">{segment.azimuth.toFixed(1)}°</span></div>
                      <div className="flex justify-between"><span>Modules:</span> <span className="font-medium">{segment.moduleCount}</span></div>
                    </div>
                    <SelectField label="Module" id={`module-select-${segment.id}`} value={segment.moduleId || ''} onChange={(val) => onUpdateSegment(segment.id, { moduleId: val })} options={moduleOptions} />
                  </div>
                ))
              )}
            </div>
            <div className="mt-4 pt-4 border-t text-sm font-medium text-gray-700">
              Total Modules: {totalModules}
            </div>
          </div>
        )}
        {activeTab === 'keepouts' && <div className="text-center text-gray-500 p-8">Keepouts settings will be here.</div>}
        {activeTab === 'electrical' && <div className="text-center text-gray-500 p-8">Electrical settings will be here.</div>}
        {activeTab === 'advanced' && <div className="text-center text-gray-500 p-8">Advanced settings will be here.</div>}
      </div>
    </aside>
  );
};

export default DesignEditorSidebar;