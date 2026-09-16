const PLATFORM_LABELS: Record<string, string> = {
  midjourney: 'Midjourney',
  'stable-diffusion': 'Stable Diffusion',
  dalle: 'DALL-E',
  comfyui: 'ComfyUI',
  chatgpt: 'ChatGPT',
  claude: 'Claude',
  other: 'Other',
};

export function formatTimeSaving(timeStr: string, lang: string): string {
  if (!timeStr) return '';
  const match = timeStr.match(/(\d+)/);
  if (!match) return timeStr;
  const num = match[1];
  const lower = timeStr.toLowerCase();
  if (lower.includes('hour') || lower.includes('hr')) {
    return lang === 'vi' ? `${num} giờ` : `${num} ${parseInt(num, 10) > 1 ? 'hours' : 'hour'}`;
  }
  if (lower.includes('min')) {
    return lang === 'vi' ? `${num} phút` : `${num} mins`;
  }
  return timeStr;
}

export function getPlatformLabel(platform: string): string {
  return PLATFORM_LABELS[platform] || platform;
}
