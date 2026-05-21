# 🌌 Avalon - Anime Tracking Saga (v4.5.1 - Manga Search Correction)

Avalon é uma plataforma otaku completa e de altíssimo nível, combinando o rastreamento cinematográfico de animes com mecânicas de RPG social, gamificação (conquistas, badges equipáveis e patentes) e comunidade ativa, tudo envolto em uma interface moderna de alta fidelidade visual.

---

## 🎨 O que há de Novo na Versão v4.5.1 (Manga Search Correction)

Nesta atualização, corrigimos e otimizamos o motor de busca global para integrar e libertar a pesquisa de mangás diretamente pela interface unificada:

- **📚 Busca Unificada e Corrigida de Mangás**: Sanamos a limitação que impedia a pesquisa de mangás. Adicionamos a aba nativa de filtro para **"Mangás"** nos resultados de busca global.
- **🌐 Roteamento e Icons Inteligentes**: Ao buscar por mangás, o sistema agora redireciona com precisão o usuário para a página específica de detalhes ou leitura de mangás (`/manga/:id`), ao invés de forçar o caminho de anime. Adicionamos o ícone de leitura `BookOpen` dinâmico em cards de mangás e refinamos as datas originais de publicação exibindo o ano correto (`published.prop.from.year`).
- **🔍 Placeholder de Busca Expandido**: A barra de pesquisa do cabeçalho foi sutilmente recalibrada para `"Pesquisar animes ou mangás..."`, promovendo maior clareza para navegação no acervo literário.

---

## 🎨 O que há de Novo na Versão v4.5.0 (Luxury Design & Fluid Kinetic Tab Switch)

Nesta versão, realizamos uma transformação estética completa e otimização de de fidelidades de animações, deixando a plataforma rápida, leve e com visual premium digno de cinema:

- **🎨 Harmonia e Visual Premium Contrastado (Modo Claro & Escuro)**: Redefinimos a paleta cromática nativa e as variáveis estéticas. O modo claro adquire um tom azul-acinzentado ultra limpo (`#f4f6fa`), enquanto o modo escuro sintoniza em um azul espacial profundo e elegante (`#090e17`). Adicionamos bordas ultrafinas brilhantes (`1px border`) e sombras estéticas com dispersão em gradiente nas caixas, cards e navbars.
- **✨ Transições Cinéticas de Abas (Rotas fluidas)**: Implementamos o componente `PageTransition` integrado sobre Framer Motion (`motion.div`) em todo o ecossistema de rotas. O chaveamento de páginas ocorre através de um suave efeito de fade acompanhado de uma sutil flutuação espacial, regida por curvas de velocidade Bézier personalizadas (`duration: 0.22, ease: [0.16, 1, 0.3, 1]`), garantindo suavidade máxima sem pesar tanto em celulares básicos quanto em PCs.
- **💫 Polimento de Elementos Interativos**: Refatoramos botões, sliders, links ativos e elementos secundários para aderirem organicamente às tonalidades do tema sintonizado no ato (Avalon Gold, Crunchyroll, Netflix), entregando transições táteis responsivas e visual impecável.

---

## 🎨 O que há de Novo na Versão v4.4.0 (Theme Integration & Contrast Harmonizer Update)

Nesta versão, realizamos uma revisão estética aprofundada para garantir harmonia visual absoluta do Avalon com seu inovador ecossistema de temas dinâmicos (Avalon Gold, Crunchyroll, Netflix):

- **🎨 Harmonização de Cores e Temas Dinâmicos**: Refatoramos componentes cruciais e fluxos que utilizavam paletas de cores estáticas (como amarelos/orange fixos) para adotarem variáveis nativas de cada tema. Os Star Ratings de cartões de mídia, botões de ação e componentes de rankings agora adquirem as nuances estilizadas de forma instantânea de acordo com o tema selecionado.
- **✨ Botão "Me Surpreenda!" e Modal Temáticos**: O clássico sintonizador de sorte "Me Surpreenda!" e todo o visual do modal de recomendação aleatória foram completamente reconstruídos sob o design system adaptativo do Avalon. Os status das obras, vibes ("Qualquer", "Curtos", etc.) e o botão alternativo "OUTRO" seguem os gradientes, sombras e as cores autênticas dos temas.
- **📈 Contraste Aperfeiçoado e Cards Reconstruídos**: Os boxes de status e gráficos em barras na página física de detalhes da obra foram readequados para remover planos de fundo escuros fixos, garantindo compatibilidade elegante tanto em modo escuro quanto em modo claro sintonizado. Tags de categorias e gêneros receberam novos limites de contrastes legíveis em todas as variações de displays.

