const fs = require('fs');
const path = require('path');

const clientDir = path.join(__dirname);
const dirsToCreate = [
  'src/components/layout',
  'src/components/ui',
  'src/components/features',
  'src/pages/auth',
  'src/pages/dashboard',
  'src/pages/cases',
  'src/pages/documents',
  'src/pages/audit',
  'src/pages/search',
  'src/pages/admin',
  'src/pages/notifications',
  'src/services',
  'src/hooks',
  'src/utils',
];

dirsToCreate.forEach(dir => {
  fs.mkdirSync(path.join(clientDir, dir), { recursive: true });
});

console.log('Directories created successfully.');
