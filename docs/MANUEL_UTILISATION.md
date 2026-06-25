# Manuel d'Utilisation

## 1. Connexion et Authentification

### 1.1 Creation de Compte
1. Acceder a `/register`
2. Remplir les champs: Nom complet, Email, Mot de passe, Confirmation
3. Cliquer sur "Creer un compte"
4. Redirection automatique vers le dashboard

### 1.2 Connexion
1. Acceder a `/login`
2. Entrer email et mot de passe
3. Cliquer sur "Se connecter"
4. Acces au dashboard personnel

### 1.3 Deconnexion
- Cliquer sur le menu utilisateur en haut a droite
- Selectionner "Deconnexion"

## 2. Dashboard

Le dashboard presente une vue d'ensemble des indicateurs cles:
- Taux de conformite
- Nombre de non-conformites en cours
- Actions CAPA ouvertes
- Projets actifs
- Alertes et notifications

**Navigation**: Menu lateral gauche

## 3. Gestion des Processus

### 3.1 Liste des Processus
1. Menu lateral > **Processes**
2. Vue de tous les processus avec leur diagramme BPMN
3. Filtrer par projet ou statut

### 3.2 Creer un Processus
1. Cliquer sur **Nouveau processus**
2. Remplir le nom, description, projet associe, clause ISO
3. Cliquer sur **Creer**

### 3.3 Modifier le Diagramme BPMN
1. Cliquer sur un processus > **Editer BPMN**
2. L'editeur BPMN s'ouvre:
   - **Palette a gauche**: Elements (taches, evenements, passerelles, flux)
   - **Canvas central**: Glisser-deposer les elements
   - **Proprietes a droite**: Configurer l'element selectionne
3. **Sauvegarder**: Bouton en haut
4. **Fermer**: Retour au detail du processus

### 3.4 Visualisation du Flux
1. Depuis **ProcessDetailsPage**, le diagramme BPMN s'affiche
2. Les donnees sont synchronisees avec le flux actuel

## 4. Gestion des Projets

### 4.1 Liste des Projets
1. Menu lateral > **Projects**
2.Vue des projets avec barre de progression

### 4.2 Creer un Projet
1. Cliquer sur **Nouveau projet**
2. Remplir: Nom, Description, Date de debut, Date de fin prevue
3. Cliquer sur **Creer**

### 4.3 Details du Projet
1. Cliquer sur un projet
2. Voir les processus lies, tasks, et CAPA associees

## 5. Taches

### 5.1 Liste des Taches
1. Menu lateral > **Tasks**
2. Vue des taches avec filtres:
   - Par processus
   - Par statut
   - Par priorite
   - Taches en retard uniquement

### 5.2 Creer une Tache
1. Cliquer sur **Nouvelle tache**
2. Remplir: Titre, Description, Processus, Projet,Responsable, Priorite, Date limite
3. Cliquer sur **Creer**

### 5.3 Modifier une Tache
1. Cliquer sur une tache existente
2. Modifier les champs wished
3. Marquer comme terminee ou annuler

## 6. Actions Correctives et Preventives (CAPA)

### 6.1 Acceder aux CAPA
Menu lateral > **Actions CAPA**

### 6.2 Creer une Action
1. Dans le panneau **Creer une CAPA** (a droite):
   - Titre de l'action
   - Recommandation (etapes a suivre)
   - Gravite: LOW, MEDIUM, HIGH, CRITICAL
   - Source: MANUAL, OVERDUE_TASK, DELAYED_PROJECT, KPI_DEVIATION
   - Non-conformite liee (optionnel)
   - Date limite
2. Cliquer sur **Creer l'action corrective**

### 6.3 Utiliser les Modeles
Des modeles pre-definis sont disponibles:
- **Modele cause**: Analyse cause racine (5 pourquoi)
- **Modele confinement**: Action de confinement immediate
- **Modele KPI**: Correction d'un indicateur sous objectif
- **Modele retard**: Replanification d'une tache en retard
- **Modele efficacite**: Verification de l'efficacite

### 6.4 Suivre les Actions
1. Dans le panneau **Actions ouvertes** (a gauche):
   - Filtres par statut, gravite, efficacite
   - Cartes avec informations detaillees:
     - Type d'action (Corrective/Preventive)
     - Source
     - Date limite (avec indicateur retard si depassee)
     - Processus/Projet associe
     - Clause ISO
   - Boutons d'action rapide:
     - **Demarrer l'action**: Passer OPEN > IN_PROGRESS
     - **Annuler**: Passer en CANCELLED

