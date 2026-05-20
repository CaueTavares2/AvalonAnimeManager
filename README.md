# 🌌 Avalon - Anime Tracking Saga (v3.4.0)

Avalon é uma plataforma otaku completa e de altíssimo nível, combinando o rastreamento cinematográfico de animes com mecânicas de RPG social, gamificação (conquistas, badges equipáveis e patentes) e comunidade ativa, tudo envolto em uma interface moderna de alta fidelidade visual.

---

## 🚀 O que há de Novo na Versão v3.4.0 (The Stremio Update)

- **🎬 Stremio Addon Engine**: Implementação de suporte nativo ao protocolo Stremio. O Torrentio agora é uma fonte selecionável, trazendo conteúdo P2P dublado e legendado diretamente para o player do Avalon.
- **🔗 Intelligent IMDb Mapping**: Sistema de tradução de IDs que mapeia automaticamente animes do MyAnimeList para IDs IMDb, permitindo compatibilidade universal com addons cinematográficos.
- **⚙️ Custom Sources Central**: Nova interface em Configurações para adicionar qualquer manifest URL de addon do Stremio (.json). Personalize suas fontes de vídeo como quiser.
- **🛡️ Shielded Asset Guardian v2**: Melhorias na estabilidade de rotas e carregamento de metadados externos.

---

## 🚀 O que há de Novo na Versão v3.3.0 (Stability & Quality Focus)

- **🛡️ Resilience Layer**: Implementação do motor `lazyWithRetry` e ErrorBoundaries reforçados. Isso elimina o erro "Falha de Roteamento" causado por caches desatualizados ou chunks perdidos durante atualizações do servidor.
- **✨ Qualidade sobre Quantidade**: Filtro global inteligente que prioriza animes de alta qualidade (Séries de TV e Filmes), removendo automaticamente clipes musicais, comerciais e especiais irrelevantes dos feeds e resultados de busca.
- **🔍 MyList Search Engine**: Nova barra de busca instantânea integrada na aba "Minha Lista" para acesso veloz aos seus títulos favoritos.
- **🎨 Visual Master Refresh**: Redesign completo dos cards de mídia. Agora com bordas arredondadas de 12px (estilo iOS/Netflix), badges "PREMIUM" para obras aclamadas, efeitos de vidro (glassmorphism) e transições cinematográficas de hover.

---

## 🚀 O que há de Novo na Versão v3.2.0 (Asset Guardian Engine)

- **🛡️ Shielded Assets**: As logos agora são importadas diretamente no código e processadas pelo Vite. Isso garante que o bundler gere os caminhos corretos independentemente de onde o site estiver hospedado.
- **⚙️ Roteamento Refinado**: Otimização do `basename` e `BASE_URL` para suporte total ao GitHub Pages e PWAs.

---

## 🚀 O que há de Novo na Versão v3.1.9 (Deploy & Routing Fix)

- **🌐 GitHub Pages Support**: Reativação da `base path` no Vite e configuração do `basename` no React Router para suporte total a subpastas de hospedagem.
- **🖼️ Image Path Recovery**: Correção das referências de logos na UI utilizando `BASE_URL`, garantindo que as imagens carreguem sob qualquer estrutura de diretório.
- **📱 PWA Scope Fix**: Ajuste de escopos e Manifesto do PWA para sincronia total com o novo sistema de roteamento absoluto.

---

## 🚀 O que há de Novo na Versão v3.1.8 (Final Assets Restoration)

- **🖼️ Logos Reconectadas**: As marcas visuais `logo-light.jpeg` e `logo-dark.jpeg` foram restauradas no diretório `/public` e vinculadas permanentemente em toda a UI.
- **🛠️ Fix de Paths**: Correção dos caminhos estáticos para garantir compatibilidade com o PWA e Build de Produção.

---

## 🚀 O que há de Novo na Versão v3.1.7 (Engine Optimization & Assets)

- **🖼️ Asset Sync. Definitivo**: Remoção da `base path` redundante no Vite que impedia a resolução das logos `.jpeg` originais. Inserção das marcas visuais na Home, Navbar e Players.
- **📝 Log de Novidades v3.1.7**: Sincronização do sistema de Changelog para refletir os últimos reparos estéticos e funcionais.

---

## 🚀 O que há de Novo na Versão v3.1.6 (Hotfix & Visuals)

- **🖼️ Asset Sync. Concluído**: Integração direta (`import`) do recurso visual oficial carregado internamente na plataforma, contornando a exclusão dos CDNs estáticos.
- **📝 Modal de Changelog Consertado**: Atualização do modal para espelhar as últimas versões (a partir da v3.1.6). Fix das versões congeladas na antiga detecção da v3.1.2.

