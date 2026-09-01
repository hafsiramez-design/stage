# ❓ FAQ - World Events

## 🔑 Authentification

### Q: Je n'arrive pas à me connecter sur le téléphone
**R**: Vérifiez:
1. Le serveur backend est démarré (`node server.js`)
2. Votre téléphone est sur le même WiFi que le serveur
3. Utilisez les identifiants de test fournis
4. Vérifiez que vous utilisez `https://world-events-backend-ji93.onrender.com` comme serveur cloud

### Q: Comment réinitialiser mon mot de passe?
**R**: 
1. Cliquez sur "Mot de passe oublié?" sur l'écran de login
2. Entrez votre email
3. Recevez le code OTP par email
4. Entrez le code et définissez un nouveau mot de passe

### Q: Où est le bouton "Admins"?
**R**: Le bouton a été supprimé par sécurité. Les clients ne peuvent plus voir les autres admins. Seuls les admins voient les autres utilisateurs sur AdminScreen.

---

## 📱 Utilisation Expo Go

### Q: Comment lancer l'app sur mon téléphone?
**R**:
1. Installez Expo Go (App Store ou Google Play)
2. Démarrez le serveur: `node server.js`
3. Lancez l'app: `npm start`
4. Scannez le QR code depuis Expo Go
5. L'app se lancera automatiquement

### Q: Pourquoi Expo Go et pas un APK/IPA?
**R**: 
- Expo Go: Développement rapide, pas de build, live reload
- APK/IPA: Production, plus optimisé, signature requise

### Q: Je vois une erreur "Network Error"
**R**:
1. Vérifiez que le serveur est démarré
2. Vérifiez que vous êtes sur le même réseau WiFi
3. Redémarrez Expo Go
4. L'app utilise automatiquement le cloud si le local échoue

---

## 📧 Email & SMS

### Q: Je ne reçois pas les emails
**R**:
1. Vérifiez votre dossier SPAM/Promotions
2. Vérifiez que le serveur est démarré
3. Vérifiez que la configuration Gmail est correcte
4. Consultez les logs du serveur: `node server.js` (vérifiez les messages)

### Q: Le SMS ne fonctionne pas
**R**:
- Textbelt (fallback): 1 SMS gratuit par jour par IP
- Pour plus, configurez Twilio (voir DEPLOY_GUIDE.md)
- Les SMS fonctionnent mieux sur le serveur PC que sur le cloud

### Q: Comment ajouter Twilio?
**R**: Voir DEPLOY_GUIDE.md section "SMS avec Twilio"

---

## 👤 Compte Admin

### Q: Comment créer un compte admin?
**R**:
1. Créez un compte client normalement
2. Modifiez directement dans `database.json`: `"role": "admin"`
3. Redémarrez le serveur
4. L'utilisateur est maintenant admin

### Q: Quels sont les pouvoirs d'un admin?
**R**:
- Ajouter des événements
- Modifier des événements
- Supprimer des événements
- Voir tous les clients
- Voir les demandes d'inscription

### Q: Je ne vois pas le bouton "Add Event"
**R**: Vous n'êtes pas connecté en tant qu'admin. Vérifiez votre rôle dans `database.json`

---

## 📍 Événements

### Q: Comment ajouter un événement?
**R** (Admin seulement):
1. Connectez-vous en tant qu'admin
2. Cliquez sur "＋ Add Event"
3. Sélectionnez un pays
4. Remplissez les détails (titre, date, lieu)
5. Ajoutez une photo optionnelle
6. Cliquez "Save Event"
7. Les clients reçoivent une notification

### Q: Comment s'inscrire à un événement?
**R** (Clients):
1. Sélectionnez un événement
2. Cliquez sur le bouton d'inscription
3. Recevez une confirmation par email
4. L'admin valide votre inscription

### Q: Pourquoi mes photos ne s'affichent pas?
**R**:
1. L'image est convertie en base64 (fonctionne local/cloud)
2. Attendez que l'upload se termine (barre de progression)
3. Vérifiez la qualité de l'image (pas trop grande)
4. Rafraîchissez l'app (swipe down)

