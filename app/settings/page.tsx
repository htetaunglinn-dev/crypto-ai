'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Header } from '@/components/Header';

export default function SettingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [apiKey, setApiKey] = useState('');
  const [aiProvider, setAiProvider] = useState<'claude' | 'gemini'>('claude');
  const [hasKey, setHasKey] = useState(false);
  const [keyPreview, setKeyPreview] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    } else if (status === 'authenticated') {
      fetchApiKeyStatus();
    }
  }, [status, router]);

  const fetchApiKeyStatus = async () => {
    try {
      const response = await fetch('/api/user/api-key');
      const data = await response.json();

      if (data.success) {
        setHasKey(data.data.hasKey);
        setKeyPreview(data.data.keyPreview || '');
        setAiProvider(data.data.aiProvider || 'claude');
      }
    } catch (error) {
      console.error('Error fetching API key status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveApiKey = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setIsSaving(true);

    try {
      const response = await fetch('/api/user/api-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey, aiProvider }),
      });

      const data = await response.json();

      if (data.success) {
        setMessage({ type: 'success', text: 'API key saved successfully!' });
        setApiKey('');
        fetchApiKeyStatus();
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to save API key' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'An error occurred. Please try again.' });
      console.error('Error saving API key:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleRemoveApiKey = async () => {
    if (!confirm('Are you sure you want to remove your API key? You will not be able to use AI analysis features.')) {
      return;
    }

    setMessage(null);
    setIsSaving(true);

    try {
      const response = await fetch('/api/user/api-key', {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        setMessage({ type: 'success', text: 'API key removed successfully' });
        fetchApiKeyStatus();
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to remove API key' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'An error occurred. Please try again.' });
      console.error('Error removing API key:', error);
    } finally {
      setIsSaving(false);
    }
  };

  if (status === 'loading' || isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-gray-700 border-t-brand" />
          <p className="text-sm text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Header />
      <div className="mx-auto max-w-3xl px-4 py-6 sm:py-10 animate-pop-in">
        <div className="mb-6">
          <Link
            href="/"
            className="inline-flex items-center text-sm text-gray-400 hover:text-gray-300"
          >
            ← Back to Dashboard
          </Link>
        </div>

        <div className="card p-6 sm:p-8">
          <div className="mb-8">
            <h1 className="text-2xl font-semibold tracking-tight text-white">Settings</h1>
            <p className="mt-2 text-sm text-gray-400">
              Manage your account and API configuration
            </p>
          </div>

          <div className="space-y-8">
            <div>
              <h2 className="mb-3 text-base font-semibold text-white">Account Information</h2>
              <div className="space-y-3 rounded-xl border border-line bg-surface-2/60 p-4">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-400">Name</span>
                  <span className="text-sm font-medium text-white">{session?.user?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-400">Email</span>
                  <span className="text-sm font-medium text-white">{session?.user?.email}</span>
                </div>
              </div>
            </div>

            <div>
              <h2 className="mb-3 text-base font-semibold text-white">AI Provider Configuration</h2>
              <p className="text-sm text-gray-400 mb-4">
                Choose your AI provider and add your API key to enable AI analysis features.
              </p>

              {message && (
                <div
                  className={`mb-4 rounded-xl border px-3.5 py-2.5 ${
                    message.type === 'success'
                      ? 'border-green-500/50 bg-green-500/10'
                      : 'border-red-500/50 bg-red-500/10'
                  }`}
                >
                  <p
                    className={`text-sm ${
                      message.type === 'success' ? 'text-green-500' : 'text-red-500'
                    }`}
                  >
                    {message.text}
                  </p>
                </div>
              )}

              {hasKey && (
                <div className="mb-4 rounded-xl border border-green-500/30 bg-green-500/10 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-green-500">
                        API Key Configured ({aiProvider === 'claude' ? 'Claude' : 'Gemini'})
                      </p>
                      <p className="text-xs text-gray-400 mt-1">{keyPreview}</p>
                    </div>
                    <button
                      onClick={handleRemoveApiKey}
                      disabled={isSaving}
                      className="btn h-8 border border-red-500/40 px-3 text-xs text-red-400 hover:bg-red-500/10"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              )}

              <form onSubmit={handleSaveApiKey} className="space-y-4">
                <div>
                  <label htmlFor="aiProvider" className="mb-1.5 block text-sm font-medium text-gray-300">
                    AI Provider
                  </label>
                  <div id="aiProvider" role="radiogroup" className="grid grid-cols-2 gap-2">
                    {([
                      { value: 'claude', name: 'Claude', by: 'Anthropic' },
                      { value: 'gemini', name: 'Gemini', by: 'Google' },
                    ] as const).map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        role="radio"
                        aria-checked={aiProvider === option.value}
                        onClick={() => setAiProvider(option.value)}
                        className={`rounded-xl border px-4 py-3 text-left transition cursor-pointer ${
                          aiProvider === option.value
                            ? 'border-brand/60 bg-brand/10 ring-1 ring-brand/40'
                            : 'border-line-strong bg-surface-2 hover:border-gray-600'
                        }`}
                      >
                        <div className="text-sm font-semibold text-white">{option.name}</div>
                        <div className="text-xs text-gray-400">{option.by}</div>
                      </button>
                    ))}
                  </div>
                  <p className="mt-2 text-xs text-gray-500">
                    {aiProvider === 'claude' ? (
                      <>
                        Get your API key from{' '}
                        <a
                          href="https://console.anthropic.com"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-500 hover:text-blue-400"
                        >
                          console.anthropic.com
                        </a>
                      </>
                    ) : (
                      <>
                        Get your API key from{' '}
                        <a
                          href="https://aistudio.google.com/app/apikey"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-500 hover:text-blue-400"
                        >
                          Google AI Studio
                        </a>
                      </>
                    )}
                  </p>
                </div>

                <div>
                  <label htmlFor="apiKey" className="mb-1.5 block text-sm font-medium text-gray-300">
                    {hasKey ? 'Update API Key' : 'API Key'}
                  </label>
                  <input
                    id="apiKey"
                    type="password"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder={aiProvider === 'claude' ? 'sk-ant-...' : 'AIza...'}
                    className="input"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Your API key is encrypted and stored securely
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={isSaving || !apiKey}
                  className="btn btn-primary h-10"
                >
                  {isSaving ? 'Saving...' : hasKey ? 'Update API Key' : 'Save API Key'}
                </button>
              </form>
            </div>

            <div className="border-t border-line pt-6">
              <h2 className="mb-3 text-base font-semibold text-white">Features</h2>
              <div className="space-y-3 text-sm text-gray-400">
                <div className="flex items-center gap-2">
                  <span className="text-up">✓</span>
                  <span>Real-time crypto price tracking</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-up">✓</span>
                  <span>Technical indicators (RSI, MACD, EMA, Bollinger Bands)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={hasKey ? 'text-green-500' : 'text-gray-600'}>
                    {hasKey ? '✓' : '○'}
                  </span>
                  <span>{aiProvider === 'claude' ? 'Claude' : 'Gemini'} AI market analysis</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={hasKey ? 'text-green-500' : 'text-gray-600'}>
                    {hasKey ? '✓' : '○'}
                  </span>
                  <span>Pattern recognition and risk assessment</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
