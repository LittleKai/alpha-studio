
import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from '../../i18n/context';
import { useAuth } from '../../auth/context';
import type { WorkflowDocument, DepartmentType, Transaction, AutomationRule, AffiliateStats, TeamMember, Comment, Project, Task } from '../../types';
import {
    getProjects,
    createProject as createProjectAPI,
    updateProject as updateProjectAPI,
    deleteProject as deleteProjectAPI,
    getDocuments,
    createDocument as createDocumentAPI,
    updateDocument as updateDocumentAPI,
    deleteDocument as deleteDocumentAPI,
    searchUsers,
    getUserProfile,
    type UserPublicProfile
} from '../../services/workflowService';
import { Editor } from '@tinymce/tinymce-react';
import { uploadToCloudinary } from '../../services/cloudinaryService';
import { uploadToB2 } from '../../services/b2StorageService';
import LoadingSpinner from '../ui/LoadingSpinner';
// StudentProfileModal and PartnerRegistrationModal not used - moved to separate view components
import LanguageSwitcher from '../ui/LanguageSwitcher';
import ThemeSwitcher from '../ui/ThemeSwitcher';
import { JobsView, PartnersView, PromptsView, ResourcesView } from './views';
import ProfileEditModal from '../modals/ProfileEditModal';

interface WorkflowDashboardProps {
  onBack: () => void;
}

