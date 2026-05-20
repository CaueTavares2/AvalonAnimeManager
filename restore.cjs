const { execSync } = require('child_process');
try {
  execSync('git checkout public/logo-dark.jpeg public/logo-light.jpeg', { stdio: 'inherit' });
  console.log("Restored logos");
} catch (e) {
  console.log('Error restoring logos', e.message);
  try {
     const status = execSync('git status -s').toString();
     console.log('Status:', status);
     execSync('git checkout HEAD -- public/');
  } catch (e2) {}
}
