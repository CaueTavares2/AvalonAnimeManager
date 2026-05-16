# Avalon - Anime Tracking Saga

Avalon é uma plataforma refinada de rastreamento de animes com uma interface cinematográfica, sistema de progressão otaku e recursos sociais.

---

## 🚀 Como Rodar Localmente (Ambiente Independente)

O projeto foi preparado para execução local sem dependência obrigatória de infraestrutura na nuvem (usando Emuladores do Firebase para Auth e Banco de Dados Local).

### 🛠️ Pré-requisitos
- **Node.js** (v18 ou superior)
- **Java JRE/JDK** (Necessário para a execução do Firebase Local Emulator)
- **npm** (Vem com o Node)

O projeto contém um script interno de validação (`npm run dev` rodará o checklist de pré-requisitos antes de subir).

### ⚙️ 1. Configuração de Variáveis de Ambiente
1. Copie o arquivo de exemplo de ambiente:
   ```bash
   cp .env.example .env
   ```
2. Caso use as APIs mockadas não modifique, se desejar conectar com backend real apenas preencha as chaves no novo arquivo `.env`. Em `.env` as variáveis padrão já estão configuradas para o funcionamento de modo local/default.

### 📦 2. Instalação e Inicialização
Criamos atalhos no `package.json` para facilitar sua vida. 
Abra o seu terminal na pasta do projeto e execute:

```bash
# 1. Instalação de dependências e setup inicial
npm install
npm run build
```

### 💻 3. Como Executar o App (2 Opções)

**OPÇÃO A: Desenvolvimento Local Total (DB Simulado / Firebase Emulator)**
*Recomendado para evitar custos ou problemas de conexão de nuvem.*

Primeiro, em um terminal separado, instale o emulador (se não tiver) e inicie:
```bash
npx firebase-tools emulators:start --only auth,firestore --config firebase.emulator.json
```

Depois, em outro terminal, inicie o front-end:
```bash
VITE_USE_FIREBASE_EMULATOR=true VITE_JIKAN_API_URL=https://api.jikan.moe/v4 npm run dev
```
O app estará rodando em `http://localhost:3000` conectado ao seu banco local!

Em um terceiro terminal, popule os dados iniciais do banco utilizando o nosso seed script:
```bash
VITE_USE_FIREBASE_EMULATOR=true npx tsx scripts/seed.ts
```

**OPÇÃO B: Desenvolvimento com Backend Real**
Caso as chaves já estejam configuradas ou se estiver num preview/ambiente de produção:
```bash
npm run dev
```

### 🔨 4. Build para Produção
```bash
npm run build
```

---

## 📂 Estrutura do Projeto e Isolamento
- `.env.example`: Centraliza os endpoints e credenciais (ex: Jikan API URL).
- `scripts/pre-run-check.ts`: Verifica a versão do Node.js, arquivos cruciais e faz análise de sanidade antes do ambiente rodar.
- `src/lib/firebase.ts`: O sistema conecta automaticamente aos Emuladores se a flag `VITE_USE_FIREBASE_EMULATOR` estiver presente no momento da build (`npm run dev:local`).
- Componentes estão isolados, caminhos de importação são todos relativos (ex: `../../` ou `@/`) para garantir a portabilidade total.

---

## 🆕 Novidades
- **Sistema de Notificações de Conquistas:** Notificações visuais e animadas (Motion) para desbloqueio de conquistas, adaptadas ao nível de raridade.
- **Painel de Testes (Staff):** Área administrativa para testar o sistema de notificações de conquistas sem impactar o banco de dados.

## 📱 Instalação como App (PWA)
Avalon agora funciona como um Progressive Web App (PWA). Você pode instalá-lo no seu computador ou dispositivo móvel para uma experiência nativa:

1. **Chrome/Edge/Brave:** Clique no ícone de "Instalar" na barra de endereços (lado direito).
2. **Mobile (Android):** No Chrome, abrir o menu e selecionar "Instalar App" ou "Adicionar à tela inicial".
3. **iOS (Safari):** Tocar no botão de "Compartilhar" e selecionar "Adicionar à Tela de Início".

*Nota: Ícones personalizados do app serão adicionados em uma atualização futura.*

---

## 🛠️ Tecnologias
- **Frontend:** React + Vite + TypeScript
- **Estilização:** Tailwind CSS (Modern v4)
- **Animações:** Motion (Framer Motion)
- **Backend/DB:** Firebase (Auth, Firestore) & Firebase Local Emulators
- **Dados:** Jikan API (MyAnimeList)

Para mais detalhes e arquitetura, consulte a documentação na pasta `docs/`.