### 6.5 Reporting et Graphiques
Les graphiques en haut de page montrent:
- **Gravite**: Repartition pie chart
- **Statut**: Repartition bar chart
- **Type**: Corrective vs Preventive (pie)
- **Source**: Provenance des actions (bar)

Metriques:
- Total des actions
- En cours
- Critiques
- En retard

## 7. Non-Conformites

### 7.1 Declarer une NC
1. Menu lateral > **Non-Conformities**
2. Cliquer sur **Nouvelle non-conformite**
3. Remplir: Titre, Description, Gravite, Processus associe
4. Cliquer sur **Declarer**

### 7.2 Lier a une CAPA
1. Ouvrir une non-conformite
2. Dans le champ "Action corrective", selectionner une CAPA existante ou en creer une nouvelle
3. Sauvegarder

## 8. Notifications et Boite de Reception

### 8.1 Boite de Reception
Menu lateral > **Notifications**

Affiche:
- **Rapports recus**: Alertes et signalements diriges vers votre role
- **Alertes operationnelles**: Taches en retard, projets retardes

### 8.2 Rapports Recus Details
Chaque rapport affiche:
- Titre et description
- Expediteur et date d'envoi
- Type d'action (Corrective/Preventive)
- Gravite (CRITICAL, HIGH, MEDIUM, LOW)
- Statut
- Date limite (avec indicateur si expiree)
- Source, Processus/Projet, Clause ISO
- Cause racine et action de confinement (si disponibles)
- Lien vers le suivi CAPA

### 8.3 Graphiques de Reporting
- **Distribution**: Pie chart (Rapports / Taches en retard / Projets retardes)
- **Severite rapports**: Bar chart par gravite
- **Statut rapports**: Bar chart par statut

### 8.4 Actions
- Cliquer sur **Ouvrir le suivi** pour acceder a la CAPA associee
- Utiliser les liens rapides pour naviguer vers les modules

## 9. Documents

### 9.1 Gestion Documentaire
Menu lateral > **Documents**

### 9.2 Telecharger un Document
1. Cliquer sur **Telecharger un document**
2. Selectionner le fichier
3. Renseigner: Nom, Type (Procedure, Instruction, Enregistrement, etc.)
4. Optionnellement lier a un processus
5. Cliquer sur **Telecharger**

### 9.3 Supprimer un Document
1. Cliquer sur l'icone de suppression
2. Confirmer la suppression

## 10. Tableau de Bord Global

Menu lateral > **Dashboard**

Vue synthetique avec:
- KPIs principaux en temps reel
- Graphiques de tendance
- Acces rapide aux modules prioritaires

## 11. Profiles et Preferences

### 11.1 Changer la Langue
1. Menu deroulant en haut a droite
2. Selectionner: Francais ou Anglais
3. L'interface se met a jour immediatement

### 11.2 Notifications
Les notifications sont distribuees automatiquement selon:
- Taches en retard
- Projets hors-delai
- Nouveaux rapports diriges vers votre role
- Actions CAPA a verifier

## 12. Glossaire

| Terme | Definition |
|-------|------------|
| CAPA | Corrective and Preventive Action - Action corrective et preventive |
| NC | Non-Conformite - Non-conformite aux exigences |
| ISO 9001 | Norme internationale de management de la qualite |
| BPMN | Business Process Model and Notation - Standard de modelisation |
| KPI | Key Performance Indicator - Indicateur cle de performance |
| RBAC | Role-Based Access Control - Controle d'acces base sur les roles |

## 13. Tips et Bonnes Pratiques

1. **Declarer rapidement les NC**: Plus une non-conformite est traitee tot, mieux c'est
2. **Utiliser les modeles CAPA**: Gain de temps et conformite aux pratiques
3. **Respecter les dates limites**: Les indicateurs de retard permettent un suivi precis
4. **Lier les actions aux processus**: Facilite la traçabilite et l'analyse
5. **Verifier l'efficacite**: Toujours verifier que les actions menees ont eu l'effet souhaite
6. **Consulter regulierement les notifications**: Rester informe des alertes et rapports