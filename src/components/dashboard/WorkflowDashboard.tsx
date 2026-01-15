import React, { useState } from 'react';
import { useTranslation } from '../../i18n/context';
import type { Project, WorkflowDocument, DepartmentType, TeamMember, Task } from '../../types';

interface WorkflowDashboardProps {
  onBack: () => void;
}

// Mock data
const MOCK_TEAM: TeamMember[] = [
  { id: '1', name: 'John Doe', role: 'Project Manager', avatar: '' },
  { id: '2', name: 'Jane Smith', role: 'Designer', avatar: '' },
  { id: '3', name: 'Mike Johnson', role: 'Developer', avatar: '' },
  { id: '4', name: 'Sarah Wilson', role: 'Creative Director', avatar: '', isExternal: true },
];

const MOCK_PROJECTS: Project[] = [
  {
    id: '1',
    name: 'Tech Conference 2024',
    client: 'TechCorp Inc.',
    description: 'Annual technology conference with keynote speakers and exhibitions',
    department: 'event_planner',
    status: 'active',
    startDate: '2024-01-15',
    deadline: '2024-03-20',
    budget: 50000,
    expenses: 32000,
    team: MOCK_TEAM.slice(0, 3),
    files: [],
    progress: 65,
    chatHistory: [],
    tasks: [
      { id: 't1', title: 'Venue booking', assigneeId: '1', assigneeName: 'John Doe', status: 'done', dueDate: '2024-02-01' },
      { id: 't2', title: 'Speaker coordination', assigneeId: '2', assigneeName: 'Jane Smith', status: 'in_progress', dueDate: '2024-02-15' },
      { id: 't3', title: 'Marketing materials', assigneeId: '3', assigneeName: 'Mike Johnson', status: 'todo', dueDate: '2024-02-28' },
    ],
  },
  {
    id: '2',
    name: 'Product Launch Event',
    client: 'StartUp Co.',
    description: 'New product launch with media coverage',
    department: 'creative',
    status: 'planning',
    startDate: '2024-02-01',
    deadline: '2024-04-15',
    budget: 30000,
    expenses: 5000,
    team: MOCK_TEAM.slice(1, 4),
    files: [],
    progress: 20,
    chatHistory: [],
    tasks: [],
  },
];

const MOCK_DOCUMENTS: WorkflowDocument[] = [
  {
    id: '1',
    name: 'Venue Contract.pdf',
    type: 'pdf',
    size: '2.4 MB',
    uploadDate: '2024-01-20',
    uploader: 'John Doe',
    department: 'event_planner',
    status: 'approved',
  },
  {
    id: '2',
    name: 'Stage Design.psd',
    type: 'psd',
    size: '45 MB',
    uploadDate: '2024-01-22',
    uploader: 'Jane Smith',
    department: 'creative',
    status: 'pending',
  },
  {
    id: '3',
    name: 'Budget Report.xlsx',
    type: 'xlsx',
    size: '156 KB',
    uploadDate: '2024-01-25',
    uploader: 'Mike Johnson',
    department: 'operation',
    status: 'pending',
  },
];

type TabType = 'projects' | 'documents' | 'team';

