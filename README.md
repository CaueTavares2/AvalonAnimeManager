# 🌌 Avalon - Anime Tracking Saga (v3.0.0)

Avalon é uma plataforma otaku completa e de altíssimo nível, combinando o rastreamento cinematográfico de animes com mecânicas de RPG social, gamificação (conquistas, badges equipáveis e patentes) e comunidade ativa, tudo envolto em uma interface moderna de alta fidelidade visual.

---

## 🚀 O que há de Novo na Versão v3.0.0 (Milestone de Estabilidade)

Esta versão marca a chegada da **Era de Redirecionamento e Segurança** do Avalon. Com as recentes instabilidades globais e derrubadas consecutivas dos principais agregadores de vídeo na internet (incluindo o Consumet API e seus múltiplos clones), tomamos medidas firmes para proteger o ecossistema do aplicativo e a experiência de nossos usuários:

- **🔐 Desativação Preventiva do Consumet**: Removemos de forma limpa todas as conexões instáveis que causavam falhas consecutivas e sobrecargas no aplicativo.
- **⚠️ Alerta de Transição Temporária**: Adicionamos avisos claros e polidos no reprodutor de vídeos (*Anime Player*) e nas configurações de fontes. Os usuários agora são informados sobre a reestruturação global dos provedores de vídeo de forma transparente.
- **🏗️ Nova Infraestrutura de Vídeo em Desenvolvimento**: Iniciamos a estruturação de uma nova arquitetura nativa focada em servidores autônomos e backups ultra-rápidos que estarão disponíveis no futuro.
- **🚀 Otimizações Gerais no Aplicativo**: Revisão completa e refatoração no sistema de busca, controle de rotas de vídeo e estabilização de requisições.

---

## 🌟 Funcionalidades Principais do Avalon

### 1. 🎞️ Rastreamento Cinematográfico e Busca de Animes
- **Integração Jikan (MyAnimeList)**: Busca instantânea, detalhes de animes, visualização de elencos/personagens, lista de episódios oficial e recomendações contextuais.
- **Filtros por Anos e Rankings**: Navegue pelos animes organizados por temporadas históricas e anos.

### 2. 🎮 Gamificação Otaku RPG
- **Sistema de Conquistas (Achievements)**: Notificações animadas usando `motion` que reagem dinamicamente quando você joga, assiste, avalia ou interage na comunidade. Baseado em níveis de raridade (Comum, Raro, Épico, Lendário, Divino).
- **Badges Equipáveis no Perfil**: Ganhe badges através de tarefas secretas e equipe-as na sua página de perfil para exibir o seu progresso aos outros membros da comunidade.
- **Perfil de Rastreamento**: Estatísticas ricas com contador de horas assistidas, títulos concluídos, distribuição de notas e exibição de badges selecionadas.

### 3. 💬 AniChat e Feed Social
- **Chat em Tempo Real**: Canais globais inspirados em tecnologia moderna para os usuários debaterem sobre as últimas obras.
- **Atividades Sociais**: Feed contínuo atualizado em tempo real exibindo as conquistas coletadas pela comunidade e o progresso das conquistas dos seus amigos.

### 4. 📚 Leitor de Mangás (Beta Experimental)
- **Leitura Imersiva**: Sistema responsivo para busca e exibição de páginas de mangás integrado ao motor Comick/MangaDex, equipado com aviso de beta controlado para assegurar usabilidade.

### 5. 🛠️ Painel de Administrador e Staff Terminal
- **Área de Sandbox**: Simulador de conquistas e testes de badges construído para a equipe testar animações de UI e eventos sem poluir o Firestore de produção.

---

## 🛠️ Como Rodar Localmente (Ambiente Independente)

O projeto está totalmente configurado para execução offline/local usando Emuladores do Firebase para Auth e Firestore, dispensando custos na nuvem.

### 📋 Pré-requisitos
- **Node.js** (v18 ou superior)
- **Java JRE/JDK** (Necessário para rodar o Firebase Emulator Suite)

### ⚙️ 1. Configuração do Ambiente (.env)
Abra a raiz do projeto e crie o seu arquivo de variáveis:
```bash
cp .env.example .env
```
As variáveis padrão já vêm preparadas para os emuladores locais e consumo direto da Jikan API.

### 📦 2. Instalação de Dependências
```bash
npm install
npm run build
```

### 💻 3. Como Executar (Com Banco Local Simulado / Firebase Emulator)

1. **Abra um terminal** e inicie o Firebase local:
   ```bash
   npx firebase-tools emulators:start --only auth,firestore --config firebase.emulator.json
   ```

2. **Abra outro terminal** e inicie o front-end em modo de desenvolvimento:
   ```bash
   VITE_USE_FIREBASE_EMULATOR=true VITE_JIKAN_API_URL=https://api.jikan.moe/v4 npm run dev
   ```
   *O aplicativo iniciará de forma segura em `http://localhost:3000`*.

3. **Abra um terceiro terminal** para popular o banco de dados simulado com dados iniciais (Seed):
   ```bash
   VITE_USE_FIREBASE_EMULATOR=true npx tsx scripts/seed.ts
   ```

---

## 📈 Histórico de Atualizações (Changelog de Lançamentos)

### [v3.0.0] - Era da Estabilidade e Segurança (Atual)
- **Remoção das Extensões Instáveis**: Remoção limpa do Consumet de `extensionService.ts` devido à queda global de seus servidores.
- **Avisos Informativos**: Integração de mensagens oficiais no Player e na Área de Ajustes informando aos usuários os motivos da reestruturação.
- **Controle Sanitário**: Atualização de todos os logs internos, banners de desenvolvimento e tratamento fino de exceptions de rede.

### [v2.2.0] - Otimizações de Conclusão e Customizações
- **Fluxo de Conclusão**: Implementado aviso mandatório de feedback e notas na finalização do anime.
- **Badges do Perfil**: Sistema onde o usuário consegue escolher e equipar no seu header badges de conquistas.
- **Ajustes de Design**: Interface refinada da Home com estatísticas rotativas e novos temas paletados de cores.

### [v2.1.0] - Sistema de Conquistas Reativo
- **Notificações em Tempo Real**: Adicionado modal dinâmico no estilo RPG para conquistas desbloqueadas.
- **Terminal GoAnime**: Painel interno de comandos e testes rápidos.

---

## 📱 Instalação como App (PWA)
O Avalon é um **Progressive Web App**. Você pode adicioná-lo à tela inicial do celular ou instalá-lo no computador através do navegador Chrome ou Safari clicando em **"Adicionar à tela de início"** / **"Instalar App"**.

---
*Avalon é desenvolvido com dedicação artística e engenharia limpa. Que sua jornada otaku seja lendária! 🌌*