---

## 🛡️ O que há de Novo na Versão v4.3.6 (Dynamic Airing & Liberation Update)

- **⏰ Cronograma de Próximos Episódios e Lançamento Real-Time**: Nova integração sênior combinando Jikan API e AniList GraphQL para exibir contagem regressiva viva e data/hora do lançamento internacional dos novos episódios em tempo real direto na página de detalhes da obra.
- **🎛️ Barra de Servidores e Escudo Compacta**: Refatoração visual na página do Reprodutor. A seleção de servidores e o Escudo de Anúncios agora residem em um único painel minimalista com botões enxutos e um badge de clique cíclico que alterna o nível do Escudo com um clique.
- **⚙️ Sintonizador de Mídia Colapsável**: O painel do Tradutor de Identidades de Mídia foi simplificado para uma única linha de status ativa por padrão. Os cliques no link expandem horizontalmente as opções de calibragem TMDB sob demanda, reduzindo a poluição informativa em 85%.
- **🔓 Limitador Dinâmico de Contagem de Episódios**: Caso um anime em lançamento receba episódios de surpresa (ou que o MyAnimeList atrase em sincronizar o progresso de novos episódios), adicionamos dois gatilhos interativos (**"+ 12 Eps"** e **"Grade 100"**), permitindo ao usuário estender o tamanho do catálogo no ato de forma limpa e resiliente.

---

## 🛡️ O que há de Novo na Versão v4.3.5 (Shield & Stream Era)

- **🛡️ Escudo Anti-Anúncios Inteligente ("Smart Guard")**: Upgrade profundo no motor de filtragem de anúncios dos iframes e players de streaming. Anteriormente, um sandbox estrito bloqueava todas as requisições geradoras de popups/novas abas indiscriminadamente, o que fazia com que servidores de vídeo modernos (como Betterflix S1/S2/S3, VidLink e Vidsrc) tivessem comportamentos de travamento, loops infinitos de sintonia ou disparassem telas de **Erro 404** e erros de carregamento na reprodução ao falhar tentativas de abrir scripts de publicidade ou telemetria em plano secundário.
- **⚓ Isolamento Seguro Sem Perda de Sinal**: O novo modo **Smart Guard** (Recomendado) permite que os scripts das fontes rodem e gerenciem conexões de forma segura, inclusive liberando a simulação de popups e novos contexts (`allow-popups` e `allow-popups-to-escape-sandbox`), mas **remove estritamente a permissão de redirecionamento da página principal (`allow-top-navigation`)**. Suas sintonizações e episódios agora carregam 100% livres de Erro 404, enquanto mantemos o Avalon e sua navegação principal totalmente blindados de redirects!
- **🎛️ Painel Seletor de Níveis do Escudo**: Integrado um seletor visual de alta fidelidade com 3 botões rápidos acoplados diretamente no painel de controle do player de vídeo, permitindo a alternância imediata dependendo da fonte escolhida:
  - 🛡️ **Smart Guard (Recomendado)**: Compatibilidade máxima, performance limpa, evita 100% dos erros 404 e protege sua aba ativa contra sequestros de redirecionamento.
  - ⚡ **Estrito (Strict)**: Bloqueio absoluto agressivo (pode ocasionar tela 404 em servidores sensíveis com scripts anti-sandbox).
  - 🧼 **Desativado (Off)**: Sem restrições de sandbox, reproduzindo no player de forma nativa e sem intervenção.

---

## 🎲 O que há de Novo na Versão v4.3.4 (Otaku Roulette Era)

