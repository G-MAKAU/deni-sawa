'use client';

import * as React from 'react';
import { Bot, Check, ChevronDown, Loader2, RefreshCw } from 'lucide-react';
import { adminPut, adminFetch } from '@/lib/admin-client';
import { AdminCard, Field, StatusPill } from '@/components/admin/ui';
import { cn } from '@/lib/utils';

export interface AiOverview {
  primary: {
    type: string | null;
    baseUrl: string | null;
    model: string | null;
    keyConfigured: boolean;
    maskedKey: string | null;
  };
  fallback: {
    type: string;
    baseUrl: string | null;
    model: string | null;
    keyConfigured: boolean;
    maskedKey: string | null;
  } | null;
  editable: string[];
}

interface AiSettingsEditorProps {
  ai: AiOverview;
  onSaved: (ai: AiOverview) => void;
}

interface Preset {
  id: string;
  type: 'anthropic' | 'google' | 'openai';
  baseUrl: string;
  label: string;
  models: string[];
}

const PRESETS: Preset[] = [
  { id: 'anthropic', type: 'anthropic', baseUrl: 'https://api.anthropic.com/v1', label: 'Anthropic (Claude)', models: ['claude-sonnet-4-6', 'claude-sonnet-4-5', 'claude-opus-4-1', 'claude-haiku-4-5'] },
  { id: 'google', type: 'google', baseUrl: 'https://generativelanguage.googleapis.com/v1beta', label: 'Google (Gemini)', models: ['gemini-3.6-flash', 'gemini-2.5-pro', 'gemini-2.5-flash', 'gemini-2.0-flash'] },
  { id: 'openai', type: 'openai', baseUrl: 'https://api.openai.com/v1', label: 'OpenAI', models: ['gpt-4o', 'gpt-4o-mini', 'gpt-4.1'] },
  { id: 'deepseek', type: 'openai', baseUrl: 'https://api.deepseek.com/v1', label: 'DeepSeek', models: ['deepseek-chat', 'deepseek-reasoner'] },
  { id: 'qwen', type: 'openai', baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1', label: 'Qwen (Alibaba)', models: ['qwen-plus', 'qwen-max', 'qwen-turbo'] },
  { id: 'kimi', type: 'openai', baseUrl: 'https://api.moonshot.cn/v1', label: 'Kimi (Moonshot)', models: ['moonshot-v1-8k', 'moonshot-v1-32k', 'kimi-latest'] },
  { id: 'groq', type: 'openai', baseUrl: 'https://api.groq.com/openai/v1', label: 'Groq', models: ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant'] },
  { id: 'openrouter', type: 'openai', baseUrl: 'https://openrouter.ai/api/v1', label: 'OpenRouter', models: ['google/gemini-3.6-flash', 'deepseek/deepseek-chat', 'anthropic/claude-sonnet-4-6'] },
  { id: 'custom', type: 'openai', baseUrl: '', label: 'Custom (OpenAI-compatible)', models: [] },
];

const inputCls =
  'h-10 w-full rounded-lg border border-[var(--a-border)] bg-[var(--a-card)] px-3 text-sm text-[var(--a-ink2)] outline-none transition-colors focus:border-[#E8510A]';

function presetFor(overview: AiOverview): Preset {
  const t = overview.primary.type;
  const b = (overview.primary.baseUrl ?? '').replace(/\/+$/, '');
  if (t === 'anthropic') return PRESETS[0];
  if (t === 'google') return PRESETS[1];
  const match = PRESETS.slice(2).find((p) => p.baseUrl === b);
  return match ?? PRESETS[8];
}

export function AiSettingsEditor({ ai, onSaved }: AiSettingsEditorProps) {
  const initial = presetFor(ai);
  const [providerId, setProviderId] = React.useState(initial.id);
  const [type, setType] = React.useState<string>(ai.primary.type ?? 'openai');
  const [baseUrl, setBaseUrl] = React.useState<string>(ai.primary.baseUrl ?? '');
  const [apiKey, setApiKey] = React.useState('');
  const [model, setModel] = React.useState<string>(ai.primary.model ?? '');
  const [modelOptions, setModelOptions] = React.useState<string[]>(initial.models);
  const [loadingModels, setLoadingModels] = React.useState(false);

  const [showFallback, setShowFallback] = React.useState(Boolean(ai.fallback));
  const [fType, setFType] = React.useState<string>(ai.fallback?.type ?? 'openai');
  const [fBaseUrl, setFBaseUrl] = React.useState<string>(ai.fallback?.baseUrl ?? '');
  const [fApiKey, setFApiKey] = React.useState('');
  const [fModel, setFModel] = React.useState<string>(ai.fallback?.model ?? '');

  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [saved, setSaved] = React.useState(false);

  const pickProvider = (id: string) => {
    const preset = PRESETS.find((p) => p.id === id) ?? PRESETS[8];
    setProviderId(id);
    setType(preset.type);
    setBaseUrl(preset.baseUrl);
    setModelOptions(preset.models);
    setSaved(false);
  };

  const loadModels = async () => {
    setLoadingModels(true);
    setError(null);
    try {
      const data = await adminFetch<{
        anthropic: string[];
        google: string[];
        openaiCompatible: string[];
        openrouter: string[];
      }>('/api/admin/models');
      const list =
        type === 'anthropic'
          ? data.anthropic
          : type === 'google'
            ? data.google
            : [...new Set([...(data.openaiCompatible ?? []), ...(data.openrouter ?? [])])];
      if (list.length) setModelOptions(list);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load models.');
    } finally {
      setLoadingModels(false);
    }
  };

  const save = async () => {
    setSaving(true);
    setError(null);
    setSaved(false);
    const settings: Record<string, string> = {
      AI_PROVIDER_TYPE: type,
      AI_BASE_URL: baseUrl.trim(),
      AI_MODEL: model.trim(),
    };
    if (apiKey.trim()) settings.AI_API_KEY = apiKey.trim();
    if (showFallback) {
      settings.AI_FALLBACK_PROVIDER_TYPE = fType;
      if (fBaseUrl.trim()) settings.AI_FALLBACK_BASE_URL = fBaseUrl.trim();
      if (fModel.trim()) settings.AI_FALLBACK_MODEL = fModel.trim();
      if (fApiKey.trim()) settings.AI_FALLBACK_API_KEY = fApiKey.trim();
    }
    try {
      const result = await adminPut<{ ok: boolean; ai: AiOverview }>('/api/admin/settings', { settings });
      setApiKey('');
      setFApiKey('');
      setSaved(true);
      onSaved(result.ai);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save AI settings.');
    } finally {
      setSaving(false);
    }
  };

  const presetModels = PRESETS.find((p) => p.id === providerId)?.models ?? [];

  return (
    <AdminCard
      title="AI Provider & Model"
      subtitle="Configure which AI model powers report generation. Stored encrypted in the database — no redeploy needed."
      actions={
        <StatusPill tone={ai.primary.keyConfigured ? 'green' : 'amber'}>
          {ai.primary.keyConfigured ? 'Configured' : 'Env fallback'}
        </StatusPill>
      }
      className="lg:col-span-2"
    >
      <div className="grid gap-5 lg:grid-cols-2">
        <div className="space-y-4">
          <Field label="Primary provider">
            <div className="relative">
              <select value={providerId} onChange={(e) => pickProvider(e.target.value)} className={cn(inputCls, 'appearance-none pr-9')}>
                {PRESETS.map((p) => (
                  <option key={p.id} value={p.id}>{p.label}</option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--a-muted)]" />
            </div>
          </Field>

          <Field label="Base URL (OpenAI-compatible /chat/completions)" hint={providerId === 'custom' ? 'e.g. https://api.deepseek.com/v1' : undefined}>
            <input className={inputCls} value={baseUrl} onChange={(e) => setBaseUrl(e.target.value)} placeholder={presetFor(ai).baseUrl || 'https://api.example.com/v1'} />
          </Field>

          <Field label="API key" hint={ai.primary.keyConfigured ? `Currently ${ai.primary.maskedKey ?? 'configured'} — leave blank to keep it.` : undefined}>
            <input className={inputCls} type="password" value={apiKey} onChange={(e) => setApiKey(e.target.value)} placeholder={ai.primary.keyConfigured ? '••••••••' : 'sk-…'} autoComplete="new-password" />
          </Field>

          <Field label="Model">
            <div className="flex gap-2">
              <input className={inputCls} list="ai-model-options" value={model} onChange={(e) => setModel(e.target.value)} placeholder="e.g. deepseek-chat" />
              <datalist id="ai-model-options">
                {[...new Set([...presetModels, ...modelOptions])].map((m) => (
                  <option key={m} value={m} />
                ))}
              </datalist>
              <button
                type="button"
                onClick={loadModels}
                disabled={loadingModels}
                className="inline-flex h-10 shrink-0 items-center gap-1.5 rounded-lg border border-[var(--a-border)] px-3 text-xs font-semibold text-[var(--a-ink2)] transition-colors hover:bg-[var(--a-hover)] disabled:opacity-50"
              >
                {loadingModels ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
                Models
              </button>
            </div>
          </Field>
        </div>

        <div className="space-y-4">
          <label className="flex items-center gap-2 text-[13px] font-semibold text-[var(--a-ink2)]">
            <input type="checkbox" checked={showFallback} onChange={(e) => setShowFallback(e.target.checked)} className="h-4 w-4 accent-[#E8510A]" />
            Enable fallback provider (auto-switch on failure)
          </label>

          {showFallback && (
            <>
              <Field label="Fallback provider type">
                <select value={fType} onChange={(e) => setFType(e.target.value)} className={inputCls}>
                  <option value="anthropic">Anthropic (Claude)</option>
                  <option value="google">Google (Gemini)</option>
                  <option value="openai">OpenAI-compatible</option>
                </select>
              </Field>
              {fType === 'openai' && (
                <Field label="Fallback base URL">
                  <input className={inputCls} value={fBaseUrl} onChange={(e) => setFBaseUrl(e.target.value)} placeholder="https://api.openai.com/v1" />
                </Field>
              )}
              <Field label="Fallback API key" hint={ai.fallback?.keyConfigured ? 'Leave blank to keep the existing key.' : undefined}>
                <input className={inputCls} type="password" value={fApiKey} onChange={(e) => setFApiKey(e.target.value)} placeholder={ai.fallback?.keyConfigured ? '••••••••' : 'sk-…'} autoComplete="new-password" />
              </Field>
              <Field label="Fallback model">
                <input className={inputCls} value={fModel} onChange={(e) => setFModel(e.target.value)} placeholder="e.g. claude-sonnet-4-6" />
              </Field>
            </>
          )}

          {ai.fallback && !showFallback && (
            <p className="text-xs text-[var(--a-muted)]">
              Fallback currently configured: {ai.fallback.type} / {ai.fallback.model ?? '—'}
            </p>
          )}
        </div>
      </div>

      {error && <p className="mt-4 rounded-md bg-red-500/10 px-3 py-2 text-xs font-medium text-red-600">{error}</p>}
      {saved && (
        <p className="mt-4 flex items-center gap-1.5 rounded-md bg-[#5A9E28]/10 px-3 py-2 text-xs font-medium text-[#5A9E28]">
          <Check className="h-3.5 w-3.5" /> Saved — active within ~60 seconds.
        </p>
      )}

      <div className="mt-5 flex items-center gap-3">
        <button
          type="button"
          onClick={save}
          disabled={saving}
          className="inline-flex h-10 items-center gap-2 rounded-lg bg-[#E8510A] px-5 text-[13px] font-bold text-white transition-colors hover:bg-[#C44508] disabled:opacity-60"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Bot className="h-4 w-4" />}
          {saving ? 'Saving…' : 'Save AI Settings'}
        </button>
      </div>
    </AdminCard>
  );
}