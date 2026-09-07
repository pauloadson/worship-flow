# Worship Flow - Documentação

Worship Flow é um Web App Full-Stack criado para facilitar a gestão de departamentos de música e ministérios de louvor, resolvendo problemas de comunicação e desorganização.

## Estrutura do Monorepo

Este projeto utiliza o [Turborepo](https://turbo.build/) com o gerenciador de pacotes `pnpm`, dividindo as aplicações em três pacotes principais:

- `/frontend`: Aplicação Web desenvolvida com **Next.js 15+ (App Router)** e **Tailwind CSS**.
- `/backend`: API RESTful desenvolvida com **NestJS** e **Prisma ORM**.
- `/docs`: Documentação geral do projeto.

## Comandos Principais

Na raiz do projeto, você pode executar os seguintes comandos:

- `pnpm dev`: Inicia tanto o frontend quanto o backend em modo de desenvolvimento.
- `pnpm build`: Constrói ambas as aplicações para produção.
- `pnpm lint`: Executa a verificação de linting em todo o código.
- `pnpm test`: Executa a suíte de testes.

## Funcionalidades Planejadas

- **Gestão de Grupos (RBAC)**: Criação de grupos musicais e convites para membros, com permissões para administradores.
- **Painel do Líder**: Dashboard rápido com confirmações de ensaios e repertório.
- **Repertório**: Cadastro de músicas com links para videoaulas e partituras/cifras.
- **Escalas e RSVP**: Agendamento de ensaios/cultos e sistema de confirmação (Sim/Não) com links únicos para os voluntários.
