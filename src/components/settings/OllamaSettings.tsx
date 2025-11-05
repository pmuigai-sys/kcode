import { useMemo } from "react";
import { useForm } from "react-hook-form";

import { useModelConfig, useModelsList, useUpdateModelConfig } from "../../hooks/useModelConfig";
import type { ModelConfig } from "../../api-client/system";

const OllamaSettings = () => {
  const { data: config, isLoading } = useModelConfig();
  const { data: models } = useModelsList();
  const { mutateAsync, isPending } = useUpdateModelConfig();

  const availableModels = useMemo(() => models ?? [], [models]);

  const { register, handleSubmit, reset } = useForm<ModelConfig>({
    values: config ?? {
      defaultChatModel: "llama3.2",
      defaultCodeModel: "codellama",
      temperature: 0.2,
      maxTokens: 4096
    }
  });

  const onSubmit = async (values: ModelConfig) => {
    await mutateAsync(values);
    reset(values);
  };

  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-950/70 p-6 shadow-softer">
      <header className="mb-4">
        <h3 className="text-lg font-semibold">Ollama models</h3>
        <p className="text-xs text-slate-400">
          Configure the default chat and code models for agent runs. Only locally
          available models are listed.
        </p>
      </header>
      {isLoading && <div className="text-xs text-slate-400">Loading model config…</div>}
      {!isLoading && (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <label className="flex flex-col gap-2 text-xs text-slate-400">
              Default chat model
              <select
                {...register("defaultChatModel")}
                className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white focus:border-kb-primary focus:outline-none"
              >
                {availableModels.map((model) => (
                  <option key={model} value={model}>
                    {model}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-2 text-xs text-slate-400">
              Default code model
              <select
                {...register("defaultCodeModel")}
                className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white focus:border-kb-primary focus:outline-none"
              >
                {availableModels.map((model) => (
                  <option key={model} value={model}>
                    {model}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-2 text-xs text-slate-400">
              Temperature
              <input
                type="number"
                step="0.1"
                min="0"
                max="1"
                {...register("temperature", { valueAsNumber: true })}
                className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white focus:border-kb-primary focus:outline-none"
              />
            </label>
            <label className="flex flex-col gap-2 text-xs text-slate-400">
              Max tokens
              <input
                type="number"
                min="512"
                max="8192"
                step="256"
                {...register("maxTokens", { valueAsNumber: true })}
                className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white focus:border-kb-primary focus:outline-none"
              />
            </label>
          </div>
          <button
            type="submit"
            className="rounded-lg bg-kb-primary px-4 py-2 text-sm font-medium text-slate-950 transition hover:bg-sky-300 disabled:opacity-60"
            disabled={isPending}
          >
            {isPending ? "Saving…" : "Save changes"}
          </button>
        </form>
      )}
    </section>
  );
};

export default OllamaSettings;
