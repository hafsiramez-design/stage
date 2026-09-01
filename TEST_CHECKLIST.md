# 🧪 Checklist de Test Complète - World Events

## Phase 1: Démarrage de l'Application

### ✅ Serveur Backend
- [ ] Démarrer avec `node server.js`
- [ ] Vérifier le port 3000 est accessible: `http://localhost:3000`
- [ ] Vérifier `/api/health` répond correctement
- [ ] Base de données chargée avec 2 utilisateurs et événements

### ✅ Frontend (Expo Go)
- [ ] Démarrer avec `npm start` ou `expo start`
- [ ] Scanner le QR code depuis Expo Go
- [ ] Écran de chargement apparaît
- [ ] Pas d'erreurs dans la console Expo

---

## Phase 2: Authentification

### ✅ Écran de Login
- [ ] Page affichée correctement
- [ ] Logo et titre "World Events" visibles
- [ ] Champs email et mot de passe accessibles

### Test Login - Admin
```
Email: hafsiramez@gmail.com
Mot de passe: hafsi0123
```
- [ ] Connexion réussie
- [ ] Redirection vers AdminScreen
- [ ] Pas d'erreur "Email ou mot de passe incorrect"
- [ ] User name "AdminRamez" affiché en haut

### Test Login - Client  
```
Email: ramezhafsi16@gmail.com
Mot de passe: hafsi0123
```
- [ ] Connexion réussie
- [ ] Redirection vers WelcomeScreen
- [ ] Pas d'erreur
- [ ] User name "ClientRamez" affiché

### Test Login Errors
- [ ] Email vide → Message "Veuillez saisir votre email"
- [ ] Mot de passe vide → Message "Veuillez saisir votre mot de passe"
- [ ] Email inexistant → Message "Email ou mot de passe incorrect"
- [ ] Mot de passe incorrect → Message "Email ou mot de passe incorrect"

### ✅ Récupération de Mot de Passe
- [ ] Clic sur "Mot de passe oublié" montre la modale
- [ ] Étape 1: Saisir email
- [ ] Étape 2: Entrer code OTP
- [ ] Étape 3: Nouveau mot de passe
- [ ] Email de réinitialisation envoyé (vérifier inbox)

### ✅ Enregistrement (Register)
- [ ] Page Register accessible
- [ ] Photo de profil capturée ou importée
- [ ] Sélection du code pays
- [ ] Numéro de téléphone accepté
- [ ] Enregistrement réussi → Redirection vers Login

---

## Phase 3: Dashboard Admin

### ✅ Interface Admin
- [ ] Bouton "＋ Add Event" visible
- [ ] ❌ Bouton "Admins" **NOT VISIBLE** (doit être supprimé!)
- [ ] Grille de catégories (Festival, Music, Sports, etc.)
- [ ] Événements par pays affichés

### ✅ Ajouter un Événement
- [ ] Clic sur "＋ Add Event"
- [ ] Modale d'ajout ouvre
- [ ] Sélectionner un pays
- [ ] Remplir titre, date, location
- [ ] Ajouter une photo depuis galerie
- [ ] Envoyer → Succès "Événement ajouté!"
- [ ] Événement apparaît dans la liste

### ✅ Sélectionner par Catégorie
- [ ] Clic sur catégorie (ex: "Music")
- [ ] Redirige vers CategoryEventsScreen
- [ ] Événements filtrés par catégorie
- [ ] Bouton back fonctionne

### ✅ Sélectionner par Pays
- [ ] Clic sur un pays
- [ ] Redirige vers CountryEventsScreen  
- [ ] Événements du pays affichés
- [ ] Bouton back fonctionne

---

## Phase 4: Dashboard Client

### ✅ Interface Client
- [ ] Pas de bouton "＋ Add Event" (admin only)
- [ ] ❌ Bouton "Admins" supprimé (clients ne voient pas)
- [ ] Grille de catégories visible
- [ ] Événements affichés
- [ ] Bouton logout visible

### ✅ Navigation Client
- [ ] Clic sur catégorie → CategoryEventsScreen
- [ ] Clic sur pays → CountryEventsScreen
- [ ] Voir détails d'un événement → EventDetailsScreen
- [ ] Retour au dashboard fonctionne

### ✅ Détails d'Événement
- [ ] Titre de l'événement
- [ ] Date, location, catégorie affichés
- [ ] Description lisible
- [ ] Photo de l'événement visible
- [ ] Boutons de réaction/commentaires fonctionnent
- [ ] Option s'inscrire visible

---

## Phase 5: Connectivité Réseau

