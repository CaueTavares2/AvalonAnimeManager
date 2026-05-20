const { execSync } = require('child_process');
try {
  execSync('git checkout public/logo-dark.jpeg public/logo-light.jpeg public/logo-dark.jpg public/logo-light.jpg', { stdio: 'inherit' });
} catch (e) {
  console.log('Error', e);
}