- **🎰 Roleta Gamificada e Slot Machine Visual ("Me Surpreenda!")**: Upgrade completo na interface do sorteador inteligente na Minha Lista. Agora, ao acionar o "Me Surpreenda!", o sistema apresenta uma animação inspirada em caça-níqueis (Slot Machine) desacelerando e alternando entre pôsteres e títulos candidatos antes de revelar a escolha do seu destino!
- **🌀 Filtros por "Vibe" de Recomendação**: Introdução de seletores de vibe dinâmicos no modal da Roleta que moldam o sorteio de acordo com seu humor atual:
  - ⚡ **Curtos**: Filtra animes/mangás focados em experiências rápidas e dinâmicas (como filmes ou séries de até 13 episódios).
  - 🏆 **Relíquias**: Prioriza produções lendárias e as maiores notas dadas pela comunidade/você (mídias com score ≥ 8).
  - 🧭 **Mundiais/Longos (Maratonas)**: Sorteia grandes épicos, sagas de longa duração e histórias imersivas.
  - ✨ **Qualquer**: Mantém a roleta ampla e descompromissada sobre todos os candidatos.
- **🔗 Atalhos e Deep Links Rápidos**: Adição do botão **"Assistir!"** / **"Ler Saga!"** que altera o status da mídia instantaneamente e redireciona você de forma indolor e profunda direto para a tela de assistir ou ler, reduzindo atritos na sua experiência diária!
- **🧼 Ajustes Finos e Alinhamentos**: Correções na tipografia Space Grotesk/JetBrains Mono do modal e controle estrito das animações de Framer Motion (`AnimatePresence`) para assegurar transições fluidas de renderização a 60fps.

---

## 🚀 O que há de Novo na Versão v4.3.3 (Smart Discovery Era)

- **🧠 Algoritmo de Descoberta Inteligente ("Me Surpreenda!")**: Correção definitiva do seletor aleatório inteligente de sugestões. Anteriormente, ele podia sortear temporadas subsequentes, sequências diretas ou arcos continuados (como *Date A Live V*, segundas temporadas ou partes avançadas). Agora, um analisador semântico de alta precisão identifica marcadores ordinais, números romanos (até X), termos de temporada/temporada em múltiplos idiomas e subtitulações de arcos exclusivos para filtrar e excluir sequências do sorteio, priorizando o início de novas jornadas ou primeiras temporadas.
- **🛡️ Fallback de Resiliência**: Caso sua lista só possua sequências pendentes para assistir, o sistema desativa inteligentemente a barreira de filtro para assegurar que a recomendação continue ativa e funcional sem travamentos.

---

## 🚀 O que há de Novo na Versão v4.3.2 (Sync Alignment Era)

- **🔄 Sincronização e Alinhamento de IDs (AniList Import)**: Correção do desalinhamento crítico de sincronização entre a Minha Lista e os trackers externos (AniList/MyAnimeList). Os animes importados pelo AniList anteriormente utilizavam o ID interno da plataforma em vez do ID unificado da **MyAnimeList (MAL / Jikan)**, fazendo com que as mutações e atualizações falhassem ou gerassem anotações duplicadas/múltiplas. Agora, o importador puxa diretamente o identificador global unificado `idMal`.
- **🧼 Migração Automática e Faxina de Duplicados**: Implementação de um motor inteligente e invisível que monitora quando um anime é importado pela segunda vez com o novo ID corrigido. Ele remove **instantaneamente** o registro antigo duplicado correspondente ao ID inválido (do banco Firestore em tempo real e do LocalStorage de visitantes), consolidando seu progresso.
- **💡 Como Sincronizar**: Basta acessar as Configurações e clicar em **"Importar"** novamente na aba de Migração. Suas duplicatas serão apagadas e seu progresso continuará sincronizado de forma perfeita daqui em diante!

---

## 🚀 O que há de Novo na Versão v4.3.1 (Kimetsu Resolution Era)

- **⚔️ Resolução do Conflito "Kimetsu vs Arcane"**: Correção definitiva do desalinhamento de ID que enviava as temporadas de *Demon Slayer: Kimetsu no Yaiba* (MAL ID 38000 + derivativos de temporadas) para o ID `94605` (que no TMDB corresponde à aclamada série animada *Arcane*). Os mapeamentos estáticos foram atualizados com o ID oficial global de Demon Slayer: **`85937`**.
- **💥 Atualização Instantânea**: Ajustes aplicados em todos os mappers de offset e seasons do anime (incluindo Mugen Train Arc, Entertainment District Arc, Swordsmith Village e Hashira Training), restabelecendo as sintonias de áudio/legenda corretas sob demanda.

