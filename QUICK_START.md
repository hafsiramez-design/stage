# 🚀 QUICK START - World Events

**Dernière mise à jour**: 26 Août 2026  
**Status**: ✅ 100% Fonctionnelle

---

## ⏱️ 5 Minutes pour Démarrer

### 1️⃣ Dépendances Installées?
```bash
# Vérifier Node.js v18+
node --version

# Installer dépendances (si pas déjà fait)
npm install
```

### 2️⃣ Démarrer le Serveur Backend
```bash
node server.js
```
✅ Vous devriez voir: `World Events Backend running on port 3000`

### 3️⃣ Démarrer l'Application Expo
```bash
npm start
```
✅ Un QR code apparaîtra dans le terminal

### 4️⃣ Lancer sur Téléphone
1. Installez **Expo Go** depuis App Store ou Google Play
2. Ouvrez Expo Go
3. Scannez le QR code
4. L'app se lancera automatiquement

### 5️⃣ Se Connecter
**Admin:**
```
Email: hafsiramez@gmail.com
Mot de passe: hafsi0123
```

**Client:**
```
Email: ramezhafsi16@gmail.com  
Mot de passe: hafsi0123
```

---

## 🎯 Ce Qui a Été Corrigé

### ✅ **1. Bouton "Admins" Supprimé**
- ❌ Avant: Clients voyaient un bouton pour voir les autres admins
- ✅ Après: Bouton complètement supprimé pour la sécurité

### ✅ **2. Mobile fonctionne sur Expo Go**
- ❌ Avant: Erreur de connexion "192.168.1.11 non accessible"
- ✅ Après: Mobile utilise automatiquement le cloud server (Render)

### ✅ **3. Service Email fonctionne**
- ❌ Avant: Erreurs lors de l'envoi d'emails
- ✅ Après: Configuration corrigée, fallback en place

### ✅ **4. Login sans erreurs**
- ❌ Avant: "Erreur s'est produite" sur mobile
- ✅ Après: Messages d'erreur clairs, gestion réseau améliorée

---

## 📱 Tester les Fonctionnalités

### Pour Admin:
```
1. Se connecter avec admin
2. Voir le bouton "＋ Add Event"
3. ❌ PAS de bouton "Admins" (bug fixé!)
4. Ajouter un événement
5. Voir tous les clients
```

### Pour Client:
```
1. Se connecter avec client
2. ❌ PAS de bouton "＋ Add Event" (admin only)
3. ❌ PAS de bouton "Admins" (bug fixé!)
4. Voir la grille des événements
5. S'inscrire à un événement
6. Cliquer sur "Logout"
```

---

## 📚 Documentation Complète

| Document | Description |
|----------|-------------|
| **DEPLOY_GUIDE.md** | Guide complet de déploiement et configuration |
| **TEST_CHECKLIST.md** | Liste complète de tests (tous les scénarios) |
| **CHANGELOG.md** | Détail de tous les changements apportés |
| **FAQ.md** | Questions fréquentes et réponses |
| **.env.example** | Configuration pour production |

---

## 🌐 Connectivité

### Développement Local:
```
PC ↔ Téléphone (même WiFi)
- Serveur: http://192.168.1.11:3000 (si PC et téléphone sur même réseau)
- App détecte automatiquement et utilise le cloud
```

### Production:
```
Cloud Server (Render):
- URL: https://world-events-backend-ji93.onrender.com
- Automatique pour tous les mobiles
```

---

## ⚡ Commandes Rapides

```bash
# Démarrer serveur
node server.js

# Démarrer Expo
npm start

# Redémarrer tout
npm install && node server.js  # Terminal 1
npm start                        # Terminal 2

# Réinitialiser la base de données
rm database.json && node server.js

# Vérifier si le serveur fonctionne
curl http://localhost:3000/api/health

# Vérifier les ports disponibles
netstat -ano | findstr LISTENING  # Windows
lsof -i -P -n | grep LISTEN      # macOS/Linux
```

---

## ❌ Problèmes Courants & Solutions

### "Cannot connect to server"
```bash
✅ Solution:
1. Vérifier que node server.js tourne
2. Vérifier le WiFi de votre téléphone
3. L'app bascule automatiquement au cloud server
```

### "Module not found"
```bash
✅ Solution:
npm install
# ou
npm install --legacy-peer-deps  # Si conflit
```

### "Port 3000 already in use"
```bash
✅ Solution (Windows):
netstat -ano | findstr :3000
taskkill /PID <PID> /F

✅ Solution (Mac/Linux):
lsof -i :3000
kill -9 <PID>
```

### "Email not received"
```bash
✅ Solutions:
1. Vérifier le dossier SPAM
2. Vérifier la console serveur pour les erreurs
3. Le serveur cloud peut avoir des délais
```

---

## 🎁 Extras

### Voir la Base de Données:
```bash
cat database.json | jq .  # Affiche formaté
```

### Ajouter un Utilisateur Test:
```json
{
  "id": "usr_test_1234",
  "email": "test@example.com",
  "username": "TestUser",
  "password": "test123",
  "role": "client",  // ou "admin"
  "status": "active"
}
```

### Mettre à Jour la Configuration API:
- Fichier: `src/config/api.js`
- Changer `CLOUD_SERVER` pour utiliser un autre serveur
- Redémarrer Expo Go

---

## 🔐 Sécurité

⚠️ **Development ONLY:**
- Mots de passe en clair ❌
- Pas de JWT ❌
- CORS ouvert ❌

✅ **À implémenter en production:**
- Bcrypt pour les mots de passe
- JWT pour l'authentification
- CORS restrictif
- HTTPS/SSL
- Chiffrement des données sensibles

---

## 📊 Checklist de Vérification

Avant de considérer l'app comme "100% fonctionnelle":

- [x] Bouton "Admins" supprimé
- [x] Mobile se connecte au serveur cloud
- [x] API routes corrigées
- [x] Gestion d'erreurs améliorée
- [x] Email fonctionne
- [x] SMS fallback fonctionne
- [x] Base locale et cloud synchro
- [x] Navigation smooth
- [x] Pas de crash
- [x] Documentation complète

---

## 📞 Besoin d'Aide?

1. **Consultez**: FAQ.md
2. **Consultez**: DEPLOY_GUIDE.md
3. **Consultez**: TEST_CHECKLIST.md
4. **Vérifiez**: Les logs du serveur (`node server.js`)
5. **Vérifiez**: La console Expo Go

---

## 🚀 Prochaines Étapes (Optionnel)

1. **Déployer sur EAS Build** (APK/IPA)
2. **Configurer Twilio** (SMS illimité)
3. **Implémenter JWT** (Sécurité)
4. **Migrer vers MongoDB** (Scalabilité)
5. **Ajouter Push Notifications** (Engagement)

---

**Bonne utilisation! 🎉**

Tout fonctionne à 100%. Profitez de votre application!

