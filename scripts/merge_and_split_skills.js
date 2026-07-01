import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const publicDataDir = path.join(__dirname, '..', 'public', 'data');
const mainSkillsFile = path.join(publicDataDir, 'skills.json');
const indexFile = path.join(publicDataDir, 'skills-index.json');
const targetDir = path.join(publicDataDir, 'skills');

// Default path to the crawled output
const crawledFile = path.join(
  __dirname,
  '..',
  '..',
  '..',
  '2.reference_pj',
  '.skill-ref',
  'crawl',
  'crawl4ai-skill',
  'output',
  'shyft-skills',
  'skills.json'
);

console.log('--- Merge & Split Process ---');
console.log('Main skills database:', mainSkillsFile);
console.log('Crawled file source:', crawledFile);

if (!fs.existsSync(crawledFile)) {
  console.error(`Error: Crawled skills file not found at ${crawledFile}`);
  process.exit(1);
}

// 1. Read existing and crawled skills
const frontendSkills = fs.existsSync(mainSkillsFile) 
  ? JSON.parse(fs.readFileSync(mainSkillsFile, 'utf8'))
  : [];
const crawledSkills = JSON.parse(fs.readFileSync(crawledFile, 'utf8'));

const existingSlugs = new Set(frontendSkills.map(s => s.slug));

// 2. Filter out duplicates
const newSkills = crawledSkills.filter(s => !existingSlugs.has(s.slug));

console.log(`Existing skills count: ${frontendSkills.length}`);
console.log(`New crawled skills to merge: ${newSkills.length}`);

let mergedSkills = [...frontendSkills];

if (newSkills.length > 0) {
  // Enrich new skills with Vietnamese translation placeholder fields
  const enrichedNewSkills = newSkills.map(skill => {
    const enriched = {
      ...skill,
      headline_vi: skill.headline_vi || skill.headline || '',
      short_description_vi: skill.short_description_vi || skill.short_description || '',
    };
    
    if (enriched.sections) {
      enriched.sections = {
        ...enriched.sections,
        overview_vi: enriched.sections.overview_vi || enriched.sections.overview || '',
        setup_vi: enriched.sections.setup_vi || enriched.sections.setup || '',
        usage_vi: enriched.sections.usage_vi || enriched.sections.usage || '',
      };
    }
    
    return enriched;
  });

  // Combine
  mergedSkills = [...frontendSkills, ...enrichedNewSkills];
  
  // Write back the main database
  fs.writeFileSync(mainSkillsFile, JSON.stringify(mergedSkills, null, 2), 'utf8');
  console.log(`Successfully merged ${newSkills.length} new skills into main database.`);
} else {
  console.log('No new skills to merge into main database.');
}

// 3. Now perform the split logic automatically to keep chunks in sync
console.log('Updating index and detail chunk files...');

if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

const indexList = [];
let splitCount = 0;

mergedSkills.forEach(skill => {
  if (!skill.slug) return;

  const indexItem = {
    source: skill.source || 'shyft.ai',
    url: skill.url || '',
    slug: skill.slug,
    name: skill.name || '',
    headline: skill.headline || '',
    headline_vi: skill.headline_vi || '',
    short_description: skill.short_description || '',
    short_description_vi: skill.short_description_vi || '',
    tier: skill.tier || 'Bronze',
    category: skill.category || 'Productivity',
    difficulty: skill.difficulty || 'Beginner',
    install_type: skill.install_type || 'Terminal',
    estimated_time_saving: skill.estimated_time_saving || '',
    author: skill.author || '',
    install_command: skill.install_command || '',
    source_repo_url: skill.source_repo_url || '',
    works_with: skill.works_with || [],
    tags: skill.tags || []
  };

  indexList.push(indexItem);

  const detailFile = path.join(targetDir, `${skill.slug}.json`);
  fs.writeFileSync(detailFile, JSON.stringify(skill, null, 2), 'utf8');
  splitCount++;
});

fs.writeFileSync(indexFile, JSON.stringify(indexList, null, 2), 'utf8');

console.log('--- COMPLETED ---');
console.log(`Successfully processed and split ${splitCount} total skills.`);
console.log(`Saved index file to: ${indexFile} (${(fs.statSync(indexFile).size / 1024 / 1024).toFixed(2)} MB)`);
console.log(`Detail files are in sync in: ${targetDir}`);
