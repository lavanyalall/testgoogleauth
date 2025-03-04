const fs = require('fs');
const path = require('path');

const buildContractsPath = path.join(__dirname, 'build', 'contracts');
const srcContractsPath = path.join(__dirname, 'src', 'contracts');

fs.readdir(buildContractsPath, (err, files) => {
  if (err) {
    console.error('Error reading build/contracts directory', err);
    return;
  }

  // Make sure the src/contracts directory exists
  if (!fs.existsSync(srcContractsPath)) {
    fs.mkdirSync(srcContractsPath);
  }

  files.forEach((file) => {
    const filePath = path.join(buildContractsPath, file);
    const destPath = path.join(srcContractsPath, file);

    // Only copy JSON files
    if (path.extname(file) === '.json') {
      fs.copyFile(filePath, destPath, (err) => {
        if (err) {
          console.error('Error copying contract JSON file', err);
        } else {
          console.log(`Copied: ${file}`);
        }
      });
    }
  });
});
