#!/bin/bash
echo "Avalon Auto-Installer - Configurando ambiente local..."
if ! command -v node &> /dev/null
then
    echo "Erro: Node.js não encontrado. Por favor instale o Node.js v18+."
    exit
fi
echo "Instalando dependências (npm install)..."
npm install
echo "Ambiente configurado com sucesso!"
echo "Para iniciar o app, use: npm run dev"
read -p "Pressione [Enter] para fechar..."
