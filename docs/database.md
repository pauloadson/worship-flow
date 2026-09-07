# Banco de Dados (Prisma)

O banco de dados do **Worship Flow** é modelado usando PostgreSQL e o Prisma ORM. Abaixo está a visão geral das tabelas principais:

### 1. User
Armazena as informações base de cada usuário cadastrado na plataforma (id, email, senha, etc).

### 2. Group & Role
Representa o Ministério de Louvor ou Grupo Específico.
Um **Group** possui um `owner` (o criador). Dentro de cada grupo existem **Roles** (Cargos) dinâmicos, por exemplo: "Baterista", "Cantor", "Líder".

### 3. GroupMember (RBAC)
É a tabela pivot que vincula um `User` a um `Group`, atribuindo opcionalmente um `Role`.
Ela também possui o campo `isAdmin` que permite ao usuário ter privilégios de edição dentro daquele grupo.

### 4. Song
Representa o Repertório. O cadastro de cada música possui:
- `title` e `artist`
- `key` (tom da música)
- URLs para materiais externos (`sheetMusicUrl`, `videoLessonUrl`, `audioUrl`), concentrando tudo em um só lugar.

### 5. Event & EventRsvp
O fluxo de escalas. 
- Um **Event** (Ensaio ou Culto) ocorre em uma data.
- **EventRsvp** (Confirmação de Presença) vincula um `Event` a um `GroupMember`.
- O RSVP tem o estado `status` que pode ser `pending`, `accepted` ou `declined`.
- Há também um campo `tokenLink` exclusivo que pode ser enviado via WhatsApp para o usuário confirmar presença sem precisar fazer login no sistema inteiro todas as vezes.
