import fs from 'fs';
import path from 'path';

// This script acts as a safety guard ("trava de segurança") to prevent publishing failures.
// It ensures that the 'dist' folder the platform uses for artifact generation exists
// and actually contains files.

console.log('\n[🔒] Executando trava de segurança de Build (Build Safety Guard)...');

const distPath = path.resolve(process.cwd(), 'dist');

if (!fs.existsSync(distPath)) {
  console.error('[ERRO FATAL] A pasta "dist/" não foi criada durante a build!');
  console.error('Alternativa/Correção: Verifique se o Vite concluiu o processo e se há falhas silenciosas de memória/TypeScript.');
  process.exit(1);
}

const files = fs.readdirSync(distPath);

if (files.length === 0) {
  console.error('[ERRO FATAL] A pasta "dist/" foi criada, mas está vazia. Os artefatos de build não foram gerados corretamente.');
  console.error('Alternativa/Correção: Certifique-se de que não haja um erro de outDir ou que o script "vite build" não esteja sendo interceptado.');
  process.exit(1);
}

const hasIndexHtml = files.includes('index.html');
if (!hasIndexHtml) {
  console.error('[ERRO FATAL] O artefato principal (index.html) não foi gerado dentro de "dist/".');
  console.error('Isso causará telas em branco quando publicado.');
  process.exit(1);
}

console.log('[✅] Build validada com sucesso! Os artefatos estão prontos e consistentes para a publicação.');
process.exit(0);
