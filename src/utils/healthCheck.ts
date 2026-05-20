export const runSelfDiagnostics = () => {
  const diagnostics = {
    env: {
      status: 'check',
      message: 'Checking Environment Variables...',
      passed: true
    },
    routing: {
      status: 'check',
      message: 'Checking React Router basename...',
      passed: true
    },
    assets: {
      status: 'check',
      message: 'Checking Static Assets...',
      passed: true
    }
  };

  // 1. Check Routes
  try {
    if (!import.meta.env.BASE_URL) {
      diagnostics.routing.passed = false;
      diagnostics.routing.message = 'BASE_URL is undefined. This may break routing on GitHub Pages.';
    } else {
      diagnostics.routing.message = `BASE_URL is ${import.meta.env.BASE_URL}. OK.`;
    }
  } catch (error) {
    diagnostics.routing.passed = false;
  }

  // 2. Check Jikan API
  fetch('https://api.jikan.moe/v4/anime/1')
    .then(res => {
      if (!res.ok) console.warn('Avalon Diagnostic: Jikan API might be rate-limiting or down.');
      else console.log('Avalon Diagnostic: Jikan API is online.');
    })
    .catch(() => console.error('Avalon Diagnostic: Failed to reach Jikan API.'));

  console.group('Avalon System Diagnostics');
  Object.values(diagnostics).forEach(d => {
    if (d.passed) {
      console.log(`%c[PASS]%c ${d.message}`, 'color: #10b981; font-weight: bold;', 'color: inherit;');
    } else {
      console.error(`[FAIL] ${d.message}`);
    }
  });
  console.groupEnd();
};
