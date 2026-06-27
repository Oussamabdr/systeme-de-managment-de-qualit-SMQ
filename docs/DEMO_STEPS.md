# Demo Steps - Application SMQ (ISO 9001)

L'application tourne sur **http://localhost:5173** (frontend) et **http://localhost:5000/api** (backend).

---

## 1. Connexion

| Rôle | Email | Mot de passe |
|------|-------|-------------|
| **Admin** | `admin@esi.edu` | `Password123!` |
| **Chef de projet** | `manager@esi.edu` | `Password123!` |
| **Membre équipe** | `member@esi.edu` | `Password123!` |
| **CAQ** | `caq@esi.edu` | `Password123!` |

Va sur `/login` et connecte-toi avec l'admin pour voir toutes les fonctionnalités.

---

## 2. Dashboard (page d'accueil)

- Menu latéral > **Dashboard**
- Vue d'ensemble : KPIs, conformité, NC en cours, CAPA ouvertes, projets actifs
- C'est le point de départ pour piloter le SMQ

---

## 3. Créer un Processus

1. Menu latéral > **Processes** → page `/processes`
2. Dans le panneau de droite **"Create Process"**, remplis :
   - **Nom** : ex. "Gestion des réclamations"
   - **Responsable** : ex. "Mohamed Ali"
   - **Département** : choisis un (ou ajoutes-en un en tant qu'Admin)
   - **Description** : brève description
   - **Entrées / Sorties** : séparées par des virgules (ex. `Réclamation client, Email`)
   - **Indicateurs KPI** : ex. `Délai de traitement, Taux de satisfaction`
3. Clique **"Save Process"**
4. Le processus apparaît dans la liste groupée par département

---

## 4. Détail du Processus & Évaluation ISO

1. Clique **"Open"** sur le processus créé → page `/processes/:processId`
2. Tu vois :
   - Responsable, nombre de KPIs
   - Entrées / Sorties / Indicateurs avec leurs taux d'atteinte
   - **Diagramme BPMN** généré automatiquement
3. Plus bas : **Fiche d'évaluation ISO 9001**
   - Coche les critères pertinents pour ton processus
   - Renseigne la véracité, le score (0-100), le taux, des observations
   - Clique **"Enregistrer"** pour sauvegarder l'évaluation

---

## 5. Éditer le Diagramme BPMN

1. Dans les détails du processus, clique **"Edit BPMN"**
2. L'éditeur BPMN s'ouvre avec :
   - Palette à gauche (tâches, événements, gateway, flux)
   - Canvas central pour glisser-déposer
   - Propriétés à droite
3. Construis ton flux de processus
4. **Sauvegarde** en haut

---

## 6. Créer un Projet & y Lier le Processus

1. Menu latéral > **Projects** → `/projects`
2. Clique **"New Project"** → remplis nom, description, dates
3. Ouvre le projet créé → section **"Assign Processes"**
4. Sélectionne ton processus et associe-le au projet

---

## 7. Créer des Tâches

1. Menu latéral > **Tasks** → `/tasks`
2. Clique **"New Task"**
3. Remplis : titre, description, processus, projet, responsable, priorité, date limite
4. La tâche apparaît dans le Kanban (TODO → IN_PROGRESS → DONE)
5. Tu peux glisser-déposer les cartes pour changer le statut

---

## 8. Déclarer une Non-Conformité (NC)

1. Menu latéral > **Non-Conformities**
2. **"New Non-Conformity"** → titre, description, gravité, processus lié
3. Déclare-la

---

## 9. Créer une Action Corrective (CAPA)

1. Menu latéral > **Corrective Actions**
2. Panneau droit **"Create CAPA"** :
   - Titre, recommandation, gravité, source
   - Lie la NC créée précédemment
   - Date limite
3. Clique **"Create Corrective Action"**
4. Utilise les boutons rapides pour passer OPEN → IN_PROGRESS
5. Renseigne la cause racine et les critères d'efficacité
6. Passe en DONE → un admin/CAQ peut vérifier

---

## 10. Documents & Notifications

1. **Documents** (`/documents`) : téléverse un fichier lié à un processus ou une tâche
2. **Notifications** (`/notifications`) : voir les alertes (tâches en retard, projets retardés, CAPA à vérifier)

---

## Résumé du parcours utilisateur

```
Connexion → Dashboard → Créer Processus → Évaluer ISO →
Éditer BPMN → Créer Projet → Lier Processus →
Créer Tâche → Déclarer NC → Créer CAPA → Vérifier → Documents
```
