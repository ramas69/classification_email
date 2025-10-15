import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Link, Save } from 'lucide-react';

export function WebhookSettings() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [webhookUrl, setWebhookUrl] = useState('');
  const [hasWebhook, setHasWebhook] = useState(false);

  useEffect(() => {
    loadWebhook();
  }, [user]);

  const loadWebhook = async () => {
    if (!user) return;

    setLoading(true);
    const { data } = await supabase
      .from('webhook_settings')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (data) {
      setWebhookUrl(data.n8n_webhook_url);
      setHasWebhook(true);
    }
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setSaving(true);

    try {
      if (hasWebhook) {
        await supabase
          .from('webhook_settings')
          .update({
            n8n_webhook_url: webhookUrl,
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', user.id);
      } else {
        await supabase
          .from('webhook_settings')
          .insert({
            user_id: user.id,
            n8n_webhook_url: webhookUrl,
          });
        setHasWebhook(true);
      }

      alert('Webhook enregistré avec succès !');
    } catch (error) {
      console.error('Error saving webhook:', error);
      alert('Erreur lors de l\'enregistrement');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-4 border-[#EF6855] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-4xl">
      <div className="bg-gradient-to-r from-[#EF6855] to-[#F9A459] rounded-2xl p-8 text-white mb-6">
        <div className="flex items-center gap-4">
          <div className="bg-white/20 rounded-xl p-3">
            <Link className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-3xl font-bold mb-1">Webhook N8N</h2>
            <p className="text-white/90">
              {hasWebhook ? 'Modifiez votre webhook N8N' : 'Configurez votre webhook N8N'}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-8 shadow-sm mb-6">
        <div className="flex items-center gap-2 mb-6">
          <Link className="w-5 h-5 text-[#EF6855]" />
          <h3 className="text-xl font-bold text-[#3D2817]">URL du webhook</h3>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            URL du webhook N8N
          </label>
          <input
            type="url"
            value={webhookUrl}
            onChange={(e) => setWebhookUrl(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#EF6855] focus:border-transparent outline-none"
            placeholder="https://votre-instance.n8n.io/webhook/..."
            required
          />
          <p className="mt-2 text-sm text-gray-500">
            Ce webhook sera déclenché pour envoyer les configurations à votre workflow N8N
          </p>
        </div>

        {hasWebhook && (
          <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-sm text-green-800">
              Un webhook est déjà configuré. Vous pouvez le modifier en soumettant le formulaire.
            </p>
          </div>
        )}
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={saving}
          className="bg-gradient-to-r from-[#EF6855] to-[#F9A459] text-white px-8 py-3 rounded-lg font-medium flex items-center gap-2 hover:shadow-lg transition-shadow disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Save className="w-5 h-5" />
          {saving ? 'Enregistrement...' : hasWebhook ? 'Modifier le webhook' : 'Enregistrer le webhook'}
        </button>
      </div>
    </form>
  );
}
