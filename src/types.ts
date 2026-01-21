export interface Control {
  key: string;
  labelKey: string;
  min: number;
  max: number;
  defaultValue: number;
  unit?: string;
}

export interface Preset {
  key: string;
  labelKey: string;
  prompt: string;
  referenceImage?: string;
  control?: Control;
}

export interface Transformation {
  key: string;
  titleKey: string;
  icon: string;
  prompt?: string;
  descriptionKey?: string;
  items?: Transformation[];
  isMultiImage?: boolean;
  isSecondaryOptional?: boolean;
  isTwoStep?: boolean;
  stepTwoPrompt?: string;
  primaryUploaderTitle?: string;
  secondaryUploaderTitle?: string;
  primaryUploaderDescription?: string;
  secondaryUploaderDescription?: string;
  controls?: Control[];
  hasCustomPrompt?: boolean;
  isCustomPromptOptional?: boolean;
  customPromptLabelKey?: string;
  customPromptPlaceholderKey?: string;
  hasMask?: boolean;
  isPresetBased?: boolean;
  presets?: Preset[];
  isStoryboard?: boolean;
  backgroundUploaderTitle?: string;
  backgroundUploaderDescription?: string;
  characterUploaderTitle?: string;
  characterUploaderDescription?: string;
  referenceUploaderTitle?: string;
  referenceUploaderDescription?: string;
}

export interface GeneratedContent {
  imageUrl: string | null;
  text: string | null;
  secondaryImageUrl?: string | null;
  videoUrl?: string;
  originalImageUrl?: string | null;
}

export type DepartmentType = 'all' | 'event_planner' | 'creative' | 'operation';

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  avatar: string;
  isExternal?: boolean;
}

export interface Comment {
  id: string;
  author: string;
  text: string;
  timestamp: string;
  isSystem?: boolean;
}

export interface Task {
  id: string;
  title: string;
  assigneeId: string;
  assigneeName: string;
  status: 'todo' | 'in_progress' | 'done';
  dueDate: string;
  fileId?: string;
}

export interface Project {
  id: string;
  name: string;
  client: string;
  description: string;
  department: DepartmentType;
  status: 'planning' | 'active' | 'completed' | 'archived';
  startDate: string;
  deadline: string;
  budget: number;
  expenses: number;
  team: TeamMember[];
  files: string[];
  progress: number;
  chatHistory: Comment[];
  tasks: Task[];
}

export interface WorkflowDocument {
  id: string;
  name: string;
  type: string;
  size: string;
  uploadDate: string;
  uploader: string;
  department: DepartmentType;
  status: 'pending' | 'approved' | 'rejected';
  url?: string;
  team?: TeamMember[];
  comments?: Comment[];
  isProject?: boolean;
  projectId?: string;
  description?: string;
  tasks?: Task[];
}

export interface ServerApp {
  id: string;
  name: string;
  icon: string;
  status: 'online' | 'busy' | 'offline';
  description: string;
  costPerHour: number;
}

export interface Job {
  id: string;
  title: string;
  client: string;
  budget: string;
  deadline: string;
  description: string;
  tags: string[];
  postedDate: string;
  applicants: number;
}

export interface Transaction {
  id: string;
  type: 'deposit' | 'spend' | 'earning' | 'withdrawal' | 'reward';
  amount: number;
  description: string;
  date: string;
  status: 'completed' | 'pending' | 'failed';
}

export type PartnerType = 'agency' | 'supplier';

export interface PartnerCompany {
  id: string;
  name: string;
  type: PartnerType;
  logo: string;
  description: string;
  location: string;
  contact: {
    phone: string;
    email: string;
    website: string;
  };
  specialties: string[];
  isVerified: boolean;
  coverImage?: string;
  projects?: string[];
}

export interface UserProfile {
  name: string;
  role: string;
  email: string;
  phone: string;
  bio: string;
  skills: string[];
  portfolioUrl?: string;
  avatar?: string;
  birthDate?: string;
  showBirthDate?: boolean;
  location?: string;
  socials?: {
    linkedin?: string;
    behance?: string;
    github?: string;
  };
}

export interface FeaturedStudent {
  id: string;
  name: string;
  role: string;
  image: string;
  work: string;
  hired: boolean;
  bio?: string;
  skills?: string[];
  gallery?: string[];
  socials?: {
    behance?: string;
    linkedin?: string;
  }
}

export interface AutomationRule {
  id: string;
  name: string;
  trigger: 'file_upload' | 'status_approved' | 'status_rejected';
  action: 'send_email' | 'send_telegram' | 'send_whatsapp';
  target: string;
  isActive: boolean;
  lastRun?: string;
}

export interface AffiliateStats {
  totalEarned: number;
  pending: number;
  referrals: number;
  clicks: number;
  links: {
    id: string;
    name: string;
    url: string;
    commission: string;
  }[];
}

export interface CreativeAsset {
  id: string;
  title: string;
  type: 'prompt' | 'workflow' | 'dataset';
  content: string;
  tags: string[];
  author: string;
  likes: number;
  downloads: number;
}

export interface SharedResource {
  id: string;
  title: string;
  type: 'project_file' | 'design_asset' | 'industry_data' | 'template';
  format: string;
  size: string;
  author: string;
  downloads: number;
  uploadDate: string;
  description: string;
}

export interface CourseData {
  id: string;
  title: string;
  description: string;
  image?: string;
  duration: string;
  level?: string;
  instructor?: string;
  modules?: CourseModule[];
  // Landing page course fields
  tag?: string;
  lessonsCount?: number;
  progress?: number;
  icon?: string;
  color?: string;
  syllabus?: { title: string; duration: string }[];
}

export interface CourseModule {
  id: string;
  title: string;
  duration: string;
  lessons: string[];
}
