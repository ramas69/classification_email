# Fix pour l'erreur SASL OAuth2 Gmail

## 🔴 Problème

Vous recevez cette erreur lors de l'utilisation du token OAuth2 Gmail avec IMAP :
```
{"error":"AUTHENTICATE command error: BAD [b'Invalid SASL argument. cdcc0902adbc2-3b17b3c8a9emb2890492d76']"}
```

## 🎯 Causes principales

1. **Token expiré** : Les access tokens OAuth2 Gmail expirent après ~1 heure
2. **Mauvais format OAuth2** : La chaîne d'authentification XOAUTH2 est mal formée
3. **Mauvaise utilisation de `imaplib`** : La méthode `authenticate()` n'est pas correctement appelée

## ✅ Solution en 3 étapes

### Étape 1 : Corriger la fonction d'authentification OAuth2

Dans votre backend Flask, **remplacez** la fonction `connect_imap` par :

```python
import imaplib
import base64
import logging

logger = logging.getLogger(__name__)

def generate_oauth2_string(user, access_token):
    """Génère la chaîne d'authentification OAuth2 pour IMAP"""
    auth_string = f'user={user}\x01auth=Bearer {access_token}\x01\x01'
    return auth_string

def connect_imap(email_address, password=None, oauth_token=None, imap_server=None, imap_port=None, provider=None):
    """
    Connexion IMAP avec support OAuth2 (Gmail) et password
    VERSION CORRIGÉE
    """
    server = get_imap_server(email_address, imap_server, provider)
    port = get_imap_port(provider, imap_port)

    logger.info(f"Connexion à {server}:{port} pour {email_address}")

    mail = imaplib.IMAP4_SSL(server, port)

    # Authentification OAuth2 (Gmail)
    if oauth_token:
        logger.info(f"Authentification OAuth2 pour {email_address}")
        try:
            # Générer et encoder la chaîne d'authentification
            auth_string = generate_oauth2_string(email_address, oauth_token)
            auth_string_b64 = base64.b64encode(auth_string.encode('ascii')).decode('ascii')

            # Utiliser la commande AUTHENTICATE
            mail.authenticate('XOAUTH2', lambda x: auth_string_b64)

            logger.info(f"✅ Authentification OAuth2 réussie")

        except imaplib.IMAP4.error as e:
            error_msg = str(e)
            logger.error(f"❌ Erreur OAuth2: {error_msg}")

            if 'AUTHENTICATE' in error_msg or 'SASL' in error_msg:
                raise ValueError(f"Token OAuth2 invalide ou expiré. Rafraîchissez le token.")
            raise

    # Authentification classique
    elif password:
        logger.info(f"Authentification par mot de passe")
        mail.login(email_address, password)

    else:
        raise ValueError("Ni password ni oauth_token fourni")

    return mail
```

### Étape 2 : Toujours utiliser un token frais

**Option A : Depuis le frontend (N8N, autre)**

Avant chaque appel à votre backend Flask, récupérez un token frais depuis l'Edge Function :

```javascript
// Dans N8N ou votre frontend
const tokenResponse = await fetch(
  'https://0ec90b57d6e95fcbda19832f.supabase.co/functions/v1/get-gmail-token',
  {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${userJwtToken}`,
      'apikey': 'votre_supabase_anon_key',
      'Content-Type': 'application/json'
    }
  }
);

const { access_token, email } = await tokenResponse.json();

// Utiliser ce token FRAIS dans votre appel Flask
const response = await fetch('http://votre-backend:5000/poll-emails', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: email,
    oauthToken: access_token,  // ✅ Token frais
    provider: 'gmail'
  })
});
```

**Option B : Auto-refresh dans le backend Flask**

Ajoutez cette fonction dans votre backend :

```python
import requests
import os

SUPABASE_URL = os.getenv('SUPABASE_URL', 'https://0ec90b57d6e95fcbda19832f.supabase.co')
SUPABASE_ANON_KEY = os.getenv('SUPABASE_ANON_KEY')

def get_valid_gmail_token(user_jwt_token):
    """Récupère automatiquement un token Gmail valide"""
    url = f"{SUPABASE_URL}/functions/v1/get-gmail-token"

    response = requests.post(
        url,
        headers={
            'Authorization': f'Bearer {user_jwt_token}',
            'apikey': SUPABASE_ANON_KEY,
            'Content-Type': 'application/json'
        },
        timeout=10
    )

    if response.status_code != 200:
        raise ValueError(f"Erreur token: {response.json().get('error')}")

    return response.json()

# Modifier poll-emails pour utiliser cette fonction
@app.route('/poll-emails', methods=['POST'])
def poll_emails():
    data = request.json
    email_address = data['email']
    provider = data.get('provider', '').lower()
    user_jwt = data.get('userJwt')  # Nouveau champ

    # Auto-récupération du token pour Gmail
    if provider == 'gmail' and user_jwt:
        token_data = get_valid_gmail_token(user_jwt)
        oauth_token = token_data['access_token']
    else:
        oauth_token = data.get('oauthToken')

    # ... reste du code
