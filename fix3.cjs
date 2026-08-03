const fs = require('fs');
let content = fs.readFileSync('src/pages/Settings.tsx', 'utf8');

// Insert the wizards at the end
content = content.replace(
  "<AnilistGuideModal isOpen={showAnilistGuide} onClose={() => setShowAnilistGuide(false)} />\n    </div>",
  "<AnilistGuideModal isOpen={showAnilistGuide} onClose={() => setShowAnilistGuide(false)} />\n      <TrackerSetupWizard isOpen={showAnilistWizard} onClose={() => setShowAnilistWizard(false)} trackerType=\"anilist\" />\n      <TrackerSetupWizard isOpen={showMalWizard} onClose={() => setShowMalWizard(false)} trackerType=\"mal\" />\n    </div>"
);

fs.writeFileSync('src/pages/Settings.tsx', content);