---

## 💾 Base de Données

### Q: Où sont sauvegardées mes données?
**R**:
- Local: Fallback en mémoire (client)
- Serveur PC: `database.json`
- Cloud: Base de données Render

### Q: Comment restaurer la base de données?
**R**:
1. Supprimez `database.json`
2. Redémarrez le serveur: `node server.js`
3. Elle se recréera avec les données par défaut

### Q: Mes données persistent-elles?
**R**:
- Oui sur le serveur (`database.json`)
- Non sur le client (utilise le fallback local)
- Synchro automatique si serveur disponible

---

## 🔒 Sécurité

### Q: Mes données sont-elles sécurisées?
**R**: 
- Développement: Non (mots de passe en clair)
- Production: À améliorer (voir CHANGELOG.md)
- SSL/HTTPS recommandé pour production

### Q: Pourquoi pas de chiffrement?
**R**: C'est une démo. En production, implémenter:
- Bcrypt pour les mots de passe
- JWT pour l'authentification
- HTTPS/SSL obligatoire

### Q: Comment supprimer mon compte?
**R**:
1. Cliquez sur votre profil
2. Cherchez l'option "Supprimer le compte"
3. Confirmez la suppression
4. Votre compte est fermé

---

## 🎨 Interface Utilisateur

### Q: Comment changer le thème (clair/sombre)?
**R**:
1. Cherchez l'icône de la lune/soleil en haut à droite
2. Cliquez pour basculer entre thème clair et sombre
3. L'application se rafraîchit automatiquement

### Q: Pourquoi l'interface est en français?
**R**: C'est configuré par défaut. Support multi-langue à venir.

### Q: Puis-je modifier la taille du texte?
**R**: Actuellement non. À ajouter dans les paramètres.

---

## 🚀 Déploiement

### Q: Comment déployer sur Render?
**R**: Voir DEPLOY_GUIDE.md section "Déployer sur Render"

### Q: Peut-on faire un build APK/IPA?
**R**:
```bash
# APK (Android)
eas build --platform android

# IPA (iOS)  
eas build --platform ios
```
Nécessite EAS CLI et compte Expo

### Q: Quel est le coût?
**R**:
- Expo Go: Gratuit
- EAS Build: Payant (~$12.99/mois)
- Render: Gratuit (limité), payant pour plus

---

## 🐛 Dépannage

### Q: L'app crash au démarrage
**R**:
1. Vérifiez les logs: `npm start` 
2. Redémarrez le serveur: `node server.js`
3. Redémarrez Expo Go
4. Vérifiez la version Node.js: `node --version` (v18+)

### Q: "Module not found: expo-camera"
**R**:
```bash
npm install expo-camera expo-image-picker expo-location
```

### Q: "EADDRINUSE: address already in use :::3000"
**R**:
```bash
# Trouver le processus
lsof -i :3000  # macOS/Linux
netstat -ano | findstr :3000  # Windows

# Tuer le processus
kill -9 <PID>  # macOS/Linux
taskkill /PID <PID> /F  # Windows
```

### Q: Les images ne s'affichent pas
**R**:
1. Vérifiez que la base64 est correcte
2. Utilisez un utilitaire en ligne pour décoder
3. Vérifiez la taille de l'image
4. Recompressez si nécessaire

---

## 📞 Support Supplémentaire

### Pas de réponse à votre question?
1. Consultez la documentation Expo: https://docs.expo.dev
2. Voir les logs détaillés: `npm start --verbose`
3. Créer une issue GitHub avec:
   - Description du problème
   - Logs d'erreur
   - Étapes pour reproduire
   - Version Node.js et OS

### Avant de signaler un bug:
- [ ] Avez-vous essayé de redémarrer?
- [ ] Avez-vous vérifié les logs?
- [ ] Est-ce reproductible?
- [ ] Y a-t-il une erreur spécifique?

---

**Dernière mise à jour**: 26 Août 2026  
**Version**: 1.0.1  
**Statut**: Documentation complète ✅