export default function WorkflowDashboard({ onBack }: WorkflowDashboardProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [documents, setDocuments] = useState<WorkflowDocument[]>([]);
  const [loading, setLoading] = useState(true);

  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { id: projectIdParam } = useParams<{ id: string }>();

  // Navigation State
  const [activeView, setActiveView] = useState<'documents' | 'projects' | 'jobs' | 'partners' | 'automation' | 'affiliate' | 'creative' | 'resources'>('documents');
  const [searchQuery, setSearchQuery] = useState('');
  // partnerFilter moved to PartnersView component

  // Collaboration State
  const [activeDocForComment, setActiveDocForComment] = useState<WorkflowDocument | null>(null);
  const [docComment, setDocComment] = useState('');
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
  const [memberProfileModal, setMemberProfileModal] = useState<{ member: TeamMember; profile: UserPublicProfile | null; loading: boolean } | null>(null);
  // showPartnerModal moved to PartnersView component
  // showCreativeModal and showResourceModal moved to PromptsView and ResourcesView components
  const [showProjectModal, setShowProjectModal] = useState(false);

  // New Project Data
  const [newProjectData, setNewProjectData] = useState({ name: '', tagline: '', description: '', department: 'event_planner' as DepartmentType, client: '', budget: 0, deadline: '' });

  // Expense Form State
  const [newExpense, setNewExpense] = useState({ name: '', amount: '' });

  // Chat auto-scroll
  const chatEndRef = useRef<HTMLDivElement>(null);

  // User search for Add Member
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [userSearchResults, setUserSearchResults] = useState<TeamMember[]>([]);
  const [userSearchLoading, setUserSearchLoading] = useState(false);

  // Edit project modal
  const [showEditProjectModal, setShowEditProjectModal] = useState(false);
  const [editProjectData, setEditProjectData] = useState({ name: '', tagline: '', requirements: '', description: '', avatar: '', department: 'event_planner' as DepartmentType, client: '', budget: 0, deadline: '' });
  const [editProjectUploading, setEditProjectUploading] = useState(false);

  // Project list department filter
  const [projectDeptFilter, setProjectDeptFilter] = useState<DepartmentType>('all');
  // Project list "Mine" filter (projects the current user is a member of)
  const [projectMineFilter, setProjectMineFilter] = useState(false);

  // Upload progress per tempId: 0–100
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});

  // All Documents view — sort & filter
  const [docSortField, setDocSortField] = useState<'name' | 'date' | 'project'>('date');
  const [docSortDir, setDocSortDir] = useState<'asc' | 'desc'>('desc');
  const [docSourceFilter, setDocSourceFilter] = useState<'all' | 'personal' | 'project'>('all');

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

  // creativeAssets and resources state moved to PromptsView and ResourcesView components
  // Partners state moved to PartnersView component with database integration

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return;
    const file = e.target.files[0];
    e.target.value = '';

    // Non-admin users: file size limit (10 MB) and personal file count limit (20)
    if (user?.role !== 'admin') {
        const MAX_MB = 10;
        if (file.size > MAX_MB * 1024 * 1024) {
            alert(t('workflow.dashboard.uploadSizeLimit'));
            return;
        }
        // Personal file count limit (only applies when not uploading to a project)
        if (!selectedProject) {
            const personalCount = documents.filter(d => !d.projectId && d.createdBy === user?._id).length;
            if (personalCount >= 20) {
                alert(t('workflow.dashboard.uploadFileLimit'));
                return;
            }
        }
    }

    const token = localStorage.getItem('alpha_studio_token') || '';
    const uploadDate = new Date().toISOString().split('T')[0];
    const tempId = `temp-doc-${Date.now()}`;
    const newDoc: WorkflowDocument = {
        id: tempId,
        name: file.name,
        type: file.name.split('.').pop()?.toUpperCase() || 'FILE',
        size: `${(file.size / 1024 / 1024).toFixed(2)} MB`,
        uploadDate,
        uploader: userProfile.name,
        status: 'pending',
        comments: [],
        projectId: selectedProject?.id,
        url: '',
    };
    setDocuments(prev => [newDoc, ...prev]);
    setUploadProgress(prev => ({ ...prev, [tempId]: 0 }));

    // Upload to Backblaze B2 with progress tracking
    let uploadUrl = '';
    let fileKey = '';
    try {
        const b2Result = await uploadToB2(file, 'workflow-docs', token, (p) => {
            setUploadProgress(prev => ({ ...prev, [tempId]: p }));
        });
        uploadUrl = b2Result.url;
        fileKey = b2Result.key;
        setDocuments(prev => prev.map(d => d.id === tempId ? { ...d, url: uploadUrl } : d));
    } catch { /* proceed without URL on error */ } finally {
        setUploadProgress(prev => { const n = { ...prev }; delete n[tempId]; return n; });
    }

    // Persist to backend
    createDocumentAPI({
        name: newDoc.name,
        type: newDoc.type,
        size: newDoc.size,
        uploadDate,
        uploader: newDoc.uploader,
        status: 'pending',
        url: uploadUrl,
        fileKey,
        projectId: selectedProject?.id
    }).then(res => {
        if (res.success && res.data?.id) {
            setDocuments(prev => prev.map(d => d.id === tempId ? { ...res.data } : d));
        }
    }).catch(console.error);

    if (selectedProject) {
        const sysMsg: Comment = {
            id: `sys-${Date.now()}`,
            author: 'System',
            text: `${userProfile.name} ${t('workflow.dashboard.project.chat.sys.uploadedFile')} ${file.name}`,
            timestamp: new Date().toLocaleTimeString(),
            isSystem: true
        };
        const updatedHistory = [...selectedProject.chatHistory, sysMsg];
        updateProjectChat(selectedProject.id, sysMsg);
        updateProjectAPI(selectedProject.id, { chatHistory: updatedHistory }).catch(console.error);
    }
  };

  const handleCreateProject = (e: React.FormEvent) => {
      e.preventDefault();
      const tempId = `proj-${Date.now()}`;
      const initMsg: Comment = { id: 'sys-init', author: 'System', text: `"${newProjectData.name}" ${t('workflow.dashboard.project.chat.sys.projectInit')}`, timestamp: new Date().toLocaleTimeString(), isSystem: true };
      const newProject: Project = {
          id: tempId,
          name: newProjectData.name,
          client: newProjectData.client,
          tagline: newProjectData.tagline,
          description: newProjectData.description,
          department: newProjectData.department,
          status: 'planning',
          startDate: new Date().toISOString().split('T')[0],
          deadline: newProjectData.deadline || '',
          budget: Number(newProjectData.budget),
          expenses: 0,
          expenseLog: [],
          team: [{ id: user?._id || 'me', name: userProfile.name, role: userProfile.role, avatar: user?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(userProfile.name)}`, isExternal: false, projectRole: 'creator' }],
          files: [],
          progress: 0,
          chatHistory: [initMsg],
          tasks: []
      };
      setProjects(prev => [newProject, ...prev]);
      setShowProjectModal(false);
      setNewProjectData({ name: '', tagline: '', description: '', department: 'event_planner', client: '', budget: 0, deadline: '' });
      alert(t('workflow.dashboard.project.success'));

      // API call - replace temp ID with real MongoDB _id
      createProjectAPI({
          name: newProject.name,
          client: newProject.client,
          tagline: newProject.tagline,
          description: newProject.description,
          department: newProject.department,
          status: newProject.status,
          startDate: newProject.startDate,
          deadline: newProject.deadline,
          budget: newProject.budget,
          expenses: 0,
          expenseLog: [],
          team: newProject.team,
          progress: 0,
          chatHistory: newProject.chatHistory,
          tasks: []
      }).then(res => {
          if (res.success && res.data?.id) {
              setProjects(prev => prev.map(p => p.id === tempId ? { ...res.data } : p));
          }
      }).catch(console.error);
  };

  // handleCreateAsset and handleUploadResource moved to PromptsView and ResourcesView components
  // handleAddPartner moved to PartnersView component

  const toggleAutomation = (id: string) => { setAutomations(prev => prev.map(a => a.id === id ? { ...a, isActive: !a.isActive } : a)); };
  const copyToClipboard = (text: string) => { navigator.clipboard.writeText(text); alert(t('workflow.affiliate.copied')); };

  const handleChangeDocStatus = (docId: string, newStatus: 'approved' | 'rejected' | 'pending') => {
      setDocuments(prev => prev.map(d => d.id === docId ? { ...d, status: newStatus } : d));
      setActiveDocForComment(prev => prev?.id === docId ? { ...prev, status: newStatus } : prev);
      updateDocumentAPI(docId, { status: newStatus }).catch(console.error);
  };

  const handleDeleteDoc = (docId: string) => {
      if (!confirm(t('workflow.dashboard.docPanel.confirmDelete'))) return;
      setDocuments(prev => prev.filter(d => d.id !== docId));
      if (activeDocForComment?.id === docId) setActiveDocForComment(null);
      deleteDocumentAPI(docId).catch(console.error);
  };

  const handleAddDocComment = (e: React.FormEvent) => {
      e.preventDefault();
      if (!docComment.trim() || !activeDocForComment) return;
      const newComment: Comment = {
          id: `cmt-${Date.now()}`,
          author: userProfile.name,
          text: docComment.trim(),
          timestamp: new Date().toLocaleTimeString()
      };
      const updatedComments = [...(activeDocForComment.comments || []), newComment];
      setDocuments(prev => prev.map(d => d.id === activeDocForComment.id ? {
          ...d, comments: updatedComments
      } : d));
      setActiveDocForComment(prev => prev ? { ...prev, comments: updatedComments } : null);
      setDocComment('');
      updateDocumentAPI(activeDocForComment.id, { comments: updatedComments }).catch(console.error);
  };

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

  const updateProjectTeamAndFinance = (member: TeamMember, cost: number) => {
      if (!selectedProject) return;
      const sysMsg: Comment = {
          id: `sys-${Date.now()}`,
          author: 'System',
          text: `${member.name} ${t('workflow.dashboard.project.chat.sys.joined')}`,
          timestamp: new Date().toLocaleTimeString(),
          isSystem: true
      };
      // Clear system role — display label starts empty per-project
      const updatedTeam = [...selectedProject.team, { ...member, role: '' }];
      const updatedExpenses = selectedProject.expenses + cost;
      const updatedHistory = [...selectedProject.chatHistory, sysMsg];

      setProjects(prev => prev.map(p => p.id === selectedProject.id ? {
          ...p, team: updatedTeam, expenses: updatedExpenses, chatHistory: updatedHistory
      } : p));
      setSelectedProject(prev => prev ? {
          ...prev, team: updatedTeam, expenses: updatedExpenses, chatHistory: updatedHistory
      } : null);
      setShowMemberSelect(false);
      setUserSearchQuery('');
      setUserSearchResults([]);

      updateProjectAPI(selectedProject.id, { team: updatedTeam, expenses: updatedExpenses, chatHistory: updatedHistory }).catch(console.error);
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
      const updatedHistory = [...selectedProject.chatHistory, newMsg];
      updateProjectChat(selectedProject.id, newMsg);
      setProjectChatMessage('');
      updateProjectAPI(selectedProject.id, { chatHistory: updatedHistory }).catch(console.error);
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
          updateProjectAPI(selectedProject.id, { status: 'completed' }).catch(console.error);
      }
  };

  const handleCreateTask = () => {
      if (!newTaskData.title || !newTaskData.assigneeId) {
          alert(t('workflow.dashboard.project.tasks.modal.fillRequired'));
          return;
      }

      const assignee = selectedProject?.team.find(u => u.id === newTaskData.assigneeId);
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
              text: `${t('workflow.dashboard.project.chat.sys.taskAssigned')}: "${newTask.title}" → ${newTask.assigneeName}`,
              timestamp: new Date().toLocaleTimeString(),
              isSystem: true
          };
          const updatedTasks = [...selectedProject.tasks, newTask];
          const updatedHistory = [...selectedProject.chatHistory, sysMsg];

          setProjects(prev => prev.map(p => p.id === selectedProject.id ? {
              ...p, tasks: updatedTasks, chatHistory: updatedHistory
          } : p));

          setSelectedProject(prev => prev ? {
              ...prev,
              tasks: updatedTasks,
              chatHistory: updatedHistory
          } : null);

          updateProjectAPI(selectedProject.id, { tasks: updatedTasks, chatHistory: updatedHistory }).catch(console.error);
      } else if (selectedFileForTask) {
          alert(`Đã giao việc "${newTask.title}" cho file ${selectedFileForTask.name}`);
      }

      setShowTaskModal(false);
      setNewTaskData({ title: '', assigneeId: '', dueDate: '' });
      setSelectedFileForTask(null);
  };

  const handleAddExpense = () => {
      if (!newExpense.name.trim() || !newExpense.amount || !selectedProject) return;
      const cost = Number(newExpense.amount);
      if (isNaN(cost) || cost <= 0) return;
      const entry = { id: `exp-${Date.now()}`, name: newExpense.name.trim(), amount: cost, date: new Date().toISOString().split('T')[0] };
      const updatedLog = [...(selectedProject.expenseLog || []), entry];
      const updatedExpenses = selectedProject.expenses + cost;
      setProjects(prev => prev.map(p => p.id === selectedProject.id ? { ...p, expenses: updatedExpenses, expenseLog: updatedLog } : p));
      setSelectedProject(prev => prev ? { ...prev, expenses: updatedExpenses, expenseLog: updatedLog } : null);
      setNewExpense({ name: '', amount: '' });
      updateProjectAPI(selectedProject.id, { expenses: updatedExpenses, expenseLog: updatedLog }).catch(console.error);
  };

  const cycleTaskStatus = (taskId: string) => {
      if (!selectedProject) return;
      const nextStatus = (s: string) => s === 'todo' ? 'in_progress' : s === 'in_progress' ? 'done' : 'todo';
      const updatedTasks = selectedProject.tasks.map(t => t.id === taskId ? { ...t, status: nextStatus(t.status) as Task['status'] } : t);
      setProjects(prev => prev.map(p => p.id === selectedProject.id ? { ...p, tasks: updatedTasks } : p));
      setSelectedProject(prev => prev ? { ...prev, tasks: updatedTasks } : null);
      updateProjectAPI(selectedProject.id, { tasks: updatedTasks }).catch(console.error);
  };

  // Load projects and documents from API on mount
  useEffect(() => {
      Promise.all([getProjects(), getDocuments()])
          .then(([p, d]) => {
              setProjects(p.data || []);
              setDocuments(d.data || []);
          })
          .catch(console.error)
          .finally(() => setLoading(false));
  }, []);

  // Sync URL param → selectedProject (deep link support: /workflow/projects/:id)
  useEffect(() => {
      if (!projectIdParam) {
          // URL has no project ID — clear any open project
          setSelectedProject(null);
          return;
      }
      if (projects.length === 0) return; // wait until projects are loaded
      const found = projects.find(p => p.id === projectIdParam);
      if (found) {
          setSelectedProject(found);
          setProjectTab('overview'); // always reset tab when switching projects
          setActiveView('projects');
      } else {
          // Project not found (deleted or no access) — redirect to project list
          navigate('/workflow', { replace: true });
      }
  }, [projectIdParam, projects]);

  // When entering a project, reload all its documents (so all members see each other's files)
  useEffect(() => {
      if (!selectedProject) return;
      getDocuments(selectedProject.id).then(res => {
          if (res.success) {
              setDocuments(prev => {
                  const otherDocs = prev.filter(d => d.projectId !== selectedProject.id);
                  return [...(res.data || []), ...otherDocs];
              });
          }
      }).catch(console.error);
  }, [selectedProject?.id]);

  // Auto-scroll chat to bottom when new message arrives
  useEffect(() => {
      if (chatEndRef.current) {
          chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
      }
  }, [selectedProject?.chatHistory?.length]);

  const handleRemoveMember = (memberId: string, memberName: string) => {
      if (!selectedProject) return;
      if (!confirm(`Remove "${memberName}" from this project?`)) return;
      const sysMsg: Comment = {
          id: `sys-${Date.now()}`, author: 'System',
          text: `${memberName} ${t('workflow.dashboard.project.chat.sys.removed')}`,
          timestamp: new Date().toLocaleTimeString(), isSystem: true
      };
      const updatedTeam = selectedProject.team.filter(m => m.id !== memberId);
      const updatedHistory = [...selectedProject.chatHistory, sysMsg];
      setProjects(prev => prev.map(p => p.id === selectedProject.id ? { ...p, team: updatedTeam, chatHistory: updatedHistory } : p));
      setSelectedProject(prev => prev ? { ...prev, team: updatedTeam, chatHistory: updatedHistory } : null);
      updateProjectAPI(selectedProject.id, { team: updatedTeam, chatHistory: updatedHistory }).catch(console.error);
  };

  const handleLeaveProject = () => {
      if (!selectedProject || !user) return;
      if (!confirm(`Leave project "${selectedProject.name}"?`)) return;
      const sysMsg: Comment = {
          id: `sys-${Date.now()}`, author: 'System',
          text: `${userProfile.name} ${t('workflow.dashboard.project.chat.sys.left')}`,
          timestamp: new Date().toLocaleTimeString(), isSystem: true
      };
      const updatedTeam = selectedProject.team.filter(m => m.id !== user._id);
      const updatedHistory = [...selectedProject.chatHistory, sysMsg];
      setProjects(prev => prev.map(p => p.id === selectedProject.id ? { ...p, team: updatedTeam, chatHistory: updatedHistory } : p));
      updateProjectAPI(selectedProject.id, { team: updatedTeam, chatHistory: updatedHistory }).catch(console.error);
      navigate('/workflow');
  };

  const handleToggleManager = (memberId: string) => {
      if (!selectedProject) return;
      const member = selectedProject.team.find(m => m.id === memberId);
      if (!member) return;
      const isNowManager = member.projectRole === 'manager';
      const newRole = isNowManager ? '' : 'manager';
      const sysMsg: Comment = {
          id: `sys-${Date.now()}`, author: 'System',
          text: `${member.name} ${isNowManager ? t('workflow.dashboard.project.chat.sys.demotedManager') : t('workflow.dashboard.project.chat.sys.promotedManager')}`,
          timestamp: new Date().toLocaleTimeString(), isSystem: true
      };
      const updatedTeam = selectedProject.team.map(m => m.id === memberId ? { ...m, projectRole: newRole } : m);
      const updatedHistory = [...selectedProject.chatHistory, sysMsg];
      setProjects(prev => prev.map(p => p.id === selectedProject.id ? { ...p, team: updatedTeam, chatHistory: updatedHistory } : p));
      setSelectedProject(prev => prev ? { ...prev, team: updatedTeam, chatHistory: updatedHistory } : null);
      updateProjectAPI(selectedProject.id, { team: updatedTeam, chatHistory: updatedHistory }).catch(console.error);
  };

  const handleDeleteTask = (taskId: string, e: React.MouseEvent) => {
      e.stopPropagation(); // prevent triggering cycleTaskStatus
      if (!selectedProject) return;
      const updatedTasks = selectedProject.tasks.filter(t => t.id !== taskId);
      setProjects(prev => prev.map(p => p.id === selectedProject.id ? { ...p, tasks: updatedTasks } : p));
      setSelectedProject(prev => prev ? { ...prev, tasks: updatedTasks } : null);
      updateProjectAPI(selectedProject.id, { tasks: updatedTasks }).catch(console.error);
  };

  const handleUpdateProgress = (value: number) => {
      setProjects(prev => prev.map(p => p.id === selectedProject?.id ? { ...p, progress: value } : p));
      setSelectedProject(prev => prev ? { ...prev, progress: value } : null);
  };

  const handleProgressPointerUp = () => {
      if (selectedProject) {
          updateProjectAPI(selectedProject.id, { progress: selectedProject.progress }).catch(console.error);
      }
  };

  // Permission helpers
  const isProjectCreator = () => {
      if (!selectedProject || !user) return false;
      if (user.role === 'admin') return true; // admin treated as creator
      // Check createdBy field (reliable for all projects, even pre-role ones)
      if (selectedProject.createdBy && selectedProject.createdBy === user._id) return true;
      const member = selectedProject.team.find(m => m.id === user._id);
      return member?.projectRole === 'creator';
  };

  const isProjectManagerOrCreator = () => {
      if (!selectedProject || !user) return false;
      if (user.role === 'admin' || user.role === 'mod') return true;
      const member = selectedProject.team.find(m => m.id === user._id);
      return member?.projectRole === 'creator' || member?.projectRole === 'manager';
  };

  const isProjectMember = () => {
      if (!selectedProject || !user) return false;
      if (user.role === 'admin' || user.role === 'mod') return true;
      return selectedProject.team.some(m => m.id === user._id);
  };

  const canDeleteDoc = (doc: WorkflowDocument) => {
      if (!user) return false;
      if (user.role === 'admin' || user.role === 'mod') return true;
      if (isProjectManagerOrCreator()) return true;
      return doc.createdBy === user._id;
  };

  // User search for adding members
  const handleUserSearch = async (q: string) => {
      setUserSearchQuery(q);
      if (!q || q.length < 2) { setUserSearchResults([]); return; }
      setUserSearchLoading(true);
      try {
          const res = await searchUsers(q);
          if (res.success) setUserSearchResults(res.data as TeamMember[]);
      } catch { /* ignore */ } finally {
          setUserSearchLoading(false);
      }
  };

  // Update a team member's display role label (custom job title in this project)
  const handleUpdateDisplayRole = (memberId: string, newRole: string) => {
      if (!selectedProject) return;
      const updatedTeam = selectedProject.team.map(m => m.id === memberId ? { ...m, role: newRole } : m);
      setProjects(prev => prev.map(p => p.id === selectedProject.id ? { ...p, team: updatedTeam } : p));
      setSelectedProject(prev => prev ? { ...prev, team: updatedTeam } : null);
      updateProjectAPI(selectedProject.id, { team: updatedTeam }).catch(console.error);
  };

  // Edit project (name, description, avatar, department)
  const handleOpenEditProject = () => {
      if (!selectedProject) return;
      const rawDeadline = selectedProject.deadline;
      setEditProjectData({ name: selectedProject.name, tagline: selectedProject.tagline || '', requirements: selectedProject.requirements || '', description: selectedProject.description, avatar: selectedProject.avatar || '', department: selectedProject.department, client: selectedProject.client || '', budget: selectedProject.budget || 0, deadline: (rawDeadline && rawDeadline !== 'TBD') ? rawDeadline : '' });
      setShowEditProjectModal(true);
  };

  const handleEditProjectAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!e.target.files?.[0]) return;
      setEditProjectUploading(true);
      try {
          const result = await uploadToCloudinary(e.target.files[0], 'projects', 'logo');
          if (result.success && result.url) setEditProjectData(prev => ({ ...prev, avatar: result.url }));
      } catch { /* ignore */ } finally {
          setEditProjectUploading(false);
      }
  };

  const handleSaveEditProject = () => {
      if (!selectedProject || !editProjectData.name.trim()) return;
      const updated = { name: editProjectData.name.trim(), tagline: editProjectData.tagline, requirements: editProjectData.requirements, description: editProjectData.description, avatar: editProjectData.avatar, department: editProjectData.department, client: editProjectData.client, budget: editProjectData.budget, deadline: editProjectData.deadline };
      setProjects(prev => prev.map(p => p.id === selectedProject.id ? { ...p, ...updated } : p));
      setSelectedProject(prev => prev ? { ...prev, ...updated } : null);
      setShowEditProjectModal(false);
      updateProjectAPI(selectedProject.id, updated).catch(console.error);
  };

  // Delete completed project (admin only)
  const handleDeleteProject = (projectId: string) => {
      if (!confirm(t('workflow.dashboard.project.confirmDelete'))) return;
      setProjects(prev => prev.filter(p => p.id !== projectId));
      deleteProjectAPI(projectId).catch(console.error);
  };

  // Update file note (uploader only)
  const handleUpdateDocNote = (docId: string, note: string) => {
      setDocuments(prev => prev.map(d => d.id === docId ? { ...d, note } : d));
      updateDocumentAPI(docId, { note }).catch(console.error);
  };

  const filteredDocs = documents
    .filter(doc => doc.name.toLowerCase().includes(searchQuery.toLowerCase()))
    .filter(doc => {
      if (docSourceFilter === 'personal') return !doc.projectId;
      if (docSourceFilter === 'project') return !!doc.projectId;
      return true;
    })
    .sort((a, b) => {
      let aVal = '';
      let bVal = '';
      if (docSortField === 'name') { aVal = a.name; bVal = b.name; }
      else if (docSortField === 'date') { aVal = a.uploadDate; bVal = b.uploadDate; }
      else if (docSortField === 'project') {
        aVal = a.projectId ? (projects.find(p => p.id === a.projectId)?.name || '') : '';
        bVal = b.projectId ? (projects.find(p => p.id === b.projectId)?.name || '') : '';
      }
      const cmp = aVal.localeCompare(bVal);
      return docSortDir === 'asc' ? cmp : -cmp;
    });

  const toggleDocSort = (field: 'name' | 'date' | 'project') => {
    if (docSortField === field) {
      setDocSortDir(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setDocSortField(field);
      setDocSortDir('asc');
    }
  };

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
                  <div className="flex items-center gap-4">
                      <button
                          onClick={() => navigate('/workflow')}
                          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[var(--accent-primary)]/10 hover:bg-[var(--accent-primary)]/20 text-[var(--accent-primary)] font-bold text-sm transition-all border border-[var(--accent-primary)]/30 hover:border-[var(--accent-primary)]/60 flex-shrink-0"
                      >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" /></svg>
                          {t('workflow.dashboard.project.backToProjects')}
                      </button>
                      {selectedProject.avatar ? (
                          <img src={selectedProject.avatar} className="w-12 h-12 rounded-xl object-cover border border-[var(--border-primary)]" />
                      ) : (
                          <div className="w-12 h-12 rounded-xl bg-[var(--bg-secondary)] flex items-center justify-center text-2xl border border-[var(--border-primary)]">
                              {selectedProject.department === 'event_planner' ? '📅' : selectedProject.department === 'creative' ? '🎨' : '⚙️'}
                          </div>
                      )}
                      <div>
                          <div className="flex items-center gap-2">
                              <h1 className="text-2xl font-black text-[var(--text-primary)]">{selectedProject.name}</h1>
                              {isProjectManagerOrCreator() && selectedProject.status !== 'completed' && (
                                  <button onClick={handleOpenEditProject} className="p-1 rounded-lg hover:bg-[var(--bg-secondary)] text-[var(--text-tertiary)] hover:text-[var(--accent-primary)] transition-colors" title={t('workflow.dashboard.project.edit')}>
                                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" /></svg>
                                  </button>
                              )}
                          </div>
                          <div className="flex items-center gap-3 text-sm mt-1.5 flex-wrap">
                              <span className="text-[var(--accent-primary)] font-semibold">{selectedProject.client}</span>
                              <span className="text-[var(--text-tertiary)]">• {selectedProject.startDate} → {selectedProject.deadline}</span>
                              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${selectedProject.status === 'completed' ? 'bg-green-500/20 text-green-400' : 'bg-blue-500/20 text-blue-400'}`}>
                                  {t(`workflow.status.${selectedProject.status}`).toUpperCase()}
                              </span>
                          </div>
                      </div>
                  </div>
                  {isProjectCreator() && selectedProject.status !== 'completed' && (
                      <button onClick={handlePackageProject} className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-2 rounded-lg font-bold shadow-lg hover:opacity-90">
                          📦 {t('workflow.dashboard.project.package.btn')}
                      </button>
                  )}
              </div>

              <div className="flex border-b border-[var(--border-primary)] px-6 bg-[var(--bg-secondary)] overflow-x-auto">
                  {(isProjectMember()
                      ? ['overview', 'team', 'files', 'finance', 'chat', 'tasks']
                      : ['overview', 'team']
                  ).map(tab => (
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
                              {selectedProject.tagline && (
                                  <div className="mb-5">
                                      <h3 className="text-lg font-bold mb-2">{t('workflow.introduction')}</h3>
                                      <p className="text-sm text-[var(--text-secondary)] leading-relaxed italic">{selectedProject.tagline}</p>
                                  </div>
                              )}
                              {selectedProject.description && (
                                  <div className={`mb-5 ${selectedProject.tagline ? 'border-t border-[var(--border-primary)] pt-4' : ''}`}>
                                      <h3 className="text-base font-bold mb-2">{t('workflow.description')}</h3>
                                      <div className="text-[var(--text-secondary)] text-sm leading-relaxed" dangerouslySetInnerHTML={{ __html: selectedProject.description }} />
                                  </div>
                              )}
                              {selectedProject.requirements && (
                                  <div className="border-t border-[var(--border-primary)] pt-4">
                                      <h3 className="text-base font-bold mb-2">{t('workflow.requirements')}</h3>
                                      <p className="text-sm text-[var(--text-secondary)] leading-relaxed whitespace-pre-wrap">{selectedProject.requirements}</p>
                                  </div>
                              )}
                              <div className="mt-6">
                                  <div className="flex justify-between items-center mb-2">
                                      <h3 className="text-base font-bold">{t('workflow.progress')}</h3>
                                      <span className="text-base font-black text-[var(--accent-primary)]">{selectedProject.progress}%</span>
                                  </div>
                                  <div className="w-full bg-[var(--bg-secondary)] rounded-full h-4 mb-3">
                                      <div className="bg-[var(--accent-primary)] h-4 rounded-full transition-all" style={{ width: `${selectedProject.progress}%` }}></div>
                                  </div>
                                  {selectedProject.status !== 'completed' && (
                                      <div>
                                          <p className="text-xs text-[var(--text-tertiary)] mb-1">{t('workflow.dashboard.project.overview.updateProgress')}</p>
                                          <input
                                              type="range" min="0" max="100" step="5"
                                              value={selectedProject.progress}
                                              onChange={e => handleUpdateProgress(Number(e.target.value))}
                                              onPointerUp={handleProgressPointerUp}
                                              className="w-full accent-[var(--accent-primary)] cursor-pointer"
                                          />
                                      </div>
                                  )}
                              </div>
                          </div>
                          <div className="bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-xl p-6">
                              <h3 className="text-lg font-bold mb-4">{t('workflow.dashboard.project.overview.quickStats')}</h3>
                              <div className="space-y-4">
                                  <div className="flex justify-between text-sm font-medium"><span className="text-[var(--text-secondary)]">{t('workflow.dashboard.project.overview.files')}</span> <span className="font-bold">{projectDocs.length}</span></div>
                                  <div className="flex justify-between text-sm font-medium"><span className="text-[var(--text-secondary)]">{t('workflow.dashboard.project.overview.members')}</span> <span className="font-bold">{selectedProject.team.length}</span></div>
                                  <div className="flex justify-between text-sm font-medium text-yellow-400"><span>{t('workflow.budget')}</span> <span className="font-bold flex items-center gap-1">{selectedProject.budget.toLocaleString()} <span className="w-3.5 h-3.5 rounded-full bg-yellow-400 text-black flex items-center justify-center text-[8px] font-black flex-shrink-0">C</span></span></div>
                              </div>
                          </div>
                      </div>
                  )}

                  {projectTab === 'team' && (
                      <div className="space-y-6">
                          <div className="flex justify-between items-center">
                              <h3 className="text-lg font-bold">{t('workflow.dashboard.project.teamPanel.title')}</h3>
                              {isProjectManagerOrCreator() && selectedProject.status !== 'completed' && (
                                  <button onClick={() => { setShowMemberSelect(true); setUserSearchQuery(''); setUserSearchResults([]); }} className="bg-[var(--accent-primary)] text-black px-4 py-2 rounded-lg font-bold text-sm">+ {t('workflow.addMember')}</button>
                              )}
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                              {selectedProject.team.map(member => {
                                  const isSelf = member.id === user?._id;
                                  const isCreatorCard = member.projectRole === 'creator';
                                  const isManagerCard = member.projectRole === 'manager';
                                  // Creator can remove anyone except themselves; manager can remove non-creator/non-manager only
                                  const canRemove = !isSelf && !isCreatorCard && selectedProject.status !== 'completed' &&
                                      (isProjectCreator() || (isProjectManagerOrCreator() && !isManagerCard));
                                  return (
                                      <div key={member.id} className="bg-[var(--bg-card)] border border-[var(--border-primary)] p-5 rounded-xl flex items-start gap-4">
                                          <img
                                              src={member.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(member.name)}&background=random`}
                                              className="w-14 h-14 rounded-full object-cover flex-shrink-0 border-2 border-[var(--border-primary)]"
                                          />
                                          <div className="flex-1 min-w-0">
                                              <div className="flex items-center gap-2 flex-wrap">
                                                  <button
                                                      onClick={() => {
                                                          setMemberProfileModal({ member, profile: null, loading: true });
                                                          getUserProfile(member.id)
                                                              .then(res => setMemberProfileModal(prev => prev ? { ...prev, profile: res.data, loading: false } : null))
                                                              .catch(() => setMemberProfileModal(prev => prev ? { ...prev, loading: false } : null));
                                                      }}
                                                      className="font-bold text-base hover:text-[var(--accent-primary)] transition-colors text-left"
                                                  >
                                                      {member.name}
                                                  </button>
                                                  {isSelf && <span className="text-[10px] bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] px-1.5 py-0.5 rounded font-bold">You</span>}
                                              </div>
                                              {/* Custom display label - editable by creator/manager */}
                                              {isProjectManagerOrCreator() && !isCreatorCard && selectedProject.status !== 'completed' ? (
                                                  <input
                                                      key={member.id + '-role'}
                                                      className="text-sm bg-transparent border-b border-dashed border-[var(--border-primary)] focus:outline-none focus:border-[var(--accent-primary)] text-[var(--text-tertiary)] w-full mt-1 placeholder-[var(--text-tertiary)]/50"
                                                      placeholder={t('workflow.dashboard.project.teamPanel.rolePlaceholder')}
                                                      defaultValue={member.role || ''}
                                                      onBlur={e => { if (e.target.value.trim() !== (member.role || '')) handleUpdateDisplayRole(member.id, e.target.value.trim()); }}
                                                      onKeyDown={e => { if (e.key === 'Enter') e.currentTarget.blur(); }}
                                                  />
                                              ) : (
                                                  <p className="text-sm text-[var(--text-tertiary)] truncate mt-1">{member.role}</p>
                                              )}
                                              {/* Structural role badges */}
                                              <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                                                  {isCreatorCard && <span className="text-xs bg-purple-500/20 text-purple-400 px-2 py-0.5 rounded-full font-bold">👑 Creator</span>}
                                                  {isManagerCard && <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full font-bold">⭐ Manager</span>}
                                                  {member.isExternal && <span className="text-xs bg-yellow-500/20 text-yellow-500 px-2 py-0.5 rounded-full">{t('workflow.dashboard.project.teamPanel.external')}</span>}
                                              </div>
                                              {/* Manager toggle — creator only, not for self */}
                                              {isProjectCreator() && !isSelf && !isCreatorCard && selectedProject.status !== 'completed' && (
                                                  isManagerCard ? (
                                                      <button
                                                          onClick={() => handleToggleManager(member.id)}
                                                          className="mt-2 inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg font-medium bg-blue-500/15 text-blue-400 border border-blue-500/30 hover:bg-red-500/15 hover:text-red-400 hover:border-red-500/30 transition-all"
                                                      >
                                                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM7 9a1 1 0 000 2h6a1 1 0 100-2H7z" clipRule="evenodd" /></svg>
                                                          {t('workflow.dashboard.project.teamPanel.removeManager')}
                                                      </button>
                                                  ) : (
                                                      <button
                                                          onClick={() => handleToggleManager(member.id)}
                                                          className="mt-2 inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg font-medium bg-[var(--bg-secondary)] text-[var(--text-tertiary)] border border-dashed border-[var(--border-primary)] hover:bg-blue-500/15 hover:text-blue-400 hover:border-blue-500/30 transition-all"
                                                      >
                                                          <span>⭐</span> {t('workflow.dashboard.project.teamPanel.makeManager')}
                                                      </button>
                                                  )
                                              )}
                                              {/* Leave button — self only, non-creator */}
                                              {isSelf && !isCreatorCard && selectedProject.status !== 'completed' && (
                                                  <button onClick={handleLeaveProject} className="mt-2 text-xs text-red-400 hover:text-red-300 underline block font-medium">
                                                      {t('workflow.dashboard.project.teamPanel.leave')}
                                                  </button>
                                              )}
                                          </div>
                                          {/* Remove button */}
                                          {canRemove && (
                                              <button
                                                  onClick={() => handleRemoveMember(member.id, member.name)}
                                                  className="flex-shrink-0 p-1.5 rounded-lg hover:bg-red-500/20 text-[var(--text-tertiary)] hover:text-red-400 transition-colors mt-0.5"
                                                  title={t('workflow.collaboration.removeMember')}
                                              >
                                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                                              </button>
                                          )}
                                      </div>
                                  );
                              })}
                          </div>
                          {showMemberSelect && (
                            <div className="bg-[var(--bg-card)] border border-[var(--border-primary)] p-4 rounded-xl mt-4">
                                <h4 className="font-bold mb-3">{t('workflow.dashboard.project.teamPanel.selectToAdd')}</h4>
                                <input
                                    autoFocus
                                    placeholder="Search by name or email..."
                                    value={userSearchQuery}
                                    onChange={e => handleUserSearch(e.target.value)}
                                    className="w-full mb-3 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[var(--accent-primary)]"
                                />
                                {userSearchLoading && <p className="text-xs text-[var(--text-tertiary)] text-center py-2">Searching...</p>}
                                {!userSearchLoading && userSearchQuery.length >= 2 && userSearchResults.length === 0 && (
                                    <p className="text-xs text-[var(--text-tertiary)] text-center py-2">No users found</p>
                                )}
                                <div className="space-y-2 max-h-52 overflow-y-auto">
                                    {userSearchResults
                                        .filter(u => !selectedProject.team.find(m => m.id === u.id))
                                        .map(u => (
                                        <div key={u.id} onClick={() => handleAddMemberToProject(u)} className="flex justify-between items-center p-2 hover:bg-[var(--bg-secondary)] rounded cursor-pointer border border-transparent hover:border-[var(--border-primary)]">
                                            <div className="flex items-center gap-2">
                                                <img src={u.avatar} className="w-8 h-8 rounded-full object-cover" />
                                                <div>
                                                    <p className="text-sm font-medium">{u.name}</p>
                                                    <p className="text-xs text-[var(--text-tertiary)]">{u.role}</p>
                                                </div>
                                            </div>
                                            <span className="text-xs text-[var(--accent-primary)] font-bold">{t('workflow.dashboard.project.teamPanel.free')}</span>
                                        </div>
                                    ))}
                                </div>
                                <button onClick={() => { setShowMemberSelect(false); setUserSearchQuery(''); setUserSearchResults([]); }} className="mt-3 text-xs underline text-[var(--text-tertiary)]">{t('common.cancel')}</button>
                            </div>
                          )}
                      </div>
                  )}

                  {projectTab === 'files' && (
                      <div className="space-y-4">
                          <div className="flex justify-between items-center">
                              <h3 className="text-lg font-bold">{t('workflow.dashboard.project.filesPanel.title')}</h3>
                              <label className="cursor-pointer bg-[var(--bg-secondary)] border border-[var(--border-primary)] px-4 py-2 rounded-lg font-bold text-sm hover:bg-[var(--border-primary)]">
                                  {t('workflow.dashboard.project.filesPanel.upload')} <input type="file" className="hidden" onChange={handleFileUpload} />
                              </label>
                          </div>
                          <div className="grid grid-cols-1 gap-2">
                              {projectDocs.length > 0 ? projectDocs.map(doc => (
                                  <div key={doc.id} className="p-3 bg-[var(--bg-card)] rounded-lg border border-[var(--border-primary)]">
                                      <div className="flex items-start justify-between gap-3">
                                          <div className="flex items-center gap-3 flex-1 min-w-0">
                                              <div className="w-8 h-8 bg-[var(--bg-secondary)] flex items-center justify-center rounded text-xs font-bold flex-shrink-0">{doc.type}</div>
                                              <div className="flex-1 min-w-0">
                                                  <p className="font-medium text-sm truncate">{doc.name}</p>
                                                  <p className="text-xs text-[var(--text-tertiary)]">{doc.uploader} • {doc.size} • {doc.uploadDate}</p>
                                                  {/* Upload progress bar */}
                                                  {uploadProgress[doc.id] !== undefined && (
                                                      <div className="mt-1.5">
                                                          <div className="flex justify-between text-[10px] text-[var(--text-tertiary)] mb-0.5">
                                                              <span>Uploading to B2...</span>
                                                              <span>{uploadProgress[doc.id]}%</span>
                                                          </div>
                                                          <div className="w-full h-1 bg-[var(--bg-secondary)] rounded-full overflow-hidden">
                                                              <div className="h-full bg-[var(--accent-primary)] rounded-full transition-all" style={{ width: `${uploadProgress[doc.id]}%` }} />
                                                          </div>
                                                      </div>
                                                  )}
                                                  {/* Note field: editable by uploader, read-only for others */}
                                                  {doc.createdBy === user?._id ? (
                                                      <input
                                                          key={doc.id + '-note'}
                                                          className="mt-1 text-xs w-full bg-transparent border-b border-dashed border-[var(--border-primary)] focus:outline-none focus:border-[var(--accent-primary)] text-[var(--text-tertiary)] placeholder-[var(--text-tertiary)]/50 italic"
                                                          placeholder={t('workflow.dashboard.project.filesPanel.notePlaceholder')}
                                                          defaultValue={doc.note || ''}
                                                          onBlur={e => { if (e.target.value !== (doc.note || '')) handleUpdateDocNote(doc.id, e.target.value); }}
                                                          onKeyDown={e => { if (e.key === 'Enter') e.currentTarget.blur(); }}
                                                      />
                                                  ) : doc.note ? (
                                                      <p className="mt-1 text-xs italic text-[var(--text-tertiary)]">📝 {doc.note}</p>
                                                  ) : null}
                                              </div>
                                          </div>
                                          <div className="flex gap-2 flex-shrink-0">
                                              {doc.url ? (
                                                  <a href={doc.url} download={doc.name} target="_blank" rel="noreferrer" className="text-xs bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/20 px-3 py-1 rounded flex items-center gap-1">
                                                      ↓ {t('workflow.dashboard.project.teamPanel.download')}
                                                  </a>
                                              ) : (
                                                  <span className="text-xs text-[var(--text-tertiary)] px-3 py-1">{doc.name.split('.').pop()?.toUpperCase()}</span>
                                              )}
                                              {canDeleteDoc(doc) && (
                                                  <button onClick={() => handleDeleteDoc(doc.id)} className="text-xs bg-red-500/10 text-red-400 hover:bg-red-500/20 px-2 py-1 rounded" title={t('workflow.dashboard.docPanel.delete')}>✕</button>
                                              )}
                                          </div>
                                      </div>
                                  </div>
                              )) : <p className="text-[var(--text-tertiary)] italic">{t('workflow.dashboard.project.filesPanel.noFiles')}</p>}
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
                              <h3 className="font-bold mb-4">{t('workflow.dashboard.project.finance.addExpense')}</h3>
                              <div className="flex gap-2 mb-6">
                                  <input
                                      placeholder={t('workflow.dashboard.project.finance.expenseName')}
                                      value={newExpense.name}
                                      onChange={e => setNewExpense(prev => ({ ...prev, name: e.target.value }))}
                                      className="flex-1 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg p-2 text-sm"
                                      onKeyDown={e => e.key === 'Enter' && handleAddExpense()}
                                  />
                                  <input
                                      placeholder={t('workflow.dashboard.project.finance.amount')}
                                      type="number"
                                      value={newExpense.amount}
                                      onChange={e => setNewExpense(prev => ({ ...prev, amount: e.target.value }))}
                                      className="w-36 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg p-2 text-sm"
                                      onKeyDown={e => e.key === 'Enter' && handleAddExpense()}
                                  />
                                  <button onClick={handleAddExpense} className="bg-[var(--accent-primary)] text-black px-4 py-2 rounded-lg font-bold text-sm">{t('workflow.dashboard.project.finance.add')}</button>
                              </div>
                              <div>
                                  <h4 className="text-sm font-bold text-[var(--text-secondary)] mb-3">{t('workflow.dashboard.project.finance.expenseHistory')}</h4>
                                  {(selectedProject.expenseLog || []).length === 0 ? (
                                      <p className="text-xs text-[var(--text-tertiary)] italic">{t('workflow.dashboard.project.finance.noExpenses')}</p>
                                  ) : (
                                      <div className="space-y-2">
                                          {(selectedProject.expenseLog || []).map(entry => (
                                              <div key={entry.id} className="flex items-center justify-between py-2 border-b border-[var(--border-primary)] last:border-0">
                                                  <div>
                                                      <p className="text-sm font-medium">{entry.name}</p>
                                                      <p className="text-xs text-[var(--text-tertiary)]">{entry.date}</p>
                                                  </div>
                                                  <span className="text-sm font-bold text-red-400">-{entry.amount.toLocaleString()} 🪙</span>
                                              </div>
                                          ))}
                                      </div>
                                  )}
                              </div>
                          </div>
                      </div>
                  )}

                  {projectTab === 'chat' && (
                      <div className="flex flex-col h-full">
                          <div className="flex-1 overflow-y-auto space-y-4 mb-4 pr-2 max-h-[calc(100vh-320px)]">
                              {selectedProject.chatHistory.map(msg => (
                                  <div key={msg.id} className={`flex flex-col ${msg.isSystem ? 'items-center' : (msg.author === userProfile.name ? 'items-end' : 'items-start')}`}>
                                      {msg.isSystem ? (
                                          <span className="text-xs text-[var(--text-tertiary)] bg-[var(--bg-secondary)] px-3 py-1 rounded-full border border-[var(--border-primary)]">{msg.text}</span>
                                      ) : (
                                          <>
                                              <div className={`max-w-[80%] p-3.5 rounded-xl text-sm leading-relaxed ${msg.author === userProfile.name ? 'bg-[var(--accent-primary)] text-black rounded-tr-none' : 'bg-[var(--bg-secondary)] text-[var(--text-primary)] rounded-tl-none border border-[var(--border-primary)]'}`}>
                                                  {msg.text}
                                              </div>
                                              <span className="text-xs text-[var(--text-tertiary)] mt-1 px-1">
                                                  {msg.author !== userProfile.name && `${msg.author} • `}{msg.timestamp}
                                              </span>
                                          </>
                                      )}
                                  </div>
                              ))}
                              <div ref={chatEndRef} />
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
                                      <div key={task.id} onClick={() => cycleTaskStatus(task.id)} className="bg-[var(--bg-card)] border border-[var(--border-primary)] p-4 rounded-xl flex items-center justify-between hover:border-[var(--accent-primary)] transition-all cursor-pointer">
                                          <div className="flex items-center gap-4">
                                              <div className={`w-4 h-4 rounded-full flex-shrink-0 ${task.status === 'todo' ? 'bg-gray-500' : task.status === 'in_progress' ? 'bg-blue-500' : 'bg-green-500'}`}></div>
                                              <div>
                                                  <h4 className="font-bold text-base">{task.title}</h4>
                                                  <p className="text-sm text-[var(--text-tertiary)] mt-0.5">{t('workflow.dashboard.project.tasks.assigned')}: {task.assigneeName} • {t('workflow.dashboard.project.tasks.dueLabel')}: {task.dueDate}</p>
                                              </div>
                                          </div>
                                          <div className="flex items-center gap-2">
                                              <span className={`text-xs uppercase font-bold tracking-wider px-3 py-1 rounded-full ${task.status === 'todo' ? 'bg-gray-500/20 text-gray-400' : task.status === 'in_progress' ? 'bg-blue-500/20 text-blue-400' : 'bg-green-500/20 text-green-400'}`}>{t(`workflow.dashboard.project.tasks.status.${task.status}`)}</span>
                                              <button onClick={e => handleDeleteTask(task.id, e)} className="p-1.5 rounded-lg hover:bg-red-500/20 text-[var(--text-tertiary)] hover:text-red-400 transition-colors" title={t('common.delete')}>
                                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                                              </button>
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

  const canCreateProject = user?.role === 'admin' || user?.role === 'mod';

  const DEPT_OPTIONS: { value: DepartmentType; label: string; icon: string }[] = [
      { value: 'all', label: t('workflow.depts.all'), icon: '🗂️' },
      { value: 'event_planner', label: t('workflow.depts.event_planner'), icon: '📅' },
      { value: 'creative', label: t('workflow.depts.creative'), icon: '🎨' },
      { value: 'operation', label: t('workflow.depts.operation'), icon: '⚙️' },
  ];

  const isUserMemberOf = (p: Project) =>
      !!user && (p.team.some(m => m.id === user._id) || p.createdBy === user._id);

  const filteredProjects = projects
      .filter(p => projectDeptFilter === 'all' || p.department === projectDeptFilter)
      .filter(p => !projectMineFilter || isUserMemberOf(p))
      .sort((a, b) => {
          const aIsMine = isUserMemberOf(a) ? 1 : 0;
          const bIsMine = isUserMemberOf(b) ? 1 : 0;
          return bIsMine - aIsMine; // member projects first
      });

  const renderProjectList = () => (
      <div className="p-6 md:p-8 overflow-y-auto flex-1 animate-fade-in">
          <div className="flex justify-between items-center mb-6">
              <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[var(--accent-primary)] to-purple-500">{t('workflow.dashboard.project.hubTitle')}</h1>
              {canCreateProject && (
                  <button onClick={() => setShowProjectModal(true)} className="bg-[var(--accent-primary)] text-black font-bold px-6 py-2.5 rounded-lg shadow-lg hover:opacity-90 transition-all">+ {t('workflow.dashboard.createProject')}</button>
              )}
          </div>

          {/* Department filter + Mine filter */}
          <div className="flex gap-2 mb-6 flex-wrap">
              {DEPT_OPTIONS.map(opt => (
                  <button
                      key={opt.value}
                      onClick={() => setProjectDeptFilter(opt.value)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                          projectDeptFilter === opt.value
                              ? 'bg-[var(--accent-primary)] text-black shadow'
                              : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:bg-[var(--border-primary)]'
                      }`}
                  >
                      <span>{opt.icon}</span><span>{opt.label}</span>
                  </button>
              ))}
              <button
                  onClick={() => setProjectMineFilter(v => !v)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      projectMineFilter
                          ? 'bg-purple-500 text-white shadow'
                          : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:bg-[var(--border-primary)]'
                  }`}
              >
                  <span>👤</span><span>{t('workflow.dashboard.project.mineFilter')}</span>
              </button>
          </div>

          {filteredProjects.length === 0 && (
              <div className="col-span-3 text-center py-20">
                  <div className="text-6xl mb-4">💼</div>
                  <p className="text-[var(--text-secondary)] text-lg mb-6">{t('workflow.dashboard.project.noProjects')}</p>
                  {canCreateProject && (
                      <button onClick={() => setShowProjectModal(true)} className="bg-[var(--accent-primary)] text-black font-bold px-8 py-3 rounded-xl hover:opacity-90 transition-all">+ {t('workflow.dashboard.createProject')}</button>
                  )}
              </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProjects.map(project => (
                  <div key={project.id} className={`relative bg-[var(--bg-card)] border rounded-2xl cursor-pointer transition-all hover:-translate-y-1 shadow-lg group ${isUserMemberOf(project) ? 'pt-8 px-6 pb-6 border-[var(--accent-primary)]/50 hover:border-[var(--accent-primary)] ring-1 ring-[var(--accent-primary)]/20' : 'p-6 border-[var(--border-primary)] hover:border-[var(--accent-primary)]'}`} onClick={() => navigate(`/workflow/projects/${project.id}`)}>
                      {/* Member indicator badge */}
                      {isUserMemberOf(project) && (
                          <div className="absolute top-2.5 left-3 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[var(--accent-primary)]/20 text-[var(--accent-primary)] border border-[var(--accent-primary)]/30">
                              ✓ {t('workflow.dashboard.project.memberBadge')}
                          </div>
                      )}
                      {/* Admin delete button for completed projects */}
                      {user?.role === 'admin' && project.status === 'completed' && (
                          <button
                              onClick={e => { e.stopPropagation(); handleDeleteProject(project.id); }}
                              className="absolute top-3 right-3 p-1 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 opacity-0 group-hover:opacity-100 transition-opacity z-10"
                              title={t('workflow.dashboard.project.confirmDelete')}
                          >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                          </button>
                      )}
                      <div className="flex items-start gap-3 mb-3">
                          <div className="w-14 h-14 rounded-xl bg-[var(--bg-secondary)] flex items-center justify-center text-2xl overflow-hidden flex-shrink-0 border border-[var(--border-primary)]">
                              {project.avatar ? <img src={project.avatar} className="w-full h-full object-cover" /> : (project.department === 'event_planner' ? '📅' : project.department === 'creative' ? '🎨' : '⚙️')}
                          </div>
                          <div className="flex-1 min-w-0">
                              <h3 className="text-lg font-bold text-[var(--text-primary)] group-hover:text-[var(--accent-primary)] transition-colors leading-tight">{project.name}</h3>
                              <div className="flex items-center gap-1.5 flex-wrap mt-1.5">
                                  <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase border ${
                                      project.status === 'completed' ? 'bg-green-500/20 text-green-400 border-green-500/30' :
                                      project.status === 'active' ? 'bg-blue-500/20 text-blue-400 border-blue-500/30' :
                                      'bg-orange-500/20 text-orange-400 border-orange-500/30'
                                  }`}>{t(`workflow.status.${project.status}`)}</span>
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[var(--bg-secondary)] text-[var(--text-tertiary)] border border-[var(--border-primary)]">
                                      {project.department === 'event_planner' ? '📅' : project.department === 'creative' ? '🎨' : '⚙️'} {t(`workflow.depts.${project.department}`)}
                                  </span>
                              </div>
                          </div>
                      </div>
                      <div className="mb-3 space-y-0.5">
                          <p className="text-sm font-semibold text-sky-400 truncate">{project.client}</p>
                          {project.tagline && <p className="text-xs text-[var(--text-tertiary)] line-clamp-2 italic">{project.tagline}</p>}
                      </div>
                      <div className="space-y-2">
                          <div className="flex justify-between text-sm font-medium"><span>{t('workflow.progress')}</span><span className="font-bold">{project.progress}%</span></div>
                          <div className="w-full h-2 bg-[var(--bg-secondary)] rounded-full overflow-hidden"><div className="h-full bg-[var(--accent-primary)] rounded-full" style={{ width: `${project.progress}%` }}></div></div>
                          <div className="flex justify-between items-center pt-2 border-t border-[var(--border-primary)]">
                              <div className="flex -space-x-2">{project.team.slice(0,3).map(m => (<img key={m.id} src={m.avatar} className="w-7 h-7 rounded-full border-2 border-[var(--bg-card)]" />))}{project.team.length > 3 && <div className="w-7 h-7 rounded-full bg-[var(--bg-secondary)] flex items-center justify-center text-[9px] font-bold border-2 border-[var(--bg-card)]">+{project.team.length-3}</div>}</div>
                              <div className="flex items-center gap-1.5">
                                  <span className="flex items-center gap-1 text-xs font-bold text-yellow-400">
                                      <span className="w-3.5 h-3.5 rounded-full bg-yellow-400 text-black flex items-center justify-center text-[8px] font-black flex-shrink-0">C</span>
                                      {project.budget.toLocaleString()}
                                  </span>
                                  <span className="text-[var(--text-tertiary)] text-xs">•</span>
                                  <span className="text-xs text-[var(--text-secondary)]">{project.deadline}</span>
                              </div>
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
      case 'resources': return <ResourcesView searchQuery={searchQuery} />;
      case 'creative': return <PromptsView searchQuery={searchQuery} />;
      case 'automation': return (
        <div className="p-6 md:p-8 overflow-y-auto flex-1 animate-fade-in">
            <div className="flex justify-between items-center mb-8"><h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-400">{t('workflow.automation.title')}</h1><button className="bg-[var(--accent-primary)] text-black font-bold px-6 py-2.5 rounded-lg shadow-lg hover:opacity-90 transition-all flex items-center gap-2"><span>+</span> {t('workflow.automation.create')}</button></div>
            <div className="grid grid-cols-1 gap-4">{automations.map(auto => (<div key={auto.id} className="bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-all hover:border-[var(--accent-primary)]"><div className="flex items-center gap-4"><div className={`w-12 h-12 rounded-lg flex items-center justify-center text-2xl ${auto.isActive ? 'bg-green-500/10 text-green-500' : 'bg-gray-500/10 text-gray-500'}`}>{auto.action === 'send_email' ? '📧' : auto.action === 'send_telegram' ? '✈️' : '💬'}</div><div><h3 className="font-bold text-lg text-[var(--text-primary)]">{auto.name}</h3><p className="text-sm text-[var(--text-secondary)] flex items-center gap-2"><span className="font-mono bg-[var(--bg-secondary)] px-1.5 py-0.5 rounded text-xs">{t(`workflow.automation.triggers.${auto.trigger}`)}</span><span>➜</span><span className="font-mono bg-[var(--bg-secondary)] px-1.5 py-0.5 rounded text-xs">{auto.target}</span></p>{auto.lastRun && <p className="text-xs text-[var(--text-tertiary)] mt-1">{t('workflow.automation.lastRun')}: {auto.lastRun}</p>}</div></div><div className="flex items-center gap-4"><span className={`text-sm font-bold ${auto.isActive ? 'text-green-500' : 'text-gray-500'}`}>{auto.isActive ? t('workflow.automation.active') : t('workflow.automation.inactive')}</span><label className="relative inline-flex items-center cursor-pointer"><input type="checkbox" checked={auto.isActive} onChange={() => toggleAutomation(auto.id)} className="sr-only peer" /><div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div></label></div></div>))}</div>
        </div>
      );
      case 'affiliate': return (
        <div className="p-6 md:p-8 overflow-y-auto flex-1 animate-fade-in">
            <div className="mb-8"><h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-rose-400 mb-2">{t('workflow.affiliate.title')}</h1><p className="text-[var(--text-secondary)]">{t('workflow.affiliate.subtitle')}</p></div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"><div className="bg-[var(--bg-card)] border border-[var(--border-primary)] p-6 rounded-2xl"><p className="text-xs font-bold text-[var(--text-tertiary)] uppercase mb-2">{t('workflow.affiliate.totalEarned')}</p><p className="text-3xl font-black text-yellow-400">{affiliateData.totalEarned} <span className="text-sm text-[var(--text-secondary)]">{t('workflow.affiliate.coins')}</span></p></div><div className="bg-[var(--bg-card)] border border-[var(--border-primary)] p-6 rounded-2xl"><p className="text-xs font-bold text-[var(--text-tertiary)] uppercase mb-2">{t('workflow.affiliate.pending')}</p><p className="text-3xl font-black text-blue-400">{affiliateData.pending} <span className="text-sm text-[var(--text-secondary)]">{t('workflow.affiliate.coins')}</span></p></div><div className="bg-[var(--bg-card)] border border-[var(--border-primary)] p-6 rounded-2xl"><p className="text-xs font-bold text-[var(--text-tertiary)] uppercase mb-2">{t('workflow.affiliate.referrals')}</p><p className="text-3xl font-black text-green-400">{affiliateData.referrals}</p></div><div className="bg-[var(--bg-card)] border border-[var(--border-primary)] p-6 rounded-2xl"><p className="text-xs font-bold text-[var(--text-tertiary)] uppercase mb-2">{t('workflow.affiliate.clicks')}</p><p className="text-3xl font-black text-purple-400">{affiliateData.clicks}</p></div></div>
            <h3 className="text-xl font-bold text-[var(--text-primary)] mb-4">{t('workflow.affiliate.program')}</h3>
            <div className="space-y-4 mb-8">{affiliateData.links.map(link => (<div key={link.id} className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] p-4 rounded-xl flex flex-col md:flex-row items-center justify-between gap-4"><div className="flex-1"><h4 className="font-bold text-[var(--text-primary)]">{link.name}</h4><p className="text-xs text-[var(--accent-primary)] mt-1">{t('workflow.affiliate.commission')}: {link.commission}</p></div><div className="flex items-center gap-3 w-full md:w-auto"><code className="bg-black/30 px-3 py-2 rounded text-xs text-[var(--text-secondary)] flex-1 md:flex-none truncate max-w-[200px]">{link.url}</code><button onClick={() => copyToClipboard(link.url)} className="bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] hover:bg-[var(--accent-primary)] hover:text-black px-4 py-2 rounded-lg text-xs font-bold transition-colors">{t('workflow.affiliate.copyLink')}</button></div></div>))}</div>
        </div>
      );
      case 'jobs': return <JobsView searchQuery={searchQuery} />;
      case 'partners': return <PartnersView searchQuery={searchQuery} />;
      default: return (
        <div className="p-6 md:p-8 overflow-y-auto flex-1">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                <div>
                    <h1 className="text-3xl font-bold">{t('workflow.sidebar.allDocuments')}</h1>
                    <p className="text-[var(--text-secondary)] mt-1">{filteredDocs.length} {t('workflow.dashboard.documentsFound')}</p>
                </div>
                <label className="cursor-pointer py-2.5 px-5 bg-[var(--bg-secondary)] border border-[var(--border-primary)] text-[var(--text-primary)] font-bold rounded-lg hover:bg-[var(--border-primary)] transition-colors flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                    {t('workflow.dashboard.upload')}
                    {user?.role !== 'admin' && <span className="text-[var(--text-tertiary)] text-xs font-normal">max 10MB</span>}
                    <input type="file" className="hidden" onChange={handleFileUpload} />
                </label>
            </div>
            {/* Filter bar */}
            <div className="flex flex-wrap gap-3 mb-4">
                <div className="flex gap-1 bg-[var(--bg-secondary)] p-1 rounded-lg border border-[var(--border-primary)]">
                    {(['all', 'personal', 'project'] as const).map(f => (
                        <button key={f} onClick={() => setDocSourceFilter(f)} className={`px-3 py-1.5 rounded text-xs font-bold transition-colors ${docSourceFilter === f ? 'bg-[var(--accent-primary)] text-black' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}>
                            {t(`workflow.dashboard.sourceFilter.${f}`)}
                        </button>
                    ))}
                </div>
            </div>
            <div className="bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-[var(--bg-secondary)] border-b border-[var(--border-primary)] text-xs uppercase tracking-wider text-[var(--text-secondary)]">
                                <th className="p-4 font-semibold cursor-pointer hover:text-[var(--text-primary)] select-none" onClick={() => toggleDocSort('name')}>
                                    <div className="flex items-center gap-1">{t('workflow.dashboard.table.name')}{docSortField === 'name' && <span className="text-[var(--accent-primary)]">{docSortDir === 'asc' ? ' ↑' : ' ↓'}</span>}</div>
                                </th>
                                <th className="p-4 font-semibold cursor-pointer hover:text-[var(--text-primary)] select-none hidden md:table-cell" onClick={() => toggleDocSort('project')}>
                                    <div className="flex items-center gap-1">{t('workflow.dashboard.table.project')}{docSortField === 'project' && <span className="text-[var(--accent-primary)]">{docSortDir === 'asc' ? ' ↑' : ' ↓'}</span>}</div>
                                </th>
                                <th className="p-4 font-semibold cursor-pointer hover:text-[var(--text-primary)] select-none hidden md:table-cell" onClick={() => toggleDocSort('date')}>
                                    <div className="flex items-center gap-1">{t('workflow.dashboard.table.date')}{docSortField === 'date' && <span className="text-[var(--accent-primary)]">{docSortDir === 'asc' ? ' ↑' : ' ↓'}</span>}</div>
                                </th>
                                <th className="p-4 font-semibold text-right">{t('workflow.dashboard.table.action')}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--border-primary)]">
                            {filteredDocs.length > 0 ? filteredDocs.map((doc) => {
                                const linkedProject = doc.projectId ? projects.find(p => p.id === doc.projectId) : null;
                                return (
                                    <tr key={doc.id} className="hover:bg-[var(--bg-secondary)]/50 transition-colors group">
                                        <td className="p-4">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0 ${linkedProject ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' : 'bg-[var(--bg-secondary)] border border-[var(--border-primary)] text-[var(--text-secondary)]'}`}>{doc.type}</div>
                                                <div>
                                                    <p className="font-semibold text-base text-[var(--text-primary)]">{doc.name}</p>
                                                    <p className="text-sm text-[var(--text-tertiary)] mt-0.5">{doc.size}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4 text-sm hidden md:table-cell">
                                            {linkedProject ? (
                                                <div>
                                                    <p className="text-[var(--text-primary)] font-medium">{linkedProject.name}</p>
                                                    <p className="text-xs text-[var(--text-tertiary)] mt-0.5">{t(`workflow.depts.${linkedProject.department}`)}</p>
                                                </div>
                                            ) : (
                                                <span className="text-[var(--text-tertiary)]">—</span>
                                            )}
                                        </td>
                                        <td className="p-4 text-sm text-[var(--text-secondary)] hidden md:table-cell">{doc.uploadDate}</td>
                                        <td className="p-4 text-right">
                                            <div className="flex justify-end gap-1 items-center">
                                                {/* Download — shown when URL is available */}
                                                {doc.url && (
                                                    <a
                                                        href={doc.url}
                                                        download={doc.name}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="p-2 rounded-lg text-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/10 transition-colors"
                                                        title={t('workflow.dashboard.project.teamPanel.download')}
                                                    >
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                                                    </a>
                                                )}
                                                {/* Delete — only for personal (non-project) files */}
                                                {!doc.projectId && (
                                                    <button onClick={() => handleDeleteDoc(doc.id)} className="p-2 rounded-lg text-[var(--text-tertiary)] hover:text-red-400 hover:bg-red-500/20 transition-colors" title={t('workflow.dashboard.docPanel.delete')}>
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            }) : (
                                <tr><td colSpan={4} className="p-12 text-center text-[var(--text-tertiary)] text-base">{t('workflow.dashboard.noFiles')}</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
      );
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center">
        <LoadingSpinner />
    </div>
  );

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] font-sans flex">
        {/* Sidebar */}
        <div className="w-20 md:w-64 bg-[var(--bg-card)] border-r border-[var(--border-primary)] flex flex-col flex-shrink-0">
            <div className="p-6 border-b border-[var(--border-primary)] flex items-center gap-3">
                <button onClick={onBack} className="p-2 rounded-lg hover:bg-[var(--bg-secondary)] transition-colors"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" /></svg></button>
                <span className="font-black text-lg hidden md:block tracking-tight text-white">ALPHA CONNECT</span>
            </div>
            <div className="flex-1 overflow-y-auto py-6 space-y-6 px-3">
                <div><p className="px-4 text-[10px] font-bold text-[var(--text-tertiary)] uppercase tracking-wider mb-2">{t('workflow.sidebar.fileManagement')}</p>
                    <div className="space-y-1">
                        <button onClick={() => { navigate('/workflow'); setActiveView('documents'); }} className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${activeView === 'documents' && !selectedProject ? 'bg-[var(--accent-primary)] text-black font-bold shadow-lg' : 'text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] hover:text-[var(--text-primary)]'}`}><span className="text-xl">📂</span><span className="hidden md:block text-sm">{t('workflow.sidebar.allDocuments')}</span></button>
                        <button onClick={() => { navigate('/workflow'); setActiveView('projects'); }} className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${activeView === 'projects' || !!selectedProject ? 'bg-[var(--accent-primary)] text-black font-bold shadow-lg' : 'text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] hover:text-[var(--text-primary)]'}`}><span className="text-xl">💼</span><span className="hidden md:block text-sm">{t('workflow.sidebar.account')}</span></button>
                    </div>
                </div>
                <div><p className="px-4 text-[10px] font-bold text-[var(--text-tertiary)] uppercase tracking-wider mb-2">{t('workflow.sidebar.networkOpportunity')}</p>
                    <div className="space-y-1">
                        <button onClick={() => { setActiveView('jobs'); setSelectedProject(null); }} className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${(activeView as string) === 'jobs' ? 'bg-[var(--accent-primary)] text-black font-bold shadow-lg' : 'text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] hover:text-[var(--text-primary)]'}`}><span className="text-xl">🚀</span><div className="hidden md:flex flex-col items-start"><span className="text-sm">{t('workflow.sidebar.jobMarket')}</span><span className="text-[10px] opacity-70">{t('workflow.sidebar.freelancer')}</span></div>{(activeView as string) !== 'jobs' && <span className="ml-auto bg-red-500 text-white text-[9px] px-1.5 py-0.5 rounded-full font-bold">New</span>}</button>
                        <button onClick={() => { setActiveView('partners'); setSelectedProject(null); }} className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${(activeView as string) === 'partners' ? 'bg-[#1e293b] border border-[var(--border-primary)] shadow-lg' : 'text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] hover:text-[var(--text-primary)]'}`}><span className="text-xl">🤝</span><span className={`hidden md:block text-sm ${(activeView as string) === 'partners' ? 'text-[var(--accent-primary)] font-bold' : ''}`}>{t('workflow.sidebar.partners')}</span></button>
                        <button onClick={() => { setActiveView('affiliate'); setSelectedProject(null); }} className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${(activeView as string) === 'affiliate' ? 'bg-[var(--accent-primary)] text-black font-bold shadow-lg' : 'text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] hover:text-[var(--text-primary)]'}`}><span className="text-xl">💸</span><span className="hidden md:block text-sm">{t('workflow.sidebar.affiliate')}</span></button>
                        <button onClick={() => navigate('/wallet')} className="w-full flex items-center gap-3 p-3 rounded-xl transition-all text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] hover:text-[var(--text-primary)]"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg><span className="hidden md:block text-sm">{t('workflow.sidebar.creditWallet')}</span><svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 ml-auto opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg></button>
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

        {/* Member Profile Modal */}
        {memberProfileModal && (() => {
            const { member, profile, loading } = memberProfileModal;
            const avatarUrl = profile?.avatar || member.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(member.name)}&background=random&size=128`;
            return (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setMemberProfileModal(null)}>
                    <div className="bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
                        {/* Header band */}
                        <div className="h-16 bg-gradient-to-r from-[var(--accent-primary)]/30 to-purple-500/20 relative" />
                        <div className="px-6 pb-6 -mt-8">
                            {/* Avatar */}
                            <img
                                src={avatarUrl}
                                className="w-16 h-16 rounded-full object-cover border-4 border-[var(--bg-card)] shadow-lg mb-3"
                            />
                            {/* Name + badges */}
                            <div className="flex items-start justify-between gap-2 mb-1">
                                <h3 className="text-xl font-black text-[var(--text-primary)] leading-tight">{member.name}</h3>
                                <div className="flex items-center gap-1.5 flex-wrap justify-end flex-shrink-0">
                                    {member.projectRole === 'creator' && <span className="text-[10px] bg-purple-500/20 text-purple-400 px-2 py-0.5 rounded-full font-bold whitespace-nowrap">👑 Creator</span>}
                                    {member.projectRole === 'manager' && <span className="text-[10px] bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full font-bold whitespace-nowrap">⭐ Manager</span>}
                                    {!member.projectRole && <span className="text-[10px] bg-[var(--bg-secondary)] text-[var(--text-tertiary)] px-2 py-0.5 rounded-full font-bold border border-[var(--border-primary)] whitespace-nowrap">👤 Member</span>}
                                    {member.isExternal && <span className="text-[10px] bg-yellow-500/20 text-yellow-500 px-2 py-0.5 rounded-full font-bold whitespace-nowrap">🔗 External</span>}
                                </div>
                            </div>

                            {loading ? (
                                <div className="flex items-center justify-center py-8">
                                    <div className="w-6 h-6 border-2 border-[var(--accent-primary)]/30 border-t-[var(--accent-primary)] rounded-full animate-spin" />
                                </div>
                            ) : profile ? (
                                <div className="space-y-3 mt-4">
                                    {/* Basic info rows */}
                                    <div className="space-y-2 text-sm">
                                        <div className="flex items-center gap-2 text-[var(--text-secondary)]">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 flex-shrink-0 text-[var(--accent-primary)]" viewBox="0 0 20 20" fill="currentColor"><path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z"/><path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z"/></svg>
                                            <span className="truncate">{profile.email || <span className="text-[var(--text-tertiary)] italic">{t('workflow.dashboard.project.memberProfile.noInfo')}</span>}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-[var(--text-secondary)]">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 flex-shrink-0 text-[var(--accent-primary)]" viewBox="0 0 20 20" fill="currentColor"><path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z"/></svg>
                                            <span>{profile.phone || <span className="text-[var(--text-tertiary)] italic">{t('workflow.dashboard.project.memberProfile.noInfo')}</span>}</span>
                                        </div>
                                        {profile.location && (
                                            <div className="flex items-center gap-2 text-[var(--text-secondary)]">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 flex-shrink-0 text-[var(--accent-primary)]" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd"/></svg>
                                                <span>{profile.location}</span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Bio */}
                                    {profile.bio && (
                                        <div className="border-t border-[var(--border-primary)] pt-3">
                                            <p className="text-xs font-bold text-[var(--text-tertiary)] uppercase tracking-wider mb-1">{t('workflow.dashboard.project.memberProfile.bio')}</p>
                                            <p className="text-sm text-[var(--text-secondary)] leading-relaxed line-clamp-3">{profile.bio}</p>
                                        </div>
                                    )}

                                    {/* Skills */}
                                    {profile.skills && profile.skills.length > 0 && (
                                        <div className="border-t border-[var(--border-primary)] pt-3">
                                            <p className="text-xs font-bold text-[var(--text-tertiary)] uppercase tracking-wider mb-2">{t('workflow.dashboard.project.memberProfile.skills')}</p>
                                            <div className="flex flex-wrap gap-1.5">
                                                {profile.skills.map((s, i) => (
                                                    <span key={i} className="text-xs bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] px-2 py-0.5 rounded-full border border-[var(--accent-primary)]/20">{s}</span>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Socials */}
                                    {(profile.socials?.facebook || profile.socials?.linkedin || profile.socials?.github) && (
                                        <div className="border-t border-[var(--border-primary)] pt-3 flex items-center gap-3">
                                            {profile.socials.facebook && <a href={profile.socials.facebook} target="_blank" rel="noopener noreferrer" className="text-[var(--text-tertiary)] hover:text-blue-400 transition-colors" title="Facebook"><svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg></a>}
                                            {profile.socials.linkedin && <a href={profile.socials.linkedin} target="_blank" rel="noopener noreferrer" className="text-[var(--text-tertiary)] hover:text-blue-500 transition-colors" title="LinkedIn"><svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg></a>}
                                            {profile.socials.github && <a href={profile.socials.github} target="_blank" rel="noopener noreferrer" className="text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors" title="GitHub"><svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.929.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/></svg></a>}
                                        </div>
                                    )}
                                </div>
                            ) : null}

                            {/* Actions */}
                            <div className="flex gap-2 mt-5">
                                <a
                                    href={`/users/${member.id}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex-1 py-2 rounded-xl bg-[var(--accent-primary)]/10 hover:bg-[var(--accent-primary)]/20 text-[var(--accent-primary)] text-sm font-bold transition-colors text-center border border-[var(--accent-primary)]/30"
                                >
                                    {t('workflow.dashboard.project.memberProfile.viewProfile')} ↗
                                </a>
                                <button
                                    onClick={() => setMemberProfileModal(null)}
                                    className="flex-1 py-2 rounded-xl bg-[var(--bg-secondary)] hover:bg-[var(--border-primary)] text-[var(--text-secondary)] text-sm font-bold transition-colors"
                                >
                                    {t('workflow.dashboard.project.memberProfile.close')}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            );
        })()}

        {showProjectModal && canCreateProject && (
            <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
                <div className="bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-2xl w-full max-w-lg p-6">
                    <h2 className="text-2xl font-bold mb-6">{t('workflow.dashboard.project.modalTitle')}</h2>
                    <form onSubmit={handleCreateProject} className="space-y-4">
                        <div className="relative">
                            <input placeholder=" " value={newProjectData.name} onChange={e => setNewProjectData({...newProjectData, name: e.target.value})} required className="peer w-full px-3 pt-5 pb-2 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg text-sm focus:outline-none focus:border-[var(--accent-primary)] transition-colors" />
                            <label className="pointer-events-none absolute left-3 top-2 text-[10px] font-medium text-[var(--accent-primary)] transition-all peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-sm peer-placeholder-shown:font-normal peer-placeholder-shown:text-[var(--text-secondary)] peer-focus:top-2 peer-focus:text-[10px] peer-focus:font-medium peer-focus:text-[var(--accent-primary)]">{t('workflow.dashboard.project.nameLabel')} *</label>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="relative">
                                <input placeholder=" " value={newProjectData.client} onChange={e => setNewProjectData({...newProjectData, client: e.target.value})} required className="peer w-full px-3 pt-5 pb-2 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg text-sm focus:outline-none focus:border-[var(--accent-primary)] transition-colors" />
                                <label className="pointer-events-none absolute left-3 top-2 text-[10px] font-medium text-[var(--accent-primary)] transition-all peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-sm peer-placeholder-shown:font-normal peer-placeholder-shown:text-[var(--text-secondary)] peer-focus:top-2 peer-focus:text-[10px] peer-focus:font-medium peer-focus:text-[var(--accent-primary)]">{t('workflow.dashboard.project.modal.client')} *</label>
                            </div>
                            <div className="relative">
                                <input type="number" placeholder=" " value={newProjectData.budget || ''} onChange={e => setNewProjectData({...newProjectData, budget: parseInt(e.target.value)})} required className="peer w-full px-3 pt-5 pb-2 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg text-sm focus:outline-none focus:border-[var(--accent-primary)] transition-colors" />
                                <label className="pointer-events-none absolute left-3 top-2 text-[10px] font-medium text-[var(--accent-primary)] transition-all peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-sm peer-placeholder-shown:font-normal peer-placeholder-shown:text-[var(--text-secondary)] peer-focus:top-2 peer-focus:text-[10px] peer-focus:font-medium peer-focus:text-[var(--accent-primary)]">{t('workflow.dashboard.project.modal.budget')} *</label>
                            </div>
                            <div className="relative">
                                <select value={newProjectData.department} onChange={e => setNewProjectData({...newProjectData, department: e.target.value as any})} className="peer w-full px-3 pt-5 pb-2 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg text-sm focus:outline-none focus:border-[var(--accent-primary)] transition-colors appearance-none">
                                    <option value="event_planner">{t('workflow.depts.event_planner')}</option>
                                    <option value="creative">{t('workflow.depts.creative')}</option>
                                    <option value="operation">{t('workflow.depts.operation')}</option>
                                </select>
                                <label className="pointer-events-none absolute left-3 top-2 text-[10px] font-medium text-[var(--text-secondary)] peer-focus:text-[var(--accent-primary)]">{t('workflow.dashboard.project.deptLabel')}</label>
                            </div>
                            <div className="relative">
                                <input type="date" value={newProjectData.deadline} onChange={e => setNewProjectData({...newProjectData, deadline: e.target.value})} className="peer w-full px-3 pt-5 pb-2 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg text-sm focus:outline-none focus:border-[var(--accent-primary)] transition-colors" />
                                <label className="pointer-events-none absolute left-3 top-2 text-[10px] font-medium text-[var(--text-secondary)] peer-focus:text-[var(--accent-primary)]">{t('workflow.dashboard.project.modal.deadline')}</label>
                            </div>
                        </div>
                        <div className="relative">
                            <input placeholder=" " value={newProjectData.tagline} onChange={e => setNewProjectData({...newProjectData, tagline: e.target.value})} className="peer w-full px-3 pt-5 pb-2 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg text-sm focus:outline-none focus:border-[var(--accent-primary)] transition-colors" />
                            <label className="pointer-events-none absolute left-3 top-2 text-[10px] font-medium text-[var(--accent-primary)] transition-all peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-sm peer-placeholder-shown:font-normal peer-placeholder-shown:text-[var(--text-secondary)] peer-focus:top-2 peer-focus:text-[10px] peer-focus:font-medium peer-focus:text-[var(--accent-primary)]">{t('workflow.introduction')}</label>
                        </div>
                        <div className="flex gap-2 justify-end mt-4">
                            <button type="button" onClick={() => setShowProjectModal(false)} className="px-4 py-2 rounded-lg text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)]">{t('common.cancel')}</button>
                            <button type="submit" className="px-4 py-2 bg-[var(--accent-primary)] text-black font-bold rounded-lg">{t('workflow.dashboard.project.createBtn')}</button>
                        </div>
                    </form>
                </div>
            </div>
        )}

        {/* Creative and Resource modals moved to PromptsView and ResourcesView components */}

        {showTaskModal && (<div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"><div className="bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-2xl w-full max-w-lg p-6"><h2 className="text-2xl font-bold mb-4">{t('workflow.dashboard.project.tasks.modal.title')}</h2><div className="space-y-4"><input placeholder={t('workflow.dashboard.project.tasks.modal.titleLabel')} value={newTaskData.title} onChange={e => setNewTaskData({...newTaskData, title: e.target.value})} className="w-full p-3 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg" /><select value={newTaskData.assigneeId} onChange={e => setNewTaskData({...newTaskData, assigneeId: e.target.value})} className="w-full p-3 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg"><option value="">{t('workflow.dashboard.project.tasks.modal.selectAssignee')}</option>{(selectedProject?.team || []).map(u => (<option key={u.id} value={u.id}>{u.name} {u.projectRole ? `(${u.projectRole})` : ''}</option>))}</select><input type="date" value={newTaskData.dueDate} onChange={e => setNewTaskData({...newTaskData, dueDate: e.target.value})} className="w-full p-3 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg" />{selectedFileForTask && (<div className="text-sm bg-[var(--bg-secondary)] p-2 rounded">{t('workflow.dashboard.project.tasks.modal.attached')} {selectedFileForTask.name}</div>)}<div className="flex gap-2 justify-end mt-4"><button onClick={() => { setShowTaskModal(false); setSelectedFileForTask(null); }} className="px-4 py-2 rounded-lg text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)]">{t('common.cancel')}</button><button onClick={handleCreateTask} className="px-4 py-2 bg-[var(--accent-primary)] text-black font-bold rounded-lg">{t('workflow.dashboard.project.tasks.modal.submit')}</button></div></div></div></div>)}

        {/* Edit Project Modal */}
        {showEditProjectModal && (
            <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
                <div className="bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-2xl w-full max-w-2xl p-6">
                    <h2 className="text-xl font-bold mb-4">{t('workflow.dashboard.project.edit')}</h2>
                    <div className="space-y-4">
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-primary)] flex items-center justify-center overflow-hidden flex-shrink-0">
                                {editProjectData.avatar ? <img src={editProjectData.avatar} className="w-full h-full object-cover" /> : <span className="text-2xl">📁</span>}
                            </div>
                            <label className="flex-1 cursor-pointer">
                                <span className="text-xs text-[var(--text-secondary)] block mb-1">{t('workflow.dashboard.project.editAvatar')}</span>
                                <div className="py-2 px-3 bg-[var(--bg-secondary)] border border-dashed border-[var(--border-primary)] rounded-lg text-center text-sm hover:border-[var(--accent-primary)] transition-colors">
                                    {editProjectUploading ? 'Uploading...' : 'Click to upload image'}
                                </div>
                                <input type="file" accept="image/*" className="hidden" onChange={handleEditProjectAvatarUpload} disabled={editProjectUploading} />
                            </label>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="relative col-span-2">
                                <input placeholder=" " value={editProjectData.name} onChange={e => setEditProjectData(prev => ({ ...prev, name: e.target.value }))} className="peer w-full px-3 pt-5 pb-2 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg text-sm focus:outline-none focus:border-[var(--accent-primary)] transition-colors" />
                                <label className="pointer-events-none absolute left-3 top-2 text-[10px] font-medium text-[var(--accent-primary)] transition-all peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-sm peer-placeholder-shown:font-normal peer-placeholder-shown:text-[var(--text-secondary)] peer-focus:top-2 peer-focus:text-[10px] peer-focus:font-medium peer-focus:text-[var(--accent-primary)]">{t('workflow.dashboard.project.nameLabel')}</label>
                            </div>
                            <div className="relative">
                                <input placeholder=" " value={editProjectData.client} onChange={e => setEditProjectData(prev => ({ ...prev, client: e.target.value }))} className="peer w-full px-3 pt-5 pb-2 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg text-sm focus:outline-none focus:border-[var(--accent-primary)] transition-colors" />
                                <label className="pointer-events-none absolute left-3 top-2 text-[10px] font-medium text-[var(--accent-primary)] transition-all peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-sm peer-placeholder-shown:font-normal peer-placeholder-shown:text-[var(--text-secondary)] peer-focus:top-2 peer-focus:text-[10px] peer-focus:font-medium peer-focus:text-[var(--accent-primary)]">{t('workflow.dashboard.project.modal.client')}</label>
                            </div>
                            <div className="relative">
                                <input type="number" placeholder=" " value={editProjectData.budget || ''} onChange={e => setEditProjectData(prev => ({ ...prev, budget: parseInt(e.target.value) || 0 }))} className="peer w-full px-3 pt-5 pb-2 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg text-sm focus:outline-none focus:border-[var(--accent-primary)] transition-colors" />
                                <label className="pointer-events-none absolute left-3 top-2 text-[10px] font-medium text-[var(--accent-primary)] transition-all peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-sm peer-placeholder-shown:font-normal peer-placeholder-shown:text-[var(--text-secondary)] peer-focus:top-2 peer-focus:text-[10px] peer-focus:font-medium peer-focus:text-[var(--accent-primary)]">{t('workflow.dashboard.project.modal.budget')}</label>
                            </div>
                            <div className="relative">
                                <select value={editProjectData.department} onChange={e => setEditProjectData(prev => ({ ...prev, department: e.target.value as DepartmentType }))} className="peer w-full px-3 pt-5 pb-2 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg text-sm focus:outline-none focus:border-[var(--accent-primary)] transition-colors appearance-none">
                                    <option value="event_planner">{t('workflow.depts.event_planner')}</option>
                                    <option value="creative">{t('workflow.depts.creative')}</option>
                                    <option value="operation">{t('workflow.depts.operation')}</option>
                                </select>
                                <label className="pointer-events-none absolute left-3 top-2 text-[10px] font-medium text-[var(--text-secondary)] peer-focus:text-[var(--accent-primary)]">{t('workflow.dashboard.project.deptLabel')}</label>
                            </div>
                            <div className="relative">
                                <input type="date" value={editProjectData.deadline} onChange={e => setEditProjectData(prev => ({ ...prev, deadline: e.target.value }))} className="peer w-full px-3 pt-5 pb-2 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg text-sm focus:outline-none focus:border-[var(--accent-primary)] transition-colors" />
                                <label className="pointer-events-none absolute left-3 top-2 text-[10px] font-medium text-[var(--text-secondary)] peer-focus:text-[var(--accent-primary)]">{t('workflow.dashboard.project.modal.deadline')}</label>
                            </div>
                        </div>
                        <div className="relative">
                            <textarea placeholder=" " value={editProjectData.tagline} onChange={e => setEditProjectData(prev => ({ ...prev, tagline: e.target.value }))} rows={2} className="peer w-full px-3 pt-5 pb-2 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg text-sm focus:outline-none focus:border-[var(--accent-primary)] transition-colors resize-none" />
                            <label className="pointer-events-none absolute left-3 top-2 text-[10px] font-medium text-[var(--accent-primary)] transition-all peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-sm peer-placeholder-shown:font-normal peer-placeholder-shown:text-[var(--text-secondary)] peer-focus:top-2 peer-focus:text-[10px] peer-focus:font-medium peer-focus:text-[var(--accent-primary)]">{t('workflow.introduction')}</label>
                        </div>
                        <div className="relative">
                            <textarea placeholder=" " value={editProjectData.requirements} onChange={e => setEditProjectData(prev => ({ ...prev, requirements: e.target.value }))} rows={3} className="peer w-full px-3 pt-5 pb-2 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg text-sm focus:outline-none focus:border-[var(--accent-primary)] transition-colors resize-none" />
                            <label className="pointer-events-none absolute left-3 top-2 text-[10px] font-medium text-[var(--accent-primary)] transition-all peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-sm peer-placeholder-shown:font-normal peer-placeholder-shown:text-[var(--text-secondary)] peer-focus:top-2 peer-focus:text-[10px] peer-focus:font-medium peer-focus:text-[var(--accent-primary)]">{t('workflow.requirements')}</label>
                        </div>
                        <div>
                            <p className="text-xs text-[var(--text-secondary)] mb-1">{t('workflow.description')}</p>
                            <Editor
                                tinymceScriptSrc="/tinymce/tinymce.min.js"
                                value={editProjectData.description}
                                onEditorChange={(content: string) => setEditProjectData(prev => ({ ...prev, description: content }))}
                                licenseKey="gpl"
                                init={{
                                    height: 220,
                                    menubar: false,
                                    plugins: ['lists', 'link', 'autolink', 'image'],
                                    toolbar: 'bold italic underline | bullist numlist | link image | removeformat',
                                    skin: 'oxide-dark',
                                    content_css: 'dark',
                                    branding: false,
                                    statusbar: false,
                                    content_style: 'body { font-family: sans-serif; font-size: 14px; }',
                                    images_upload_handler: async (blobInfo: any) => {
                                        const token = localStorage.getItem('alpha_studio_token');
                                        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
                                        const res = await fetch(`${apiUrl}/upload/presign`, {
                                            method: 'POST',
                                            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                                            body: JSON.stringify({ filename: blobInfo.filename() || 'image.png', contentType: blobInfo.blob().type || 'image/png', folder: 'project-descriptions' }),
                                        });
                                        if (!res.ok) throw new Error('Upload failed');
                                        const { data } = await res.json();
                                        await fetch(data.presignedUrl, { method: 'PUT', body: blobInfo.blob(), headers: { 'Content-Type': blobInfo.blob().type } });
                                        return data.publicUrl;
                                    },
                                }}
                            />
                        </div>
                        <div className="flex gap-2 justify-end">
                            <button onClick={() => setShowEditProjectModal(false)} className="px-4 py-2 rounded-lg text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)]">{t('common.cancel')}</button>
                            <button onClick={handleSaveEditProject} disabled={!editProjectData.name.trim() || editProjectUploading} className="px-4 py-2 bg-[var(--accent-primary)] text-black font-bold rounded-lg disabled:opacity-50">{t('common.save')}</button>
                        </div>
                    </div>
                </div>
            </div>
        )}

        {/* File Comment Panel */}
        {activeDocForComment && (
            <div className="fixed inset-y-0 right-0 w-80 bg-[var(--bg-card)] border-l border-[var(--border-primary)] flex flex-col z-40 shadow-2xl">
                <div className="p-4 border-b border-[var(--border-primary)] flex justify-between items-start gap-2">
                    <div className="min-w-0 flex-1">
                        <p className="font-bold truncate text-sm">{activeDocForComment.name}</p>
                        <div className="flex items-center gap-2 mt-1">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getStatusColor(activeDocForComment.status)}`}>{t(`workflow.dashboard.status.${activeDocForComment.status}`)}</span>
                            <span className="text-[10px] text-[var(--text-tertiary)]">{activeDocForComment.size}</span>
                        </div>
                    </div>
                    <button onClick={() => setActiveDocForComment(null)} className="p-1.5 rounded-lg hover:bg-[var(--bg-secondary)] text-[var(--text-secondary)] flex-shrink-0">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                    </button>
                </div>
                {activeDocForComment.status === 'pending' && (
                    <div className="p-3 border-b border-[var(--border-primary)] flex gap-2">
                        <button onClick={() => handleChangeDocStatus(activeDocForComment.id, 'approved')} className="flex-1 py-2 rounded-lg bg-green-500/20 text-green-400 hover:bg-green-500/30 text-sm font-bold transition-colors">✓ {t('workflow.dashboard.docPanel.approve')}</button>
                        <button onClick={() => handleChangeDocStatus(activeDocForComment.id, 'rejected')} className="flex-1 py-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 text-sm font-bold transition-colors">✗ {t('workflow.dashboard.docPanel.reject')}</button>
                    </div>
                )}
                {activeDocForComment.status !== 'pending' && (
                    <div className="p-3 border-b border-[var(--border-primary)]">
                        <button onClick={() => handleChangeDocStatus(activeDocForComment.id, 'pending')} className="w-full py-2 rounded-lg bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30 text-sm font-bold transition-colors">↺ {t('workflow.dashboard.docPanel.resetPending')}</button>
                    </div>
                )}
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    <p className="text-[10px] font-bold text-[var(--text-tertiary)] uppercase tracking-wider">{t('workflow.dashboard.docPanel.comments')}</p>
                    {(activeDocForComment.comments || []).length === 0 ? (
                        <p className="text-xs text-[var(--text-tertiary)] italic">{t('workflow.dashboard.docPanel.noComments')}</p>
                    ) : (
                        (activeDocForComment.comments || []).map(cmt => (
                            <div key={cmt.id} className="bg-[var(--bg-secondary)] rounded-lg p-3">
                                <div className="flex justify-between items-center mb-1">
                                    <span className="text-xs font-bold">{cmt.author}</span>
                                    <span className="text-[10px] text-[var(--text-tertiary)]">{cmt.timestamp}</span>
                                </div>
                                <p className="text-sm text-[var(--text-primary)]">{cmt.text}</p>
                            </div>
                        ))
                    )}
                </div>
                <form onSubmit={handleAddDocComment} className="p-4 border-t border-[var(--border-primary)] flex gap-2">
                    <input value={docComment} onChange={e => setDocComment(e.target.value)} placeholder={t('workflow.dashboard.docPanel.placeholder')} className="flex-1 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[var(--accent-primary)]" />
                    <button type="submit" disabled={!docComment.trim()} className="bg-[var(--accent-primary)] text-black px-3 py-2 rounded-lg font-bold text-sm disabled:opacity-50">{t('workflow.dashboard.docPanel.send')}</button>
                </form>
            </div>
        )}
    </div>
  );
}
