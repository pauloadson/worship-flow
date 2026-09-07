# Worship Flow 🎶

Bem-vindo ao repositório do **Worship Flow**! Este projeto é um Web App focado na gestão de equipes musicais e ministérios de louvor, desenhado para resolver problemas de desengajamento causados por ruídos de comunicação.

## Estrutura do Monorepo

O projeto está organizado como um monorepo utilizando [Turborepo](https://turbo.build/) e `pnpm`.

- `frontend/`: Aplicação web (Next.js + Tailwind CSS)
- `backend/`: API (NestJS + Prisma + PostgreSQL)
- `docs/`: Documentação técnica do projeto (Docusaurus)

## Pré-requisitos

- **Node.js** (v20 ou superior)
- **pnpm** (recomendado v9+)
- **MySQL** (Rodando localmente ou via Docker para o banco de dados)

## Como Executar o Projeto

Siga os passos abaixo para iniciar o projeto em sua máquina:

1. **Instale as dependências** na raiz do projeto:
   ```bash
   pnpm install
   ```

2. **Configure as Variáveis de Ambiente**:
   - Vá até a pasta `backend/` e crie um arquivo `.env` baseado no `.env.example` (ou crie um novo) com a sua string de conexão:
     ```env
     DATABASE_URL="mysql://usuario:senha@localhost:3306/worship_flow"
     JWT_SECRET="seu-segredo-super-seguro"
     ```

3. **Inicie o Banco de Dados (Prisma)**:
   Dentro da pasta `backend/`, rode as migrações (se for a primeira vez) e gere o cliente:
   ```bash
   cd backend
   npx prisma migrate dev --name init
   cd ..
   ```

4. **Inicie o Ambiente de Desenvolvimento (Tudo Junto)**:
   Na raiz do projeto, execute:
   ```bash
   pnpm run dev
   ```

   Isso iniciará simultaneamente:
   - **Frontend**: http://localhost:3000
   - **Backend**: http://localhost:3001 (ou porta padrão do NestJS, geralmente 3000, você pode configurar a porta no backend)
   - **Docs (Docusaurus)**: http://localhost:3002

## Outros Comandos Úteis (Na Raiz)

- `pnpm run build`: Constrói todos os aplicativos (`frontend`, `backend`, `docs`) para produção.
- `pnpm run lint`: Executa a validação de formatação de código e boas práticas em todos os pacotes.
- `pnpm run test`: Roda as suítes de teste de todos os pacotes.

## Tecnologias Principais
- **Next.js 15+** (App Router)
- **NestJS**
- **Prisma ORM**
- **Tailwind CSS**
- **TypeScript**
