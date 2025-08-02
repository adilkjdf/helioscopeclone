import React, { useState, useEffect } from 'react';
import { ArrowLeft, MapPin, Settings, Eye, Share2, FileText, Plus, Download, Trash2 } from 'lucide-react';
import { Design, ProjectData } from '../types/project';
import { Map, Marker } from 'react-map-gl';
import maplibregl from 'maplibre-gl';
import NewDesignModal from './NewDesignModal';
import { supabase } from '../integrations/supabase/client';

const MAPTILER_API_KEY = 'aTChQEvBqKVcP0AXd2bH';

interface ProjectPageProps {
  project: ProjectData;
  onBack: () => void;
  onSelectDesign: (design: Design) => void;
}

type TabType = 'designs' | 'conditions' | 'shading' | 'sharing' | 'reports';

const ProjectPage: React.FC<ProjectPageProps> = ({ project, onBack, onSelectDesign }) => {
  const [activeTab, setActiveTab] = useState<TabType>('designs');
  const [designs, setDesigns] = useState<Design[]>([]);
  const [isNewDesignModalOpen, setIsNewDesignModalOpen] = useState(false);

  useEffect(() => {
    if (!project.id) return;
    const fetchDesigns = async () => {
      try {
        const { data, error } = await supabase.from('designs').select('*').eq('project_id', project.id).order('created_at', { ascending: false });
        if (error) {
          console.error('Error fetching designs:', error);
          setDesigns([]);
        } else if (data) {
          const formattedDesigns: Design[] = data.map(d => ({
            id: d.id, name: d.name, lastModified: new Date(d.last_modified),
            nameplate: d.nameplate, field_segments: d.field_segments || [],
          }));
          setDesigns(formattedDesigns);
        }
      } catch (error) {
        console.error('Failed to fetch designs:', error);
        setDesigns([]);
      }
    };
    fetchDesigns();
  }, [project.id]);

  const tabs = [
    { id: 'designs' as TabType, label: 'Designs', icon: Settings },
    { id: 'conditions' as TabType, label: 'Conditions', icon: Eye },
    { id: 'shading' as TabType, label: 'Shading', icon: MapPin },
    { id: 'sharing' as TabType, label: 'Sharing', icon: Share2 },
    { id: 'reports' as TabType, label: 'Reports', icon: FileText },
  ];

  const handleSaveDesign = async (designName: string, clonedDesignId?: string) => {
    if (!project.id) return;
    const nameplate = clonedDesignId ? designs.find(d => d.id === clonedDesignId)?.nameplate || '-' : '-';
    try {
      const { data, error } = await supabase.from('designs').insert({ name: designName, project_id: project.id, nameplate: nameplate, last_modified: new Date().toISOString() }).select().single();
      if (error) throw error;
      const newDesign: Design = {
        id: data.id, name: data.name, lastModified: new Date(data.last_modified),
        nameplate: data.nameplate, field_segments: data.field_segments || [],
      };
      setDesigns(prev => [newDesign, ...prev]);
    } catch (error) {
      console.error('Failed to save design:', error);
      alert('Failed to save design.');
    }
  };

  const handleDeleteDesign = async (designId: string) => {
    try {
      const { error } = await supabase.from('designs').delete().eq('id', designId);
      if (error) throw error;
      setDesigns(prevDesigns => prevDesigns.filter(d => d.id !== designId));
    } catch (error) {
      console.error('Failed to delete design:', error);
      alert('Failed to delete design.');
    }
  };

  const renderTabContent = () => {
    // ... (rest of the tab content remains the same)
    switch (activeTab) {
      case 'designs':
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Designs</h3>
                <p className="text-sm text-gray-600">Each Design encompasses all the components of a solar array: the modules, inverter, wiring, and layout.</p>
              </div>
              <button 
                onClick={() => setIsNewDesignModalOpen(true)}
                className="bg-cyan-500 text-white px-4 py-2 rounded-lg hover:bg-cyan-600 transition-colors flex items-center space-x-2"
              >
                <Plus className="w-4 h-4" />
                <span>New</span>
              </button>
            </div>

            <div className="bg-white border rounded-lg overflow-hidden">
              <div className="bg-gray-50 px-6 py-3 border-b">
                <div className="grid grid-cols-5 gap-4 text-sm font-medium text-gray-700">
                  <div>Design</div>
                  <div>Last Modified</div>
                  <div>Nameplate</div>
                  <div>Actions</div>
                  <div></div>
                </div>
              </div>
              {designs.length > 0 ? (
                designs.map(design => (
                  <div key={design.id} className="p-6 border-b last:border-b-0">
                    <div className="grid grid-cols-5 gap-4 items-center">
                      <div>
                        <button onClick={() => onSelectDesign(design)} className="text-blue-600 hover:text-blue-800 font-medium text-left">
                          {design.name}
                        </button>
                      </div>
                      <div className="text-sm text-gray-600">
                        {design.lastModified.toLocaleDateString()}
                      </div>
                      <div className="text-sm text-gray-600">{design.nameplate}</div>
                      <div className="flex space-x-2">
                        <button className="p-1 text-gray-400 hover:text-gray-600" title="Download Design">
                          <Download className="w-4 h-4" />
                        </button>
                        <button className="p-1 text-orange-500 hover:text-orange-700" title="Design Settings">
                          <Settings className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDeleteDesign(design.id)}
                          className="p-1 text-red-500 hover:text-red-700"
                          title="Delete Design"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <div></div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12 px-6">
                  <Settings className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No designs yet</h3>
                  <p className="text-gray-500 mb-6">Create your first design to get started.</p>
                  <button
                    onClick={() => setIsNewDesignModalOpen(true)}
                    className="bg-cyan-500 text-white px-6 py-2 rounded-lg hover:bg-cyan-600 
                               transition-colors flex items-center space-x-2 mx-auto"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Create Design</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        );

      case 'conditions':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Conditions</h3>
              <p className="text-sm text-gray-600">Environmental and site conditions that affect solar panel performance.</p>
            </div>
            <div className="bg-white border rounded-lg p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Weather Data</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Solar Irradiance:</span>
                      <span className="font-medium">Loading...</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Temperature:</span>
                      <span className="font-medium">Loading...</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Wind Speed:</span>
                      <span className="font-medium">Loading...</span>
                    </div>
                  </div>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Site Conditions</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Tilt Angle:</span>
                      <span className="font-medium">Optimal</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Orientation:</span>
                      <span className="font-medium">South-facing</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Roof Type:</span>
                      <span className="font-medium">To be determined</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 'shading':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Shading Analysis</h3>
              <p className="text-sm text-gray-600">Analyze potential shading from nearby objects and structures.</p>
            </div>
            <div className="bg-white border rounded-lg p-6">
              <div className="text-center py-12">
                <MapPin className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h4 className="text-lg font-medium text-gray-900 mb-2">Shading Analysis</h4>
                <p className="text-gray-500 mb-6">Run shading analysis to identify potential obstructions and their impact on solar production.</p>
                <button className="bg-orange-500 text-white px-6 py-2 rounded-lg hover:bg-orange-600 transition-colors">
                  Run Shading Analysis
                </button>
              </div>
            </div>
          </div>
        );

      case 'sharing':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Sharing & Collaboration</h3>
              <p className="text-sm text-gray-600">Share your project with team members and clients.</p>
            </div>
            <div className="bg-white border rounded-lg p-6">
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Project Access</h4>
                  <div className="flex items-center space-x-4">
                    <select className="border border-gray-300 rounded-lg px-3 py-2 text-sm">
                      <option>Private</option>
                      <option>Team Access</option>
                      <option>Public Link</option>
                    </select>
                    <button className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors text-sm">
                      Generate Share Link
                    </button>
                  </div>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Team Members</h4>
                  <div className="text-sm text-gray-500">
                    No team members added yet. Invite team members to collaborate on this project.
                  </div>
                  <button className="mt-2 text-blue-600 hover:text-blue-800 text-sm font-medium">
                    + Invite Team Member
                  </button>
                </div>
              </div>
            </div>
          </div>
        );

      case 'reports':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Reports & Analytics</h3>
              <p className="text-sm text-gray-600">Generate detailed reports and performance analytics for your solar project.</p>
            </div>
            <div className="bg-white border rounded-lg p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="border border-gray-200 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-2">Performance Report</h4>
                  <p className="text-sm text-gray-600 mb-4">Detailed analysis of expected solar production and system performance.</p>
                  <button className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors text-sm">
                    Generate Report
                  </button>
                </div>
                <div className="border border-gray-200 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-2">Financial Analysis</h4>
                  <p className="text-sm text-gray-600 mb-4">ROI calculations, payback period, and financial projections.</p>
                  <button className="bg-purple-500 text-white px-4 py-2 rounded-lg hover:bg-purple-600 transition-colors text-sm">
                    Generate Report
                  </button>
                </div>
                <div className="border border-gray-200 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-2">Technical Specifications</h4>
                  <p className="text-sm text-gray-600 mb-4">Complete technical documentation and system specifications.</p>
                  <button className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors text-sm">
                    Generate Report
                  </button>
                </div>
                <div className="border border-gray-200 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-2">Proposal Document</h4>
                  <p className="text-sm text-gray-600 mb-4">Professional proposal document for client presentation.</p>
                  <button className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors text-sm">
                    Generate Report
                  </button>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{project.projectName}</h1>
                <p className="text-sm text-gray-600">{project.coordinates?.lat.toFixed(4)}, {project.coordinates?.lng.toFixed(4)}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="max-w-7xl mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Settings className="w-5 h-5 mr-2 text-orange-500" /> Project Overview
              </h3>
              <div className="space-y-4 text-sm">
                <div><label className="font-medium text-gray-700">Project</label><p>{project.projectName}</p></div>
                <div><label className="font-medium text-gray-700">Address</label><p>{project.address}</p></div>
                <div><label className="font-medium text-gray-700">Owner</label><p>{project.projectName}</p></div>
                <div><label className="font-medium text-gray-700">Last Modified</label><p>Today at {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p></div>
                <div><label className="font-medium text-gray-700">Location</label><p>({project.coordinates?.lat.toFixed(4)}, {project.coordinates?.lng.toFixed(4)}) (GMT-5.0)</p></div>
                <div><label className="font-medium text-gray-700">Profile</label><p>Default {project.projectType}</p></div>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
              <div className="p-4 border-b"><h4 className="font-medium text-gray-900 flex items-center"><MapPin className="w-4 h-4 mr-2 text-orange-500" /> Project Location</h4></div>
              <div className="h-64 relative z-0">
                {project.coordinates && (
                  <Map
                    initialViewState={{
                      longitude: project.coordinates.lng,
                      latitude: project.coordinates.lat,
                      zoom: 16
                    }}
                    style={{ width: '100%', height: '100%' }}
                    mapStyle={`https://api.maptiler.com/maps/satellite/style.json?key=${MAPTILER_API_KEY}`}
                    mapLib={maplibregl}
                  >
                    <Marker longitude={project.coordinates.lng} latitude={project.coordinates.lat} color="#f97316" />
                  </Map>
                )}
              </div>
            </div>
          </div>
          <div className="lg:col-span-3">
            <div className="bg-white rounded-lg shadow-sm border mb-6">
              <div className="border-b">
                <nav className="flex space-x-8 px-6">
                  {tabs.map((tab) => {
                    const Icon = tab.icon;
                    return (
                      <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors ${activeTab === tab.id ? 'border-orange-500 text-orange-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>
                        <div className="flex items-center space-x-2"><Icon className="w-4 h-4" /><span>{tab.label}</span></div>
                      </button>
                    );
                  })}
                </nav>
              </div>
              <div className="p-6">{renderTabContent()}</div>
            </div>
          </div>
        </div>
      </div>
      <NewDesignModal isOpen={isNewDesignModalOpen} onClose={() => setIsNewDesignModalOpen(false)} onSubmit={handleSaveDesign} existingDesigns={designs} />
    </div>
  );
};

export default ProjectPage;