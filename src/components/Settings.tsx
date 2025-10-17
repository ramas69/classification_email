import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Mail, Server, Building, Send, Eye, EyeOff, Edit, CheckCircle } from 'lucide-react';

export function Settings() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activating, setActivating] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isConfigured, setIsConfigured] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const [showForm, setShowForm] = useState(true);
  const [webhookUrl, setWebhookUrl] = useState('');
  const [provider, setProvider] = useState<string>('');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    imapHost: '',
    imapPort: 993,
    companyName: '',
    activityDescription: '',
    services: '',
  });

  useEffect(() => {
    loadProfile();
  }, [user]);

  const loadProfile = async () => {
    if (!user) return;

    setLoading(true);

    const { data: emailConfig } = await supabase
      .from('email_configurations')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    const { data: webhookData } = await supabase
      .from('webhook_settings')
      .select('n8n_webhook_url')
      .eq('user_id', user.id)
      .maybeSingle();

    setProvider(emailConfig?.provider || '');
    setFormData({
      email: emailConfig?.email || '',
      password: '',
      imapHost: emailConfig?.imap_host || '',
      imapPort: emailConfig?.imap_port || 993,
      companyName: emailConfig?.company_name || '',
      activityDescription: emailConfig?.activity_description || '',
      services: emailConfig?.services_offered || '',
    });

    const configured = !!emailConfig;
    setIsConfigured(configured);
    setIsActive(emailConfig?.is_active || false);
    setWebhookUrl(webhookData?.n8n_webhook_url || '');
    setShowForm(!configured);

    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setSaving(true);

    try {
      const isOAuthProvider = provider === 'gmail' || provider === 'outlook';

      if (isOAuthProvider) {
        // Pour Gmail/Outlook, ne mettre à jour que les infos entreprise
        await supabase
          .from('email_configurations')
          .update({
            company_name: formData.companyName,
            activity_description: formData.activityDescription,
            services_offered: formData.services,
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', user.id);
      } else {
        // Pour IMAP, mise à jour complète
        await supabase
          .from('email_configurations')
          .upsert({
            user_id: user.id,
            email: formData.email,
            password: formData.password,
            imap_host: formData.imapHost,
            imap_port: formData.imapPort,
            company_name: formData.companyName,
            activity_description: formData.activityDescription,
            services_offered: formData.services,
            provider: 'imap',
            updated_at: new Date().toISOString(),
          }, { onConflict: 'user_id' });
      }

      setIsConfigured(true);
      setShowForm(false);
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('Erreur lors de l\'enregistrement');
    } finally {
      setSaving(false);
    }
  };

  const handleActivate = async () => {
    if (!user || !webhookUrl) {
      alert('Veuillez d\'abord configurer votre webhook N8N');
      return;
    }

    setActivating(true);

    try {
      const payload = {
        user_id: user.id,
        email: formData.email,
        password: formData.password,
        imap_host: formData.imapHost,
        imap_port: formData.imapPort,
        company_name: formData.companyName,
        activity_description: formData.activityDescription,
        services: formData.services,
      };

      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error('Erreur lors de l\'appel du webhook');
      }

      await supabase
        .from('email_configurations')
        .update({
          is_active: true,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id);

      setIsActive(true);
      alert('Configuration activée avec succès ! Le workflow N8N a été déclenché.');
    } catch (error) {
      console.error('Error activating:', error);
      alert('Erreur lors de l\'activation');
    } finally {
      setActivating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-4 border-[#EF6855] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!showForm && isConfigured) {
    const isOAuthProvider = provider === 'gmail' || provider === 'outlook';

    return (
      <div className="max-w-4xl">
        <div className="bg-gradient-to-r from-[#EF6855] to-[#F9A459] rounded-2xl p-8 text-white mb-6">
          <div className="flex items-center gap-4">
            <div className="bg-white/20 rounded-xl p-3">
              <CheckCircle className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-3xl font-bold mb-1">Configuration Enregistrée</h2>
              <p className="text-white/90">Récapitulatif de votre configuration</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-8 shadow-sm mb-6">
          {!isOAuthProvider && (
            <>
              <h3 className="text-xl font-bold text-[#3D2817] mb-6">Informations de connexion</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <p className="text-sm text-gray-500">Adresse email</p>
                  <p className="font-medium text-gray-900">{formData.email}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Mot de passe</p>
                  <p className="font-medium text-gray-900">••••••••</p>
                </div>
              </div>

              <h3 className="text-xl font-bold text-[#3D2817] mb-6 mt-8">Configuration serveur IMAP</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <p className="text-sm text-gray-500">Serveur IMAP</p>
                  <p className="font-medium text-gray-900">{formData.imapHost}:{formData.imapPort}</p>
                </div>
              </div>
            </>
          )}

          {isOAuthProvider && (
            <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="text-sm text-blue-800">
                  <div className="font-semibold mb-1">Compte {provider === 'gmail' ? 'Gmail' : 'Outlook'} connecté</div>
                  <div>Email: {formData.email}</div>
                  <div className="mt-1">Les paramètres de connexion sont gérés automatiquement via OAuth.</div>
                </div>
              </div>
            </div>
          )}

          <h3 className="text-xl font-bold text-[#3D2817] mb-6 mt-8">Informations de l'entreprise</h3>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-500">Nom de l'entreprise</p>
              <p className="font-medium text-gray-900">{formData.companyName}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Description de l'activité</p>
              <p className="font-medium text-gray-900">{formData.activityDescription || 'Non renseigné'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Signature</p>
              <p className="font-medium text-gray-900">{formData.services || 'Non renseigné'}</p>
            </div>
          </div>
        </div>

        {isActive && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-6 mb-6">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-6 h-6 text-green-600" />
              <div>
                <h4 className="font-bold text-green-900">Configuration activée</h4>
                <p className="text-sm text-green-700">Le workflow N8N est actif et traite vos emails</p>
              </div>
            </div>
          </div>
        )}

        <div className="flex gap-4 justify-end">
          <button
            onClick={() => setShowForm(true)}
            className="bg-white border-2 border-[#EF6855] text-[#EF6855] px-8 py-3 rounded-lg font-medium flex items-center gap-2 hover:bg-[#EF6855] hover:text-white transition-colors"
          >
            <Edit className="w-5 h-5" />
            Modifier
          </button>
          {!isActive && (
            <button
              onClick={handleActivate}
              disabled={activating || !webhookUrl}
              className="bg-gradient-to-r from-[#EF6855] to-[#F9A459] text-white px-8 py-3 rounded-lg font-medium flex items-center gap-2 hover:shadow-lg transition-shadow disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <CheckCircle className="w-5 h-5" />
              {activating ? 'Activation...' : 'Activer la configuration'}
            </button>
          )}
        </div>

      </div>
    );
  }

  const isOAuthProvider = provider === 'gmail' || provider === 'outlook';

  return (
    <form onSubmit={handleSubmit} className="max-w-4xl">
      <div className="bg-gradient-to-r from-[#EF6855] to-[#F9A459] rounded-2xl p-8 text-white mb-6">
        <div className="flex items-center gap-4">
          <div className="bg-white/20 rounded-xl p-3">
            <Mail className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-3xl font-bold mb-1">
              {isOAuthProvider ? 'Modifier les informations' : 'Configuration Email'}
            </h2>
            <p className="text-white/90">
              {isOAuthProvider ? 'Mettez à jour les informations de votre entreprise' : 'Configurez vos paramètres de messagerie'}
            </p>
          </div>
        </div>
      </div>

      {isOAuthProvider && (
        <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="text-sm text-blue-800">
              <div className="font-semibold mb-1">Compte {provider === 'gmail' ? 'Gmail' : 'Outlook'} connecté</div>
              <div>Vous pouvez uniquement modifier les informations de votre entreprise. Les paramètres de connexion {provider === 'gmail' ? 'Gmail' : 'Outlook'} sont gérés automatiquement.</div>
            </div>
          </div>
        </div>
      )}

      {!isOAuthProvider && (
        <>
          <div className="bg-white rounded-2xl p-8 shadow-sm mb-6">
            <div className="flex items-center gap-2 mb-6">
              <Mail className="w-5 h-5 text-[#EF6855]" />
              <h3 className="text-xl font-bold text-[#3D2817]">Informations de connexion</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Adresse email
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#EF6855] focus:border-transparent outline-none"
                  placeholder="exemple@entreprise.com"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mot de passe
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#EF6855] focus:border-transparent outline-none pr-12"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-8 shadow-sm mb-6">
            <div className="flex items-center gap-2 mb-6">
              <Server className="w-5 h-5 text-[#EF6855]" />
              <h3 className="text-xl font-bold text-[#3D2817]">Configuration IMAP</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Serveur IMAP
                </label>
                <input
                  type="text"
                  value={formData.imapHost}
                  onChange={(e) => setFormData({ ...formData, imapHost: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#EF6855] focus:border-transparent outline-none"
                  placeholder="imap.exemple.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Port IMAP
                </label>
                <input
                  type="number"
                  value={formData.imapPort}
                  onChange={(e) => setFormData({ ...formData, imapPort: parseInt(e.target.value) })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#EF6855] focus:border-transparent outline-none"
                  placeholder="993"
                />
              </div>
            </div>
          </div>
        </>
      )}

      <div className="bg-white rounded-2xl p-8 shadow-sm mb-6">
        <div className="flex items-center gap-2 mb-6">
          <Building className="w-5 h-5 text-[#EF6855]" />
          <h3 className="text-xl font-bold text-[#3D2817]">Informations de l'entreprise</h3>
        </div>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nom de l'entreprise
            </label>
            <input
              type="text"
              value={formData.companyName}
              onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#EF6855] focus:border-transparent outline-none"
              placeholder="Nom de votre entreprise"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description de l'activité
            </label>
            <textarea
              value={formData.activityDescription}
              onChange={(e) => setFormData({ ...formData, activityDescription: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#EF6855] focus:border-transparent outline-none resize-none"
              rows={4}
              placeholder="Décrivez l'activité principale de votre entreprise..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Signature
            </label>
            <textarea
              value={formData.services}
              onChange={(e) => setFormData({ ...formData, services: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#EF6855] focus:border-transparent outline-none resize-none"
              rows={4}
              placeholder="Listez les services offerts par votre entreprise..."
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={saving}
          className="bg-gradient-to-r from-[#EF6855] to-[#F9A459] text-white px-8 py-3 rounded-lg font-medium flex items-center gap-2 hover:shadow-lg transition-shadow disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Send className="w-5 h-5" />
          {saving ? 'Enregistrement...' : 'Envoyer la configuration'}
        </button>
      </div>
    </form>
  );
}