---

## 🚀 O que há de Novo na Versão v3.1.4 (Otimizações & Organização)

Esta atualização expande o poder de descoberta e adiciona mecânicas sofisticadas de detecção de hardware:

- **📱 Smart Device Tiering**: Um poderoso Hook que detecta sua classe de dispositivo (como celulares Samsung Galaxy após o A13, linha S, e iPhones 14+) distribuindo-os em três níveis de escalonamento: 'Low', 'Mid' e 'High'. Essa classificação protege dispositivos de entrada desligando reflexos gaussianos e filtros passivos de forma inteligente, mantendo a responsividade altíssima.
- **🔍 Tela de Resultados Estendida**: Pressionar Enter ou clicar em "Ver todos os resultados" na barra de pesquisa agora o transporta para uma página completa de exploração `/search`, munida de filtros por tipos de mídias e navegação por paginação sem limites da Jikan API.
- **↕️ Múltiplas Ordenações na Lista**: Introdução de seletores de ordenação (sorting) charmosos via touch nas colunas `TITLE` e `SCORE` dentro da aba Minha Lista, para que possa organizá-los por pontuação máxima, mínima ou ordem alfabética livremente!
- **🎲 Sorteador Inteligente 'Gen-2' (Me Surpreenda)**: O "Me Surpreenda!" ficou genial. Ele agora analisa o título das suas franquias passadas. Se você ainda tem a 'Temprada 1' como pendente na lista, ele filtrará ativamente as continuações ('Temporada 2' ou 'Parte 2'), direcionando seu destino corretamente para a raiz da obra!
- **✨ Legacy Logos Restored**: As saudosistas e aclamadas logos JPG foram plenamente restauradas ao projeto!

---

## 🚀 O que há de Novo na Versão v3.1.3 (Sincronização de Trackers & Otimização de Busca)

Esta atualização traz importantes expansões de usabilidade, estabilização de imagem e novos canais automáticos de sincronização externa:

- **⚡ Fix Global de Imagens**: Substituição total das credenciais e carregamento das logomarcas Light e Dark via geração de vetores estáticos de alta resolução, resolvendo o erro de carregamento nos navegadores.
- **🔍 Busca Exclusiva de Vídeo (Anime/Filmes)**: Redirecionamento cirúrgico da barra de busca principal da Navbar para filtrar exclusivamente animes e filmes ("anime"), evitando a inclusão de mangás nos resultados globais do cabeçalho.
- **🎲 Retorno do 'Me Surpreenda!' na Lista**: Integração de um botão inteligente na aba Lista que escolhe de forma aleatória a sua próxima obra. Atua priorizando a lista de "Planejando" (Planning), e caso não haja, faz o sorteio sobre o restante das suas produções ativas.
- **🤖 Sincronização Invisível de Otaku Points (PO)**: O antigo botão de sincronização manual foi removido. Agora, o Avalon sincroniza as pontuações e conquistas do usuário em segundo plano de forma 100% automatizada e assíncrona, munido de uma proteção por debounce de 5 segundos para garantir eficiência extrema.
- **🔄 Tracker Sync Sênior (AniList & MyAnimeList)**: Implementação de um middleware de comunicação que atualiza progresso, episódios marcados e status direto para o AniList e MyAnimeList em tempo real.
- **😊 Tradutor de Nota Smiley (Regras da Comunidade)**: Tradução inteligente da nota numérica de 1-10 de Avalon para o formato de smileys do AniList:
  - Notas **maior ou igual a 6** $\rightarrow$ Cara Feliz (`😊 SMILE`)
  - Nota **igual a 5** $\rightarrow$ Cara Neutra (`😐 NEUTRAL`)
  - Notas **menor ou igual a 4** $\rightarrow$ Cara Ruim (`😢 SAD`)
- **📡 Toast HUD Holográfico**: Nova tela flutuante discreta montada no canto inferior direito que se acende com áudio visual e micro-transições para confirmar as atualizações de track sincronizadas no servidor.

---

## 🚀 O que há de Novo na Versão v3.1.2 (Auto-Detecção & Perfis Otimizados PC vs. Mobile)

Esta versão introduz a **Auto-Detecção Dinâmica de Plataformas**, aplicando perfis de renderização totalmente customizados de acordo com as características físicas e operacionais do usuário:

