
#  Teste técnico SEIDOR 

Aplicação de gestão de chamados em ambiente ITSM, com simulação de tempo real, roles por perfil e fluxo de atendimento em dashboard.

## Visão geral

O projeto simula um painel de suporte com três perfis principais:

- Consultor: visualiza fila, atribui e atende chamados
- Gestor: acompanha carga por consultor e reestrutura a distribuição
- Cliente: acompanha apenas seus próprios chamados e interage com o atendimento

A aplicação foi estruturada para manter a lógica de negócio separada da interface e permitir evolução incremental sem deixar tudo concentrado em um único arquivo.

## Stack

- React 19
- TypeScript
- Vite 6
- react-router-dom

## Estrutura do projeto

- [src/app/App.tsx](src/app/App.tsx): configuração de rotas da aplicação
- [src/pages/TicketDashboardPage.tsx](src/pages/TicketDashboardPage.tsx): página principal do dashboard
- [src/components](src/components): componentes reutilizáveis para lista, detalhe, overview, status e formulário
- [src/store/store.ts](src/store/store.ts): reducer central e estado do sistema
- [src/services/api.ts](src/services/api.ts): simulação de eventos em tempo real

- [src/types/types.ts](src/types/types.ts): tipagem dos modelos principais

## Como executar

1. Instale as dependências:

   npm install

2. Inicie o ambiente de desenvolvimento:

   npm run dev

3. Acesse no navegador:

   http://localhost:5173/
