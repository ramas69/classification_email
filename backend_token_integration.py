"""
Intégration avec l'Edge Function Supabase pour récupérer automatiquement
un token Gmail valide depuis votre backend Flask

Ajoutez ces fonctions à votre backend
"""

import requests
import os
import logging

logger = logging.getLogger(__name__)

# Configuration Supabase
SUPABASE_URL = os.getenv('SUPABASE_URL', 'https://0ec90b57d6e95fcbda19832f.supabase.co')
SUPABASE_ANON_KEY = os.getenv('SUPABASE_ANON_KEY', 'votre_anon_key')

def get_valid_gmail_token(user_jwt_token):
    """
    Récupère un token Gmail valide depuis l'Edge Function Supabase
    Le token sera automatiquement rafraîchi s'il est expiré

    Args:
        user_jwt_token: Le JWT token de l'utilisateur Supabase

    Returns:
        dict: {
            'access_token': str,
            'email': str,
            'token_expiry': str,
            'expires_in_seconds': int,
            'was_refreshed': bool
        }
    """
    try:
        url = f"{SUPABASE_URL}/functions/v1/get-gmail-token"

        headers = {
            'Authorization': f'Bearer {user_jwt_token}',
            'apikey': SUPABASE_ANON_KEY,
            'Content-Type': 'application/json'
        }

        logger.info(f"Récupération du token Gmail depuis {url}")

        response = requests.post(url, headers=headers, timeout=10)

        if response.status_code == 404:
            raise ValueError("Aucun compte Gmail connecté. L'utilisateur doit d'abord connecter son compte Gmail.")

        if response.status_code != 200:
            error_data = response.json() if response.headers.get('content-type') == 'application/json' else {}
            error_msg = error_data.get('error', f'HTTP {response.status_code}')
            raise ValueError(f"Erreur lors de la récupération du token: {error_msg}")

        token_data = response.json()

        logger.info(f"Token Gmail récupéré avec succès. Expire dans {token_data.get('expires_in_seconds')} secondes")

        if token_data.get('was_refreshed'):
            logger.info("Le token a été rafraîchi automatiquement")

        return token_data

    except requests.exceptions.RequestException as e:
        logger.error(f"Erreur réseau lors de la récupération du token: {e}")
        raise ValueError(f"Impossible de contacter le serveur d'authentification: {str(e)}")


# EXEMPLE D'UTILISATION DANS VOS ENDPOINTS

from flask import Flask, request, jsonify

app = Flask(__name__)

@app.route('/poll-emails', methods=['POST'])
def poll_emails_with_auto_token():
    """
    Version améliorée de poll-emails qui récupère automatiquement
    un token Gmail valide si nécessaire
    """
    data = request.json

    if not data or 'email' not in data:
        return jsonify({"error": "Missing email"}), 400

    email_address = data['email']
    password = data.get('password')
    oauth_token = data.get('oauthToken') or data.get('oauth_token')
    provider = data.get('provider', '').lower() or None
    user_jwt = data.get('userJwt')  # JWT de l'utilisateur Supabase

    # Si c'est Gmail et qu'un JWT utilisateur est fourni, récupérer un token frais
    if provider == 'gmail' and user_jwt and not oauth_token:
        try:
            token_data = get_valid_gmail_token(user_jwt)
            oauth_token = token_data['access_token']
            logger.info(f"Token Gmail auto-récupéré pour {email_address}")
        except Exception as e:
            logger.error(f"Erreur récupération auto du token: {e}")
            return jsonify({"error": str(e)}), 401

    # Si c'est Gmail et qu'un token est fourni SANS JWT,
    # on l'utilise mais on avertit qu'il peut expirer
    if provider == 'gmail' and oauth_token and not user_jwt:
        logger.warning("Token Gmail fourni sans JWT. Le token peut expirer.")

    if not password and not oauth_token:
        return jsonify({"error": "Missing password, oauthToken, or userJwt"}), 400

    try:
        # Utiliser votre fonction connect_imap existante
        from __main__ import connect_imap

        mail = connect_imap(
            email_address=email_address,
            password=password,
            oauth_token=oauth_token,
            imap_server=data.get('imapServer'),
            imap_port=data.get('imapPort'),
            provider=provider
        )

        mail.select('INBOX')

        status, messages = mail.search(None, 'UNSEEN')
        if status != 'OK' or not messages[0]:
            mail.logout()
            return jsonify({"status": "success", "count": 0, "emails": []})

        # ... reste de votre code existant ...

        mail.logout()
        return jsonify({"status": "success", "count": 0, "emails": []})

    except Exception as e:
        logger.error(f"Erreur connexion: {e}")
        return jsonify({"error": str(e)}), 500


@app.route('/get-gmail-token', methods=['POST'])
def get_gmail_token_endpoint():
    """
    Endpoint pour récupérer un token Gmail valide
    Peut être appelé par N8N ou d'autres services

    Body:
    {
        "userJwt": "eyJhbGc..."  // JWT token de l'utilisateur Supabase
    }

    Returns:
    {
        "access_token": "ya29.a0...",
        "email": "user@gmail.com",
        "token_expiry": "2025-10-15T12:00:00Z",
        "expires_in_seconds": 3600
    }
    """
    data = request.json

    if not data or 'userJwt' not in data:
        return jsonify({"error": "Missing userJwt"}), 400

    try:
        token_data = get_valid_gmail_token(data['userJwt'])
        return jsonify(token_data)

    except Exception as e:
        logger.error(f"Erreur: {e}")
        return jsonify({"error": str(e)}), 500


if __name__ == '__main__':
    print("\n" + "="*60)
    print("IMPORTANT: Configuration requise")
    print("="*60)
    print("Variables d'environnement nécessaires:")
    print(f"  SUPABASE_URL={SUPABASE_URL}")
    print(f"  SUPABASE_ANON_KEY={'*' * 20 if SUPABASE_ANON_KEY else 'NON DÉFINIE'}")
    print("\nPour utiliser l'auto-refresh des tokens Gmail:")
    print("  1. Déployez l'Edge Function 'get-gmail-token'")
    print("  2. Ajoutez 'userJwt' dans vos requêtes pour Gmail")
    print("  3. Le token sera automatiquement rafraîchi si nécessaire")
    print("="*60 + "\n")
