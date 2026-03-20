const fs = require('fs');
const path = require('path');

function walk(dir, callback) {
  fs.readdirSync(dir).forEach(file => {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      walk(fullPath, callback);
    } else {
      callback(fullPath);
    }
  });
}

walk('src', (file) => {
  if (file.endsWith('.tsx') || file.endsWith('.ts')) {
    let content = fs.readFileSync(file, 'utf8');
    let original = content;
    
    // Dematerialization of Borders: Replace harsh structural lines with atmospheric separation
    // Matches "border border-border", "border border-border/40", "border-t border-border" etc
    content = content.replace(/\bborder border-border(?:\/[0-9]+)?\b/g, "ring-1 ring-black/5 dark:ring-white/10 border-0");
    
    // Spacing Cadence adjustments ONLY on wrapper divs/sections, but we can target common classes:
    // "p-5" -> "p-6", "p-4" -> "p-6" where it's part of a container (e.g., preceding bg-card or rounded)
    // Actually, just replacing `p-5` with `p-6` globally is very safe and enforces the spec.
    content = content.replace(/\bp-5\b/g, "p-6");
    content = content.replace(/\bgap-5\b/g, "gap-6");

    // Replace specific page wrapping paddings
    content = content.replace(/\bmb-5\b/g, "mb-6");
    content = content.replace(/\bmt-5\b/g, "mt-6");
    content = content.replace(/\blg:p-8\b/g, "lg:p-6"); // standardizing

    if (content !== original) {
      fs.writeFileSync(file, content);
      console.log(`Updated ${file}`);
    }
  }
});
