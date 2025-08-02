import { useState, useEffect } from 'react';
import Header from './components/Header';
import DashboardHome from './components/DashboardHome';
import ProjectOnboarding from './components/ProjectOnboarding';
import ProjectPage from './components/ProjectPage';
import ModulesPage from './components/Library/ModulesPage';
import InvertersPage from './components/Library/InvertersPage';
import { ProjectData, Module } from './types/project';
import { supabase } from './integrations/supabase/client';

type View = 'dashboard' | 'project' | 'library_modules' | 'library_inverters';

function App() {
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
  const [projects, setProjects] = useState<ProjectData[]>([]);
  const [isLoadingProjects, setIsLoadingProjects] = useState(true);
  const [currentProject, setCurrentProject] = useState<ProjectData | null>(null);
  const [currentView, setCurrentView] = useState<View>('dashboard');

  useEffect(() => {
    const fetchProjects = async () => {
      setIsLoadingProjects(true);
      try {
        const { data, error } = await supabase
          .from('projects')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error fetching projects:', error);
          setProjects([]);
        } else if (data) {
          const formattedProjects: ProjectData[] = data.map(p => ({
            id: p.id,
            created_at: p.created_at,
            projectName: p.project_name,
            description: p.description,
            address: p.address,
            projectType: p.project_type,
            coordinates: p.latitude && p.longitude ? { lat: p.latitude, lng: p.longitude } : undefined,
          }));
          setProjects(formattedProjects);
        }
      } catch (error) {
        console.error('Failed to fetch projects:', error);
        setProjects([]);
      }
      setIsLoadingProjects(false);
    };

    if (currentView === 'dashboard') {
      fetchProjects();
    }
  }, [currentView]);

  const handleNavigate = (view: View) => {
    setCurrentView(view);
    if (view !== 'project') {
      setCurrentProject(null);
    }
  };

  const handleCreateProject = () => setIsOnboardingOpen(true);
  const handleCloseOnboarding = () => setIsOnboardingOpen(false);

  const handleSubmitProject = async (projectData: ProjectData) => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .insert({
          project_name: projectData.projectName,
          description: projectData.description,
          address: projectData.address,
          project_type: projectData.projectType,
          latitude: projectData.coordinates?.lat,
          longitude: projectData.coordinates?.lng,
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating project:', error);
        throw error;
      }

      const newProject: ProjectData = {
        id: data.id,
        created_at: data.created_at,
        projectName: data.project_name,
        description: data.description,
        address: data.address,
        projectType: data.project_type,
        coordinates: data.latitude && data.longitude ? { lat: data.latitude, lng: data.longitude } : undefined,
      };
      
      setProjects(prev => [newProject, ...prev]);
      setCurrentProject(newProject);
      setCurrentView('project');
      setIsOnboardingOpen(false);
    } catch (error) {
      console.error('Failed to create project:', error);
      throw error;
    }
  };

  const handleSelectProject = (project: ProjectData) => {
    setCurrentProject(project);
    setCurrentView('project');
  };

  const handleDeleteProject = async (projectId: string) => {
    // eslint-disable-next-line no-restricted-globals
    if (confirm('Are you sure you want to delete this project? This action cannot be undone.')) {
      try {
        const { error } = await supabase.from('projects').delete().eq('id', projectId);

        if (error) {
          console.error('Error deleting project:', error);
          alert('Failed to delete project.');
        } else {
          setProjects(prevProjects => prevProjects.filter(p => p.id !== projectId));
        }
      } catch (error) {
        console.error('Failed to delete project:', error);
        alert('Failed to delete project.');
      }
    }
  };

  const handleBackToDashboard = () => {
    setCurrentView('dashboard');
    setCurrentProject(null);
  };

  const handleSaveModule = async (moduleData: Module) => {
    try {
      const { error } = await supabase.from('modules').insert({
        model_name: moduleData.model_name,
        manufacturer: moduleData.manufacturer,
        technology: moduleData.technology,
        max_power_pmp: moduleData.max_power_pmp,
        raw_pan_data: moduleData.raw_pan_data,
      });

      if (error) {
        console.error('Error saving module:', error);
        alert('Failed to save module.');
      } else {
        alert('Module saved successfully!');
        // The ModulesPage will re-fetch its own data, so no need to update state here.
      }
    } catch (error) {
      console.error('Failed to save module:', error);
      alert('Failed to save module.');
    }
  };

  const renderCurrentView = () => {
    switch (currentView) {
      case 'dashboard':
        return <DashboardHome 
                  onCreateProject={handleCreateProject} 
                  projects={projects}
                  onSelectProject={handleSelectProject}
                  onDeleteProject={handleDeleteProject}
                  isLoading={isLoadingProjects}
                />;
      case 'project':
        return currentProject ? <ProjectPage project={currentProject} onBack={handleBackToDashboard} /> : <DashboardHome onCreateProject={handleCreateProject} projects={[]} onSelectProject={handleSelectProject} onDeleteProject={handleDeleteProject} isLoading={true} />;
      case 'library_modules':
        return <ModulesPage onSaveModule={handleSaveModule} />;
      case 'library_inverters':
        return <InvertersPage />;
      default:
        return <DashboardHome onCreateProject={handleCreateProject} projects={projects} onSelectProject={handleSelectProject} onDeleteProject={handleDeleteProject} isLoading={isLoadingProjects} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header onNavigate={handleNavigate} />
      <main>
        {renderCurrentView()}
        <ProjectOnboarding
          isOpen={isOnboardingOpen}
          onClose={handleCloseOnboarding}
          onSubmit={handleSubmitProject}
        />
      </main>
    </div>
  );
}

export default App;