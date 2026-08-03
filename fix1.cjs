const fs = require('fs');
let content = fs.readFileSync('src/pages/Settings.tsx', 'utf8');

// Fix the clearInterval issue
content = content.replace(
  "return (\n    <>\n      <TrackerSetupWizard isOpen={showAnilistWizard} onClose={() => setShowAnilistWizard(false)} trackerType=\"anilist\" />\n      <TrackerSetupWizard isOpen={showMalWizard} onClose={() => setShowMalWizard(false)} trackerType=\"mal\" />\n    <>\n      <TrackerSetupWizard isOpen={showAnilistWizard} onClose={() => setShowAnilistWizard(false)} trackerType=\"anilist\" />\n      <TrackerSetupWizard isOpen={showMalWizard} onClose={() => setShowMalWizard(false)} trackerType=\"mal\" />) => clearInterval(interval);",
  "return () => clearInterval(interval);"
);

fs.writeFileSync('src/pages/Settings.tsx', content);
