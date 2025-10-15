"""
Correction pour l'authentification OAuth2 Gmail dans votre backend Flask
Remplacez les fonctions concernées par celles-ci
"""

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
    Connexion IMAP avec support OAuth2 (Gmail) et password (Ionos, Hostinger)
    VERSION CORRIGÉE
    """
    # Vos fonctions get_imap_server() et get_imap_port() existantes
    from __main__ import get_imap_server, get_imap_port

    server = get_imap_server(email_address, imap_server, provider)
    port = get_imap_port(provider, imap_port)

    logger.info(f"Connexion à {server}:{port} pour {email_address}")

    mail = imaplib.IMAP4_SSL(server, port)

    # Authentification OAuth2 (Gmail)
    if oauth_token:
        logger.info(f"Authentification OAuth2 pour {email_address}")
        try:
            # Méthode correcte pour OAuth2 avec imaplib
            auth_string = generate_oauth2_string(email_address, oauth_token)

            # Encoder en base64
            auth_string_b64 = base64.b64encode(auth_string.encode('ascii')).decode('ascii')

            # Utiliser la commande AUTHENTICATE directement
            mail.authenticate('XOAUTH2', lambda x: auth_string_b64)

            logger.info(f"Authentification OAuth2 réussie pour {email_address}")

        except imaplib.IMAP4.error as e:
            error_msg = str(e)
            logger.error(f"Erreur d'authentification OAuth2: {error_msg}")

            # Si l'erreur contient des informations sur le token expiré
            if 'AUTHENTICATE' in error_msg or 'SASL' in error_msg:
                raise ValueError(f"Token OAuth2 invalide ou expiré. Veuillez rafraîchir le token. Erreur: {error_msg}")
            raise

    # Authentification classique (Ionos, Hostinger)
    elif password:
        logger.info(f"Authentification par mot de passe pour {email_address}")
        mail.login(email_address, password)

    else:
        raise ValueError("Ni password ni oauth_token fourni")

    return mail


# ALTERNATIVE: Si la méthode ci-dessus ne fonctionne toujours pas,
# utilisez cette version avec la commande IMAP brute

def connect_imap_alternative(email_address, password=None, oauth_token=None, imap_server=None, imap_port=None, provider=None):
    """
    Version alternative avec commande IMAP brute
    """
    from __main__ import get_imap_server, get_imap_port

    server = get_imap_server(email_address, imap_server, provider)
    port = get_imap_port(provider, imap_port)

    logger.info(f"Connexion à {server}:{port} pour {email_address}")

    mail = imaplib.IMAP4_SSL(server, port)

    if oauth_token:
        logger.info(f"Authentification OAuth2 pour {email_address}")
        try:
            # Générer la chaîne d'authentification
            auth_string = f'user={email_address}\x01auth=Bearer {oauth_token}\x01\x01'
            auth_string_b64 = base64.b64encode(auth_string.encode('ascii')).decode('ascii')

            # Envoyer la commande AUTHENTICATE manuellement
            typ, dat = mail._simple_command('AUTHENTICATE', 'XOAUTH2', auth_string_b64)

            if typ != 'OK':
                # Essayer de récupérer plus d'infos sur l'erreur
                raise imaplib.IMAP4.error(f"Authentication failed: {dat}")

            # Compléter l'authentification
            typ, dat = mail._get_response()
            if typ != 'OK':
                raise imaplib.IMAP4.error(f"Authentication failed: {dat}")

            logger.info(f"Authentification OAuth2 réussie pour {email_address}")

        except Exception as e:
            error_msg = str(e)
            logger.error(f"Erreur d'authentification OAuth2: {error_msg}")
            raise ValueError(f"Token OAuth2 invalide ou expiré. Erreur: {error_msg}")

    elif password:
        logger.info(f"Authentification par mot de passe pour {email_address}")
        mail.login(email_address, password)

    else:
        raise ValueError("Ni password ni oauth_token fourni")

    return mail
