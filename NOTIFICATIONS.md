# 📬 Système de Notifications - Taskflow Mobile

## Table des matières

1. [Vue d'ensemble](#vue-densemble)
2. [Architecture globale](#architecture-globale)
3. [Firebase Cloud Messaging (FCM)](#firebase-cloud-messaging-fcm)
4. [Notifications Locales](#notifications-locales)
5. [Types de Notifications](#types-de-notifications)
6. [Flux de Traitement](#flux-de-traitement)
7. [Configuration et Permissions](#configuration-et-permissions)
8. [Gestion des Tokens FCM](#gestion-des-tokens-fcm)
9. [Dépannage](#dépannage)

---

## Vue d'ensemble

L'application **Taskflow Mobile** dispose d'un système de notifications complet et robuste qui combine :

- **Firebase Cloud Messaging (FCM)** : Notifications push depuis le serveur backend
- **Notifications Locales** : Notifications affichées directement sur l'appareil (même quand l'app est fermée)
- **Gestion des tokens FCM** : Synchronisation automatique avec le serveur backend
- **Support multi-plateforme** : Android, iOS et Web (dégradé)

---

## Architecture globale

```
Backend Server
       |
       | (Firebase Cloud Messaging)
       |
    FCM
       |
       v
  [App Mobile]
       |
       +-- FCMNotificationService (gestion FCM)
       |        |
       |        +-- Récupération du token
       |        +-- Écoute des messages en premier plan
       |        +-- Écoute des clics sur notifications
       |        +-- Synchronisation token avec serveur
       |
       +-- NotificationService (notifications locales)
       |        |
       |        +-- Affichage notifications en premier plan
       |        +-- Gestion des canaux Android
       |        +-- Patterns de vibration
       |
       v
    [Utilisateur]
```

---

## Firebase Cloud Messaging (FCM)

### Qu'est-ce que FCM ?

Firebase Cloud Messaging est un service Google qui permet au serveur backend d'envoyer des notifications push à l'application mobile via Internet. Les messages arrivent même quand l'app est fermée ou en arrière-plan.

### Initialisation FCM

Le service FCM est initialisé dans `main.dart` lors du démarrage de l'application :

```dart
// Initialisation Firebase Core
await Firebase.initializeApp();

// Enregistrement du handler en arrière-plan
FirebaseMessaging.onBackgroundMessage(_firebaseMessagingBackgroundHandler);

// Récupération du token FCM
final fcmToken = await FirebaseMessaging.instance.getToken();
```

### Classe FCMNotificationService

**Fichier** : `lib/services/fcm_notification_service.dart`

**Singleton Pattern** : Une seule instance est créée pendant toute la durée de vie de l'app.

#### Responsabilités principales

1. **Demander les permissions** (alertes, badges, sons)
2. **Initialiser les notifications locales**
3. **Configurer les handlers FCM** :
   - Messages en premier plan
   - Clics sur notifications
   - Messages au démarrage
4. **Gérer le token FCM**
5. **Afficher les notifications locales**

#### Méthodes clés

| Méthode | Description |
|---------|-------------|
| `_initialize()` | Initialisation complète (permissions, handlers, token) |
| `getToken()` | Récupère le token FCM actuel |
| `_handleForegroundMessage()` | Gère les messages reçus quand l'app est au premier plan |
| `_handleNotificationClick()` | Gère les clics sur les notifications |
| `_saveTokenToServer()` | Sauvegarde le token sur le serveur backend |
| `_showLocalNotification()` | Affiche une notification locale |

---

## Notifications Locales

### Qu'est-ce que les notifications locales ?

Les notifications locales sont générées directement par l'application sur l'appareil. Elles ne dépendent pas d'une connexion Internet et peuvent être affichées même si l'app est fermée (via des services système).

### Classe NotificationService

**Fichier** : `lib/services/notification_service.dart`

**Singleton Pattern** : Une seule instance tout au long de la vie de l'app.

#### Canaux de Notifications Android

L'application utilise 3 canaux de notification distincts, chacun avec une priorité différente :

| Canal | ID | Importance | Cas d'usage |
|-------|---|-----------|-----------|
| **Intervention Channel** | `intervention_channel` | MAX | Nouvelles interventions urgentes |
| **Maintenance Channel** | `maintenance_channel` | MAX | Nouvelles demandes de maintenance |
| **Completion Channel** | `completion_channel` | HIGH | Interventions complétées |

#### Types de notifications locales

1. **notifyNewIntervention()**
   - Affichée quand une nouvelle intervention est créée
   - Vibrée avec pattern : `[0, 500, 250, 500]` ms
   - Emoji : 🔧

2. **notifyInterventionTaken()**
   - Affichée quand une intervention est prise en charge
   - Vibration plus courte : `[0, 300]` ms
   - Emoji : ✅

3. **notifyInterventionCompleted()**
   - Affichée à la fin d'une intervention
   - Pattern vibration : `[0, 200, 100, 200]` ms
   - Emoji : 🎉

4. **notifyNewMaintenanceRequest()**
   - Affichée pour nouvelles demandes de maintenance
   - Même pattern que les nouvelles interventions
   - Emoji : 🆕

#### Configuration des notifications

Chaque notification est configurée avec :

```dart
// Android
AndroidNotificationDetails(
  'channel_id',
  'Channel Name',
  channelDescription: 'Description',
  importance: Importance.max,      // Priorité
  priority: Priority.max,            // Priorité urgente
  enableVibration: true,             // Vibration activée
  playSound: true,                   // Son activé
  fullScreenIntent: true,            // Mode plein écran
  vibrationPattern: Int64List.fromList([...]), // Pattern vibration
);

// iOS
DarwinNotificationDetails(
  presentAlert: true,   // Afficher l'alerte
  presentBadge: true,   // Afficher le badge (nombre)
  presentSound: true,   // Jouer le son
);
```

---

## Types de Notifications

### 1. Notifications push depuis Firebase

**Origine** : Serveur backend

**Déclenchement** : 
- Nouvelle intervention assignée
- Nouvelle demande de maintenance
- Mise à jour d'une intervention

**Statut de l'app** :
- ✅ Ouverte (premier plan)
- ✅ Fermée
- ✅ Arrière-plan

**Flux** :
```
Backend → Firebase → FCM → App → Handler → Notification locale
```

### 2. Notifications locales planifiées

**Origine** : Application locale

**Déclenchement** :
- Rappels personnalisés
- Notifications de progression

**Statut de l'app** :
- ✅ Ouverte
- ✅ Fermée
- ✅ Arrière-plan

**Avantage** : Fonctionne sans Internet

### 3. Notifications de premier plan

Quand une notification FCM arrive alors que l'app est ouverte :

```dart
FirebaseMessaging.onMessage.listen(_handleForegroundMessage);
```

L'app affiche automatiquement une notification locale pour que l'utilisateur la voie (sinon elle resterait invisible).

---

## Flux de Traitement

### 🔄 Flux complet d'une notification push

```
1. SERVEUR ENVOIE
   Backend → Firebase Cloud Messaging
   {
     "notification": {
       "title": "Nouvelle intervention",
       "body": "Machine M01 - Défaut détecté"
     },
     "data": {
       "type": "new_intervention",
       "interventionId": "123"
     }
   }

2. FCM ROUTE
   ├─ App OUVERTE (premier plan)
   │  └─ _handleForegroundMessage() [fcm_notification_service.dart]
   │     └─ _showLocalNotification()
   │
   ├─ App FERMÉE ou ARRIÈRE-PLAN
   │  └─ _firebaseMessagingBackgroundHandler() [main.dart]
   │     └─ _showBackgroundNotification()
   │
   └─ Utilisateur clique
      └─ _handleNotificationClick() [fcm_notification_service.dart]
         └─ Navigation selon le type

3. AFFICHAGE
   ├─ Android
   │  └─ Notification plein écran avec vibration
   │
   └─ iOS
      └─ Alert + Badge + Son
```

### 🔄 Flux de gestion des tokens FCM

```
1. AU DÉMARRAGE
   App démarre → _initialize() [FCMNotificationService]
   ├─ Firebase.initializeApp()
   ├─ RequestPermission()
   └─ _handleTokenRefresh(null)
      ├─ Récupérer token → FirebaseMessaging.instance.getToken()
      ├─ Sauvegarder localement → SharedPreferences
      └─ Sauvegarder au serveur → POST /api/users/fcm-token

2. RENOUVELLEMENT AUTOMATIQUE
   Token FCM renouvelé (tous les ~30 jours)
   ├─ onTokenRefresh écouté
   └─ _handleTokenRefresh(newToken)
      ├─ Vérifier si différent de l'ancien
      ├─ Sauvegarder localement
      └─ Envoyer au serveur

3. SERVEUR UTILISE LE TOKEN
   Backend stocke tokens des utilisateurs
   └─ Quand envoyer une notification
      └─ Utilise le token FCM pour cibler l'appareil
```

---

## Configuration et Permissions

### Fichier de configuration Android

**Emplacement** : `android/app/build.gradle`

```gradle
dependencies {
    // Firebase
    implementation 'com.google.firebase:firebase-messaging'
}
```

### Fichier AndroidManifest.xml

**Permissions requises** :

```xml
<!-- Permissions pour les notifications -->
<uses-permission android:name="android.permission.POST_NOTIFICATIONS" />
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.VIBRATE" />
<uses-permission android:name="android.permission.RECEIVE_BOOT_COMPLETED" />

<!-- Service FCM en arrière-plan -->
<service
    android:name="com.google.firebase.messaging.FirebaseMessagingService"
    android:exported="false">
    <intent-filter>
        <action android:name="com.google.firebase.MESSAGING_EVENT" />
    </intent-filter>
</service>
```

### Permissions iOS

**Fichier** : `ios/Runner/Info.plist`

```xml
<key>NSUserNotificationAlertOption</key>
<string>alert</string>
```

L'app demande les permissions à l'utilisateur au premier démarrage.

---

## Gestion des Tokens FCM

### Qu'est-ce qu'un token FCM ?

Un token FCM est une **clé d'identification unique** pour chaque appareil qui reçoit les notifications. Le serveur backend l'utilise pour cibler l'appareil lors de l'envoi d'une notification.

```
Token FCM Example:
f5B7...9aZ (150+ caractères)
```

### Cycle de vie du token

```
┌─ APP LANCÉE
│  └─ Récupérer token FCM
│     └─ Sauvegarder en local (SharedPreferences)
│        └─ Envoyer au serveur (POST /api/users/fcm-token)
│           └─ Backend stocke dans BDD
│
└─ Token renouvelé (tous les ~30 jours)
   └─ Event onTokenRefresh déclenché
      └─ Répéter les étapes ci-dessus
```

### Sauvegarde sur le serveur

**Endpoint** : `POST /api/users/fcm-token`

**Headers** :
```
Authorization: Bearer {authToken}
Content-Type: application/json
```

**Body** :
```json
{
  "fcm_token": "f5B7...9aZ"
}
```

**Réponse succès** :
```json
{
  "success": true,
  "message": "Token sauvegardé"
}
```

### Debugging - Où voir le token ?

```dart
// Dans FCMNotificationService
String? token = await FirebaseMessaging.instance.getToken();
print('📱 Token FCM: $token');

// Dans SharedPreferences
final prefs = await SharedPreferences.getInstance();
final savedToken = prefs.getString('fcm_token');
print('💾 Token sauvegardé: $savedToken');
```

---

## Dépannage

### ❌ Les notifications ne s'affichent pas

#### Checklist Android

1. **Permissions**
   ```dart
   // Vérifier dans FCMNotificationService._initialize()
   if (settings.authorizationStatus == AuthorizationStatus.authorized) {
     // ✅ Permissions accordées
   } else {
     // ❌ Permissions refusées
   }
   ```

2. **Firebase initialisé**
   - Vérifier `firebase_core` dans `pubspec.yaml`
   - Vérifier configuration Firebase Console

3. **Token récupéré**
   ```dart
   String? token = await FirebaseMessaging.instance.getToken();
   if (token == null) {
     // ❌ Problème de configuration
   }
   ```

4. **Service en arrière-plan**
   - Vérifier `FirebaseMessagingService` dans AndroidManifest.xml
   - Handler enregistré : `FirebaseMessaging.onBackgroundMessage(...)`

5. **Canaux Android (API 26+)**
   - Les canaux doivent être créés avec `flutter_local_notifications`
   - C'est fait automatiquement dans l'initialisation

#### Checklist iOS

1. **APNs Certificate**
   - Configurer dans Firebase Console
   - Certificat Apple valide

2. **Permissions**
   ```swift
   // iOS demande les permissions automatiquement
   // ou via Info.plist
   ```

3. **Entitlements**
   - `aps-environment: production` en Info.plist

### ⚠️ Token FCM non enregistré au serveur

**Symptômes** : 
- L'app reçoit les notifications locales
- Mais le backend ne peut pas envoyer de push

**Solutions** :

1. Vérifier la connexion Internet
2. Vérifier le token d'authentification (authToken)
3. Vérifier l'URL du serveur dans ApiService
4. Vérifier les logs :
   ```dart
   // Dans _saveTokenToServer()
   print('✅ Token FCM sauvegardé au serveur');
   print('⚠️ Erreur sauvegarde token serveur: ${responseBody['message']}');
   ```

### 📱 Tester les notifications localement

```dart
// Depuis un autre service ou l'écran de test
NotificationService notificationService = NotificationService();

await notificationService.notifyNewIntervention(
  interventionId: 1,
  machineCode: 'M01',
  defectDescription: 'Test notification',
);
```

### 🔧 Debugging avec Logger

Tous les services utilisent `logger` pour tracer les événements :

```
✅ Permissions notifications accordées
✅ Notifications locales initialisées
✅ FCM complètement initialisé
📱 Token FCM récupéré: abc123...
💾 Token sauvegardé localement
✅ Token FCM sauvegardé au serveur
📬 Message premier plan reçu
👆 Notification cliquée
```

---

## Intégration avec le Backend

### Endpoint pour envoyer une notification

Le backend doit utiliser Firebase Admin SDK pour envoyer :

```javascript
// Exemple Node.js
const admin = require('firebase-admin');

admin.messaging().send({
  notification: {
    title: 'Nouvelle intervention',
    body: 'Machine M01 - Défaut détecté'
  },
  data: {
    type: 'new_intervention',
    interventionId: '123'
  },
  token: userFCMToken // Token récupéré depuis BDD
});
```

### Stockage des tokens dans la BDD

Le backend doit maintenir une table `user_fcm_tokens` ou similaire :

```
users
├─ id
├─ email
├─ fcm_token (ou fcm_tokens array)
└─ last_token_update
```

Quand un token est reçu via `POST /api/users/fcm-token` :
- Le vérifier
- Le sauvegarder
- Invalider l'ancien si différent

---

## Summary / Résumé

| Aspect | Détail |
|--------|--------|
| **FCM** | Notifications push depuis le serveur (via Firebase) |
| **Notifications Locales** | Affichage sur l'appareil + arrière-plan |
| **Token FCM** | Clé unique par appareil, renouvelé tous les ~30 jours |
| **Canaux Android** | 3 canaux (intervention, maintenance, completion) |
| **Permissions** | POST_NOTIFICATIONS, INTERNET, VIBRATE |
| **Vibration** | Patterns différents selon le type de notification |
| **iOS/Android** | Support complet, configurations appropriées pour chaque |
| **Arrière-plan** | Handler enregistré + notifications locales en async |

---

**Dernière mise à jour** : 28/02/2026
**Version** : 1.0.0
