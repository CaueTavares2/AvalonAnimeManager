# 🌌 Avalon - Anime Tracking Saga (v3.1.1)

Avalon é uma plataforma otaku completa e de altíssimo nível, combinando o rastreamento cinematográfico de animes com mecânicas de RPG social, gamificação (conquistas, badges equipáveis e patentes) e comunidade ativa, tudo envolto em uma interface moderna de alta fidelidade visual.

---

## 🚀 O que há de Novo na Versão v3.1.1 (Premium Ultra-Performance & Mobile)

Esta versão eleva a usabilidade do Avalon para dispositivos móveis, aplicativos instaláveis PWA e traz otimizações de renderização que reduzem latência e stuttering em celulares:

- **⚡ Renderização Acelerada (Anti-Stuttering)**: Aplicamos aceleração gráfica tridimensional por hardware nos cartões de anime (usando `translate3d`), habilitamos renderização virtual (`content-visibility: auto`) em mídias dinâmicas e simplificamos filtros de desfoque pesados em navegadores mobile para evitar gargalos em aparelhos low-to-mid range.
- **📱 Experiência PWA Ultra-confortável**: Otimização completa do menu inferior com detecção automática do estado ativo para destacar a aba corrente, suporte de espaçamento especial para notches/linhas físicas (`env(safe-area-inset-bottom)`) e bloqueio de zoom acidental ao editar campos de entrada (inputs) no celular.
- **📅 Correção Completa do Explorar por Ano**: O painel de busca por anos foi expandido dinamicamente para acomodar o ano atual de **2026**. Corrigimos a clássica corrida de dados (race-conditions) decorrente de cliques consecutivos rápidos e implementamos travas exclusivas contra requisições duplicadas que causavam animes duplicados na listagem infinita.
- **🔐 Estabilidade de Vídeo Reforçada**: Manutenção das novas diretrizes de segurança aplicadas após a indisponibilidade global coletiva de agregadores terceiros (Consumet).

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

### [v3.1.1] - Ultra-Performance & Mobile Comfort (Atual)
- **Minimização de Stutterings**: Injeção de renderização virtualizada em imagens e aceleração GPU (`translate3d`) nos cartões de obras.
- **Suplementação PWA**: Adaptação física das notches (`env(safe-area-inset-bottom)`) e navegação inferior automatizada com realces brilhantes.
- **Filtro de Anos Corrigido**: Corrida de dados dissipada por locks de rede em tempos de pesquisa intensiva de animes por ano (com ano base estendido até 2026).
- **Controle Estrito de Zoom**: Correção de input zoom para evitar escalonamentos prejudiciais no teclado do iOS/Android (forçando fono-campo 16px).

### [v3.0.0] - Era da Estabilidade e Segurança
- **Remoção das Extensões Instáveis**: Remoção limpa de conexões diretas do Consumet devido ao encerramento mundial de seus serviços.
- **Avisos Informativos**: Transparência com mensagens amigáveis no reprodutor e ajustes explicando o panorama global de vídeos.
- **Controle Sanitário**: Atualização de todas as referências de build, versionamento de sistema e blindagem de falhas.

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