---

## 🚀 O que há de Novo na Versão v4.3.0 (Identity Tuning Era)

- **🛠️ Sintonizador e Tradutor de Identidades de Mídia (DevTools)**: Novo painel acoplado ao player exibe detalhadamente a identidade do MyAnimeList ou AniList cruzando com o ID do TMDB correspondente, temporada e compensador (offset) do fluxo de vídeo em tempo real.
- **⚡ Sintonia Fina Manual Resiliente**: Se o fluxo automático sintonizar a temporada errada ou sofrer dessincronização por arcos segmentados de MyAnimeList, recalibre o ID de TMDb Alvo, mídia, temporada correspondente ou compensador (offset) no ato! O Avalon salvará os ajustes preferenciais localmente em seu navegador com prioridade absoluta.
- **🧩 Flexibilidade de Mapeamento Multi-Payload**: Ajustes profundos na recuperação de chaves de tradução pelo servidor cloud da AniZip. O receptor foi blindado para decodificar e processar com 100% de estabilidade e tolerância falhas em payloads que distribuem informações sob chaves variadas (`tmdb_id`, `themoviedb_id` ou via coleções aninhadas em `mappings`).
- **💡 Correção Fluida no Modo Lista de Episódios**: Ajuste no alinhamento de layout flex do modo "Lista" nos episódios da coluna lateral, garantindo espaçamento simétrico e alta elegância visual no desktop e mobile.

---

## 🚀 O que há de Novo na Versão v4.2.6 (Season Alignment Era)

- **🔄 Sincronização Absoluta de Temporadas**: Implementação de um dicionário inteligente e estendido de mappers que traduz IDs segmentados do MyAnimeList (ex: *Demon Slayer: Hashira Training*, *Yuukaku-hen*, *Swordsmith Village*, *Attack on Titan Final Part 1/2*) para as temporadas consolidadas correspondentes dentro do banco da TMDB, garantindo que o player carregue o sinal correto sob demanda.
- **📐 Compensador Dinâmico de Episódios (Offset)**: Mecanismo de remapeamento interno que aplica cálculos de offset (ex: *Yuukaku-hen* iniciando no episódio 8 na numeração da S2 do TMDB) para garantir que você clique no botão "Episódio 1" e assista ao exato primeiro episódio daquele Arco sem rupturas ou desalinhamentos.
- **🛡️ Escudo Anti-Desvio "Undercurrents"**: Algoritmo de segurança e validação severa das requisições que impede IDs não mapeados de caírem na requisição genérica de valor ID "1" (que exibia a série "Undercurrents"). Agora exibe um aviso acolhedor incentivando a busca direta ou alternância de fonte caso a triangulação automática seja interceptada.

---

## 🚀 O que há de Novo na Versão v4.2.5 (The Anti-Leak Shield)

- **🛡️ Escudo Anti-Vazamento de Cliques**: Mecanismo de sincronização retardada (450ms) no botão de iniciar sintonização para absorver completamente os cliques de mouse, impedindo que o evento vaze (*click fall-through*) para o iframe e acione popups ocultos do player.
- **⚡ Status Imersivo do Escudo**: Nova animação e indicador visual "Escudo Protetor Ativado" ao sintonizar o sinal, garantindo clareza e imersão durante a filtragem de anúncios.

---

## 🚀 O que há de Novo na Versão v4.2.0 (The Shield Era)

- **🛡️ Escudo Anti-Anúncios (Ad-Shield)**: Introdução de um sandboxing cirúrgico do HTML5 no iframe para bloquear a abertura de popups, novas abas ou redirects de sites parceiros sem interferir no buffer de áudio e vídeo de alta fidelidade.
- **⚙️ Controle Dinâmico do Escudo**: Possibilidade de ativar ou desativar o Escudo Anti-Anúncios a qualquer momento no player caso queira abrir links externos ou suporte outros métodos de integração interativa.
- **✨ Full Control Hub**: Botão indicador do Guardião com status visual de proteção acoplado ao seletor de servidores de maneira intuitiva.

---

## 🚀 O que há de Novo na Versão v4.1.0 (The Precision Era)

