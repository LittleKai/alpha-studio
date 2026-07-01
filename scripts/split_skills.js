import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const publicDataDir = path.join(__dirname, '..', 'public', 'data');
const sourceFile = path.join(publicDataDir, 'skills.json');
const indexFile = path.join(publicDataDir, 'skills-index.json');
const targetDir = path.join(publicDataDir, 'skills');

console.log('Source file:', sourceFile);
console.log('Index output:', indexFile);
console.log('Detail files directory:', targetDir);

if (!fs.existsSync(sourceFile)) {
  console.error('Error: Source skills.json not found!');
  process.exit(1);
}

// Read and parse massive skills.json
console.log('Loading skills.json (25MB)...');
const allSkills = JSON.parse(fs.readFileSync(sourceFile, 'utf8'));
console.log(`Loaded ${allSkills.length} skills.`);

// Ensure targets exist
if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
  console.log('Created skills directory.');
}

const indexList = [];
let count = 0;

allSkills.forEach(skill => {
  if (!skill.slug) return;

  // 1. Extract only basic metadata for index
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

  // 2. Write full skill details (including sections) to its own file
  const detailFile = path.join(targetDir, `${skill.slug}.json`);
  fs.writeFileSync(detailFile, JSON.stringify(skill, null, 2), 'utf8');
  count++;
});

// 3. Write the index file
fs.writeFileSync(indexFile, JSON.stringify(indexList, null, 2), 'utf8');

console.log('--- COMPLETED ---');
console.log(`Successfully split ${count} skills.`);
console.log(`Saved index list to: ${indexFile} (${(fs.statSync(indexFile).size / 1024 / 1024).toFixed(2)} MB)`);
console.log(`Generated detail JSON files in: ${targetDir}`);
