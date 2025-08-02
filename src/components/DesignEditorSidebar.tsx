import React, { useState } from 'react';
import { Design } from '../types/project';
import { Settings, RotateCcw, RotateCw, LayoutGrid, Eye, Zap, TestTube, Plus, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import DrawingControls from './DrawingControls';

interface DesignEditorSidebarProps {
  design: Design;
  isOpen: boolean;
  onToggle: () => void;
  isDrawing: boolean;
  onStartDrawing: () => void;
  onStopDrawing: () => void;
  onClearDrawing: () => void;
  drawingArea: number;
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
  drawingArea
}) => {
  const [activeTab, setActiveTab] = useState<Tab>('mechanical');

  const tabs = [
    { id: 'mechanical', label: 'Mechanical', icon: LayoutGrid },
    { id: 'keepouts', label: 'Keepouts', icon: Eye },
    { id: 'electrical', label: 'Electrical', icon: Zap },
    { id: 'advanced', label: 'Advanced', icon: TestTube },
  ];

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
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-800">{design.name}</h2>
          <div className="flex items-center space-x-2">
            <button className="p-2 hover:bg-gray-100 rounded-md">
              <Settings className="w-5 h-5 text-gray-600" />
            </button>
            <button onClick={onToggle} className="p-2 hover:bg-gray-100 rounded-md">
              <PanelLeftClose className="w-6 h-6 text-gray-600" />
            </button>
          </div>
        </div>
        <div className="flex items-center justify-between bg-gray-50 p-2 rounded-lg">
          <div className="flex items-center space-x-1">
            <span className="text-sm font-medium text-green-600">Saved</span>
            <button className="p-1.5 hover:bg-gray-200 rounded-md">
              <RotateCcw className="w-4 h-4 text-gray-600" />
            </button>
            <button className="p-1.5 hover:bg-gray-200 rounded-md">
              <RotateCw className="w-4 h-4 text-gray-600" />
            </button>
          </div>
          <button className="px-4 py-1.5 bg-orange-500 text-white rounded-md text-sm font-semibold hover:bg-orange-600 flex items-center space-x-2">
            <span>Array</span>
            <Eye className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b">
        <nav className="flex justify-around">
          {tabs.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as Tab)}
                className={`flex-1 py-3 px-2 text-sm font-medium flex flex-col items-center space-y-1 transition-colors ${
                  activeTab === tab.id
                    ? 'text-orange-600 border-b-2 border-orange-600 bg-orange-50'
                    : 'text-gray-500 hover:bg-gray-100'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="flex-grow p-4 overflow-y-auto">
        {activeTab === 'mechanical' && (
          <div>
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-semibold text-gray-800">Field Segments</h3>
              <button 
                onClick={onStartDrawing}
                className="px-3 py-1 bg-gray-200 text-gray-800 rounded-md text-sm font-semibold hover:bg-gray-300 flex items-center space-x-1"
              >
                <Plus className="w-4 h-4" />
                <span>New</span>
              </button>
            </div>
            <div className="mb-4">
              <label className="flex items-center text-sm text-gray-700">
                <input type="checkbox" defaultChecked className="mr-2 h-4 w-4 rounded border-gray-300 text-orange-600 focus:ring-orange-500" />
                Field segments cast shadows
              </label>
            </div>
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="p-2 text-left font-medium text-gray-600">Description</th>
                    <th className="p-2 text-left font-medium text-gray-600">Modules</th>
                    <th className="p-2 text-left font-medium text-gray-600">Action</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td colSpan={3} className="text-center p-4 text-gray-500">
                      No field segments created.
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="mt-2 text-sm text-gray-600">
              0 Modules, 0.00 kWp
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