const WorkflowDashboard: React.FC<WorkflowDashboardProps> = ({ onBack }) => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<TabType>('projects');
  const [departmentFilter, setDepartmentFilter] = useState<DepartmentType>('all');
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Filter projects by department
  const filteredProjects = MOCK_PROJECTS.filter(project => {
    if (departmentFilter !== 'all' && project.department !== departmentFilter) return false;
    if (searchQuery && !project.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  // Filter documents by department
  const filteredDocuments = MOCK_DOCUMENTS.filter(doc => {
    if (departmentFilter !== 'all' && doc.department !== departmentFilter) return false;
    if (searchQuery && !doc.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const getDepartmentColor = (dept: DepartmentType) => {
    switch (dept) {
      case 'event_planner': return 'bg-purple-500/20 text-purple-400';
      case 'creative': return 'bg-pink-500/20 text-pink-400';
      case 'operation': return 'bg-blue-500/20 text-blue-400';
      default: return 'bg-gray-500/20 text-gray-400';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
      case 'approved': return 'bg-green-500/20 text-green-400';
      case 'planning':
      case 'pending': return 'bg-yellow-500/20 text-yellow-400';
      case 'completed': return 'bg-blue-500/20 text-blue-400';
      case 'archived':
      case 'rejected': return 'bg-red-500/20 text-red-400';
      default: return 'bg-gray-500/20 text-gray-400';
    }
  };

  const renderProjectDetail = () => {
    if (!selectedProject) return null;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedProject(null)} />
        <div className="relative z-10 w-full max-w-3xl bg-[var(--bg-primary)] rounded-2xl overflow-hidden shadow-2xl max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="sticky top-0 bg-[var(--bg-primary)] border-b border-[var(--border-primary)] px-6 py-4 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-[var(--text-primary)]">{selectedProject.name}</h2>
              <p className="text-sm text-[var(--text-secondary)]">{selectedProject.client}</p>
            </div>
            <button
              onClick={() => setSelectedProject(null)}
              className="p-2 hover:bg-[var(--bg-secondary)] rounded-lg transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-[var(--text-secondary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="p-6">
            {/* Progress */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-[var(--text-secondary)]">{t('workflow.progress')}</span>
                <span className="text-sm font-medium text-[var(--accent-primary)]">{selectedProject.progress}%</span>
              </div>
              <div className="h-2 bg-[var(--bg-tertiary)] rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[var(--accent-primary)] to-orange-500 rounded-full transition-all"
                  style={{ width: `${selectedProject.progress}%` }}
                />
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="p-4 bg-[var(--bg-secondary)] rounded-xl">
                <p className="text-sm text-[var(--text-tertiary)]">{t('workflow.budget')}</p>
                <p className="text-xl font-bold text-[var(--text-primary)]">${selectedProject.budget.toLocaleString()}</p>
              </div>
              <div className="p-4 bg-[var(--bg-secondary)] rounded-xl">
                <p className="text-sm text-[var(--text-tertiary)]">{t('workflow.spent')}</p>
                <p className="text-xl font-bold text-[var(--accent-primary)]">${selectedProject.expenses.toLocaleString()}</p>
              </div>
              <div className="p-4 bg-[var(--bg-secondary)] rounded-xl">
                <p className="text-sm text-[var(--text-tertiary)]">{t('workflow.deadline')}</p>
                <p className="text-xl font-bold text-[var(--text-primary)]">{new Date(selectedProject.deadline).toLocaleDateString()}</p>
              </div>
              <div className="p-4 bg-[var(--bg-secondary)] rounded-xl">
                <p className="text-sm text-[var(--text-tertiary)]">{t('workflow.team')}</p>
                <p className="text-xl font-bold text-[var(--text-primary)]">{selectedProject.team.length}</p>
              </div>
            </div>

            {/* Description */}
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-2">{t('workflow.description')}</h3>
              <p className="text-[var(--text-secondary)]">{selectedProject.description}</p>
            </div>

            {/* Tasks */}
            {selectedProject.tasks.length > 0 && (
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-3">{t('workflow.tasks')}</h3>
                <div className="flex flex-col gap-2">
                  {selectedProject.tasks.map((task: Task) => (
                    <div
                      key={task.id}
                      className="flex items-center justify-between p-3 bg-[var(--bg-secondary)] rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${
                          task.status === 'done' ? 'bg-green-500' :
                          task.status === 'in_progress' ? 'bg-yellow-500' : 'bg-gray-500'
                        }`} />
                        <span className={`text-sm ${task.status === 'done' ? 'text-[var(--text-tertiary)] line-through' : 'text-[var(--text-primary)]'}`}>
                          {task.title}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-[var(--text-tertiary)]">{task.assigneeName}</span>
                        <span className="text-xs text-[var(--text-tertiary)]">|</span>
                        <span className="text-xs text-[var(--text-tertiary)]">{new Date(task.dueDate).toLocaleDateString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Team */}
            <div>
              <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-3">{t('workflow.teamMembers')}</h3>
              <div className="flex flex-wrap gap-2">
                {selectedProject.team.map((member: TeamMember) => (
                  <div
                    key={member.id}
                    className="flex items-center gap-2 px-3 py-2 bg-[var(--bg-secondary)] rounded-lg"
                  >
                    <div className="w-8 h-8 bg-[var(--accent-primary)]/20 rounded-full flex items-center justify-center text-[var(--accent-primary)] font-medium">
                      {member.name.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm text-[var(--text-primary)]">{member.name}</p>
                      <p className="text-xs text-[var(--text-tertiary)]">{member.role}</p>
                    </div>
                    {member.isExternal && (
                      <span className="px-2 py-0.5 bg-blue-500/20 text-blue-400 text-xs rounded-full">External</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-[var(--bg-primary)]/80 backdrop-blur-lg border-b border-[var(--border-primary)]">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <button
                onClick={onBack}
                className="p-2 hover:bg-[var(--bg-secondary)] rounded-lg transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-[var(--text-secondary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </button>
              <div>
                <h1 className="text-xl font-bold text-[var(--text-primary)]">{t('workflow.title')}</h1>
                <p className="text-sm text-[var(--text-secondary)]">{t('workflow.subtitle')}</p>
              </div>
            </div>

            {/* Search */}
            <div className="relative">
              <svg xmlns="http://www.w3.org/2000/svg" className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-tertiary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('workflow.search')}
                className="pl-10 pr-4 py-2 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg text-sm text-[var(--text-primary)] placeholder-[var(--text-tertiary)] focus:outline-none focus:border-[var(--accent-primary)]"
              />
            </div>
          </div>

          {/* Tabs & Filters */}
          <div className="flex items-center justify-between">
            {/* Tabs */}
            <div className="flex gap-1 bg-[var(--bg-secondary)] p-1 rounded-lg">
              {(['projects', 'documents', 'team'] as TabType[]).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                    activeTab === tab
                      ? 'bg-[var(--accent-primary)] text-white'
                      : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  {t(`workflow.tab.${tab}`)}
                </button>
              ))}
            </div>

            {/* Department Filter */}
            <select
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value as DepartmentType)}
              className="px-3 py-2 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
            >
              <option value="all">{t('workflow.dept.all')}</option>
              <option value="event_planner">{t('workflow.dept.eventPlanner')}</option>
              <option value="creative">{t('workflow.dept.creative')}</option>
              <option value="operation">{t('workflow.dept.operation')}</option>
            </select>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6">
        {/* Projects Tab */}
        {activeTab === 'projects' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredProjects.map((project) => (
              <button
                key={project.id}
                onClick={() => setSelectedProject(project)}
                className="p-4 bg-[var(--bg-secondary)] rounded-xl text-left hover:bg-[var(--bg-tertiary)] transition-colors group"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-[var(--text-primary)] group-hover:text-[var(--accent-primary)] transition-colors">
                      {project.name}
                    </h3>
                    <p className="text-sm text-[var(--text-tertiary)]">{project.client}</p>
                  </div>
                  <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(project.status)}`}>
                    {t(`workflow.status.${project.status}`)}
                  </span>
                </div>

                <p className="text-sm text-[var(--text-secondary)] mb-3 line-clamp-2">{project.description}</p>

                {/* Progress Bar */}
                <div className="mb-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-[var(--text-tertiary)]">{t('workflow.progress')}</span>
                    <span className="text-xs text-[var(--accent-primary)]">{project.progress}%</span>
                  </div>
                  <div className="h-1.5 bg-[var(--bg-tertiary)] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[var(--accent-primary)] rounded-full"
                      style={{ width: `${project.progress}%` }}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className={`px-2 py-1 text-xs rounded-full ${getDepartmentColor(project.department)}`}>
                    {t(`workflow.dept.${project.department.replace('_', '')}`)}
                  </span>
                  <div className="flex -space-x-2">
                    {project.team.slice(0, 3).map((member, i) => (
                      <div
                        key={member.id}
                        className="w-6 h-6 bg-[var(--accent-primary)]/20 rounded-full border-2 border-[var(--bg-secondary)] flex items-center justify-center text-xs text-[var(--accent-primary)]"
                        style={{ zIndex: 3 - i }}
                      >
                        {member.name.charAt(0)}
                      </div>
                    ))}
                    {project.team.length > 3 && (
                      <div className="w-6 h-6 bg-[var(--bg-tertiary)] rounded-full border-2 border-[var(--bg-secondary)] flex items-center justify-center text-xs text-[var(--text-tertiary)]">
                        +{project.team.length - 3}
                      </div>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Documents Tab */}
        {activeTab === 'documents' && (
          <div className="flex flex-col gap-3">
            {filteredDocuments.map((doc) => (
              <div
                key={doc.id}
                className="flex items-center gap-4 p-4 bg-[var(--bg-secondary)] rounded-xl hover:bg-[var(--bg-tertiary)] transition-colors"
              >
                {/* File Icon */}
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                  doc.type === 'pdf' ? 'bg-red-500/20 text-red-400' :
                  doc.type === 'psd' ? 'bg-blue-500/20 text-blue-400' :
                  'bg-green-500/20 text-green-400'
                }`}>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>

                {/* File Info */}
                <div className="flex-1">
                  <h3 className="font-medium text-[var(--text-primary)]">{doc.name}</h3>
                  <p className="text-sm text-[var(--text-tertiary)]">
                    {doc.size} • {doc.uploader} • {new Date(doc.uploadDate).toLocaleDateString()}
                  </p>
                </div>

                {/* Status */}
                <span className={`px-3 py-1 text-xs rounded-full ${getStatusColor(doc.status)}`}>
                  {t(`workflow.status.${doc.status}`)}
                </span>

                {/* Actions */}
                <div className="flex gap-2">
                  <button className="p-2 hover:bg-[var(--bg-secondary)] rounded-lg transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-[var(--text-secondary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                  </button>
                  <button className="p-2 hover:bg-[var(--bg-secondary)] rounded-lg transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-[var(--text-secondary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Team Tab */}
        {activeTab === 'team' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {MOCK_TEAM.map((member) => (
              <div
                key={member.id}
                className="p-4 bg-[var(--bg-secondary)] rounded-xl text-center"
              >
                <div className="w-20 h-20 mx-auto mb-3 bg-gradient-to-br from-[var(--accent-primary)] to-orange-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                  {member.name.charAt(0)}
                </div>
                <h3 className="font-semibold text-[var(--text-primary)]">{member.name}</h3>
                <p className="text-sm text-[var(--text-secondary)] mb-2">{member.role}</p>
                {member.isExternal && (
                  <span className="px-3 py-1 bg-blue-500/20 text-blue-400 text-xs rounded-full">
                    External Partner
                  </span>
                )}
              </div>
            ))}

            {/* Add Team Member */}
            <button className="p-4 bg-[var(--bg-secondary)] rounded-xl border-2 border-dashed border-[var(--border-primary)] hover:border-[var(--accent-primary)] transition-colors flex flex-col items-center justify-center min-h-[180px]">
              <div className="w-12 h-12 bg-[var(--bg-tertiary)] rounded-full flex items-center justify-center mb-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-[var(--text-tertiary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
              </div>
              <span className="text-sm text-[var(--text-tertiary)]">{t('workflow.addMember')}</span>
            </button>
          </div>
        )}
      </main>

      {/* Project Detail Modal */}
      {selectedProject && renderProjectDetail()}
    </div>
  );
};

export default WorkflowDashboard;