```

### Étape 3 : Déployer l'Edge Function

L'Edge Function `get-gmail-token` doit être déployée sur Supabase :

1. **Via Supabase Dashboard** :
   - Allez dans Edge Functions
   - Créez une nouvelle fonction nommée `get-gmail-token`
   - Copiez le contenu de `/supabase/functions/get-gmail-token/index.ts`
   - Déployez

2. **Vérifier le déploiement** :
```bash
curl -X POST \
  'https://0ec90b57d6e95fcbda19832f.supabase.co/functions/v1/get-gmail-token' \
  -H 'Authorization: Bearer VOTRE_JWT' \
  -H 'apikey: VOTRE_ANON_KEY'
```

## 🔧 Configuration N8N

Si vous utilisez N8N, créez ce workflow :

1. **Nœud HTTP Request 1** : Récupérer le token
   - URL : `https://votre-supabase.co/functions/v1/get-gmail-token`
   - Méthode : POST
   - Headers :
     - `Authorization: Bearer {{$node["Auth"].json["jwt"]}}`
     - `apikey: votre_anon_key`

2. **Nœud HTTP Request 2** : Appeler votre backend
   - URL : `http://votre-backend:5000/poll-emails`
   - Méthode : POST
   - Body :
```json
{
  "email": "{{$node["Get Token"].json["email"]}}",
  "oauthToken": "{{$node["Get Token"].json["access_token"]}}",
  "provider": "gmail"
}
```

## 🧪 Test de débogage

Ajoutez cet endpoint à votre backend Flask pour déboguer :

```python
@app.route('/test-gmail-oauth', methods=['POST'])
def test_gmail_oauth():
    """Test détaillé de l'authentification Gmail OAuth2"""
    data = request.json
    email_address = data['email']
    oauth_token = data['oauthToken']

    logger.info(f"🔍 Test OAuth2 pour {email_address}")
    logger.info(f"📝 Token (premiers 20 chars): {oauth_token[:20]}...")

    try:
        # Tester la connexion
        mail = imaplib.IMAP4_SSL('imap.gmail.com', 993)

        auth_string = f'user={email_address}\x01auth=Bearer {oauth_token}\x01\x01'
        auth_string_b64 = base64.b64encode(auth_string.encode('ascii')).decode('ascii')

        logger.info("📤 Envoi de la commande AUTHENTICATE...")
        mail.authenticate('XOAUTH2', lambda x: auth_string_b64)

        logger.info("✅ Authentification réussie!")

        # Tester la sélection de boîte
        mail.select('INBOX')
        status, messages = mail.search(None, 'ALL')

        logger.info(f"📧 Nombre de messages: {len(messages[0].split()) if messages[0] else 0}")

        mail.logout()

        return jsonify({
            "status": "success",
            "message": "Authentification OAuth2 réussie",
            "mailbox_accessible": True
        })

    except Exception as e:
        logger.error(f"❌ Erreur: {str(e)}")
        return jsonify({
            "status": "error",
            "error": str(e),
            "suggestions": [
                "Vérifiez que le token n'est pas expiré",
                "Assurez-vous d'avoir activé l'API Gmail",
                "Vérifiez les scopes OAuth2 (https://mail.google.com/ requis)"
            ]
        }), 500
```

## 📋 Checklist de dépannage

- [ ] Le token est récupéré depuis l'Edge Function (pas depuis le cache)
- [ ] L'Edge Function `get-gmail-token` est déployée
- [ ] Les scopes OAuth2 incluent `https://mail.google.com/`
- [ ] Le `access_type=offline` et `prompt=consent` sont dans l'URL OAuth initiale
- [ ] Le refresh token existe dans la base de données
- [ ] Les variables d'environnement `GOOGLE_CLIENT_ID` et `GOOGLE_CLIENT_SECRET` sont définies
- [ ] La fonction `generate_oauth2_string` utilise `\x01` (pas `\\x01`)
- [ ] Le token est encodé en base64 ASCII

## 🎓 Comprendre le problème

Les tokens OAuth2 ont deux parties :
- **Access Token** : Valide 1 heure, utilisé pour l'authentification
- **Refresh Token** : Valide longtemps, utilisé pour obtenir un nouveau Access Token

❌ **Avant** : Vous utilisiez un Access Token qui expirait
✅ **Après** : L'Edge Function rafraîchit automatiquement l'Access Token si besoin

## 📞 Support

Si l'erreur persiste :
1. Vérifiez les logs de l'Edge Function dans Supabase Dashboard
2. Testez avec `curl` la récupération du token
3. Vérifiez que le refresh_token existe en base
4. Reconnectez votre compte Gmail pour obtenir un nouveau refresh_token
