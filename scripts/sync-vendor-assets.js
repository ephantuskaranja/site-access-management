const fs = require('fs');
const path = require('path');

const projectRoot = path.resolve(__dirname, '..');

const assets = [
  {
    src: path.join(projectRoot, 'node_modules', 'choices.js', 'public', 'assets', 'styles', 'choices.min.css'),
    dest: path.join(projectRoot, 'public', 'vendor', 'choices', 'choices.min.css'),
  },
  {
    src: path.join(projectRoot, 'node_modules', 'choices.js', 'public', 'assets', 'scripts', 'choices.min.js'),
    dest: path.join(projectRoot, 'public', 'vendor', 'choices', 'choices.min.js'),
  },
  {
    src: path.join(projectRoot, 'node_modules', 'xlsx', 'dist', 'xlsx.full.min.js'),
    dest: path.join(projectRoot, 'public', 'vendor', 'xlsx', 'xlsx.full.min.js'),
  },
  {
    src: path.join(projectRoot, 'node_modules', 'jspdf', 'dist', 'jspdf.umd.min.js'),
    dest: path.join(projectRoot, 'public', 'vendor', 'jspdf', 'jspdf.umd.min.js'),
  },
  {
    src: path.join(projectRoot, 'node_modules', 'jspdf-autotable', 'dist', 'jspdf.plugin.autotable.min.js'),
    dest: path.join(projectRoot, 'public', 'vendor', 'jspdf-autotable', 'jspdf.plugin.autotable.min.js'),
  },
];

let copied = 0;
let missing = 0;

for (const asset of assets) {
  if (!fs.existsSync(asset.src)) {
    missing += 1;
    console.warn(`[sync-vendor-assets] Missing source: ${path.relative(projectRoot, asset.src)}`);
    continue;
  }

  fs.mkdirSync(path.dirname(asset.dest), { recursive: true });
  fs.copyFileSync(asset.src, asset.dest);
  copied += 1;
  console.log(`[sync-vendor-assets] Copied ${path.relative(projectRoot, asset.dest)}`);
}

if (missing > 0) {
  console.warn(`[sync-vendor-assets] Completed with ${missing} missing source file(s).`);
}

console.log(`[sync-vendor-assets] Done. Files copied: ${copied}.`);
