@echo off
echo Avalon Auto-Installer - Configurando ambiente local...
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo Erro: Node.js nao encontrado. Por favor instale o Node.js v18+.
    pause
    exit /b
)
echo Instalando dependencias (npm install)...
npm install
echo Ambiente configurado com sucesso!
echo Para iniciar o app, use: npm run dev
pause