- **🎯 Legendary Mapping Dictionary**: Mapeamento manual verificado para as maiores franquias (Naruto, Bleach, Dragon Ball, One Piece, HxH), garantindo 100% de precisão e latência zero.
- **📐 Year Triangulation**: Novo motor de busca híbrida que cruza o ano de lançamento do MyAnimeList com o catálogo TMDB, eliminando confusões com remakes, musicais ou documentários.
- **🇯🇵 Cultural Origin Filtering**: Refinamento nos filtros de busca para priorizar conteúdos de animação com origem japonesa, garantindo que você sempre chegue ao anime correto.
- **⚡ Instant-Load Engine v2**: Cache persistente otimizado que agora inclui dados de triangulação para navegação ainda mais fluida.

---

## 🚀 O que há de Novo na Versão v4.0.0 (The Optimization Overhaul)

- **⚡ Instant-Load Engine**: Implementação de cache persistente (24h) para detalhes de animes e mapeamentos TMDB, tornando a navegação entre títulos instantânea.
- **🎬 Binge-Watch Core**: Adição de Auto-Play para o próximo episódio e botão de navegação rápida "Próximo Ep" diretamente nos controles do player.
- **🎯 Dynamic Episode Paging**: Sincronização inteligente entre o MyAnimeList e as fontes externas, garantindo que a lista de episódios reflita exatamente a contagem real da obra.
- **🛡️ Enhanced Failover Watchdog**: Redução do tempo de reação do failover automático (12s) com lógica de debounce para garantir a melhor experiência de streaming sem interrupções manuais.
- **🔓 Global Signal Bypass v2**: Otimização dos cabeçalhos de Iframe para suporte total a provedores Premium, eliminando conflitos de Sandbox e geolocalização.

---

## 🚀 O que há de Novo na Versão v3.6.5 (Player Stability & Bypass)

## 🚀 O que há de Novo na Versão v3.6.0 (The Betterflix Update)

- **💎 Betterflix API Integration**: Adição do Betterflix como provedor oficial. O Avalon agora filtra inteligentemente o catálogo massivo do Betterflix para destacar animes e filmes relevantes, integrando-os ao ecossistema de tracking.
- **🎬 Recovery & Stability**: Após um breve período de manutenção, todas as fontes Stremio (Torrentio) foram restauradas. O motor de comunicação com provedores externos foi blindado contra falhas de rede.
- **⚙️ Advanced Diagnostic Suite**: A aba de fontes agora conta com um suíte de testes aprimorado, permitindo validar cada addon individualmente com logs de resposta e tempos de ping.
- **🛡️ Secure Proxy Layer v3**: Melhorias no sistema de tunelamento de requisições para contornar restrições de domínios externos e garantir o stream.

---

## 🚀 O que há de Novo na Versão v3.5.1 (Maintenance & Quality Control)

- **🛡️ Shielded Sources**: Fontes externas em manutenção para garantir a estabilidade do ecossistema. O aviso de indisponibilidade foi restaurado enquanto preparamos o motor v4.
- **🎨 Visual Master Refresh**: Os novos cards de mídia com Glassmorphism, badges "PREMIUM" e transições cinematográficas continuam ativos e performáticos.
- **🔍 Search Precision**: Sistema de busca interna na "Minha Lista" e filtro global de qualidade (TV/Movies) permanecem funcionais.

---

## 🚀 O que há de Novo na Versão v3.5.0 (P2P Hybrid & Connectivity)

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

### [v4.3.6] - Dynamic Airing & Liberation (Atual)
- **Ajuste Próximo Episódio**: Integração do cronômetro de lançamentos reais do AniList em conjunção ao Jikan no `AnimeDetails`.
- **Simplificação de Modos**: Redução monumental do ruído visual e simplificação inteligente da seleção de servidores e do painel tradutor TMDB no `AnimePlayer`.
- **Limitadores Eliminados**: Bypass dinâmico de limites oficiais sincronizados de episódios nas janelas de exibição através dos botões "+ 12 Eps" e "Grade 100".

### [v3.6.1] - Stability & Key Dedup
- **Duplicate Key Shield**: Deduplicação profunda em `AnimeDetails`, `SearchResults`, `Home` e `betterflixService`.
- **Character Grid Fix**: Correção específica para duplicidades em IDs de personagens de animes com elencos extensos.

### [v3.1.9] - Deploy & Routing Fix
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
