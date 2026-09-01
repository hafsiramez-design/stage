# 📱 World Events - Guide de Déploiement & Expo Go

## ✅ Corrections Appliquées

### 1. **Bouton "Admins" Supprimé** ✓
   - Les clients ne voient plus le bouton pour consulter les autres admins
   - Seul le bouton de logout reste visible

### 2. **Configuration API Optimisée pour Mobile** ✓
   - **PC/Web**: Utilise `http://localhost:3000`
   - **Expo Go (Mobile)**: Utilise automatiquement le serveur cloud `https://world-events-backend-ji93.onrender.com`
   - Fallback vers la base de données locale en cas de problème réseau

### 3. **Routes Serveur Corrigées** ✓
   - Route de mise à jour de mot de passe: `POST /api/users/password-by-email` (au lieu de PUT)
   - Gestion des erreurs améliorée pour login et register
   - Validation des entrées serveur renforcée

---

## 🚀 Déploiement sur Expo Go (Mobile)

### Pré-requis:
1. Node.js v18+ installé
2. Expo CLI: `npm install -g expo-cli`
3. Application Expo Go sur votre téléphone (iOS/Android)

### Étapes:

#### 1️⃣ **Démarrer le serveur backend**
```bash
cd c:\Users\DELL\Desktop\stage
node server.js
```
Vous devriez voir:
```
World Events Backend running on port 3000
Database: 2 users, 53 events, 0 subscriptions
```

#### 2️⃣ **Démarrer Expo en local**
```bash
npm start
# ou
expo start
```

#### 3️⃣ **Connecter depuis Expo Go**
- Scannez le QR code avec votre téléphone
- L'app se lancera automatiquement sur Expo Go

#### 4️⃣ **Tester les Fonctionnalités**
**Identifiants de Test:**
- **Admin**: 
  - Email: `hafsiramez@gmail.com`
  - Mot de passe: `hafsi0123`
  
- **Client**: 
  - Email: `ramezhafsi16@gmail.com`
  - Mot de passe: `hafsi0123`

---

## 🔧 Configuration Cloud (Render)

Si le serveur Render n'est pas disponible, suivez ces étapes:

### Déployer sur Render:
1. Créez un compte sur https://render.com
2. Créez un nouveau "Web Service"
3. Connectez votre repo GitHub
4. Configuration:
   - **Build**: `npm install`
   - **Start**: `node server.js`
5. Les variables d'environnement seront héritées automatiquement

**URL Cloud actuelle**: `https://world-events-backend-ji93.onrender.com`

---

## 📧 Configuration Email (SMTP)

L'application utilise **Gmail** pour envoyer les emails. Les emails sont configurés dans `server.js`:

```javascript
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: { 
    user: 'hafsiramez@gmail.com', 
    pass: 'ptqc udoj mkyw fvyv' // App password
  }
});
```

**⚠️ Important**: Pour une production réelle, utilisez des variables d'environnement!

---

## 📱 SMS avec Twilio (Optional)

**État Actuel**: La configuration Twilio n'est pas complète, mais l'app utilise un **fallback automatique** avec **Textbelt** (1 SMS gratuit par jour par IP).

Pour activer Twilio en production:

1. Créez un compte sur https://www.twilio.com
2. Récupérez:
   - Account SID (commence par "AC")
   - Auth Token
   - Verify Service SID (créez un service, commence par "VA")
3. Mettez à jour `src/config/twilio.js`:
```javascript
export const TWILIO_CONFIG = {
  ACCOUNT_SID:  'ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
  AUTH_TOKEN:   'votre_token_ici',
  SERVICE_SID:  'VAxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
};
```

---

## 🐛 Dépannage

### ❌ "Une erreur s'est produite lors de la connexion"
**Solution**: Vérifiez que:
1. Le serveur backend est démarré (`node server.js`)
2. L'application mobile et le serveur sont sur la même réseau
3. Utilisez le serveur cloud si sur un réseau différent

### ❌ "Email non reçu"
**Solution**:
1. Vérifiez la configuration Gmail
2. Les emails sont peut-être en spam
3. Sur Textbelt, le quota gratuit est de 1 SMS/IP/jour

### ❌ "Impossible de sélectionner une photo"
**Solution**: Accordez les permissions:
- iOS: Settings → Privacy → Photos
- Android: Settings → Apps → Permissions → Camera/Storage

### ❌ "Le service SMS ne fonctionne pas"
**Solution**: 
- Sur développement local, le SMS fonctionne seulement sur PC (pas de services mobiles)
- Configurez Twilio pour un usage en production
- Textbelt (fallback) : 1 essai gratuit par jour

---

## ✨ Nouvelles Fonctionnalités Activées

✅ **Admin Dashboard**: Seuls les admins peuvent ajouter des événements  
✅ **Clients**: Voient uniquement la liste des événements, pas les autres admins  
✅ **API Cloud**: Mobile se connecte automatiquement au serveur Render  
✅ **Erreurs Améliorées**: Messages d'erreur plus clairs  
✅ **Fallback Local**: Si le serveur est down, utilise les données locales  

---

## 📝 Notes Importantes

1. **Expo Go vs Build APK/IPA**:
   - Expo Go (développement): Simple et rapide
   - APK/IPA (production): Nécessite `expo build` ou EAS Build

2. **Base de Données**:
   - Local: SQLite sur le téléphone
   - Serveur: JSON file (`database.json`)
   - Synchronisation: Les données du serveur priment

3. **Sécurité**:
   - Les mots de passe ne sont PAS chiffrés (développement seulement)
   - Pour production, implémentez bcrypt ou similar
   - N'utilisez jamais les vraies credentials en public

---

## 🎯 Checklist Avant Production

- [ ] Configurer des vraies variables d'environnement (.env)
- [ ] Configurer Twilio pour les SMS illimités
- [ ] Chiffrer les mots de passe (bcrypt)
- [ ] Ajouter la validation des entrées côté serveur
- [ ] Configurer CORS correctement
- [ ] Ajouter l'authentification JWT
- [ ] Faire un vrai test utilisateur complet
- [ ] Configurer HTTPS/SSL
- [ ] Sauvegarder les données en base de données (MongoDB/PostgreSQL)

---

**Besoin d'aide?** Consultez la documentation Expo: https://docs.expo.dev/