- **⚡ Fim dos Stutterings em Dispositivos de Entrada (Galaxy A13 e similares)**: Detecção automática que desativa transições Framer Motion pesadas e remove micro-animações de zoom na tela inicial para manter a resposta tátil e de rolagem leve e responsiva.
- **🎨 Bypass de Elementos Hover**: Oclusão absoluta do rendering de sobreposições de hover de cards de obra em celulares touch. Isso economiza dezenas de nós no DOM virtual, reduz consumo de bateria, memória RAM e evita congelamentos no scroll.
- **🛡️ Blindagem de Transições do Navegador**: Estilização inteligente em CSS que limita as transições visuais a parâmetros de cores puras, eliminando cálculos matemáticos de layout em tempo real nas telas de toque.
- **📅 Correção do Explorar por Ano**: O painel de busca agora suporta o ano atual de **2026** e previne corrida de dados de forma estrita.

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

### [v3.1.9] - Deploy & Routing Fix (Atual)
- **Correção de Tela Branca**: Reintrodução da `base` no Vite para suporte nativo ao GitHub Pages.
- **PWA Manifest Sync**: Sincronização do `start_url` para evitar erros de cache offline.

### [v3.1.8] - Final Assets Restoration
- **Logos Restauradas**: Recarregamento das logos originais e fix de caminhos absolutos no Navbar e Footer.

### [v3.1.7] - Asset Restoration & Log Engine
- **Recuperação Nativa de Assets**: Mapeamento fixo de `.jpeg` e `.jpg` corrigido com importações modulares diretas na UI e retorno das logomarcas originais criadas pelo usuário.
- **Log Engine Refactored**: Fix para a modalidade visual travada nas antigas versões, passando a expor os dados estritos da última arquitetura.

### [v3.1.5] - Hotfix: Asset Resolution Engine
- **Recuperação Nativa de Assets**: Mapeamento fixo de `.jpeg` e `.jpg` corrigido em `/public`, além de substituição global nas Views (Navbar, App e Player).

### [v3.1.4] - Otimizações Extremas & Resultados Buscáveis
- **Detecção de Hardware**: Hook dedicado `useDevice` que escala a performance ('Low', 'Mid', 'High') focado em arquiteturas pós-A13 (A14, S23/S24, iPhone 14+) limitando o processamento do hardware.
- **Search Engine Upgrade**: Página `/search` com grid completa de resultados, paginação nativa e filtros universais.
- **Lista de Ordenação**: Os valores "TITLE" e "SCORE" na MyList agora possuem gatilhos triangulares clicáveis e bidirecionais de ordenamento.
- **Restauro Artístico**: Imagens nativas (`.jpg`) oficiais re-empregadas em detrimento do SVG automático gerado no build anterior.
- **Sorteador Gen-2**: "Me Surpreenda!" com bloqueio de franquias para séries consecutivas em que a primeira temporada não foi finalizada.

### [v3.1.3] - Sincronização de Trackers & Otimização de Busca
- **Logos Corrigidas**: Regeneração estável para evitar 404 e erros nos logotipos da Navbar.
- **Limitação de Busca**: Restrição da barra de navegação principal da Navbar apenas para animes e filmes.
- **Auto PO Sync**: Substituição do botão manual por sincronização reativa de segundo plano em lotes com proteção por debounce de 5 segundos.
- **Botão Me Surpreenda**: Retornado O Sorteador Inteligente na página de MyList, compatível com o filtro de mídia ativado.
- **Tracker Gateway**: Comunicação em tempo real com AniList GraphQL e MyAnimeList REST, munido de tradução automática sob escala Smiley (Feliz, Neutro, Ruim) do AniList.
- **Floating HUD Overlay**: Exibição da confirmação de transmissão em tempo real no canto inferior por HUD holográfico.

### [v3.1.2] - Auto-Detecção & Perfis Otimizados PC vs. Mobile
- **Auto-Detecção Direct-to-Core**: Sistema inteligente de leitura do UA / suporte a toque / tamanho físico que categoriza e injeta as regras de plataforma.
- **Transições Suspensas no Celular**: Remoção cirúrgica de animações de montagem do Framer Motion e efeitos de zoom para salvar recursos de processadores como do Galaxy A13.
- **Oclusão de Hover em Touch**: Cards de obras sem renderização de hover overlays em dispositivos de toque, evitando vazamento ou lentidão gráfica.
- **Bypass de Scroll em CSS**: Limitação de transições de scroll unicamente para atributos simples de cores em mobile.

### [v3.1.1] - Performance PWA e Console
- **Minimização de Stutterings**: Injeção primária de renderização virtualizada em imagens e GPU `translate3d`.
- **Navegação e Trava de Anos**: Resolução definitiva de race-conditions de requests e ano base de busca estendido até 2026.
- **Prevenção de Zoom**: Redefinição de input touch sizes para evitar o zoom invasivo automático dos navegadores nativos móveis.

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