### ✅ Sur la Même Machine
1. Serveur: `http://192.168.1.11:3000`
2. Expo: Scanner QR depuis PC
- [ ] Connexion réussie
- [ ] Emails envoyés avec succès
- [ ] SMS/OTP reçu

### ✅ Sur Différentes Machines (Network)
1. Serveur: PC (192.168.1.x)
2. Mobile: Même WiFi
- [ ] Scanner QR sur mobile
- [ ] App se charge
- [ ] Login réussie
- [ ] Événements affichés

### ✅ Serveur Cloud (Render)
1. Changer API vers: `https://world-events-backend-ji93.onrender.com`
- [ ] App se connecte au cloud
- [ ] Données chargées
- [ ] Login fonctionne
- [ ] Événements affichés

### ✅ Sans Internet (Offline)
- [ ] App utilise données locales (fallback)
- [ ] Login fonctionne avec données locales
- [ ] Événements visibles hors ligne
- [ ] Message "réseau indisponible" optionnel

---

## Phase 6: Services Email & SMS

### ✅ Email OTP (Register/Forgot Password)
- [ ] Lors d'une inscription → Email OTP reçu
- [ ] Format email correct
- [ ] Lien de vérification fonctionne
- [ ] Nouveau compte créé

### ✅ Email Notification (Admin)
- [ ] Admin ajoute un événement
- [ ] Clients reçoivent notification email
- [ ] Email contient titre, date, location

### ✅ SMS OTP (Optional)
- [ ] Textbelt fallback fonctionne (1/jour/IP)
- [ ] SMS reçu au bon numéro
- [ ] Code OTP valide

---

## Phase 7: Bugs Spécifiques à Corriger

### ✅ Bouton "Admins" Supprimé
- [ ] **Admin**: Pas de bouton "💬 Admins"
- [ ] **Client**: Pas de bouton "💬 Admins"
- [ ] Seul "🚪 Logout" visible pour clients

### ✅ Erreurs de Login sur Mobile
- [ ] Login réussit sur mobile (Expo Go)
- [ ] Pas d'erreur "Erreur réseau"
- [ ] Dashboard charge correctement

### ✅ Service Mail Mobile
- [ ] Emails reçus sur mobile aussi
- [ ] Notifications apparaissent
- [ ] Format lisible sur petit écran

### ✅ API Mobile
- [ ] Mobile utilise CLOUD_SERVER automatiquement
- [ ] Pas de référence à `192.168.1.11`
- [ ] Fallback vers local en cas de besoin

---

## Phase 8: Performance & UX

### ✅ Animations
- [ ] Entrée/sortie d'écrans smooth
- [ ] Boutons réactifs au toucher
- [ ] Pas de freeze ou lag
- [ ] Loading indicators visibles

### ✅ Responsive Design
- [ ] App s'adapte à différentes tailles d'écran
- [ ] Texte lisible
- [ ] Boutons facilement cliquables (min 44px)
- [ ] Pas de texte coupé

### ✅ Gestion des Erreurs
- [ ] Messages d'erreur clairs
- [ ] Pas de crash lors d'erreurs réseau
- [ ] Retry buttons visibles
- [ ] Fallback local fonctionne

---

## Phase 9: Sécurité Basique

### ⚠️ À Améliorer (Production)
- [ ] Mots de passe devraient être hachés (bcrypt)
- [ ] Utiliser JWT pour l'authentification
- [ ] HTTPS pour toutes les communications
- [ ] Variables d'environnement pour secrets
- [ ] Valider toutes les entrées côté serveur

### ✅ Actuellement OK (Dev)
- [ ] CAPTCHA sur login (basique)
- [ ] Validation des emails
- [ ] Compte peut être fermé/réactivé

---

## 🎯 Résumé Final

**Avant de considérer l'app comme "100% fonctionnelle":**

1. ✅ Bouton "Admins" supprimé
2. ✅ API configurée pour mobile (CLOUD_SERVER)
3. ✅ Routes serveur corrigées (PUT → POST)
4. ✅ Gestion erreurs améliorée
5. ✅ Tous les tests ci-dessus passent
6. ✅ Pas de crash ou erreur dans la console
7. ✅ Emails & SMS fonctionnent
8. ✅ Fallback local fonctionne
9. ✅ Performance acceptable (<2s loading)
10. ✅ Responsive sur mobile

**Score de Qualité:**
- Phase 1-2: ___/100 (Auth)
- Phase 3-4: ___/100 (UI/Navigation)
- Phase 5-6: ___/100 (Network/Services)
- Phase 7-9: ___/100 (Bugs/Quality)

---

**Date du Test**: _______________
**Testeur**: _______________
**Résultat Final**: ✅ PASS / ❌ FAIL

