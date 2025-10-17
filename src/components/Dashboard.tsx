import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { LogOut, Settings as SettingsIcon, Mail } from 'lucide-react';
import { Settings } from './Settings';
import { EmailConfigurations } from './EmailConfigurations';
import { CompanyInfoForm } from './CompanyInfoForm';
import { ConfirmationModal } from './ConfirmationModal';
import { supabase } from '../lib/supabase';

type ActiveView = 'home' | 'settings' | 'email-configs' | 'company-info';

export function Dashboard() {
  const { user, signOut } = useAuth();
  const [activeView, setActiveView] = useState<ActiveView>('home');
  const [gmailConnected, setGmailConnected] = useState(false);
  const [gmailEmail, setGmailEmail] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [showCompanyForm, setShowCompanyForm] = useState(false);
  const [showDisconnectModal, setShowDisconnectModal] = useState(false);

  useEffect(() => {
    checkGmailConnection();

    const handleMessage = async (event: MessageEvent) => {
      if (event.data.type === 'gmail-connected') {
        setIsConnecting(false);
        window.location.reload();
      } else if (event.data.type === 'outlook-connected') {
        setIsConnecting(false);
        window.location.reload();
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const checkGmailConnection = async () => {
    const { data } = await supabase
      .from('gmail_tokens')
      .select('email')
      .eq('user_id', user?.id)
      .maybeSingle();

    if (data) {
      setGmailConnected(true);
      setGmailEmail(data.email);
      await checkCompanyInfo();
    }
  };

  const checkCompanyInfo = async () => {
    const { data } = await supabase
      .from('email_configurations')
      .select('company_name, activity_description, services_offered')
      .eq('user_id', user?.id)
      .eq('provider', 'gmail')
      .maybeSingle();

    const hasCompanyInfo = data?.company_name || data?.activity_description || data?.services_offered;
    setShowCompanyForm(!hasCompanyInfo);
  };

  const connectGmail = async () => {
    setIsConnecting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/gmail-oauth-init`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session?.access_token}`,
            'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            redirectUrl: window.location.origin,
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to initiate Gmail connection');
      }

      const { authUrl } = await response.json();

      const width = 600;
      const height = 700;
      const left = window.screen.width / 2 - width / 2;
      const top = window.screen.height / 2 - height / 2;

      const popup = window.open(
        authUrl,
        'Gmail OAuth',
        `width=${width},height=${height},left=${left},top=${top}`
      );

      const checkPopup = setInterval(() => {
        if (popup && popup.closed) {
          clearInterval(checkPopup);
          setIsConnecting(false);
          window.location.reload();
        }
      }, 500);
    } catch (error) {
      console.error('Error connecting Gmail:', error);
      setIsConnecting(false);
    }
  };


  const handleDisconnectClick = () => {
    if (gmailConnected) {
      setShowDisconnectModal(true);
    } else {
      connectGmail();
    }
  };

  const disconnectGmail = async () => {
    await supabase
      .from('gmail_tokens')
      .delete()
      .eq('user_id', user?.id);

    setGmailConnected(false);
    setGmailEmail(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <img src="/logo.png" alt="Hall IA" className="h-10" />
            <nav className="flex gap-4">
              <button
                onClick={() => setActiveView('home')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  activeView === 'home'
                    ? 'bg-[#EF6855] text-white'
                    : 'text-gray-600 hover:text-[#EF6855]'
                }`}
              >
                Accueil
              </button>
              <button
                onClick={() => setActiveView('email-configs')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                  activeView === 'email-configs'
                    ? 'bg-[#EF6855] text-white'
                    : 'text-gray-600 hover:text-[#EF6855]'
                }`}
              >
                <Mail className="w-4 h-4" />
                Comptes configurés
              </button>
              <button
                onClick={() => setActiveView('settings')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                  activeView === 'settings'
                    ? 'bg-[#EF6855] text-white'
                    : 'text-gray-600 hover:text-[#EF6855]'
                }`}
              >
                <SettingsIcon className="w-4 h-4" />
                Configuration
              </button>
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">{user?.email}</span>
            <button
              onClick={() => signOut()}
              className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:text-[#EF6855] transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Déconnexion
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-12">
        {activeView === 'home' && (
          <>
            <div className="mb-8">
              <h1 className="text-4xl font-bold text-[#3D2817] mb-2">
                Tableau de bord
              </h1>
              <p className="text-gray-600">
                Gérez vos emails et automatisez vos réponses
              </p>
            </div>

            {gmailConnected && showCompanyForm && (
              <div className="mb-6 bg-[#EF6855] text-white rounded-2xl p-6 shadow-lg">
                <div className="flex items-start gap-4">
                  <div className="bg-white/20 p-3 rounded-lg">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-lg mb-1">Configuration requise</h3>
                    <p className="text-white/90 mb-4">
                      Pour tirer le meilleur parti de Hall IA, veuillez renseigner les informations de votre entreprise.
                    </p>
                    <button
                      onClick={() => setActiveView('company-info')}
                      className="bg-white text-[#EF6855] px-6 py-2 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                    >
                      Compléter maintenant
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div className="bg-white rounded-2xl p-8 shadow-sm">
              <h2 className="text-2xl font-bold text-[#3D2817] mb-4">
                Bienvenue dans Hall IA !
              </h2>
              <p className="text-gray-600 mb-6">
                Pour commencer à utiliser Hall IA, vous devez configurer vos paramètres email.
                Cela permettra à notre IA de se connecter à votre boîte de réception et de commencer
                à classer automatiquement vos emails.
              </p>
              <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                <button
                  type="button"
                  onClick={handleDisconnectClick}
                  disabled={isConnecting}
                  className={`w-full py-4 rounded-lg font-medium flex items-center justify-center gap-3 transition-all ${
                    gmailConnected
                      ? 'bg-green-50 border-2 border-green-500 text-green-700 hover:bg-green-100'
                      : 'bg-white border-2 border-gray-200 text-gray-700 hover:border-[#EF6855] hover:shadow-md'
                  } ${isConnecting ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <svg className="w-6 h-6" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  <div className="flex flex-col items-start">
                    <span>{isConnecting ? 'Connexion...' : gmailConnected ? 'Gmail connecté' : 'Connecter Gmail'}</span>
                    {gmailEmail && <span className="text-xs opacity-75">{gmailEmail}</span>}
                  </div>
                </button>

                <button
                  type="button"
                  disabled={gmailConnected}
                  className={`w-full py-4 rounded-lg font-medium flex items-center justify-center gap-3 transition-all ${
                    gmailConnected
                      ? 'bg-gray-100 border-2 border-gray-200 text-gray-400 cursor-not-allowed opacity-60'
                      : 'bg-white border-2 border-gray-200 text-gray-700 hover:border-[#EF6855] hover:shadow-md'
                  }`}
                >
                  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M22 3H2C.9 3 0 3.9 0 5v14c0 1.1.9 2 2 2h20c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H2V8l10 6 10-6v11z"/>
                  </svg>
                  Connecter Outlook
                </button>

                <button
                  type="button"
                  onClick={() => setActiveView('settings')}
                  disabled={gmailConnected}
                  className={`w-full py-4 rounded-lg font-medium flex items-center justify-center gap-3 transition-all ${
                    gmailConnected
                      ? 'bg-gray-100 border-2 border-gray-200 text-gray-400 cursor-not-allowed opacity-60'
                      : 'bg-white border-2 border-gray-200 text-gray-700 hover:border-[#EF6855] hover:shadow-md'
                  }`}
                >
                  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="4" width="18" height="16" rx="2"/>
                    <path d="M3 8l9 6 9-6"/>
                  </svg>
                  Autres emails
                </button>
              </div>

              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <h3 className="font-semibold text-[#3D2817] mb-2">Prochaines étapes :</h3>
                <ol className="list-decimal list-inside space-y-2 text-gray-700">
                  <li>Configurez vos paramètres SMTP/IMAP</li>
                  <li>Créez vos premières catégories d'emails</li>
                  <li>Définissez des modèles de réponses automatiques</li>
                  <li>Laissez l'IA faire le reste !</li>
                </ol>
              </div>
            </div>
          </>
        )}

        {activeView === 'email-configs' && (
          <EmailConfigurations />
        )}

        {activeView === 'settings' && (
          <>
            <div className="mb-8">
              <h1 className="text-4xl font-bold text-[#3D2817] mb-2">
                Configuration
              </h1>
              <p className="text-gray-600">
                Configurez vos paramètres email
              </p>
            </div>
            <Settings />
          </>
        )}

        {activeView === 'company-info' && (
          <>
            <div className="mb-8">
              <h1 className="text-4xl font-bold text-[#3D2817] mb-2">
                Configuration de votre entreprise
              </h1>
              <p className="text-gray-600">
                Complétez les informations pour personnaliser l'IA
              </p>
            </div>
            <CompanyInfoForm />
          </>
        )}
      </main>

      <ConfirmationModal
        isOpen={showDisconnectModal}
        onClose={() => setShowDisconnectModal(false)}
        onConfirm={disconnectGmail}
        title="Déconnecter le compte"
        message={`Êtes-vous sûr de vouloir déconnecter ${gmailEmail} ? Toutes les configurations associées seront perdues.`}
        confirmText="Déconnecter"
        cancelText="Annuler"
      />
    </div>
  );
}
