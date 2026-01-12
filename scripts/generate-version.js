import { writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const version = {
  version: Date.now().toString(),
  buildDate: new Date().toISOString()
};

const publicPath = join(__dirname, '..', 'public', 'version.json');

writeFileSync(publicPath, JSON.stringify(version, null, 2));
console.log('✓ Generated version.json:', version.version);
