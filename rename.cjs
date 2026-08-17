const fs = require('fs');
const path = require('path');

function replaceInDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      replaceInDir(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts') || fullPath.endsWith('.html')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      let newContent = content
        .replace(/Lumibot/g, 'Traveler Chatbot')
        .replace(/lumibot\.ai/g, 'traveler-chatbot.com')
        .replace(/Lumi Assistant/g, 'Traveler Assistant')
        .replace(/Lumi/g, 'Traveler')
        .replace(/lovable-chat\.ai/g, 'traveler-chatbot.com');
      
      if (content !== newContent) {
        fs.writeFileSync(fullPath, newContent);
        console.log(`Updated ${fullPath}`);
      }
    }
  }
}

replaceInDir(path.join(__dirname, 'src'));
