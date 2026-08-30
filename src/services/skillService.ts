const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// ─── Types ──────────────────────────────────────────────────────────

export interface Skill {
  _id?: string;
  source: string;
  url: string;
  slug: string;
  name: string;
  headline: string;
  headline_vi: string;
  short_description: string;
  short_description_vi: string;
  tier: string;
  category: string;
  difficulty: string;
  install_type: string;
  estimated_time_saving: string;
  author: string;
  install_command: string;
  source_repo_url: string;
  github_stars?: number;
  works_with: string[];
  tags: string[];
}

export interface SkillDetail extends Skill {
  sections: {
    overview: string;
    overview_vi: string;
    setup: string;
    setup_vi: string;
    usage: string;
    usage_vi: string;
    requirements: string[];
    related_skills: string[];
  };
}

export interface PaginationInfo {
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export interface FilterCounts {
  categories: Record<string, number>;
  tiers: Record<string, number>;
  difficulties: Record<string, number>;
  installTypes: Record<string, number>;
  totalSkills: number;
  verifiedCount: number;
  totalTimeSavedHours: number;
}

export interface SkillsListResponse {
  success: boolean;
  data: Skill[];
  pagination: PaginationInfo;
  filterCounts: FilterCounts;
}

export interface SkillDetailResponse {
  success: boolean;
  data: SkillDetail;
  relatedSkills: Skill[];
}

export interface SkillsStatsResponse {
  success: boolean;
  data: {
    totalSkills: number;
    verifiedCount: number;
    totalTimeSavedHours: number;
  };
}

// ─── Query params builder ───────────────────────────────────────────

export interface SkillsQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  difficulty?: string;
  tier?: string;
  install_type?: string;
  timeSaving?: string;
  sort?: string;
}

function buildQueryString(params: SkillsQueryParams): string {
  const searchParams = new URLSearchParams();

  if (params.page) searchParams.set('page', String(params.page));
  if (params.limit) searchParams.set('limit', String(params.limit));
  if (params.search) searchParams.set('search', params.search);
  if (params.category) searchParams.set('category', params.category);
  if (params.difficulty && params.difficulty !== 'all') searchParams.set('difficulty', params.difficulty);
  if (params.tier) searchParams.set('tier', params.tier);
  if (params.install_type) searchParams.set('install_type', params.install_type);
  if (params.timeSaving) searchParams.set('timeSaving', params.timeSaving);
  if (params.sort) searchParams.set('sort', params.sort);

  const qs = searchParams.toString();
  return qs ? `?${qs}` : '';
}

// ─── API Functions ──────────────────────────────────────────────────

/**
 * Fetch paginated skills list with filters
 */
export async function getSkills(params: SkillsQueryParams = {}): Promise<SkillsListResponse> {
  const qs = buildQueryString(params);
  const res = await fetch(`${API_URL}/skills${qs}`);
  if (!res.ok) {
    throw new Error(`Failed to fetch skills: ${res.status}`);
  }
  return res.json();
}

/**
 * Fetch a single skill by slug (full detail including sections)
 */
export async function getSkillBySlug(slug: string): Promise<SkillDetailResponse> {
  const res = await fetch(`${API_URL}/skills/${encodeURIComponent(slug)}`);
  if (!res.ok) {
    throw new Error(`Failed to fetch skill: ${res.status}`);
  }
  return res.json();
}

/**
 * Fetch aggregate stats for the hero section
 */
export async function getSkillsStats(): Promise<SkillsStatsResponse> {
  const res = await fetch(`${API_URL}/skills/stats`);
  if (!res.ok) {
    throw new Error(`Failed to fetch skills stats: ${res.status}`);
  }
  return res.json();
}

// ─── Admin API ──────────────────────────────────────────────────────
// Slug là khoá công khai của skill nên backend không cho sửa — payload chỉ
// mang các field nội dung, gửi partial được.

export type SkillUpdateInput = Partial<Omit<SkillDetail, '_id' | 'slug'>>;

/**
 * Update a skill (admin only)
 */
export async function updateSkill(
  slug: string,
  payload: SkillUpdateInput,
  token: string
): Promise<{ success: boolean; message: string; data: SkillDetail }> {
  const res = await fetch(`${API_URL}/skills/${encodeURIComponent(slug)}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
  const json = await res.json().catch(() => ({ message: `HTTP ${res.status}` }));
  if (!res.ok) {
    throw new Error(json.message || `Failed to update skill: ${res.status}`);
  }
  return json;
}

/**
 * Delete a skill (admin only)
 */
export async function deleteSkill(
  slug: string,
  token: string
): Promise<{ success: boolean; message: string }> {
  const res = await fetch(`${API_URL}/skills/${encodeURIComponent(slug)}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
  const json = await res.json().catch(() => ({ message: `HTTP ${res.status}` }));
  if (!res.ok) {
    throw new Error(json.message || `Failed to delete skill: ${res.status}`);
  }
  return json;
}
