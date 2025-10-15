import { useState } from 'react';
import { Mail, Zap, TrendingUp, Clock, ArrowRight } from 'lucide-react';
import { useAuth } from './contexts/AuthContext';
import { AuthForm } from './components/AuthForm';
import { Dashboard } from './components/Dashboard';

function App() {
  const { user, loading } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#EF6855] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  if (user) {
    return <Dashboard />;
  }

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-50">
        {/* Header */}
        <header className="px-6 py-6 flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="Hall IA" className="h-12" />
          </div>
          <button
            onClick={() => setShowAuthModal(true)}
            className="bg-gradient-to-r from-[#EF6855] to-[#F9A459] text-white px-6 py-3 rounded-lg font-medium flex items-center gap-2 hover:shadow-lg transition-shadow"
          >
            <ArrowRight className="w-4 h-4" />
            Connexion
          </button>
        </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-6 py-16">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-[#3D2817] mb-6">
            Automatisez la gestion de vos emails
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Hall IA classifie automatiquement vos emails dans différentes boîtes et prépare des réponses intelligentes pour vos destinataires.
          </p>
          <button
            onClick={() => setShowAuthModal(true)}
            className="bg-gradient-to-r from-[#EF6855] to-[#F9A459] text-white px-8 py-4 rounded-lg font-medium text-lg flex items-center gap-2 mx-auto hover:shadow-lg transition-shadow"
          >
            Commencer maintenant
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          <div className="bg-white rounded-2xl p-8 shadow-sm hover:shadow-md transition-shadow">
            <div className="bg-gradient-to-br from-[#EF6855] to-[#F9A459] w-14 h-14 rounded-xl flex items-center justify-center mb-6">
              <Mail className="w-7 h-7 text-white" />
            </div>
            <h3 className="text-xl font-bold text-[#3D2817] mb-3">
              Classification intelligente
            </h3>
            <p className="text-gray-600">
              Vos emails sont automatiquement triés et organisés dans les bonnes boîtes selon leur contenu et priorité.
            </p>
          </div>

          <div className="bg-white rounded-2xl p-8 shadow-sm hover:shadow-md transition-shadow">
            <div className="bg-gradient-to-br from-[#EF6855] to-[#F9A459] w-14 h-14 rounded-xl flex items-center justify-center mb-6">
              <Zap className="w-7 h-7 text-white" />
            </div>
            <h3 className="text-xl font-bold text-[#3D2817] mb-3">
              Réponses préparées
            </h3>
            <p className="text-gray-600">
              Des réponses personnalisées sont générées automatiquement pour chaque type d'email reçu.
            </p>
          </div>

          <div className="bg-white rounded-2xl p-8 shadow-sm hover:shadow-md transition-shadow">
            <div className="bg-gradient-to-br from-[#EF6855] to-[#F9A459] w-14 h-14 rounded-xl flex items-center justify-center mb-6">
              <TrendingUp className="w-7 h-7 text-white" />
            </div>
            <h3 className="text-xl font-bold text-[#3D2817] mb-3">
              Productivité maximale
            </h3>
            <p className="text-gray-600">
              Concentrez-vous sur l'essentiel pendant que l'IA gère votre boîte de réception.
            </p>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Card */}
          <div className="bg-gradient-to-br from-[#EF6855] to-[#F9A459] rounded-2xl p-10 text-white">
            <h2 className="text-3xl font-bold mb-8">
              Gagnez du temps précieux
            </h2>

            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="bg-white/20 rounded-lg p-3 flex-shrink-0">
                  <Clock className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-lg mb-1">
                    Jusqu'à 3h par jour économisées
                  </h3>
                  <p className="text-white/90">
                    Ne perdez plus de temps à trier et répondre manuellement à vos emails
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="bg-white/20 rounded-lg p-3 flex-shrink-0">
                  <Zap className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-lg mb-1">
                    Réactivité instantanée
                  </h3>
                  <p className="text-white/90">
                    Vos contacts reçoivent des réponses rapides et pertinentes
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="bg-white/20 rounded-lg p-3 flex-shrink-0">
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-lg mb-1">
                    Performance améliorée
                  </h3>
                  <p className="text-white/90">
                    Augmentez votre productivité et celle de votre équipe
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Card */}
          <div className="bg-white rounded-2xl p-10 shadow-sm">
            <h2 className="text-3xl font-bold text-[#3D2817] mb-8">
              Comment ça fonctionne ?
            </h2>

            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="bg-gradient-to-br from-[#EF6855] to-[#F9A459] rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0 text-white font-bold">
                  1
                </div>
                <p className="text-gray-600 pt-1">
                  Configurez vos paramètres email (SMTP/IMAP) et informations entreprise
                </p>
              </div>

              <div className="flex items-start gap-4">
                <div className="bg-gradient-to-br from-[#EF6855] to-[#F9A459] rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0 text-white font-bold">
                  2
                </div>
                <p className="text-gray-600 pt-1">
                  L'IA analyse et classifie automatiquement vos emails entrants
                </p>
              </div>

              <div className="flex items-start gap-4">
                <div className="bg-gradient-to-br from-[#EF6855] to-[#F9A459] rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0 text-white font-bold">
                  3
                </div>
                <p className="text-gray-600 pt-1">
                  Des réponses personnalisées sont générées et prêtes à être envoyées
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>

    {/* Auth Modal */}
    {showAuthModal && (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
        <div className="relative">
          <button
            onClick={() => setShowAuthModal(false)}
            className="absolute -top-4 -right-4 bg-white rounded-full w-8 h-8 flex items-center justify-center shadow-lg hover:bg-gray-100 transition-colors z-10"
          >
            ✕
          </button>
          <AuthForm onSuccess={() => setShowAuthModal(false)} />
        </div>
      </div>
    )}
    </>
  );
}

export default App;
