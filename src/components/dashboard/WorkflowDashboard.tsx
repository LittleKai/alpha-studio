
import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useTranslation } from '../../i18n/context';
import { useAuth } from '../../auth/context';
import { useConfirm } from '../ui/ConfirmDialog';
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
import { uploadToB2, isB2Url, getB2SignedUrl } from '../../services/b2StorageService';
import { compressImage } from '../../services/imageCompression';
import LoadingSpinner from '../ui/LoadingSpinner';
// StudentProfileModal and PartnerRegistrationModal not used - moved to separate view components
import LanguageSwitcher from '../ui/LanguageSwitcher';
import ThemeSwitcher from '../ui/ThemeSwitcher';
import { JobsView, PartnersView, PromptsView, LibraryPublisherView, SkillsView } from './views';
import ProfileEditModal from '../modals/ProfileEditModal';
import PublishToLibraryModal, { type PublishSource } from '../modals/PublishToLibraryModal';
import './WorkflowDashboard.css';
import { cdnFromUrl } from '../../services/cloudinaryAssets';

type WorkflowIconName = 'back' | 'files' | 'projects' | 'jobs' | 'partners' | 'affiliate' | 'prompts' | 'library' | 'exit' | 'search' | 'user' | 'plus' | 'calendar' | 'creative' | 'operations' | 'arrowRight' | 'book' | 'archive';

function WorkflowIcon({ name, className = 'w-5 h-5' }: { name: WorkflowIconName; className?: string }) {
    let content: React.ReactNode;

    switch (name) {
        case 'back':
            content = <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />;
            break;
        case 'files':
            content = <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />;
            break;
        case 'projects':
            content = <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />;
            break;
        case 'jobs':
            content = <path strokeLinecap="round" strokeLinejoin="round" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />;
            break;
        case 'partners':
            content = <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />;
            break;
        case 'affiliate':
            content = <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />;
            break;
        case 'prompts':
            content = <path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />;
            break;
        case 'library':
            content = <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />;
            break;
        case 'exit':
            content = <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />;
            break;
        case 'search':
            content = <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />;
            break;
        case 'user':
            content = <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />;
            break;
        case 'plus':
            content = <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />;
            break;
        case 'calendar':
            content = <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />;
            break;
        case 'creative':
            content = <path strokeLinecap="round" strokeLinejoin="round" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />;
            break;
        case 'operations':
            content = <><path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></>;
            break;
        case 'arrowRight':
            content = <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />;
            break;
        case 'book':
            content = <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />;
            break;
        case 'archive':
            content = <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />;
            break;
    }

    return <svg aria-hidden="true" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{content}</svg>;
}

function getDocTypeColor(type: string) {
    const ext = type.toLowerCase();
    if (ext === 'pdf') return 'bg-red-500/15 text-red-400 border-red-500/35';
    if (['doc', 'docx', 'txt', 'rtf'].includes(ext)) return 'bg-blue-500/15 text-blue-400 border-blue-500/35';
    if (['xls', 'xlsx', 'csv'].includes(ext)) return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/35';
    if (['ppt', 'pptx'].includes(ext)) return 'bg-orange-500/15 text-orange-400 border-orange-500/35';
    if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext)) return 'bg-amber-500/15 text-amber-400 border-amber-500/35';
    if (['jpg', 'jpeg', 'png', 'webp', 'svg', 'gif'].includes(ext)) return 'bg-purple-500/15 text-purple-400 border-purple-500/35';
    if (['mp4', 'mov', 'avi', 'mkv'].includes(ext)) return 'bg-pink-500/15 text-pink-400 border-pink-500/35';
    return 'bg-cyan-500/15 text-cyan-400 border-cyan-500/35';
}

function getDeptBadge(dept: DepartmentType) {
    switch (dept) {
        case 'event_planner':
            return {
                bg: 'bg-gradient-to-br from-amber-500 to-orange-600 text-white',
                pill: 'bg-amber-500/15 text-amber-400 border-amber-500/35'
            };
        case 'creative':
            return {
                bg: 'bg-gradient-to-br from-purple-500 to-pink-600 text-white',
                pill: 'bg-purple-500/15 text-purple-400 border-purple-500/35'
            };
        case 'operation':
            return {
                bg: 'bg-gradient-to-br from-emerald-500 to-teal-600 text-white',
                pill: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/35'
            };
        default:
            return {
                bg: 'bg-gradient-to-br from-cyan-500 to-blue-600 text-white',
                pill: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/35'
            };
    }
}

interface WorkflowDashboardProps {
  onBack: () => void;
}

