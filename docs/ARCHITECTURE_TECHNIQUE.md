# Architecture Technique

## 1. Stack Technologique

### Frontend
- **Framework**: React 19.2.4
- **Routing**: React Router DOM 7.14
- **HTTP Client**: Axios 1.14
- **State Management**: Zustand 5.0
- **Charts**: Recharts 3.8
- **BPMN Editor**: bpmn-js 18.19 + bpmn-moddle 10.0
- **UI Icons**: Lucide React 1.7
- **Drag & Drop**: @dnd-kit/core, @dnd-kit/sortable
- **Date handling**: date-fns 4.1
- **CSS**: TailwindCSS 4.2 (via Vite plugin)
- **Build**: Vite 8.0

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js (inferred from structure)
- **Database ORM**: Prisma 6.x
- **Database**: PostgreSQL (via Supabase)
- **Authentication**: JWT (jsonwebtoken)

### Infrastructure
- **Database hosting**: Supabase (PostgreSQL)
- **Package manager**: npm

## 2. Architecture de l'Application

```
smq/
├── frontend/           # Application React
│   ├── src/
│   │   ├── api/       # Client Axios configure
│   │   ├── components/# Composants UI réutilisables
│   │   │   ├── form/  # Composants de formulaire
│   │   │   ├── ui/    # Composants UI de base (Badge, Button, Card, etc.)
│   │   │   └── notifications/
│   │   ├── hooks/     # Hooks custom (useFormValidation)
│   │   ├── pages/     # Pages/routes principales
│   │   ├── store/     # Zustand stores
│   │   └── utils/     # Utilitaires (i18n, http helpers)
│   └── vite.config.js
│
├── backend/            # API Express
│   ├── prisma/
│   │   └── schema.prisma  # Schéma de données Prisma
│   └── src/
│       ├── routes/     # Définitions des routes API
│       ├── middleware/ # Middlewares (auth, validation)
│       └── index.js    # Point d'entrée serveur
│
├── docs/               # Documentation
├── scripts/            # Scripts utilitaires
├── supabase/           # Config Supabase (migrations, functions)
└── workers/            # Jobs background (si applicable)
```

## 3. Base de Donnees (Prisma Schema)

### Modeles Principaux

```
User
├── id, email, password, fullName, role
├── createdAt, updatedAt
└── relations: correctiveActions, tasks, projects

Process
├── id, name, description, bpmnXml
├── projectId, isoClause, status
├── createdAt, updatedAt
└── relations: project, tasks, correctiveActions

Project
├── id, name, description, status
├── startDate, endDate
├── createdAt, updatedAt
└── relations: processes, tasks

Task
├── id, title, description, status, priority
├── processId, projectId, assigneeId
├── dueDate, completedAt
├── createdAt, updatedAt
└── relations: process, project, assignee

CorrectiveAction (CAPA)
├── id, title, description, recommendation
├── status, severity, actionType, source
├── nonConformityId, processId, projectId
├── dueDate, containmentAction, rootCause
├── effectivenessStatus, verificationComment
├── createdAt, updatedAt
└── relations: nonConformity, process, project, assignee

NonConformity
├── id, title, description, severity, status
├── processId, correctiveActionId
├── createdAt, updatedAt
└── relations: process, correctiveAction

Document
├── id, name, type, url, size
├── uploadedById, processId
├── createdAt
└── relations: uploadedBy, process

Notification
├── id, type, title, message, read
├── userId, relatedId, relatedType
├── createdAt
└── relations: user
```

## 4. API Endpoints

### Auth
- `POST /api/auth/register` - Creation de compte
- `POST /api/auth/login` - Connexion
- `GET /api/auth/me` - Utilisateur courant

### Processes
- `GET /api/processes` - Liste des processus
- `POST /api/processes` - Creer un processus
- `GET /api/processes/:id` - Detail processus
- `PATCH /api/processes/:id` - Modifier processus
- `DELETE /api/processes/:id` - Supprimer processus
- `GET /api/processes/:id/bpmn` - XML BPMN du processus

### Projects
- `GET /api/projects` - Liste des projets
- `POST /api/projects` - Creer un projet
- `GET /api/projects/:id` - Detail projet
- `PATCH /api/projects/:id` - Modifier projet

### Tasks
- `GET /api/tasks` - Liste des taches (avec filtres)
- `POST /api/tasks` - Creer une tache
- `PATCH /api/tasks/:id` - Modifier tache
- `DELETE /api/tasks/:id` - Supprimer tache

### Corrective Actions (CAPA)
- `GET /api/corrective-actions` - Liste des actions (avec filtres)
- `POST /api/corrective-actions` - Creer une action
- `GET /api/corrective-actions/:id` - Detail action
- `PATCH /api/corrective-actions/:id` - Modifier action
- `DELETE /api/corrective-actions/:id` - Supprimer action

### Non-Conformities
- `GET /api/non-conformities` - Liste des NC
- `POST /api/non-conformities` - Creer une NC
- `PATCH /api/non-conformities/:id` - Modifier NC

### Notifications
- `GET /api/notifications` - Liste des notifications pour l'utilisateur

### Dashboard
- `GET /api/dashboard/stats` - Statistiques KPIs

### Documents
- `GET /api/documents` - Liste des documents
- `POST /api/documents/upload` - Telecharger un document
- `DELETE /api/documents/:id` - Supprimer document

## 5. Sécurité

### Authentification
- JWT (JSON Web Token) pour l'authentification
- Token stocke dans localStorage
- Middleware d'authentification sur les routes protegees

### Autorisation
- Controle basé sur les roles (RBAC)
- ADMIN: acces complet
- PROJECT_MANAGER: gestion projet et CAPA
- TEAM_MEMBER: actions sur ses propres ressources
- CAQ: revue et validation

### Validation
- Validation des champs via hooks custom (useFormValidation)
- Sanitization des entrees utilisateur
- Protection CORS

## 6. Variables d'Environnement

### Frontend (.env)
```
VITE_API_URL=http://localhost:3000
```

### Backend (.env)
```
DATABASE_URL=postgresql://...
JWT_SECRET=your-secret-key
PORT=3000
```

## 7. Scripts npm

### Frontend
```bash
npm run dev      # Development server
npm run build    # Production build
npm run lint     # ESLint
npm run preview  # Preview production build
```

### Backend
```bash
npm run dev      # Development server
npm start        # Production server
npx prisma generate  # Generate Prisma client
npx prisma db push    # Push schema to database
npx prisma db migrate # Run migrations
```

## 8. Composants UI Principaux

| Composant | Emplacement | Description |
|-----------|-------------|-------------|
| Badge | components/ui/Badge.jsx | Etiquettes colorées |
| Button | components/ui/Button.jsx | Boutons (primary, subite, ghost) |
| Card, CardHeader | components/ui/Card.jsx | Conteneurs stylisés |
| Input, Select | components/ui/Input.jsx | Champs de formulaire |
| PageHeader | components/ui/PageHeader.jsx | En-tete de page |
| Table | components/ui/Table.jsx | Tableau de données |
| FormField | components/form/FormField.jsx | Champ avec label, erreur, validation |
| AutoBpmnViewer | components/AutoBpmnViewer.jsx | Visualisation BPMN |
| BpmnModeler | components/BpmnModeler.jsx | Editeur BPMN interactif |