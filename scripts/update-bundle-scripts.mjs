import fs from 'node:fs';
import path from 'node:path';

const rootDir = process.cwd();

const htmlFiles = [
  'index.html',
  'explore.html',
  'recipe.html',
  'create-recipe.html',
  'chef.html',
  'dashboard.html',
  'supplies.html',
  'courses.html',
  'chat.html',
  'notifications.html',
  'settings.html',
  'auth.html'
];

for (const file of htmlFiles) {
  const filePath = path.join(rootDir, file);
  if (!fs.existsSync(filePath)) continue;

  let content = fs.readFileSync(filePath, 'utf8');

  // Replace any existing <script type="module" ...> tags at the bottom with the standalone bundle script
  const scriptRegex = /<!-- Application Scripts -->[\s\S]*?<\/body>/;
  if (scriptRegex.test(content)) {
    content = content.replace(scriptRegex, `<!-- Application Standalone Bundle (Runs anywhere: file:/// & http://) -->\n  <script src="./js/bundle.js"></script>\n</body>`);
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated scripts in ${file}`);
  } else {
    // If no comment header, replace module scripts before </body>
    const genericScriptRegex = /(<script type="module"[\s\S]*?<\/script>\s*)+<\/body>/;
    if (genericScriptRegex.test(content)) {
      content = content.replace(genericScriptRegex, `<!-- Application Standalone Bundle -->\n  <script src="./js/bundle.js"></script>\n</body>`);
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`Updated generic scripts in ${file}`);
    }
  }
}
