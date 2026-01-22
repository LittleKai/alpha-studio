
import React, { useState } from 'react';
import { useTranslation } from '../../i18n/context';
import { useAuth } from '../../auth/context';
import type { WorkflowDocument, DepartmentType, Transaction, AutomationRule, AffiliateStats, CreativeAsset, SharedResource, TeamMember, Comment, Project, Task } from '../../types';
// StudentProfileModal and PartnerRegistrationModal not used - moved to separate view components
import LanguageSwitcher from '../ui/LanguageSwitcher';
import ThemeSwitcher from '../ui/ThemeSwitcher';
import { JobsView, PartnersView, WalletView } from './views';
import ProfileEditModal from '../modals/ProfileEditModal';

interface WorkflowDashboardProps {
  onBack: () => void;
  documents?: WorkflowDocument[];
  onAddDocument?: (doc: WorkflowDocument) => void;
  onOpenStudio?: () => void;
  projects?: Project[];
  setProjects?: React.Dispatch<React.SetStateAction<Project[]>>;
}

export default function WorkflowDashboard({ onBack }: WorkflowDashboardProps) {
  // Internal state for documents and projects when not provided as props
  const [internalDocuments, setInternalDocuments] = useState<WorkflowDocument[]>([]);
  const [internalProjects, setInternalProjects] = useState<Project[]>([]);

  const documents = internalDocuments;
  const projects = internalProjects;
  const setProjects = setInternalProjects;
  const onAddDocument = (doc: WorkflowDocument) => setInternalDocuments(prev => [...prev, doc]);
  const onOpenStudio = () => {};
  const { t } = useTranslation();
  const { user } = useAuth();

  // Navigation State
  const [activeView, setActiveView] = useState<'documents' | 'projects' | 'jobs' | 'wallet' | 'partners' | 'automation' | 'affiliate' | 'creative' | 'resources'>('documents');
  const [selectedDept, setSelectedDept] = useState<DepartmentType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  // partnerFilter moved to PartnersView component

  // Collaboration State
  const [_activeDocForChat, setActiveDocForChat] = useState<WorkflowDocument | null>(null);
  const [_chatMessage, _setChatMessage] = useState('');
  const [showMemberSelect, setShowMemberSelect] = useState(false);

  // Project Hub State
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [projectTab, setProjectTab] = useState<'overview' | 'team' | 'files' | 'finance' | 'chat' | 'tasks'>('overview');
  const [projectChatMessage, setProjectChatMessage] = useState('');

  // Task Management State
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [selectedFileForTask, setSelectedFileForTask] = useState<WorkflowDocument | null>(null);
  const [newTaskData, setNewTaskData] = useState({ title: '', assigneeId: '', dueDate: '' });

  // Modal States
  const [showProfileModal, setShowProfileModal] = useState(false);
  // showPartnerModal moved to PartnersView component
  const [showCreativeModal, setShowCreativeModal] = useState(false);
  const [showResourceModal, setShowResourceModal] = useState(false);
  const [showProjectModal, setShowProjectModal] = useState(false);

  // New Project Data
  const [newProjectData, setNewProjectData] = useState({ name: '', description: '', department: 'event_planner' as DepartmentType, client: '', budget: 0 });

  // Mock Available Users for Collaboration
  const availableUsers: TeamMember[] = [
      { id: 'u1', name: 'Minh Thu', role: 'Event Director', avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=100&h=100&fit=crop', isExternal: false },
      { id: 'u2', name: 'Quang Huy', role: '3D Artist', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop', isExternal: false },
      { id: 'u3', name: 'Hoàng Nam', role: 'VFX Lead (Expert)', avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100&h=100&fit=crop', isExternal: true },
      { id: 'u4', name: 'Thảo My', role: 'Concept Artist', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop', isExternal: false },
      { id: 'u5', name: 'David Nguyen', role: 'Technical Director (Expert)', avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop', isExternal: true },
  ];

  // User Profile - connected to authenticated user
  const userProfile = {
    name: user?.name || 'Guest User',
    role: user?.role || 'student',
    email: user?.email || '',
    phone: '',
    bio: '',
    skills: [] as string[],
    portfolioUrl: ''
  };

  // Local balance state for reward/spending features (main wallet moved to WalletView)
  const [balance, setBalance] = useState(user?.balance || 0);
  const [_transactions, setTransactions] = useState<Transaction[]>([]);

  const [automations, setAutomations] = useState<AutomationRule[]>([
    { id: 'a1', name: 'Gửi file Thiết kế cho Art Director', trigger: 'file_upload', action: 'send_telegram', target: '@ArtDirectorGroup', isActive: true, lastRun: '2 phút trước' },
    { id: 'a2', name: 'Thông báo khách hàng khi duyệt file', trigger: 'status_approved', action: 'send_email', target: 'client@event.com', isActive: true, lastRun: '1 ngày trước' },
    { id: 'a3', name: 'Báo lỗi render qua WhatsApp', trigger: 'status_rejected', action: 'send_whatsapp', target: '+84909000111', isActive: false },
  ]);

  const [affiliateData, _setAffiliateData] = useState<AffiliateStats>({
    totalEarned: 1250,
    pending: 300,
    referrals: 12,
    clicks: 450,
    links: [
        { id: 'l1', name: 'Giới thiệu Khóa học AI Basic', url: 'https://alphastudio.vn/ref/user001/course', commission: '10% giá trị khóa học' },
        { id: 'l2', name: 'Tuyển dụng Designer cho Job', url: 'https://alphastudio.vn/ref/user001/job/123', commission: '50 Credit / ứng viên' },
    ]
  });

  const [creativeAssets, setCreativeAssets] = useState<CreativeAsset[]>([
    { id: 'c1', title: 'Cyberpunk Stage Prompt', type: 'prompt', content: 'Futuristic stage, neon lights, holographic screens...', tags: ['stage', 'cyberpunk', 'midjourney'], author: 'Admin', likes: 15, downloads: 4 },
    { id: 'c2', title: 'Logo 3D Workflow', type: 'workflow', content: 'ComfyUI JSON for turning 2D logo to 3D metallic.', tags: ['logo', '3d', 'comfyui'], author: 'ProUser', likes: 28, downloads: 12 },
  ]);
  const [newAssetData, setNewAssetData] = useState({ title: '', type: 'prompt', content: '', tags: '' });

  const [resources, setResources] = useState<SharedResource[]>([
    { id: 'r1', title: 'Stage Design 3D Model (SketchUp)', type: 'project_file', format: 'SKP', size: '150 MB', author: 'Minh Thu', downloads: 25, uploadDate: '2024-06-24', description: 'Full 3D model for outdoor music festival stage.' },
    { id: 'r2', title: 'Event Budget Template 2024', type: 'industry_data', format: 'XLSX', size: '2 MB', author: 'Admin', downloads: 120, uploadDate: '2024-06-20', description: 'Comprehensive Excel template for event budgeting.' },
    { id: 'r3', title: 'Luxury Texture Pack', type: 'design_asset', format: 'ZIP', size: '500 MB', author: 'Quang Huy', downloads: 45, uploadDate: '2024-06-22', description: 'High-res textures for luxury event mapping.' },
  ]);
  const [newResourceData, setNewResourceData] = useState({ title: '', type: 'project_file', format: '', description: '' });

  // Partners state moved to PartnersView component with database integration

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const newDoc: WorkflowDocument = {
        id: Date.now().toString(),
        name: file.name,
        type: file.name.split('.').pop()?.toUpperCase() || 'FILE',
        size: `${(file.size / 1024 / 1024).toFixed(2)} MB`,
        uploadDate: new Date().toISOString().split('T')[0],
        uploader: `${userProfile.name} (User)`,
        department: selectedDept === 'all' ? 'event_planner' : selectedDept,
        status: 'pending',
        team: [],
        comments: [],
        projectId: selectedProject?.id,
        tasks: []
      };
      onAddDocument(newDoc);

      if (selectedProject) {
          const sysMsg: Comment = {
              id: `sys-${Date.now()}`,
              author: 'System',
              text: `${userProfile.name} uploaded file: ${file.name}`,
              timestamp: new Date().toLocaleTimeString(),
              isSystem: true
          };
          updateProjectChat(selectedProject.id, sysMsg);
      }
    }
  };

  const handleCreateProject = (e: React.FormEvent) => {
      e.preventDefault();
      const newProject: Project = {
          id: `proj-${Date.now()}`,
          name: newProjectData.name,
          client: newProjectData.client,
          description: newProjectData.description,
          department: newProjectData.department,
          status: 'planning',
          startDate: new Date().toISOString().split('T')[0],
          deadline: 'TBD',
          budget: Number(newProjectData.budget),
          expenses: 0,
          team: [{ id: 'me', name: userProfile.name, role: userProfile.role, avatar: 'https://ui-avatars.com/api/?name=Me', isExternal: false }],
          files: [],
          progress: 0,
          chatHistory: [{ id: 'sys-init', author: 'System', text: `Project "${newProjectData.name}" initialized.`, timestamp: new Date().toLocaleTimeString(), isSystem: true }],
          tasks: []
      };
      setProjects(prev => [newProject, ...prev]);

      const projectDoc: WorkflowDocument = {
          id: newProject.id,
          name: newProject.name,
          type: 'PROJECT',
          size: 'N/A',
          uploadDate: newProject.startDate,
          uploader: userProfile.name,
          department: newProject.department,
          status: 'approved',
          isProject: true,
          team: newProject.team,
          comments: [],
          projectId: newProject.id
      };
      onAddDocument(projectDoc);

      setShowProjectModal(false);
      setNewProjectData({ name: '', description: '', department: 'event_planner', client: '', budget: 0 });
      alert(t('workflow.dashboard.project.success'));
  };

  const handleCreateAsset = (e: React.FormEvent) => {
      e.preventDefault();
      const asset: CreativeAsset = {
          id: `c-${Date.now()}`,
          title: newAssetData.title,
          type: newAssetData.type as 'prompt' | 'workflow' | 'dataset',
          content: newAssetData.content,
          tags: newAssetData.tags.split(',').map(t => t.trim()),
          author: userProfile.name,
          likes: 0,
          downloads: 0
      };
      setCreativeAssets(prev => [asset, ...prev]);
      setShowCreativeModal(false);
      setBalance((prev: number) => prev + 100);
      setTransactions((prev: Transaction[]) => [{ id: `r-${Date.now()}`, type: 'reward', amount: 100, description: 'Thưởng đóng góp dữ liệu sáng tạo', date: new Date().toISOString().split('T')[0], status: 'completed' }, ...prev]);
      alert(t('workflow.creative.success'));
      setNewAssetData({ title: '', type: 'prompt', content: '', tags: '' });
  };

  const handleUploadResource = (e: React.FormEvent) => {
      e.preventDefault();
      const resource: SharedResource = {
          id: `r-${Date.now()}`,
          title: newResourceData.title,
          type: newResourceData.type as any,
          format: newResourceData.format || 'ZIP',
          size: '10 MB',
          author: userProfile.name,
          downloads: 0,
          uploadDate: new Date().toISOString().split('T')[0],
          description: newResourceData.description
      };
      setResources(prev => [resource, ...prev]);
      setShowResourceModal(false);
      setBalance((prev: number) => prev + 300);
      setTransactions((prev: Transaction[]) => [{ id: `rr-${Date.now()}`, type: 'reward', amount: 300, description: 'Thưởng chia sẻ tài nguyên', date: new Date().toISOString().split('T')[0], status: 'completed' }, ...prev]);
      alert(t('workflow.resources.success'));
      setNewResourceData({ title: '', type: 'project_file', format: '', description: '' });
  };

  // handleAddPartner moved to PartnersView component

  const toggleAutomation = (id: string) => { setAutomations(prev => prev.map(a => a.id === id ? { ...a, isActive: !a.isActive } : a)); };
  const copyToClipboard = (text: string) => { navigator.clipboard.writeText(text); alert(t('workflow.affiliate.copied')); };

  const handleOpenChat = (doc: WorkflowDocument) => { setActiveDocForChat(doc); };

  const handleAddMemberToProject = (user: TeamMember) => {
      if (!selectedProject) return;
      const currentTeam = selectedProject.team || [];
      if (currentTeam.find(m => m.id === user.id)) return;

      const MEMBER_COST = 50;

      if (user.isExternal) {
          if (balance < MEMBER_COST) {
              alert(t('workflow.collaboration.insufficient'));
              return;
          }
          if (confirm(`${t('workflow.collaboration.feeNotice')} (${MEMBER_COST} Coins)`)) {
              setBalance((prev: number) => prev - MEMBER_COST);
              setTransactions((prev: Transaction[]) => [{ id: `fee-${Date.now()}`, type: 'spend', amount: -MEMBER_COST, description: `Phí thêm thành viên dự án: ${user.name}`, date: new Date().toISOString().split('T')[0], status: 'completed' }, ...prev]);

              updateProjectTeamAndFinance(user, MEMBER_COST);
          }
      } else {
          if(confirm(`${t('workflow.collaboration.freeNotice')} (${user.name})`)) {
              updateProjectTeamAndFinance(user, 0);
          }
      }
  };

  const updateProjectTeamAndFinance = (user: TeamMember, cost: number) => {
      const sysMsg: Comment = {
          id: `sys-${Date.now()}`,
          author: 'System',
          text: `${user.name} joined the project.`,
          timestamp: new Date().toLocaleTimeString(),
          isSystem: true
      };

      setProjects(prev => prev.map(p => p.id === selectedProject?.id ? {
          ...p,
          team: [...p.team, user],
          expenses: p.expenses + cost,
          chatHistory: [...p.chatHistory, sysMsg]
      } : p));

      setSelectedProject(prev => prev ? {
          ...prev,
          team: [...prev.team, user],
          expenses: prev.expenses + cost,
          chatHistory: [...prev.chatHistory, sysMsg]
      } : null);

      setShowMemberSelect(false);
  };

  const handleSendProjectMessage = (e: React.FormEvent) => {
      e.preventDefault();
      if (!projectChatMessage.trim() || !selectedProject) return;

      const newMsg: Comment = {
          id: `msg-${Date.now()}`,
          author: userProfile.name,
          text: projectChatMessage,
          timestamp: new Date().toLocaleTimeString()
      };

      updateProjectChat(selectedProject.id, newMsg);
      setProjectChatMessage('');
  };

  const updateProjectChat = (projectId: string, msg: Comment) => {
      setProjects(prev => prev.map(p => p.id === projectId ? {
          ...p,
          chatHistory: [...p.chatHistory, msg]
      } : p));

      if (selectedProject && selectedProject.id === projectId) {
          setSelectedProject(prev => prev ? {
              ...prev,
              chatHistory: [...prev.chatHistory, msg]
          } : null);
      }
  };

  const handlePackageProject = () => {
      if (!selectedProject) return;
      if (confirm(t('workflow.dashboard.project.package.confirm'))) {
          setProjects(prev => prev.map(p => p.id === selectedProject.id ? { ...p, status: 'completed' } : p));
          setSelectedProject(prev => prev ? { ...prev, status: 'completed' } : null);
          alert(t('workflow.dashboard.project.package.success'));
      }
  };

  const handleCreateTask = () => {
      if (!newTaskData.title || !newTaskData.assigneeId) {
          alert("Vui lòng điền đủ thông tin nhiệm vụ.");
          return;
      }

      const assignee = availableUsers.find(u => u.id === newTaskData.assigneeId);
      const newTask: Task = {
          id: `task-${Date.now()}`,
          title: newTaskData.title,
          assigneeId: newTaskData.assigneeId,
          assigneeName: assignee ? assignee.name : 'Unknown',
          status: 'todo',
          dueDate: newTaskData.dueDate || 'TBD',
          fileId: selectedFileForTask ? selectedFileForTask.id : undefined
      };

      if (selectedProject) {
          const sysMsg: Comment = {
              id: `sys-task-${Date.now()}`,
              author: 'System',
              text: `Assigned task: "${newTask.title}" to ${newTask.assigneeName}`,
              timestamp: new Date().toLocaleTimeString(),
              isSystem: true
          };

          setProjects(prev => prev.map(p => p.id === selectedProject.id ? {
              ...p,
              tasks: [...p.tasks, newTask],
              chatHistory: [...p.chatHistory, sysMsg]
          } : p));

          setSelectedProject(prev => prev ? {
              ...prev,
              tasks: [...prev.tasks, newTask],
              chatHistory: [...prev.chatHistory, sysMsg]
          } : null);
      } else if (selectedFileForTask) {
          alert(`Đã giao việc "${newTask.title}" cho file ${selectedFileForTask.name}`);
      }

      setShowTaskModal(false);
      setNewTaskData({ title: '', assigneeId: '', dueDate: '' });
      setSelectedFileForTask(null);
  };

  const openTaskModalForFile = (doc: WorkflowDocument) => {
      setSelectedFileForTask(doc);
      setShowTaskModal(true);
  };

  const filteredDocs = documents.filter(doc => {
    const matchesDept = selectedDept === 'all' || doc.department === selectedDept;
    const matchesSearch = doc.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesDept && matchesSearch;
  });

  // Partners filtering moved to PartnersView component

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'approved': return 'bg-green-500/20 text-green-400 border-green-500/50';
      case 'rejected': return 'bg-red-500/20 text-red-400 border-red-500/50';
      default: return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50';
    }
  };

  const renderProjectHub = () => {
      if (!selectedProject) return null;
      const projectDocs = documents.filter(d => d.projectId === selectedProject.id);

      return (
          <div className="flex flex-col h-full animate-fade-in">
              <div className="p-6 border-b border-[var(--border-primary)] bg-[var(--bg-card)] flex justify-between items-center sticky top-0 z-10">
                  <div>
                      <button onClick={() => setSelectedProject(null)} className="text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] mb-1 flex items-center gap-1">
                          ← Back to Projects
                      </button>
                      <h1 className="text-2xl font-black text-[var(--text-primary)]">{selectedProject.name}</h1>
                      <div className="flex items-center gap-3 text-xs mt-1">
                          <span className="text-[var(--accent-primary)] font-bold">{selectedProject.client}</span>
                          <span className="text-[var(--text-tertiary)]">• {selectedProject.startDate} - {selectedProject.deadline}</span>
                          <span className={`px-2 py-0.5 rounded-full ${selectedProject.status === 'completed' ? 'bg-green-500/20 text-green-400' : 'bg-blue-500/20 text-blue-400'}`}>
                              {selectedProject.status.toUpperCase()}
                          </span>
                      </div>
                  </div>
                  {selectedProject.status !== 'completed' && (
                      <button onClick={handlePackageProject} className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-2 rounded-lg font-bold shadow-lg hover:opacity-90">
                          📦 {t('workflow.dashboard.project.package.btn')}
                      </button>
                  )}
              </div>

              <div className="flex border-b border-[var(--border-primary)] px-6 bg-[var(--bg-secondary)] overflow-x-auto">
                  {['overview', 'team', 'files', 'finance', 'chat', 'tasks'].map(tab => (
                      <button
                        key={tab}
                        onClick={() => setProjectTab(tab as any)}
                        className={`py-3 px-6 font-bold text-sm border-b-2 transition-colors whitespace-nowrap ${projectTab === tab ? 'border-[var(--accent-primary)] text-[var(--accent-primary)]' : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}
                      >
                          {t(`workflow.dashboard.project.tabs.${tab}`)}
                      </button>
                  ))}
              </div>

              <div className="p-6 overflow-y-auto flex-1">
                  {projectTab === 'overview' && (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          <div className="md:col-span-2 bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-xl p-6">
                              <h3 className="text-lg font-bold mb-4">Description</h3>
                              <p className="text-[var(--text-secondary)]">{selectedProject.description}</p>
                              <div className="mt-6">
                                  <h3 className="text-sm font-bold mb-2">Progress</h3>
                                  <div className="w-full bg-[var(--bg-secondary)] rounded-full h-4">
                                      <div className="bg-[var(--accent-primary)] h-4 rounded-full" style={{ width: `${selectedProject.progress}%` }}></div>
                                  </div>
                                  <p className="text-right text-xs mt-1">{selectedProject.progress}%</p>
                              </div>
                          </div>
                          <div className="bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-xl p-6">
                              <h3 className="text-lg font-bold mb-4">Quick Stats</h3>
                              <div className="space-y-4">
                                  <div className="flex justify-between"><span>Files</span> <span>{projectDocs.length}</span></div>
                                  <div className="flex justify-between"><span>Members</span> <span>{selectedProject.team.length}</span></div>
                                  <div className="flex justify-between text-yellow-400"><span>Budget</span> <span>{selectedProject.budget.toLocaleString()} Coins</span></div>
                              </div>
                          </div>
                      </div>
                  )}

                  {projectTab === 'team' && (
                      <div className="space-y-6">
                          <div className="flex justify-between items-center">
                              <h3 className="text-lg font-bold">Project Members</h3>
                              <button onClick={() => setShowMemberSelect(true)} className="bg-[var(--accent-primary)] text-black px-4 py-2 rounded-lg font-bold text-sm">+ Add Member</button>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                              {selectedProject.team.map(member => (
                                  <div key={member.id} className="bg-[var(--bg-card)] border border-[var(--border-primary)] p-4 rounded-xl flex items-center gap-4">
                                      <img src={member.avatar} className="w-10 h-10 rounded-full" />
                                      <div>
                                          <p className="font-bold">{member.name}</p>
                                          <p className="text-xs text-[var(--text-tertiary)]">{member.role}</p>
                                      </div>
                                      {member.isExternal && <span className="ml-auto text-[10px] bg-yellow-500/20 text-yellow-500 px-2 py-1 rounded">External (50c)</span>}
                                  </div>
                              ))}
                          </div>
                          {showMemberSelect && (
                            <div className="bg-[var(--bg-card)] border border-[var(--border-primary)] p-4 rounded-xl mt-4">
                                <h4 className="font-bold mb-2">Select to Add</h4>
                                <div className="space-y-2">
                                    {availableUsers.map(u => (
                                        <div key={u.id} onClick={() => handleAddMemberToProject(u)} className="flex justify-between items-center p-2 hover:bg-[var(--bg-secondary)] rounded cursor-pointer border border-transparent hover:border-[var(--border-primary)]">
                                            <div className="flex items-center gap-2">
                                                <img src={u.avatar} className="w-6 h-6 rounded-full" />
                                                <span>{u.name}</span>
                                            </div>
                                            <span className="text-xs text-[var(--accent-primary)]">{u.isExternal ? '50 Coins' : 'Free'}</span>
                                        </div>
                                    ))}
                                </div>
                                <button onClick={() => setShowMemberSelect(false)} className="mt-2 text-xs underline text-[var(--text-tertiary)]">Cancel</button>
                            </div>
                          )}
                      </div>
                  )}

                  {projectTab === 'files' && (
                      <div className="space-y-4">
                          <div className="flex justify-between items-center">
                              <h3 className="text-lg font-bold">Project Files</h3>
                              <label className="cursor-pointer bg-[var(--bg-secondary)] border border-[var(--border-primary)] px-4 py-2 rounded-lg font-bold text-sm hover:bg-[var(--border-primary)]">
                                  Upload File <input type="file" className="hidden" onChange={handleFileUpload} />
                              </label>
                          </div>
                          <div className="grid grid-cols-1 gap-2">
                              {projectDocs.length > 0 ? projectDocs.map(doc => (
                                  <div key={doc.id} className="flex items-center justify-between p-3 bg-[var(--bg-card)] rounded-lg border border-[var(--border-primary)]">
                                      <div className="flex items-center gap-3">
                                          <div className="w-8 h-8 bg-[var(--bg-secondary)] flex items-center justify-center rounded text-xs font-bold">{doc.type}</div>
                                          <div>
                                              <p className="font-medium text-sm">{doc.name}</p>
                                              <p className="text-xs text-[var(--text-tertiary)]">{doc.size} • {doc.uploadDate}</p>
                                          </div>
                                      </div>
                                      <div className="flex gap-2">
                                          <button onClick={() => openTaskModalForFile(doc)} className="text-xs bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 px-3 py-1 rounded">Assign Task</button>
                                          <button className="text-xs bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] px-3 py-1 rounded">Open</button>
                                      </div>
                                  </div>
                              )) : <p className="text-[var(--text-tertiary)] italic">No files in this project yet.</p>}
                          </div>
                      </div>
                  )}

                  {projectTab === 'finance' && (
                      <div className="space-y-6">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                              <div className="bg-gradient-to-br from-green-900/50 to-green-800/20 border border-green-500/30 p-6 rounded-2xl">
                                  <p className="text-sm text-green-300 font-bold uppercase">{t('workflow.dashboard.project.finance.budget')}</p>
                                  <div className="flex items-center gap-2 mt-1">
                                      <span className="text-2xl">🪙</span>
                                      <p className="text-2xl font-black text-white">{selectedProject.budget.toLocaleString()}</p>
                                  </div>
                              </div>
                              <div className="bg-gradient-to-br from-red-900/50 to-red-800/20 border border-red-500/30 p-6 rounded-2xl">
                                  <p className="text-sm text-red-300 font-bold uppercase">{t('workflow.dashboard.project.finance.expenses')}</p>
                                  <div className="flex items-center gap-2 mt-1">
                                      <span className="text-2xl">🪙</span>
                                      <p className="text-2xl font-black text-white">{selectedProject.expenses.toLocaleString()}</p>
                                  </div>
                              </div>
                              <div className="bg-gradient-to-br from-blue-900/50 to-blue-800/20 border border-blue-500/30 p-6 rounded-2xl">
                                  <p className="text-sm text-blue-300 font-bold uppercase">{t('workflow.dashboard.project.finance.profit')}</p>
                                  <div className="flex items-center gap-2 mt-1">
                                      <span className="text-2xl">🪙</span>
                                      <p className="text-2xl font-black text-white">{(selectedProject.budget - selectedProject.expenses).toLocaleString()}</p>
                                  </div>
                              </div>
                          </div>
                          <div className="bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-xl p-6">
                              <h3 className="font-bold mb-4">Add Expense</h3>
                              <div className="flex gap-2">
                                  <input placeholder="Expense Name" className="flex-1 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg p-2 text-sm" />
                                  <input placeholder="Amount (Coins)" type="number" className="w-32 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg p-2 text-sm" />
                                  <button className="bg-[var(--accent-primary)] text-black px-4 py-2 rounded-lg font-bold text-sm">Add</button>
                              </div>
                          </div>
                      </div>
                  )}

                  {projectTab === 'chat' && (
                      <div className="flex flex-col h-full">
                          <div className="flex-1 overflow-y-auto space-y-4 mb-4 pr-2">
                              {selectedProject.chatHistory.map(msg => (
                                  <div key={msg.id} className={`flex flex-col ${msg.isSystem ? 'items-center' : (msg.author === userProfile.name ? 'items-end' : 'items-start')}`}>
                                      {msg.isSystem ? (
                                          <span className="text-[10px] text-[var(--text-tertiary)] bg-[var(--bg-secondary)] px-2 py-0.5 rounded-full border border-[var(--border-primary)]">{msg.text}</span>
                                      ) : (
                                          <>
                                              <div className={`max-w-[80%] p-3 rounded-xl text-sm ${msg.author === userProfile.name ? 'bg-[var(--accent-primary)] text-black rounded-tr-none' : 'bg-[var(--bg-secondary)] text-[var(--text-primary)] rounded-tl-none border border-[var(--border-primary)]'}`}>
                                                  {msg.text}
                                              </div>
                                              <span className="text-[10px] text-[var(--text-tertiary)] mt-1 px-1">
                                                  {msg.author !== userProfile.name && `${msg.author} • `}{msg.timestamp}
                                              </span>
                                          </>
                                      )}
                                  </div>
                              ))}
                          </div>
                          <form onSubmit={handleSendProjectMessage} className="pt-4 border-t border-[var(--border-primary)] flex gap-2">
                              <button type="button" onClick={() => setShowTaskModal(true)} className="p-2.5 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-primary)] text-[var(--accent-primary)] hover:bg-[var(--accent-primary)] hover:text-black transition-colors" title={t('workflow.dashboard.project.tasks.addTask')}>
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" /></svg>
                              </button>
                              <input type="text" value={projectChatMessage} onChange={(e) => setProjectChatMessage(e.target.value)} placeholder={t('workflow.dashboard.project.chat.placeholder')} className="flex-1 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-[var(--accent-primary)]" />
                              <button type="submit" disabled={!projectChatMessage.trim()} className="bg-[var(--accent-primary)] text-black px-6 py-2 rounded-lg font-bold hover:opacity-90 transition-opacity disabled:opacity-50">{t('workflow.dashboard.project.chat.send')}</button>
                          </form>
                      </div>
                  )}

                  {projectTab === 'tasks' && (
                      <div className="space-y-6">
                          <div className="flex justify-between items-center">
                              <h3 className="text-lg font-bold">{t('workflow.dashboard.project.tasks.title')}</h3>
                              <button onClick={() => setShowTaskModal(true)} className="bg-[var(--accent-primary)] text-black px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2"><span>+</span> {t('workflow.dashboard.project.tasks.addTask')}</button>
                          </div>
                          <div className="space-y-3">
                              {selectedProject.tasks && selectedProject.tasks.length > 0 ? (
                                  selectedProject.tasks.map(task => (
                                      <div key={task.id} className="bg-[var(--bg-card)] border border-[var(--border-primary)] p-4 rounded-xl flex items-center justify-between hover:border-[var(--accent-primary)] transition-all">
                                          <div className="flex items-center gap-4">
                                              <div className={`w-3 h-3 rounded-full ${task.status === 'todo' ? 'bg-gray-500' : task.status === 'in_progress' ? 'bg-blue-500' : 'bg-green-500'}`}></div>
                                              <div>
                                                  <h4 className="font-bold">{task.title}</h4>
                                                  <p className="text-xs text-[var(--text-tertiary)]">{t('workflow.dashboard.project.tasks.assigned')}: {task.assigneeName} • Due: {task.dueDate}</p>
                                              </div>
                                          </div>
                                          <div className="flex items-center gap-2">
                                              <span className="text-xs uppercase font-bold tracking-wider px-2 py-1 rounded bg-[var(--bg-secondary)] text-[var(--text-secondary)]">{t(`workflow.dashboard.project.tasks.status.${task.status}`)}</span>
                                          </div>
                                      </div>
                                  ))
                              ) : (
                                  <div className="text-center py-10 text-[var(--text-tertiary)] italic">{t('workflow.dashboard.project.tasks.noTasks')}</div>
                              )}
                          </div>
                      </div>
                  )}
              </div>
          </div>
      );
  };

  const renderProjectList = () => (
      <div className="p-6 md:p-8 overflow-y-auto flex-1 animate-fade-in">
          <div className="flex justify-between items-center mb-8">
              <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[var(--accent-primary)] to-purple-500">{t('workflow.dashboard.project.hubTitle')}</h1>
              <button onClick={() => setShowProjectModal(true)} className="bg-[var(--accent-primary)] text-black font-bold px-6 py-2.5 rounded-lg shadow-lg hover:opacity-90 transition-all">+ {t('workflow.dashboard.createProject')}</button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {projects.map(project => (
                  <div key={project.id} onClick={() => setSelectedProject(project)} className="bg-[var(--bg-card)] border border-[var(--border-primary)] hover:border-[var(--accent-primary)] rounded-2xl p-6 cursor-pointer transition-all hover:-translate-y-1 shadow-lg group">
                      <div className="flex justify-between items-start mb-4">
                          <div className="w-12 h-12 rounded-lg bg-[var(--bg-secondary)] flex items-center justify-center text-2xl">{project.department === 'event_planner' ? '📅' : project.department === 'creative' ? '🎨' : '⚙️'}</div>
                          <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${project.status === 'active' ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'}`}>{project.status}</span>
                      </div>
                      <h3 className="text-xl font-bold text-[var(--text-primary)] mb-1 group-hover:text-[var(--accent-primary)] transition-colors">{project.name}</h3>
                      <p className="text-xs text-[var(--text-tertiary)] mb-4">{project.client}</p>
                      <div className="space-y-3">
                          <div className="flex justify-between text-xs font-medium"><span>Progress</span><span>{project.progress}%</span></div>
                          <div className="w-full h-1.5 bg-[var(--bg-secondary)] rounded-full overflow-hidden"><div className="h-full bg-[var(--accent-primary)] rounded-full" style={{ width: `${project.progress}%` }}></div></div>
                          <div className="flex justify-between items-center pt-2 border-t border-[var(--border-primary)]">
                              <div className="flex -space-x-2">{project.team.slice(0,3).map(m => (<img key={m.id} src={m.avatar} className="w-6 h-6 rounded-full border border-[var(--bg-card)]" />))}{project.team.length > 3 && <div className="w-6 h-6 rounded-full bg-[var(--bg-secondary)] flex items-center justify-center text-[8px] border border-[var(--bg-card)]">+{project.team.length-3}</div>}</div>
                              <span className="text-xs text-[var(--text-secondary)]">{project.deadline}</span>
                          </div>
                      </div>
                  </div>
              ))}
          </div>
      </div>
  );

  const renderContent = () => {
    if (selectedProject) return renderProjectHub();

    switch (activeView) {
      case 'projects': return renderProjectList();
      case 'resources': return (
        <div className="p-6 md:p-8 overflow-y-auto flex-1 animate-fade-in">
            <div className="flex justify-between items-center mb-8">
                <div><h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-amber-400 mb-2">{t('workflow.resources.title')}</h1><p className="text-[var(--text-secondary)]">{t('workflow.resources.subtitle')}</p></div>
                <button onClick={() => setShowResourceModal(true)} className="bg-[var(--accent-primary)] text-black font-bold px-6 py-2.5 rounded-lg shadow-lg hover:opacity-90 transition-all flex items-center gap-2"><span>+</span> {t('workflow.resources.upload')}</button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {resources.map(res => (
                    <div key={res.id} className="bg-[var(--bg-card)] border border-[var(--border-primary)] p-6 rounded-xl hover:border-[var(--accent-primary)] transition-all flex flex-col h-full group">
                        <div className="flex justify-between items-start mb-4"><span className={`px-2 py-1 rounded text-xs font-bold uppercase ${res.type === 'project_file' ? 'bg-blue-500/20 text-blue-400' : res.type === 'design_asset' ? 'bg-purple-500/20 text-purple-400' : 'bg-green-500/20 text-green-400'}`}>{t(`workflow.resources.types.${res.type}`)}</span><div className="text-xs text-[var(--text-tertiary)] bg-[var(--bg-secondary)] px-2 py-1 rounded">{res.format}</div></div>
                        <h3 className="text-lg font-bold text-[var(--text-primary)] mb-2 group-hover:text-[var(--accent-primary)] transition-colors">{res.title}</h3>
                        <p className="text-sm text-[var(--text-secondary)] mb-4 flex-grow line-clamp-3">{res.description}</p>
                        <div className="flex justify-between items-center text-xs text-[var(--text-tertiary)] border-t border-[var(--border-primary)] pt-4 mt-auto"><span>{res.size} • {res.uploadDate}</span><div className="flex items-center gap-2"><span>⬇️ {res.downloads}</span><span>👤 {res.author}</span></div></div>
                        <button className="w-full mt-4 py-2 rounded-lg bg-[var(--bg-secondary)] hover:bg-[var(--accent-primary)] hover:text-black font-bold text-sm transition-all border border-[var(--border-primary)]">Download</button>
                    </div>
                ))}
            </div>
        </div>
      );
      case 'creative': return (
        <div className="p-6 md:p-8 overflow-y-auto flex-1 animate-fade-in">
            <div className="flex justify-between items-center mb-8"><div><h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-violet-400 mb-2">{t('workflow.creative.title')}</h1><p className="text-[var(--text-secondary)]">{t('workflow.creative.subtitle')}</p></div><button onClick={() => setShowCreativeModal(true)} className="bg-[var(--accent-primary)] text-black font-bold px-6 py-2.5 rounded-lg shadow-lg hover:opacity-90 transition-all flex items-center gap-2"><span>+</span> {t('workflow.creative.create')}</button></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">{creativeAssets.map(asset => (<div key={asset.id} className="bg-[var(--bg-card)] border border-[var(--border-primary)] p-6 rounded-xl hover:border-[var(--accent-primary)] transition-all"><div className="flex justify-between items-start mb-4"><span className={`px-2 py-1 rounded text-xs font-bold uppercase ${asset.type === 'prompt' ? 'bg-blue-500/20 text-blue-400' : 'bg-purple-500/20 text-purple-400'}`}>{asset.type}</span><div className="text-xs text-[var(--text-tertiary)] flex gap-3"><span>❤️ {asset.likes}</span><span>⬇️ {asset.downloads}</span></div></div><h3 className="text-lg font-bold text-[var(--text-primary)] mb-2">{asset.title}</h3><p className="text-sm text-[var(--text-secondary)] line-clamp-3 mb-4 font-mono bg-black/20 p-2 rounded">{asset.content}</p><div className="flex flex-wrap gap-2 mb-4">{asset.tags.map(tag => (<span key={tag} className="text-[10px] bg-[var(--bg-secondary)] text-[var(--text-tertiary)] px-2 py-1 rounded">#{tag}</span>))}</div><div className="text-xs text-[var(--text-tertiary)] text-right">By {asset.author}</div></div>))}</div>
        </div>
      );
      case 'automation': return (
        <div className="p-6 md:p-8 overflow-y-auto flex-1 animate-fade-in">
            <div className="flex justify-between items-center mb-8"><h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-400">{t('workflow.automation.title')}</h1><button className="bg-[var(--accent-primary)] text-black font-bold px-6 py-2.5 rounded-lg shadow-lg hover:opacity-90 transition-all flex items-center gap-2"><span>+</span> {t('workflow.automation.create')}</button></div>
            <div className="grid grid-cols-1 gap-4">{automations.map(auto => (<div key={auto.id} className="bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-all hover:border-[var(--accent-primary)]"><div className="flex items-center gap-4"><div className={`w-12 h-12 rounded-lg flex items-center justify-center text-2xl ${auto.isActive ? 'bg-green-500/10 text-green-500' : 'bg-gray-500/10 text-gray-500'}`}>{auto.action === 'send_email' ? '📧' : auto.action === 'send_telegram' ? '✈️' : '💬'}</div><div><h3 className="font-bold text-lg text-[var(--text-primary)]">{auto.name}</h3><p className="text-sm text-[var(--text-secondary)] flex items-center gap-2"><span className="font-mono bg-[var(--bg-secondary)] px-1.5 py-0.5 rounded text-xs">{t(`workflow.automation.triggers.${auto.trigger}`)}</span><span>➜</span><span className="font-mono bg-[var(--bg-secondary)] px-1.5 py-0.5 rounded text-xs">{auto.target}</span></p>{auto.lastRun && <p className="text-xs text-[var(--text-tertiary)] mt-1">{t('workflow.automation.lastRun')}: {auto.lastRun}</p>}</div></div><div className="flex items-center gap-4"><span className={`text-sm font-bold ${auto.isActive ? 'text-green-500' : 'text-gray-500'}`}>{auto.isActive ? t('workflow.automation.active') : t('workflow.automation.inactive')}</span><label className="relative inline-flex items-center cursor-pointer"><input type="checkbox" checked={auto.isActive} onChange={() => toggleAutomation(auto.id)} className="sr-only peer" /><div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div></label></div></div>))}</div>
        </div>
      );
      case 'affiliate': return (
        <div className="p-6 md:p-8 overflow-y-auto flex-1 animate-fade-in">
            <div className="mb-8"><h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-rose-400 mb-2">{t('workflow.affiliate.title')}</h1><p className="text-[var(--text-secondary)]">{t('workflow.affiliate.subtitle')}</p></div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"><div className="bg-[var(--bg-card)] border border-[var(--border-primary)] p-6 rounded-2xl"><p className="text-xs font-bold text-[var(--text-tertiary)] uppercase mb-2">{t('workflow.affiliate.totalEarned')}</p><p className="text-3xl font-black text-yellow-400">{affiliateData.totalEarned} <span className="text-sm text-[var(--text-secondary)]">Coins</span></p></div><div className="bg-[var(--bg-card)] border border-[var(--border-primary)] p-6 rounded-2xl"><p className="text-xs font-bold text-[var(--text-tertiary)] uppercase mb-2">{t('workflow.affiliate.pending')}</p><p className="text-3xl font-black text-blue-400">{affiliateData.pending} <span className="text-sm text-[var(--text-secondary)]">Coins</span></p></div><div className="bg-[var(--bg-card)] border border-[var(--border-primary)] p-6 rounded-2xl"><p className="text-xs font-bold text-[var(--text-tertiary)] uppercase mb-2">{t('workflow.affiliate.referrals')}</p><p className="text-3xl font-black text-green-400">{affiliateData.referrals}</p></div><div className="bg-[var(--bg-card)] border border-[var(--border-primary)] p-6 rounded-2xl"><p className="text-xs font-bold text-[var(--text-tertiary)] uppercase mb-2">{t('workflow.affiliate.clicks')}</p><p className="text-3xl font-black text-purple-400">{affiliateData.clicks}</p></div></div>
            <h3 className="text-xl font-bold text-[var(--text-primary)] mb-4">{t('workflow.affiliate.program')}</h3>
            <div className="space-y-4 mb-8">{affiliateData.links.map(link => (<div key={link.id} className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] p-4 rounded-xl flex flex-col md:flex-row items-center justify-between gap-4"><div className="flex-1"><h4 className="font-bold text-[var(--text-primary)]">{link.name}</h4><p className="text-xs text-[var(--accent-primary)] mt-1">{t('workflow.affiliate.commission')}: {link.commission}</p></div><div className="flex items-center gap-3 w-full md:w-auto"><code className="bg-black/30 px-3 py-2 rounded text-xs text-[var(--text-secondary)] flex-1 md:flex-none truncate max-w-[200px]">{link.url}</code><button onClick={() => copyToClipboard(link.url)} className="bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] hover:bg-[var(--accent-primary)] hover:text-black px-4 py-2 rounded-lg text-xs font-bold transition-colors">{t('workflow.affiliate.copyLink')}</button></div></div>))}</div>
        </div>
      );
      case 'wallet': return <WalletView />;
      case 'jobs': return <JobsView searchQuery={searchQuery} />;
      case 'partners': return <PartnersView searchQuery={searchQuery} />;
      default: return (
        <div className="p-6 md:p-8 overflow-y-auto flex-1">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
                <div><h1 className="text-2xl font-bold">{t(`workflow.depts.${selectedDept}`)}</h1><p className="text-[var(--text-secondary)]">{filteredDocs.length} documents found</p></div>
                <div className="flex gap-3">
                    <button onClick={onOpenStudio} className="py-2 px-4 bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-secondary)] text-[var(--text-on-accent)] font-bold rounded-lg hover:opacity-90 transition-opacity flex items-center gap-2 shadow-lg shadow-[var(--accent-shadow)]"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" /></svg>{t('workflow.dashboard.create')}</button>
                    <label className="cursor-pointer py-2 px-4 bg-[var(--bg-secondary)] border border-[var(--border-primary)] text-[var(--text-primary)] font-bold rounded-lg hover:bg-[var(--border-primary)] transition-colors flex items-center gap-2"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" /></svg>{t('workflow.dashboard.upload')}<input type="file" className="hidden" onChange={handleFileUpload} /></label>
                </div>
            </div>
            <div className="bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead><tr className="bg-[var(--bg-secondary)] border-b border-[var(--border-primary)] text-xs uppercase tracking-wider text-[var(--text-secondary)]"><th className="p-4 font-medium">{t('workflow.dashboard.table.name')}</th><th className="p-4 font-medium">{t('workflow.dashboard.table.dept')}</th><th className="p-4 font-medium hidden md:table-cell">{t('workflow.dashboard.table.date')}</th><th className="p-4 font-medium">{t('workflow.dashboard.table.status')}</th><th className="p-4 font-medium text-right">{t('workflow.dashboard.table.action')}</th></tr></thead>
                        <tbody className="divide-y divide-[var(--border-primary)]">
                            {filteredDocs.length > 0 ? filteredDocs.map((doc) => (
                                <tr key={doc.id} className="hover:bg-[var(--bg-secondary)]/50 transition-colors group">
                                    <td className="p-4"><div className="flex items-center gap-3"><div className={`w-8 h-8 rounded flex items-center justify-center text-xs font-bold ${doc.isProject ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' : 'bg-[var(--bg-secondary)] border border-[var(--border-primary)] text-[var(--text-secondary)]'}`}>{doc.isProject ? 'P' : doc.type}</div><div><p className={`font-medium ${doc.isProject ? 'text-[var(--accent-primary)]' : 'text-[var(--text-primary)]'}`}>{doc.name}</p><p className="text-xs text-[var(--text-tertiary)]">{doc.uploader} • {doc.size}</p></div></div></td>
                                    <td className="p-4 text-sm text-[var(--text-secondary)] capitalize">{t(`workflow.depts.${doc.department}`)}</td>
                                    <td className="p-4 text-sm text-[var(--text-secondary)] hidden md:table-cell">{doc.uploadDate}</td>
                                    <td className="p-4"><span className={`px-2 py-1 rounded text-xs font-bold uppercase border ${getStatusColor(doc.status)}`}>{t(`workflow.dashboard.status.${doc.status}`)}</span></td>
                                    <td className="p-4 text-right"><div className="flex justify-end gap-2"><button onClick={() => doc.isProject ? setSelectedProject(projects.find(p => p.id === (doc.projectId || doc.id)) || null) : handleOpenChat(doc)} className="p-1 text-[var(--text-secondary)] hover:text-[var(--text-primary)]"><svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" /></svg></button><button className="p-1 text-[var(--text-secondary)] hover:text-[var(--text-primary)]"><svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" /></svg></button></div></td>
                                </tr>
                            )) : (<tr><td colSpan={5} className="p-8 text-center text-[var(--text-tertiary)]">{t('workflow.dashboard.noFiles')}</td></tr>)}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
      );
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] font-sans flex">
        {/* Sidebar */}
        <div className="w-20 md:w-64 bg-[var(--bg-card)] border-r border-[var(--border-primary)] flex flex-col flex-shrink-0">
            <div className="p-6 border-b border-[var(--border-primary)] flex items-center gap-3">
                <button onClick={onBack} className="p-2 rounded-lg hover:bg-[var(--bg-secondary)] transition-colors"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" /></svg></button>
                <span className="font-black text-lg hidden md:block tracking-tight text-white">Alpha Connect</span>
            </div>
            <div className="flex-1 overflow-y-auto py-6 space-y-6 px-3">
                <div><p className="px-4 text-[10px] font-bold text-[var(--text-tertiary)] uppercase tracking-wider mb-2">{t('workflow.sidebar.fileManagement')}</p>
                    <div className="space-y-1">
                        <button onClick={() => { setActiveView('documents'); setSelectedProject(null); setSelectedDept('all'); }} className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${(activeView as string) === 'documents' && selectedDept === 'all' && !selectedProject ? 'bg-[var(--accent-primary)] text-black font-bold shadow-lg' : 'text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] hover:text-[var(--text-primary)]'}`}><span className="text-xl">📂</span><span className="hidden md:block text-sm">{t('workflow.sidebar.allDocuments')}</span></button>
                        <button onClick={() => { setActiveView('documents'); setSelectedProject(null); setSelectedDept('creative'); }} className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${(activeView as string) === 'documents' && selectedDept === 'creative' && !selectedProject ? 'bg-[var(--accent-primary)] text-black font-bold shadow-lg' : 'text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] hover:text-[var(--text-primary)]'}`}><span className="text-xl">🎨</span><span className="hidden md:block text-sm">{t('workflow.sidebar.teamCreative')}</span></button>
                        <button onClick={() => { setActiveView('documents'); setSelectedProject(null); setSelectedDept('event_planner'); }} className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${(activeView as string) === 'documents' && selectedDept === 'event_planner' && !selectedProject ? 'bg-[var(--accent-primary)] text-black font-bold shadow-lg' : 'text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] hover:text-[var(--text-primary)]'}`}><span className="text-xl">📢</span><span className="hidden md:block text-sm">{t('workflow.sidebar.eventPlanner')}</span></button>
                        <button onClick={() => { setActiveView('projects'); setSelectedProject(null); }} className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${(activeView as string) === 'projects' && !selectedProject ? 'bg-[var(--accent-primary)] text-black font-bold shadow-lg' : 'text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] hover:text-[var(--text-primary)]'}`}><span className="text-xl">💼</span><span className="hidden md:block text-sm">{t('workflow.sidebar.account')}</span></button>
                        <button onClick={() => { setActiveView('documents'); setSelectedProject(null); setSelectedDept('operation'); }} className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${(activeView as string) === 'documents' && selectedDept === 'operation' && !selectedProject ? 'bg-[var(--accent-primary)] text-black font-bold shadow-lg' : 'text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] hover:text-[var(--text-primary)]'}`}><span className="text-xl">🏭</span><span className="hidden md:block text-sm">{t('workflow.sidebar.production')}</span></button>
                    </div>
                </div>
                <div><p className="px-4 text-[10px] font-bold text-[var(--text-tertiary)] uppercase tracking-wider mb-2">{t('workflow.sidebar.networkOpportunity')}</p>
                    <div className="space-y-1">
                        <button onClick={() => { setActiveView('jobs'); setSelectedProject(null); }} className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${(activeView as string) === 'jobs' ? 'bg-[var(--accent-primary)] text-black font-bold shadow-lg' : 'text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] hover:text-[var(--text-primary)]'}`}><span className="text-xl">🚀</span><div className="hidden md:flex flex-col items-start"><span className="text-sm">{t('workflow.sidebar.jobMarket')}</span><span className="text-[10px] opacity-70">{t('workflow.sidebar.freelancer')}</span></div>{(activeView as string) !== 'jobs' && <span className="ml-auto bg-red-500 text-white text-[9px] px-1.5 py-0.5 rounded-full font-bold">New</span>}</button>
                        <button onClick={() => { setActiveView('partners'); setSelectedProject(null); }} className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${(activeView as string) === 'partners' ? 'bg-[#1e293b] border border-[var(--border-primary)] shadow-lg' : 'text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] hover:text-[var(--text-primary)]'}`}><span className="text-xl">🤝</span><span className={`hidden md:block text-sm ${(activeView as string) === 'partners' ? 'text-[var(--accent-primary)] font-bold' : ''}`}>{t('workflow.sidebar.partners')}</span></button>
                        <button onClick={() => { setActiveView('affiliate'); setSelectedProject(null); }} className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${(activeView as string) === 'affiliate' ? 'bg-[var(--accent-primary)] text-black font-bold shadow-lg' : 'text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] hover:text-[var(--text-primary)]'}`}><span className="text-xl">💸</span><span className="hidden md:block text-sm">{t('workflow.sidebar.affiliate')}</span></button>
                        <button onClick={() => { setActiveView('wallet'); setSelectedProject(null); }} className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${(activeView as string) === 'wallet' ? 'bg-[var(--accent-primary)] text-black font-bold shadow-lg' : 'text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] hover:text-[var(--text-primary)]'}`}><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg><span className="hidden md:block text-sm">{t('workflow.sidebar.creditWallet')}</span></button>
                    </div>
                </div>
                <div><p className="px-4 text-[10px] font-bold text-[var(--text-tertiary)] uppercase tracking-wider mb-2">{t('workflow.sidebar.communityResources')}</p>
                    <div className="space-y-1">
                        <button onClick={() => { setActiveView('creative'); setSelectedProject(null); }} className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${(activeView as string) === 'creative' ? 'bg-[var(--accent-primary)] text-black font-bold shadow-lg' : 'text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] hover:text-[var(--text-primary)]'}`}><span className="text-xl">🎨</span><span className="hidden md:block text-sm">{t('workflow.sidebar.sharePrompts')}</span></button>
                        <button onClick={() => { setActiveView('resources'); setSelectedProject(null); }} className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${(activeView as string) === 'resources' ? 'bg-[var(--accent-primary)] text-black font-bold shadow-lg' : 'text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] hover:text-[var(--text-primary)]'}`}><span className="text-xl">📦</span><span className="hidden md:block text-sm">{t('workflow.sidebar.resourceHub')}</span></button>
                    </div>
                </div>
            </div>
            <div className="p-4 border-t border-[var(--border-primary)]"><button onClick={onBack} className="flex items-center gap-3 p-2 w-full rounded-xl hover:bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:text-white transition-colors"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg><span className="hidden md:block text-sm font-bold">{t('workflow.sidebar.exitStudio')}</span></button></div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col h-screen overflow-hidden">
            <header className="h-16 border-b border-[var(--border-primary)] bg-[var(--bg-card-alpha)] backdrop-blur-md flex items-center justify-between px-6 sticky top-0 z-20">
                 <div className="flex items-center gap-4 flex-1"><div className="relative w-full max-w-md"><input type="text" placeholder={t('workflow.dashboard.search')} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-10 pr-4 py-2 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg text-sm text-[var(--text-primary)] focus:ring-1 focus:ring-[var(--accent-primary)] placeholder-[var(--text-tertiary)]" /><svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg></div></div>
                 <div className="flex items-center gap-4"><div className="flex items-center gap-2"><LanguageSwitcher /><ThemeSwitcher /></div><div onClick={() => setShowProfileModal(true)} className="w-8 h-8 rounded-full bg-gradient-to-tr from-[var(--accent-primary)] to-[var(--accent-secondary)] flex items-center justify-center text-[var(--text-on-accent)] font-bold text-sm cursor-pointer hover:scale-110 transition-transform overflow-hidden">{user?.avatar ? <img src={user.avatar} alt={userProfile.name} className="w-full h-full object-cover" /> : userProfile.name.charAt(0).toUpperCase()}</div></div>
            </header>
            {renderContent()}
        </div>

        {/* Modals */}
        <ProfileEditModal
            isOpen={showProfileModal}
            onClose={() => setShowProfileModal(false)}
        />
        {/* PartnerRegistrationModal moved to PartnersView component */}

        {showProjectModal && (<div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"><div className="bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-2xl w-full max-w-lg p-6"><h2 className="text-2xl font-bold mb-4">{t('workflow.dashboard.project.modalTitle')}</h2><form onSubmit={handleCreateProject} className="space-y-4"><input placeholder={t('workflow.dashboard.project.nameLabel')} value={newProjectData.name} onChange={e => setNewProjectData({...newProjectData, name: e.target.value})} className="w-full p-3 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg" required /><input placeholder={t('workflow.dashboard.project.descLabel')} value={newProjectData.description} onChange={e => setNewProjectData({...newProjectData, description: e.target.value})} className="w-full p-3 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg" required /><input placeholder="Client" value={newProjectData.client} onChange={e => setNewProjectData({...newProjectData, client: e.target.value})} className="w-full p-3 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg" required /><input type="number" placeholder="Budget (Coins)" value={newProjectData.budget || ''} onChange={e => setNewProjectData({...newProjectData, budget: parseInt(e.target.value)})} className="w-full p-3 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg" required /><select value={newProjectData.department} onChange={e => setNewProjectData({...newProjectData, department: e.target.value as any})} className="w-full p-3 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg"><option value="event_planner">Event Planner</option><option value="creative">Creative</option><option value="operation">Operation</option></select><div className="flex gap-2 justify-end mt-4"><button type="button" onClick={() => setShowProjectModal(false)} className="px-4 py-2 rounded-lg text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)]">Cancel</button><button type="submit" className="px-4 py-2 bg-[var(--accent-primary)] text-black font-bold rounded-lg">{t('workflow.dashboard.project.createBtn')}</button></div></form></div></div>)}

        {showCreativeModal && (<div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"><div className="bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-2xl w-full max-w-lg p-6"><h2 className="text-2xl font-bold mb-4">{t('workflow.creative.form.title')}</h2><form onSubmit={handleCreateAsset} className="space-y-4"><input placeholder={t('workflow.creative.form.assetTitle')} value={newAssetData.title} onChange={e => setNewAssetData({...newAssetData, title: e.target.value})} className="w-full p-3 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg" required /><select value={newAssetData.type} onChange={e => setNewAssetData({...newAssetData, type: e.target.value})} className="w-full p-3 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg"><option value="prompt">Prompt</option><option value="workflow">Workflow</option><option value="dataset">Dataset</option></select><textarea placeholder={t('workflow.creative.form.content')} value={newAssetData.content} onChange={e => setNewAssetData({...newAssetData, content: e.target.value})} className="w-full p-3 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg h-32" required /><input placeholder={t('workflow.creative.form.tags')} value={newAssetData.tags} onChange={e => setNewAssetData({...newAssetData, tags: e.target.value})} className="w-full p-3 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg" /><div className="flex gap-2 justify-end mt-4"><button type="button" onClick={() => setShowCreativeModal(false)} className="px-4 py-2 rounded-lg text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)]">Cancel</button><button type="submit" className="px-4 py-2 bg-[var(--accent-primary)] text-black font-bold rounded-lg">{t('workflow.creative.form.submit')}</button></div></form></div></div>)}

        {showResourceModal && (<div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"><div className="bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-2xl w-full max-w-lg p-6"><h2 className="text-2xl font-bold mb-4">{t('workflow.resources.form.title')}</h2><form onSubmit={handleUploadResource} className="space-y-4"><input placeholder={t('workflow.resources.form.name')} value={newResourceData.title} onChange={e => setNewResourceData({...newResourceData, title: e.target.value})} className="w-full p-3 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg" required /><select value={newResourceData.type} onChange={e => setNewResourceData({...newResourceData, type: e.target.value})} className="w-full p-3 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg"><option value="project_file">Project File</option><option value="design_asset">Design Asset</option><option value="industry_data">Industry Data</option><option value="template">Template</option></select><input placeholder={t('workflow.resources.form.format')} value={newResourceData.format} onChange={e => setNewResourceData({...newResourceData, format: e.target.value})} className="w-full p-3 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg" required /><textarea placeholder={t('workflow.resources.form.desc')} value={newResourceData.description} onChange={e => setNewResourceData({...newResourceData, description: e.target.value})} className="w-full p-3 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg h-32" required /><div className="flex gap-2 justify-end mt-4"><button type="button" onClick={() => setShowResourceModal(false)} className="px-4 py-2 rounded-lg text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)]">Cancel</button><button type="submit" className="px-4 py-2 bg-[var(--accent-primary)] text-black font-bold rounded-lg">{t('workflow.resources.form.submit')}</button></div></form></div></div>)}

        {showTaskModal && (<div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"><div className="bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-2xl w-full max-w-lg p-6"><h2 className="text-2xl font-bold mb-4">{t('workflow.dashboard.project.tasks.modal.title')}</h2><div className="space-y-4"><input placeholder={t('workflow.dashboard.project.tasks.modal.titleLabel')} value={newTaskData.title} onChange={e => setNewTaskData({...newTaskData, title: e.target.value})} className="w-full p-3 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg" /><select value={newTaskData.assigneeId} onChange={e => setNewTaskData({...newTaskData, assigneeId: e.target.value})} className="w-full p-3 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg"><option value="">Select Assignee</option>{availableUsers.map(u => (<option key={u.id} value={u.id}>{u.name} ({u.role})</option>))}</select><input type="date" value={newTaskData.dueDate} onChange={e => setNewTaskData({...newTaskData, dueDate: e.target.value})} className="w-full p-3 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg" />{selectedFileForTask && (<div className="text-sm bg-[var(--bg-secondary)] p-2 rounded">Attached: {selectedFileForTask.name}</div>)}<div className="flex gap-2 justify-end mt-4"><button onClick={() => { setShowTaskModal(false); setSelectedFileForTask(null); }} className="px-4 py-2 rounded-lg text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)]">Cancel</button><button onClick={handleCreateTask} className="px-4 py-2 bg-[var(--accent-primary)] text-black font-bold rounded-lg">{t('workflow.dashboard.project.tasks.modal.submit')}</button></div></div></div></div>)}
    </div>
  );
}