export default function WorkflowDashboard({ onBack }: WorkflowDashboardProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [documents, setDocuments] = useState<WorkflowDocument[]>([]);
  // Nguồn đang được đăng lên Thư viện sự kiện (null = modal đóng)
  const [publishSource, setPublishSource] = useState<PublishSource | null>(null);
  const [loading, setLoading] = useState(true);

  const { t } = useTranslation();
  const { user } = useAuth();
  const { confirm: confirmDialog } = useConfirm();
  const navigate = useNavigate();
  const { id: projectIdParam } = useParams<{ id: string }>();

  // Navigation State
  const [searchParams, setSearchParams] = useSearchParams();
  // Deep link: /workflow?view=<skills|library>&edit=<slug> — nút Sửa trên trang
  // chi tiết công khai mở tab mới vào đúng view này với form đã nạp sẵn.
  const deepLinkView = searchParams.get('view');
  const [activeView, setActiveView] = useState<'documents' | 'projects' | 'jobs' | 'partners' | 'automation' | 'affiliate' | 'creative' | 'library' | 'skills'>(
    deepLinkView === 'skills' || deepLinkView === 'library' ? deepLinkView : 'documents'
  );
  const [initialEditSlug, setInitialEditSlug] = useState<string | null>(
    deepLinkView === 'skills' || deepLinkView === 'library' ? searchParams.get('edit') : null
  );
  const [searchQuery, setSearchQuery] = useState('');

  // Bỏ ?edit=<slug> sau khi form đã mở để F5 không mở lại modal
  const clearEditParam = React.useCallback(() => {
    setInitialEditSlug(null);
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      next.delete('edit');
      return next;
    }, { replace: true });
  }, [setSearchParams]);

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
  // showCreativeModal moved to PromptsView
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

  // Delete confirmation dialog
  const [deleteConfirmDoc, setDeleteConfirmDoc] = useState<WorkflowDocument | null>(null);
  const [deleteConfirmInput, setDeleteConfirmInput] = useState('');

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

  // creativeAssets state moved to PromptsView
  // Partners state moved to PartnersView component with database integration

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return;
    const picked = e.target.files[0];
    e.target.value = '';
    // Tài liệu giữ nguyên; ảnh thì resize + WebP trước khi lên B2 (B2 không transform được)
    const file = await compressImage(picked, 'attachment');

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
        setDocuments(prev => prev.map(d => d.id === tempId ? { ...d, url: uploadUrl, fileKey: b2Result.key } : d));
    } catch {
        setDocuments(prev => prev.filter(d => d.id !== tempId));
        setUploadProgress(prev => { const n = { ...prev }; delete n[tempId]; return n; });
        alert(t('workflow.dashboard.uploadFailed'));
        return;
    }
    setUploadProgress(prev => { const n = { ...prev }; delete n[tempId]; return n; });

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

  // handleCreateAsset moved to PromptsView
  // handleAddPartner moved to PartnersView component

  const toggleAutomation = (id: string) => { setAutomations(prev => prev.map(a => a.id === id ? { ...a, isActive: !a.isActive } : a)); };
  const copyToClipboard = (text: string) => { navigator.clipboard.writeText(text); alert(t('workflow.affiliate.copied')); };

  const handleChangeDocStatus = (docId: string, newStatus: 'approved' | 'rejected' | 'pending') => {
      setDocuments(prev => prev.map(d => d.id === docId ? { ...d, status: newStatus } : d));
      setActiveDocForComment(prev => prev?.id === docId ? { ...prev, status: newStatus } : prev);
      updateDocumentAPI(docId, { status: newStatus }).catch(console.error);
  };

  const handleDeleteDoc = (doc: WorkflowDocument) => {
      setDeleteConfirmDoc(doc);
      setDeleteConfirmInput('');
  };

  const confirmDeleteDoc = () => {
      if (!deleteConfirmDoc || deleteConfirmInput !== deleteConfirmDoc.name) return;
      const docId = deleteConfirmDoc.id;
      setDocuments(prev => prev.filter(d => d.id !== docId));
      if (activeDocForComment?.id === docId) setActiveDocForComment(null);
      deleteDocumentAPI(docId).catch(console.error);
      setDeleteConfirmDoc(null);
      setDeleteConfirmInput('');
  };

  const handleDownload = async (doc: WorkflowDocument) => {
      if (!doc.url) return;
      const token = localStorage.getItem('alpha_studio_token') || '';
      if (isB2Url(doc.url)) {
          try {
              const signedUrl = await getB2SignedUrl(doc.url, token);
              window.open(signedUrl, '_blank');
          } catch {
              alert(t('workflow.dashboard.downloadError'));
          }
      } else {
          window.open(doc.url, '_blank');
      }
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

  const handleAddMemberToProject = async (user: TeamMember) => {
      if (!selectedProject) return;
      const currentTeam = selectedProject.team || [];
      if (currentTeam.find(m => m.id === user.id)) return;

      const MEMBER_COST = 50;

      if (user.isExternal) {
          if (balance < MEMBER_COST) {
              alert(t('workflow.collaboration.insufficient'));
              return;
          }
          if (await confirmDialog({ message: `${t('workflow.collaboration.feeNotice')} (${MEMBER_COST} Coins)`, variant: 'warning' })) {
              setBalance((prev: number) => prev - MEMBER_COST);
              setTransactions((prev: Transaction[]) => [{ id: `fee-${Date.now()}`, type: 'spend', amount: -MEMBER_COST, description: `Phí thêm thành viên dự án: ${user.name}`, date: new Date().toISOString().split('T')[0], status: 'completed' }, ...prev]);

              updateProjectTeamAndFinance(user, MEMBER_COST);
          }
      } else {
          if (await confirmDialog({ message: `${t('workflow.collaboration.freeNotice')} (${user.name})`, variant: 'info' })) {
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

  const handlePackageProject = async () => {
      if (!selectedProject) return;
      if (await confirmDialog({ message: t('workflow.dashboard.project.package.confirm'), variant: 'warning' })) {
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

  const handleRemoveMember = async (memberId: string, memberName: string) => {
      if (!selectedProject) return;
      if (!await confirmDialog({ message: t('workflow.collaboration.removeConfirm').replace('{name}', memberName), variant: 'danger' })) return;
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

  const handleLeaveProject = async () => {
      if (!selectedProject || !user) return;
      if (!await confirmDialog({ message: t('workflow.collaboration.leaveConfirm').replace('{name}', selectedProject.name), variant: 'danger' })) return;
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
  const handleDeleteProject = async (projectId: string) => {
      if (!await confirmDialog({ message: t('workflow.dashboard.project.confirmDelete'), variant: 'danger' })) return;
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
          <div className="workflow-project-shell animate-fade-in">
              <div className="workflow-project-header">
                  <div className="workflow-project-header-main">
                      <button
                          onClick={() => navigate('/workflow')}
                          className="workflow-button workflow-button-secondary workflow-back-button"
                      >
                          <WorkflowIcon name="back" className="w-4 h-4" />
                          {t('workflow.dashboard.project.backToProjects')}
                      </button>
                      {selectedProject.avatar ? (
                          <img src={cdnFromUrl(selectedProject.avatar, 'w_128')} alt="" className="workflow-project-header-avatar" />
                      ) : (
                          <span className="workflow-project-header-avatar workflow-project-header-avatar-fallback">
                              <WorkflowIcon name={selectedProject.department === 'event_planner' ? 'calendar' : selectedProject.department === 'creative' ? 'creative' : 'operations'} />
                          </span>
                      )}
                      <div className="workflow-project-header-copy">
                          <div className="workflow-project-header-title">
                              <h1>{selectedProject.name}</h1>
                              {isProjectManagerOrCreator() && selectedProject.status !== 'completed' && (
                                  <button onClick={handleOpenEditProject} className="workflow-icon-button" title={t('workflow.dashboard.project.edit')}>
                                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" /></svg>
                                  </button>
                              )}
                          </div>
                          <div className="workflow-project-header-meta">
                              <span>{selectedProject.client}</span>
                              <span>{selectedProject.startDate} → {selectedProject.deadline}</span>
                              <span className={`workflow-status workflow-status-${selectedProject.status}`}>
                                  {t(`workflow.status.${selectedProject.status}`)}
                              </span>
                          </div>
                      </div>
                  </div>
                  <div className="workflow-project-header-actions">
                  {isProjectMember() && (
                      <button
                          onClick={() => setPublishSource({ kind: 'project', id: selectedProject.id, name: selectedProject.name, summary: selectedProject.tagline || selectedProject.client })}
                          className="workflow-button workflow-button-library"
                      >
                          <WorkflowIcon name="book" />
                          {t('eventLibrary.publish.button')}
                      </button>
                  )}
                  {isProjectCreator() && selectedProject.status !== 'completed' && (
                      <button onClick={handlePackageProject} className="workflow-button workflow-button-secondary">
                          <WorkflowIcon name="archive" />
                          {t('workflow.dashboard.project.package.btn')}
                      </button>
                  )}
                  </div>
              </div>

              <div className="workflow-project-tabs" role="tablist">
                  {(isProjectMember()
                      ? ['overview', 'team', 'files', 'finance', 'chat', 'tasks']
                      : ['overview', 'team']
                  ).map(tab => (
                      <button
                        key={tab}
                        onClick={() => setProjectTab(tab as any)}
                        className={projectTab === tab ? 'is-active' : ''}
                        role="tab"
                        aria-selected={projectTab === tab}
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
                                      <div className="tinymce-content text-[var(--text-secondary)] text-sm leading-relaxed" dangerouslySetInnerHTML={{ __html: selectedProject.description }} />
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
                                              src={cdnFromUrl(member.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(member.name)}&background=random`, 'w_128')}
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
                                                <img src={cdnFromUrl(u.avatar, 'w_128')} className="w-8 h-8 rounded-full object-cover" />
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
                                   <div key={doc.id} className="p-4 bg-[var(--bg-card)] rounded-xl border border-[var(--border-primary)] shadow-sm hover:border-[var(--accent-primary)]/50 transition-colors">
                                       <div className="flex items-start justify-between gap-3">
                                           <div className="flex items-center gap-3.5 flex-1 min-w-0">
                                               <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-xs font-black uppercase flex-shrink-0 border shadow-sm ${getDocTypeColor(doc.type)}`}>{doc.type}</div>
                                               <div className="flex-1 min-w-0">
                                                   <p className="font-bold text-base text-[var(--text-primary)] truncate">{doc.name}</p>
                                                   <p className="text-xs font-medium text-[var(--text-tertiary)] mt-0.5">{doc.uploader} • {doc.size} • {doc.uploadDate}</p>
                                                   {/* Upload progress bar */}
                                                   {uploadProgress[doc.id] !== undefined && (
                                                       <div className="mt-1.5">
                                                           <div className="flex justify-between text-xs text-[var(--text-tertiary)] mb-0.5">
                                                               <span>Uploading to B2...</span>
                                                               <span className="font-bold text-[var(--accent-primary)]">{uploadProgress[doc.id]}%</span>
                                                           </div>
                                                           <div className="w-full h-1.5 bg-[var(--bg-secondary)] rounded-full overflow-hidden">
                                                               <div className="h-full bg-gradient-to-r from-[var(--accent-primary)] to-emerald-400 rounded-full transition-all" style={{ width: `${uploadProgress[doc.id]}%` }} />
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
                                           <div className="flex gap-2 flex-shrink-0 items-center">
                                               {doc.url ? (
                                                   <a href={doc.url} download={doc.name} target="_blank" rel="noreferrer" className="text-xs bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 hover:bg-cyan-500/25 px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-colors">
                                                       ↓ {t('workflow.dashboard.project.teamPanel.download')}
                                                   </a>
                                               ) : (
                                                   <span className="text-xs text-[var(--text-tertiary)] px-3 py-1 font-bold">{doc.name.split('.').pop()?.toUpperCase()}</span>
                                               )}
                                               {canDeleteDoc(doc) && (
                                                   <button onClick={() => handleDeleteDoc(doc)} className="text-xs bg-rose-500/15 text-rose-400 border border-rose-500/30 hover:bg-rose-500/25 px-2.5 py-1.5 rounded-lg font-bold transition-colors" title={t('workflow.dashboard.docPanel.delete')}>✕</button>
                                               )}
                                           </div>
                                       </div>
                                   </div>
                               )) : <p className="text-[var(--text-tertiary)] italic text-base">{t('workflow.dashboard.project.filesPanel.noFiles')}</p>}
                          </div>
                      </div>
                  )}

                  {projectTab === 'finance' && (
                      <div className="space-y-6">
                          <div className="workflow-finance-summary">
                              <div className="workflow-finance-metric" data-tone="success">
                                  <p>{t('workflow.dashboard.project.finance.budget')}</p>
                                  <div><span>C</span><strong>{selectedProject.budget.toLocaleString()}</strong></div>
                              </div>
                              <div className="workflow-finance-metric" data-tone="danger">
                                  <p>{t('workflow.dashboard.project.finance.expenses')}</p>
                                  <div><span>C</span><strong>{selectedProject.expenses.toLocaleString()}</strong></div>
                              </div>
                              <div className="workflow-finance-metric" data-tone="info">
                                  <p>{t('workflow.dashboard.project.finance.profit')}</p>
                                  <div><span>C</span><strong>{(selectedProject.budget - selectedProject.expenses).toLocaleString()}</strong></div>
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
                                              <span className={`workflow-status ${task.status === 'todo' ? 'workflow-status-planning' : task.status === 'done' ? 'workflow-status-completed' : ''}`}>{t(`workflow.dashboard.project.tasks.status.${task.status}`)}</span>
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
      <div className="workflow-content-scroll workflow-projects-page animate-fade-in">
          <div className="workflow-page-heading">
              <div>
                  <h1>{t('workflow.dashboard.project.hubTitle')}</h1>
                  <p>{t('workflow.subtitle')}</p>
              </div>
              {canCreateProject && (
                  <button onClick={() => setShowProjectModal(true)} className="workflow-button workflow-button-primary">
                      <WorkflowIcon name="plus" />
                      {t('workflow.dashboard.createProject')}
                  </button>
              )}
          </div>

          <div className="workflow-project-toolbar">
              <div className="workflow-filter-group" aria-label={t('workflow.dashboard.project.deptFilter')}>
                  {DEPT_OPTIONS.map(opt => (
                      <button
                          key={opt.value}
                          onClick={() => setProjectDeptFilter(opt.value)}
                          className={`workflow-filter ${projectDeptFilter === opt.value ? 'is-active' : ''}`}
                          aria-pressed={projectDeptFilter === opt.value}
                      >
                          <span className="text-base">{opt.icon}</span>
                          <span>{opt.label}</span>
                      </button>
                  ))}
              </div>
              <button
                  onClick={() => setProjectMineFilter(value => !value)}
                  className={`workflow-filter workflow-filter-mine ${projectMineFilter ? 'is-active' : ''}`}
                  aria-pressed={projectMineFilter}
              >
                  <span className="text-base">👤</span>
                  <span>{t('workflow.dashboard.project.mineFilter')}</span>
              </button>
              <span className="workflow-project-count">{filteredProjects.length} {t('workflow.dashboard.project.projectsShown')}</span>
          </div>

          {filteredProjects.length === 0 ? (
              <div className="workflow-empty-state">
                  <span className="text-4xl">📁</span>
                  <h2>{t('workflow.dashboard.project.noProjects')}</h2>
                  {canCreateProject && (
                      <button onClick={() => setShowProjectModal(true)} className="workflow-button workflow-button-primary">
                          <span className="text-lg">＋</span>
                          {t('workflow.dashboard.createProject')}
                      </button>
                  )}
              </div>
          ) : (
              <div className="workflow-project-list">
                  {filteredProjects.map(project => {
                      const deptBadge = getDeptBadge(project.department);
                      return (
                      <div
                          key={project.id}
                          className={`workflow-project-row ${isUserMemberOf(project) ? 'is-member' : ''}`}
                          role="button"
                          tabIndex={0}
                          onClick={() => navigate(`/workflow/projects/${project.id}`)}
                          onKeyDown={event => {
                              if (event.key === 'Enter' || event.key === ' ') {
                                  event.preventDefault();
                                  navigate(`/workflow/projects/${project.id}`);
                              }
                          }}
                          aria-label={project.name}
                      >
                          <div className="workflow-project-identity">
                              <span className={`workflow-project-avatar ${!project.avatar ? deptBadge.bg : ''}`}>
                                  {project.avatar ? (
                                      <img src={cdnFromUrl(project.avatar, 'w_128')} alt="" />
                                  ) : (
                                      <span className="text-2xl">{project.department === 'event_planner' ? '📅' : project.department === 'creative' ? '🎨' : '⚙️'}</span>
                                  )}
                              </span>
                              <div className="workflow-project-copy">
                                  <div className="workflow-project-title-line">
                                      <h2>{project.name}</h2>
                                      {isUserMemberOf(project) && (
                                          <span className="workflow-member-badge"><span>👤</span>{t('workflow.dashboard.project.memberBadge')}</span>
                                      )}
                                  </div>
                                  <p className="workflow-project-client">{project.client}</p>
                                  {project.tagline && <p className="workflow-project-tagline line-clamp-2">{project.tagline}</p>}
                              </div>
                          </div>

                          <div className="workflow-project-classification">
                              <span className={`workflow-status workflow-status-${project.status}`}>
                                  <span className="w-2 h-2 rounded-full inline-block mr-1.5 bg-current opacity-80 animate-pulse"></span>
                                  {t(`workflow.status.${project.status}`)}
                              </span>
                              <span className="workflow-department">{t(`workflow.depts.${project.department}`)}</span>
                          </div>

                          <div className="workflow-project-progress">
                              <div><span>{t('workflow.progress')}</span><strong>{project.progress}%</strong></div>
                              <progress value={project.progress} max="100" aria-label={`${t('workflow.progress')} ${project.progress}%`} />
                          </div>

                          <div className="workflow-project-meta">
                              <div className="workflow-team-stack" aria-label={`${project.team.length} ${t('workflow.teamMembers')}`}>
                                  {project.team.slice(0, 3).map(member => member.avatar ? (
                                      <img key={member.id} src={cdnFromUrl(member.avatar, 'w_128')} alt={member.name} />
                                  ) : (
                                      <span key={member.id}>{member.name.charAt(0).toUpperCase()}</span>
                                  ))}
                                  {project.team.length > 3 && <span>+{project.team.length - 3}</span>}
                              </div>
                              <span className="workflow-project-budget"><b>C</b>{project.budget.toLocaleString()}</span>
                              <span className="workflow-project-deadline"><WorkflowIcon name="calendar" className="w-4 h-4" />{project.deadline}</span>
                          </div>

                          {user?.role === 'admin' && project.status === 'completed' && (
                              <button
                                  onClick={event => { event.stopPropagation(); handleDeleteProject(project.id); }}
                                  onKeyDown={event => event.stopPropagation()}
                                  className="workflow-project-delete"
                                  title={t('workflow.dashboard.project.confirmDelete')}
                              >
                                  <WorkflowIcon name="archive" className="w-4 h-4" />
                              </button>
                          )}
                          <WorkflowIcon name="arrowRight" className="workflow-project-arrow" />
                      </div>
                  );})}
              </div>
          )}
      </div>
  );

  const renderContent = () => {
    if (selectedProject) return renderProjectHub();

    switch (activeView) {
      case 'projects': return renderProjectList();
      case 'library': return (
        <LibraryPublisherView
          searchQuery={searchQuery}
          initialEditSlug={initialEditSlug}
          onInitialEditConsumed={clearEditParam}
        />
      );
      case 'creative': return <PromptsView searchQuery={searchQuery} />;
      case 'automation': return (
        <div className="workflow-content-scroll animate-fade-in">
            <div className="workflow-page-heading"><h1>{t('workflow.automation.title')}</h1><button className="workflow-button workflow-button-primary"><WorkflowIcon name="plus" />{t('workflow.automation.create')}</button></div>
            <div className="grid grid-cols-1 gap-4">{automations.map(auto => (<div key={auto.id} className="bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-all hover:border-[var(--accent-primary)]"><div className="flex items-center gap-4"><div className={`w-12 h-12 rounded-lg flex items-center justify-center text-2xl ${auto.isActive ? 'bg-green-500/10 text-green-500' : 'bg-gray-500/10 text-gray-500'}`}>{auto.action === 'send_email' ? '📧' : auto.action === 'send_telegram' ? '✈️' : '💬'}</div><div><h3 className="font-bold text-lg text-[var(--text-primary)]">{auto.name}</h3><p className="text-sm text-[var(--text-secondary)] flex items-center gap-2"><span className="font-mono bg-[var(--bg-secondary)] px-1.5 py-0.5 rounded text-xs">{t(`workflow.automation.triggers.${auto.trigger}`)}</span><span>➜</span><span className="font-mono bg-[var(--bg-secondary)] px-1.5 py-0.5 rounded text-xs">{auto.target}</span></p>{auto.lastRun && <p className="text-xs text-[var(--text-tertiary)] mt-1">{t('workflow.automation.lastRun')}: {auto.lastRun}</p>}</div></div><div className="flex items-center gap-4"><span className={`text-sm font-bold ${auto.isActive ? 'text-green-500' : 'text-gray-500'}`}>{auto.isActive ? t('workflow.automation.active') : t('workflow.automation.inactive')}</span><label className="relative inline-flex items-center cursor-pointer"><input type="checkbox" checked={auto.isActive} onChange={() => toggleAutomation(auto.id)} className="sr-only peer" /><div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div></label></div></div>))}</div>
        </div>
      );
      case 'affiliate': return (
        <div className="workflow-content-scroll animate-fade-in">
            <div className="workflow-page-heading"><div><h1>{t('workflow.affiliate.title')}</h1><p>{t('workflow.affiliate.subtitle')}</p></div></div>
            <div className="workflow-affiliate-summary">
                <div><span>{t('workflow.affiliate.totalEarned')}</span><strong>{affiliateData.totalEarned} <small>{t('workflow.affiliate.coins')}</small></strong></div>
                <div><span>{t('workflow.affiliate.pending')}</span><strong>{affiliateData.pending} <small>{t('workflow.affiliate.coins')}</small></strong></div>
                <div><span>{t('workflow.affiliate.referrals')}</span><strong>{affiliateData.referrals}</strong></div>
                <div><span>{t('workflow.affiliate.clicks')}</span><strong>{affiliateData.clicks}</strong></div>
            </div>
            <h3 className="text-xl font-bold text-[var(--text-primary)] mb-4">{t('workflow.affiliate.program')}</h3>
            <div className="space-y-4 mb-8">{affiliateData.links.map(link => (<div key={link.id} className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] p-4 rounded-xl flex flex-col md:flex-row items-center justify-between gap-4"><div className="flex-1"><h4 className="font-bold text-[var(--text-primary)]">{link.name}</h4><p className="text-xs text-[var(--accent-primary)] mt-1">{t('workflow.affiliate.commission')}: {link.commission}</p></div><div className="flex items-center gap-3 w-full md:w-auto"><code className="bg-black/30 px-3 py-2 rounded text-xs text-[var(--text-secondary)] flex-1 md:flex-none truncate max-w-[200px]">{link.url}</code><button onClick={() => copyToClipboard(link.url)} className="bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] hover:bg-[var(--accent-primary)] hover:text-black px-4 py-2 rounded-lg text-xs font-bold transition-colors">{t('workflow.affiliate.copyLink')}</button></div></div>))}</div>
        </div>
      );
      case 'jobs': return <JobsView searchQuery={searchQuery} />;
      case 'partners': return <PartnersView searchQuery={searchQuery} />;
      case 'skills': return (
        <SkillsView
          searchQuery={searchQuery}
          initialEditSlug={initialEditSlug}
          onInitialEditConsumed={clearEditParam}
        />
      );
      default: return (
        <div className="workflow-content-scroll workflow-documents-page">
            <div className="workflow-page-heading">
                <div>
                    <h1>{t('workflow.sidebar.allDocuments')}</h1>
                    <p>{filteredDocs.length} {t('workflow.dashboard.documentsFound')}</p>
                </div>
                <label className="workflow-button workflow-button-primary cursor-pointer">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                    {t('workflow.dashboard.upload')}
                    {user?.role !== 'admin' && <span className="workflow-button-note">{t('workflow.dashboard.uploadLimit')}</span>}
                    <input type="file" className="hidden" onChange={handleFileUpload} />
                </label>
            </div>
            {/* Filter bar */}
            <div className="workflow-document-toolbar">
                <div className="workflow-filter-group">
                    {(['all', 'personal', 'project'] as const).map(f => (
                        <button key={f} onClick={() => setDocSourceFilter(f)} className={`workflow-filter ${docSourceFilter === f ? 'is-active' : ''}`} aria-pressed={docSourceFilter === f}>
                            {t(`workflow.dashboard.sourceFilter.${f}`)}
                        </button>
                    ))}
                </div>
            </div>
            <div className="workflow-table-surface">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="workflow-table-head">
                                <th className="p-4 font-semibold cursor-pointer hover:text-[var(--text-primary)] select-none" onClick={() => toggleDocSort('name')}>
                                    <div className="flex items-center gap-1">{t('workflow.dashboard.table.name')}{docSortField === 'name' && <span className="text-[var(--accent-primary)]">{docSortDir === 'asc' ? ' ↑' : ' ↓'}</span>}</div>
                                </th>
                                <th className="p-4 font-semibold cursor-pointer hover:text-[var(--text-primary)] select-none hidden md:table-cell" onClick={() => toggleDocSort('project')}>
                                    <div className="flex items-center gap-1">{t('workflow.dashboard.table.project')}{docSortField === 'project' && <span className="text-[var(--accent-primary)]">{docSortDir === 'asc' ? ' ↑' : ' ↓'}</span>}</div>
                                </th>
                                <th className="p-4 font-bold text-sm cursor-pointer hover:text-[var(--text-primary)] select-none hidden md:table-cell" onClick={() => toggleDocSort('date')}>
                                    <div className="flex items-center gap-1">{t('workflow.dashboard.table.date')}{docSortField === 'date' && <span className="text-[var(--accent-primary)]">{docSortDir === 'asc' ? ' ↑' : ' ↓'}</span>}</div>
                                </th>
                                <th className="p-4 font-bold text-sm text-right">{t('workflow.dashboard.table.action')}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--border-primary)]">
                            {filteredDocs.length > 0 ? filteredDocs.map((doc) => {
                                const linkedProject = doc.projectId ? projects.find(p => p.id === doc.projectId) : null;
                                const deptInfo = linkedProject ? getDeptBadge(linkedProject.department) : null;
                                return (
                                    <tr key={doc.id} className="hover:bg-[var(--bg-secondary)]/50 transition-colors group">
                                        <td className="p-4">
                                            <div className="flex items-center gap-3.5">
                                                <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-xs font-black uppercase flex-shrink-0 border shadow-sm ${getDocTypeColor(doc.type)}`}>
                                                    {doc.type}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="font-bold text-base text-[var(--text-primary)] hover:text-[var(--accent-primary)] transition-colors truncate">{doc.name}</p>
                                                    <p className="text-xs font-medium text-[var(--text-tertiary)] mt-0.5">{doc.size}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4 text-sm hidden md:table-cell">
                                            {linkedProject ? (
                                                <div className="flex items-center gap-2">
                                                    <span className={`w-2.5 h-2.5 rounded-full ${deptInfo?.bg || 'bg-cyan-500'}`}></span>
                                                    <div>
                                                        <p className="text-[var(--text-primary)] font-bold text-sm">{linkedProject.name}</p>
                                                        <p className="text-xs font-semibold text-[var(--text-tertiary)] mt-0.5">{t(`workflow.depts.${linkedProject.department}`)}</p>
                                                    </div>
                                                </div>
                                            ) : (
                                                <span className="text-[var(--text-tertiary)] font-medium">—</span>
                                            )}
                                        </td>
                                        <td className="p-4 text-sm font-medium text-[var(--text-secondary)] hidden md:table-cell">{doc.uploadDate}</td>
                                        <td className="p-4 text-right">
                                            <div className="flex justify-end gap-1.5 items-center">
                                                {/* Download — always shown, uses signed URL for B2 */}
                                                {doc.url && (
                                                    <button
                                                        onClick={() => handleDownload(doc)}
                                                        className="p-2.5 rounded-xl text-cyan-400 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/20 transition-all shadow-sm"
                                                        title={t('workflow.dashboard.project.teamPanel.download')}
                                                    >
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                                                    </button>
                                                )}
                                                {/* Đăng lên Thư viện sự kiện — chỉ người upload và admin */}
                                                {doc.url && (doc.createdBy === user?._id || user?.role === 'admin') && (
                                                    <button
                                                        onClick={() => setPublishSource({ kind: 'document', id: doc.id, name: doc.name, summary: doc.note })}
                                                        className="p-2.5 rounded-xl text-purple-400 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/20 transition-all shadow-sm"
                                                        title={t('eventLibrary.publish.button')}
                                                    >
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z" /></svg>
                                                    </button>
                                                )}
                                                {/* Delete — only for personal (non-project) files */}
                                                {!doc.projectId && (
                                                    <button onClick={() => handleDeleteDoc(doc)} className="p-2.5 rounded-xl text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 transition-all shadow-sm" title={t('workflow.dashboard.docPanel.delete')}>
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

  const currentViewLabel = selectedProject?.name || {
      documents: t('workflow.sidebar.allDocuments'),
      projects: t('workflow.sidebar.account'),
      jobs: t('workflow.sidebar.jobMarket'),
      partners: t('workflow.sidebar.partners'),
      automation: t('workflow.automation.title'),
      affiliate: t('workflow.sidebar.affiliate'),
      creative: t('workflow.sidebar.sharePrompts'),
      library: t('workflow.sidebar.libraryPublisher'),
      skills: t('workflow.sidebar.skillsLibrary'),
  }[activeView];

  return (
    <div className="workflow-shell">
        <aside className="workflow-sidebar">
            <button onClick={onBack} className="workflow-brand group" aria-label={t('workflow.sidebar.exitStudio')}>
                <img src="/alpha-logo-animated.svg" alt="Alpha Connect" className="w-10 h-10 rounded-xl object-contain group-hover:rotate-12 transition-transform shadow-md flex-shrink-0" />
                <span className="workflow-brand-copy"><strong>Alpha Connect</strong><small>{t('workflow.title')}</small></span>
            </button>

            <nav className="workflow-nav-scroll" aria-label={t('workflow.title')}>
                <section className="workflow-nav-section">
                    <h2>{t('workflow.sidebar.fileManagement')}</h2>
                    <div>
                        <button onClick={() => { navigate('/workflow'); setActiveView('documents'); }} className={`workflow-nav-item ${activeView === 'documents' && !selectedProject ? 'is-active' : ''}`} title={t('workflow.sidebar.allDocuments')}>
                            <span className="workflow-nav-icon-wrap bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-xl">
                                📂
                            </span>
                            <span>{t('workflow.sidebar.allDocuments')}</span>
                        </button>
                        <button onClick={() => { navigate('/workflow'); setActiveView('projects'); }} className={`workflow-nav-item ${activeView === 'projects' || !!selectedProject ? 'is-active' : ''}`} title={t('workflow.sidebar.account')}>
                            <span className="workflow-nav-icon-wrap bg-amber-500/15 text-amber-400 border border-amber-500/30 text-xl">
                                💼
                            </span>
                            <span>{t('workflow.sidebar.account')}</span>
                        </button>
                    </div>
                </section>

                <section className="workflow-nav-section">
                    <h2>{t('workflow.sidebar.networkOpportunity')}</h2>
                    <div>
                        <button onClick={() => { setActiveView('jobs'); setSelectedProject(null); }} className={`workflow-nav-item ${activeView === 'jobs' ? 'is-active' : ''}`} title={t('workflow.sidebar.jobMarket')}>
                            <span className="workflow-nav-icon-wrap bg-sky-500/15 text-sky-400 border border-sky-500/30 text-xl">
                                🚀
                            </span>
                            <span>{t('workflow.sidebar.jobMarket')}</span>
                            {activeView !== 'jobs' && <b className="workflow-nav-badge">{t('workflow.sidebar.newBadge')}</b>}
                        </button>
                        <button onClick={() => { setActiveView('partners'); setSelectedProject(null); }} className={`workflow-nav-item ${activeView === 'partners' ? 'is-active' : ''}`} title={t('workflow.sidebar.partners')}>
                            <span className="workflow-nav-icon-wrap bg-violet-500/15 text-violet-400 border border-violet-500/30 text-xl">
                                🤝
                            </span>
                            <span>{t('workflow.sidebar.partners')}</span>
                        </button>
                        <button onClick={() => { setActiveView('affiliate'); setSelectedProject(null); }} className={`workflow-nav-item ${activeView === 'affiliate' ? 'is-active' : ''}`} title={t('workflow.sidebar.affiliate')}>
                            <span className="workflow-nav-icon-wrap bg-rose-500/15 text-rose-400 border border-rose-500/30 text-xl">
                                💸
                            </span>
                            <span>{t('workflow.sidebar.affiliate')}</span>
                        </button>
                    </div>
                </section>

                <section className="workflow-nav-section">
                    <h2>{t('workflow.sidebar.communityResources')}</h2>
                    <div>
                        <button onClick={() => { setActiveView('creative'); setSelectedProject(null); }} className={`workflow-nav-item ${activeView === 'creative' ? 'is-active' : ''}`} title={t('workflow.sidebar.sharePrompts')}>
                            <span className="workflow-nav-icon-wrap bg-fuchsia-500/15 text-fuchsia-400 border border-fuchsia-500/30 text-xl">
                                🎨
                            </span>
                            <span>{t('workflow.sidebar.sharePrompts')}</span>
                        </button>
                        <button onClick={() => { setActiveView('library'); setSelectedProject(null); }} className={`workflow-nav-item ${activeView === 'library' ? 'is-active' : ''}`} title={t('workflow.sidebar.libraryPublisher')}>
                            <span className="workflow-nav-icon-wrap bg-indigo-500/15 text-indigo-400 border border-indigo-500/30 text-xl">
                                📦
                            </span>
                            <span>{t('workflow.sidebar.libraryPublisher')}</span>
                        </button>
                        {user?.role === 'admin' && (
                            <button onClick={() => { setActiveView('skills'); setSelectedProject(null); }} className={`workflow-nav-item ${activeView === 'skills' ? 'is-active' : ''}`} title={t('workflow.sidebar.skillsLibrary')}>
                                <span className="workflow-nav-icon-wrap bg-orange-500/15 text-orange-400 border border-orange-500/30 text-xl">
                                    🧠
                                </span>
                                <span>{t('workflow.sidebar.skillsLibrary')}</span>
                            </button>
                        )}
                    </div>
                </section>
            </nav>

            <div className="workflow-sidebar-footer">
                <button onClick={onBack} className="workflow-nav-item">
                    <span className="workflow-nav-icon-wrap bg-red-500/15 text-red-400 border border-red-500/30">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                    </span>
                    <span>{t('workflow.sidebar.exitStudio')}</span>
                </button>
            </div>
        </aside>

        <div className="workflow-main">
            <header className="workflow-topbar">
                 <div className="workflow-context-title"><span>{t('workflow.title')}</span><strong>{currentViewLabel}</strong></div>
                 <div className="workflow-search">
                     <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                     <input type="search" placeholder={t('workflow.dashboard.search')} value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} />
                 </div>
                 <div className="workflow-topbar-actions">
                     <div className="workflow-switchers"><LanguageSwitcher /><ThemeSwitcher /></div>
                     <button onClick={() => setShowProfileModal(true)} className="workflow-profile-button" aria-label={userProfile.name}>
                         {user?.avatar ? <img src={cdnFromUrl(user.avatar, 'w_128')} alt="" /> : userProfile.name.charAt(0).toUpperCase()}
                     </button>
                 </div>
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
                <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setMemberProfileModal(null)}>
                    <div className="bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden animate-fade-in" onClick={e => e.stopPropagation()}>
                        {/* Header band */}
                        <div className="h-24 bg-gradient-to-r from-purple-500/30 via-[var(--accent-primary)]/30 to-blue-500/30 relative" />
                        <div className="relative z-10 px-6 pb-6 -mt-12">
                            {/* Avatar */}
                            <img
                                src={cdnFromUrl(avatarUrl, 'w_256')}
                                className="w-24 h-24 rounded-full object-cover border-4 border-[var(--bg-card)] shadow-xl mb-4 relative z-20"
                                alt={member.name}
                            />

                            {loading ? (
                                <div className="flex items-center justify-center py-8">
                                    <div className="w-8 h-8 border-3 border-[var(--accent-primary)]/30 border-t-[var(--accent-primary)] rounded-full animate-spin" />
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {/* Name & Contact Info Flex Row */}
                                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                                        {/* Left Side: Name & Roles */}
                                        <div className="flex-1 min-w-0 space-y-2">
                                            <h3 className="text-2xl font-black text-[var(--text-primary)] leading-tight tracking-tight">{member.name}</h3>
                                            <div className="flex items-center gap-1.5 flex-wrap">
                                                {member.projectRole === 'creator' && <span className="text-xs bg-purple-500/20 text-purple-600 dark:text-purple-400 border border-purple-500/40 px-3 py-1 rounded-full font-bold whitespace-nowrap">👑 Creator</span>}
                                                {member.projectRole === 'manager' && <span className="text-xs bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-500/40 px-3 py-1 rounded-full font-bold whitespace-nowrap">⭐ Manager</span>}
                                                {!member.projectRole && <span className="text-xs bg-[var(--bg-secondary)] text-[var(--text-tertiary)] px-3 py-1 rounded-full font-bold border border-[var(--border-primary)] whitespace-nowrap">👤 Member</span>}
                                                {member.isExternal && <span className="text-xs bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/40 px-3 py-1 rounded-full font-bold whitespace-nowrap">🔗 External</span>}
                                            </div>
                                        </div>

                                        {/* Right Side: Narrow Contact info (Email, Phone, Location) */}
                                        <div className="w-full sm:w-56 flex-shrink-0 space-y-1.5 pt-2 sm:pt-16">
                                            <div className="flex items-center gap-2 px-2.5 py-1.5 bg-[var(--bg-secondary)] rounded-xl border border-[var(--border-primary)] shadow-xs">
                                                <div className="w-6 h-6 rounded-lg bg-purple-500/15 text-purple-600 dark:text-purple-400 flex items-center justify-center flex-shrink-0">
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor"><path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z"/><path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z"/></svg>
                                                </div>
                                                <p className="truncate font-bold text-xs text-[var(--text-primary)] flex-1">{profile?.email || <span className="text-[var(--text-tertiary)] italic font-normal">{t('workflow.dashboard.project.memberProfile.noInfo')}</span>}</p>
                                            </div>

                                            {profile?.phone && (
                                                <div className="flex items-center gap-2 px-2.5 py-1.5 bg-[var(--bg-secondary)] rounded-xl border border-[var(--border-primary)] shadow-xs">
                                                    <div className="w-6 h-6 rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center flex-shrink-0">
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor"><path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z"/></svg>
                                                    </div>
                                                    <p className="font-bold text-xs text-[var(--text-primary)] flex-1">{profile.phone}</p>
                                                </div>
                                            )}

                                            {profile?.location && (
                                                <div className="flex items-center gap-2 px-2.5 py-1.5 bg-[var(--bg-secondary)] rounded-xl border border-[var(--border-primary)] shadow-xs">
                                                    <div className="w-6 h-6 rounded-lg bg-rose-500/15 text-rose-600 dark:text-rose-400 flex items-center justify-center flex-shrink-0">
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd"/></svg>
                                                    </div>
                                                    <p className="font-bold text-xs text-[var(--text-primary)] flex-1">{profile.location}</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Bio: Full Width */}
                                    {profile?.bio && (
                                        <div className="p-3 bg-[var(--bg-secondary)]/40 border border-[var(--border-primary)]/50 rounded-2xl">
                                            <p className="text-xs font-bold text-[var(--text-tertiary)] uppercase tracking-wider mb-1">{t('workflow.dashboard.project.memberProfile.bio')}</p>
                                            <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{profile.bio}</p>
                                        </div>
                                    )}

                                    {/* Skills */}
                                    {profile?.skills && profile.skills.length > 0 && (
                                        <div className="border-t border-[var(--border-primary)] pt-3">
                                            <p className="text-xs font-bold text-[var(--text-tertiary)] uppercase tracking-wider mb-2">{t('workflow.dashboard.project.memberProfile.skills')}</p>
                                            <div className="flex flex-wrap gap-2">
                                                {profile.skills.map((s, i) => (
                                                    <span key={i} className="text-xs bg-[var(--accent-primary)]/15 text-[var(--accent-primary)] px-3 py-1 rounded-xl font-semibold border border-[var(--accent-primary)]/30">{s}</span>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Socials */}
                                    {(profile?.socials?.facebook || profile?.socials?.linkedin || profile?.socials?.github) && (
                                        <div className="border-t border-[var(--border-primary)] pt-3 flex items-center gap-3">
                                            {profile.socials.facebook && <a href={profile.socials.facebook} target="_blank" rel="noopener noreferrer" className="p-2 rounded-xl bg-[#1877f2]/15 text-[#1877f2] border border-[#1877f2]/30 hover:bg-[#1877f2]/25 transition-colors" title="Facebook"><svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg></a>}
                                            {profile.socials.linkedin && <a href={profile.socials.linkedin} target="_blank" rel="noopener noreferrer" className="p-2 rounded-xl bg-[#0077b5]/15 text-[#0077b5] border border-[#0077b5]/30 hover:bg-[#0077b5]/25 transition-colors" title="LinkedIn"><svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg></a>}
                                            {profile.socials.github && <a href={profile.socials.github} target="_blank" rel="noopener noreferrer" className="p-2 rounded-xl bg-[var(--bg-secondary)] text-[var(--text-primary)] border border-[var(--border-primary)] hover:bg-[var(--bg-tertiary)] transition-colors" title="GitHub"><svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.929.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/></svg></a>}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Actions */}
                            <div className="flex gap-2.5 mt-6">
                                <a
                                    href={`/users/${member.id}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    style={{ backgroundColor: '#0284c7', color: '#ffffff' }}
                                    className="flex-1 py-3 rounded-2xl bg-[#0284c7] hover:bg-[#0369a1] text-white font-black text-sm text-center shadow-lg hover:scale-[1.01] transition-all flex items-center justify-center gap-1.5 border-none"
                                >
                                    {t('workflow.dashboard.project.memberProfile.viewFull')} ↗
                                </a>
                                <button
                                    onClick={() => setMemberProfileModal(null)}
                                    className="flex-1 py-3 rounded-2xl bg-[var(--bg-secondary)] hover:bg-[var(--border-primary)] text-[var(--text-primary)] font-bold text-sm transition-colors border border-[var(--border-primary)]"
                                >
                                    {t('workflow.dashboard.project.memberProfile.close')}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            );
        })()}

        {/* Delete File Confirmation Modal */}
        {deleteConfirmDoc && (
            <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setDeleteConfirmDoc(null)}>
                <div className="bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-2xl w-full max-w-sm p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center flex-shrink-0">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                        </div>
                        <div>
                            <h3 className="font-bold text-[var(--text-primary)]">{t('workflow.dashboard.docPanel.deleteConfirmTitle')}</h3>
                            <p className="text-xs text-[var(--text-tertiary)] mt-0.5">{t('workflow.dashboard.docPanel.deleteConfirmMessage')}</p>
                        </div>
                    </div>
                    <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg px-3 py-2 mb-4">
                        <p className="text-sm font-mono text-[var(--text-primary)] break-all">{deleteConfirmDoc.name}</p>
                    </div>
                    <input
                        type="text"
                        placeholder={t('workflow.dashboard.docPanel.deleteConfirmPlaceholder')}
                        value={deleteConfirmInput}
                        onChange={e => setDeleteConfirmInput(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && confirmDeleteDoc()}
                        autoFocus
                        className="w-full px-3 py-2.5 mb-4 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg text-sm text-[var(--text-primary)] placeholder-[var(--text-tertiary)] focus:outline-none focus:border-red-400 transition-colors"
                    />
                    <div className="flex gap-2">
                        <button
                            onClick={confirmDeleteDoc}
                            disabled={deleteConfirmInput !== deleteConfirmDoc.name}
                            className="flex-1 py-2.5 rounded-xl bg-red-500 text-white font-bold text-sm transition-all disabled:opacity-30 disabled:cursor-not-allowed hover:bg-red-600"
                        >
                            {t('workflow.dashboard.docPanel.deleteConfirmBtn')}
                        </button>
                        <button
                            onClick={() => setDeleteConfirmDoc(null)}
                            className="flex-1 py-2.5 rounded-xl bg-[var(--bg-secondary)] text-[var(--text-secondary)] font-bold text-sm hover:bg-[var(--border-primary)] transition-colors"
                        >
                            {t('workflow.dashboard.docPanel.deleteConfirmCancel')}
                        </button>
                    </div>
                </div>
            </div>
        )}

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

        {/* Creative modal moved to PromptsView */}

        {showTaskModal && (<div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"><div className="bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-2xl w-full max-w-lg p-6"><h2 className="text-2xl font-bold mb-4">{t('workflow.dashboard.project.tasks.modal.title')}</h2><div className="space-y-4"><input placeholder={t('workflow.dashboard.project.tasks.modal.titleLabel')} value={newTaskData.title} onChange={e => setNewTaskData({...newTaskData, title: e.target.value})} className="w-full p-3 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg" /><select value={newTaskData.assigneeId} onChange={e => setNewTaskData({...newTaskData, assigneeId: e.target.value})} className="w-full p-3 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg"><option value="">{t('workflow.dashboard.project.tasks.modal.selectAssignee')}</option>{(selectedProject?.team || []).map(u => (<option key={u.id} value={u.id}>{u.name} {u.projectRole ? `(${u.projectRole})` : ''}</option>))}</select><input type="date" value={newTaskData.dueDate} onChange={e => setNewTaskData({...newTaskData, dueDate: e.target.value})} className="w-full p-3 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg" />{selectedFileForTask && (<div className="text-sm bg-[var(--bg-secondary)] p-2 rounded">{t('workflow.dashboard.project.tasks.modal.attached')} {selectedFileForTask.name}</div>)}<div className="flex gap-2 justify-end mt-4"><button onClick={() => { setShowTaskModal(false); setSelectedFileForTask(null); }} className="px-4 py-2 rounded-lg text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)]">{t('common.cancel')}</button><button onClick={handleCreateTask} className="px-4 py-2 bg-[var(--accent-primary)] text-black font-bold rounded-lg">{t('workflow.dashboard.project.tasks.modal.submit')}</button></div></div></div></div>)}

        {/* Edit Project Modal */}
        {showEditProjectModal && (
            <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
                <div className="bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-2xl w-full max-w-2xl p-6">
                    <h2 className="text-xl font-bold mb-4">{t('workflow.dashboard.project.edit')}</h2>
                    <div className="space-y-4">
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-primary)] flex items-center justify-center overflow-hidden flex-shrink-0">
                                {editProjectData.avatar ? <img src={cdnFromUrl(editProjectData.avatar, 'w_128')} className="w-full h-full object-cover" /> : <span className="text-2xl">📁</span>}
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
                                        // B2 không có tầng transform như Cloudinary — phải resize +
                                        // chuyển WebP ngay ở client, nếu không ảnh gốc vào thẳng bucket.
                                        const raw = blobInfo.blob();
                                        const file = await compressImage(
                                            new File([raw], blobInfo.filename() || 'image.png', { type: raw.type || 'image/png' }),
                                            'content'
                                        );
                                        const res = await fetch(`${apiUrl}/upload/presign`, {
                                            method: 'POST',
                                            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                                            body: JSON.stringify({ filename: file.name, contentType: file.type || 'image/png', folder: 'project-descriptions' }),
                                        });
                                        if (!res.ok) throw new Error('Upload failed');
                                        const { data } = await res.json();
                                        await fetch(data.presignedUrl, { method: 'PUT', body: file, headers: { 'Content-Type': file.type } });
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

        {publishSource && (
            <PublishToLibraryModal
                source={publishSource}
                onClose={() => setPublishSource(null)}
            />
        )}
    </div>
  );
}
