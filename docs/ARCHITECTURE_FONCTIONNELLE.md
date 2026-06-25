# Architecture Fonctionnelle

## 1. Presentation du Systeme

Le Systeme de Management de la Qualite (SMQ) est une application web permettant de gerer les processus qualite selon la norme ISO 9001. Elle permet de modeliser les processus via BPMN, gerer les actions correctives et preventives (CAPA), traiter les non-conformites, et suivre les projets et tasks.

## 2. Modules Fonctionnels

### 2.1 Authentification et Utilisateurs
- **Login / Register**: Creation de compte et authentification
- **Gestion des roles**: ADMIN, PROJECT_MANAGER, TEAM_MEMBER, CAQ
- **Dashboard personnel** avec KPIs

### 2.2 Modelisation BPMN des Processus
- **ProcessesPage**: Liste des processus avec diagrammes BPMN
- **BpmnModelerPage**: Editeur BPMN interactif pour creer et modifier les processus
- **ProcessDetailsPage**: Visualisation du flux BPMN avec synchronisation des donnees

### 2.3 Actions Correctives et Preventives (CAPA)
- **CorrectiveActionsPage**: Creation, suivi et gestion des actions
- Types d'actions: CORRECTIVE (corrective) / PREVENTIVE (preventive)
- Statuts: OPEN, IN_PROGRESS, DONE, CANCELLED
- Gravite: LOW, MEDIUM, HIGH, CRITICAL
- Sources: MANUAL, OVERDUE_TASK, DELAYED_PROJECT, KPI_DEVIATION
- Metriques de reporting: repartition par gravite, statut, type, source
- Indicateurs: actions en retard, en cours, critiques

### 2.4 Non-Conformites
- **NonConformitiesPage**: Declaration et suivi des non-conformites
- Liaisons possibles avec les actions CAPA
- Statuts de traitement

### 2.5 Projets et Processes
- **ProjectsPage**: Gestion des projets ISO
- **ProcessesPage**: Liste et gestion des processus metier
- Liaison processus-projets

### 2.6 Tasks (Taches)
- **TasksPage**: Taches operatives liees aux processus
- Assignation a des responsables
- Suivi de l'avancement
- Alertes de retard

### 2.7 Documents
- **DocumentsPage**: Gestion documentaire (procedures, instructions, enregistrements)
- Telechargement et stockage

### 2.8 Notifications et Reporting
- **NotificationsPage**: Reception des rapports et alertes
- Alertes operationnelles (taches en retard, projets retardes)
- Vue synthetique des signaux a traiter
- Charts de distribution

### 2.9 Dashboard
- **DashboardPage**: Tableau de bord avec KPIs
- Metriques cles: taux de conformite, nc en cours, capa ouvertes, etc.

## 3. Flux Fonctionnels Principaux

### 3.1 Flux de Traitement d'une Non-Conformite
1. Declaration d'une non-conformite (NC)
2. Analyse et evaluation de la severite
3. Creation d'une action corrective/preventive (CAPA)
4. Attribution a un responsable
5. Realisation des actions
6. Verification de l'efficacite
7. Cloture

### 3.2 Flux de Modelisation BPMN
1. Creation d'un nouveau processus
2. Conception du diagramme BPMN (editeur interactif)
3. Sauvegarde du XML BPMN
4. Association aux projets et clauses ISO
5. Visualisation synchronisee dans ProcessDetailsPage

### 3.3 Flux de Notification
1. Detection d'un ecart (tache en retard, projet en retard, KPI hors cible)
2. Generation automatique d'un rapport
3. Attribution au role concerne
4. Notification dans la boite de reception
5. Traitement et suivi dans CAPA

## 4. Roles et Permissions

| Role | Process | CAPA | Non-Conformite | Projects | Dashboard |
|------|---------|------|----------------|----------|----------|
| ADMIN | CRUD | CRUD | CRUD | CRUD | Full |
| PROJECT_MANAGER | Read | CRUD | CRUD | CRUD | Partial |
| TEAM_MEMBER | Read | Create/Update Own | Create | Read | None |
| CAQ | Read | CRUD | CRUD | Read | Full |

## 5. Indicateurs et KPIs

- **Taux de conformite**: NC fermees / Total NC
- **Taux de resolution CAPA**: Actions cloturees / Total actions
- **Actions critiques en retard**: Count
- **Repartition par gravite**: Graphiques pie/bar
- **Repartition par statut**: Open, In Progress, Done
- **Repartition par source**: Manual, Overdue, KPI deviation
- **Taux d'efficacite**: Actions verifiees efficacies / Total verifiees

## 6. Interfaces Utilisateurs

| Page | URL | Description |
|------|-----|-------------|
| Login | /login | Authentification |
| Register | /register | Creation de compte |
| Dashboard | /dashboard | Vue d'ensemble KPIs |
| Processes | /processes | Liste processus BPMN |
| Process Details | /processes/:id | Detail + flux BPMN |
| BPMN Editor | /processes/:id/bpmn | Editeur BPMN |
| Projects | /projects | Liste projets |
| Tasks | /tasks | Taches operatives |
| CAPA | /corrective-actions | Actions correctives/preventives |
| Non-Conformities | /non-conformities | Non-conformites |
| Notifications | /notifications | Boite de reception |
| Documents | /documents | Gestion documentaire |