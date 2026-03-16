const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? 
      walkDir(dirPath, callback) : callback(path.join(dir, f));
  });
}

const priceScaleMap = {
  // Courses
  79: 80000,
  69: 65000,
  89: 85000,
  119: 120000,
  59: 60000,
  99: 100000,
  85: 85000,
  
  // Originals
  149: 150000,
  109: 110000,
  129: 130000,
  199: 200000,
  159: 160000,

  // Programs
  299: 300000,
  499: 500000,
  399: 400000,
  599: 600000,
  49: 50000
};

walkDir('./src', function(filePath) {
  if (filePath.endsWith('.tsx') || filePath.endsWith('.ts')) {
    let content = fs.readFileSync(filePath, 'utf8');
    let changed = false;

    let newContent = content.replace(/(price|originalPrice|amount):\s*(\d+)/g, (match, key, val) => {
      let num = parseInt(val);
      if (priceScaleMap[num]) {
        changed = true;
        return key + ': ' + priceScaleMap[num];
      }
      return match;
    });

    if (changed) {
      fs.writeFileSync(filePath, newContent, 'utf8');
      console.log('Fixed prices in ' + filePath);
    }
  }
});
console.log('Done scanning all TS/TSX files.');
