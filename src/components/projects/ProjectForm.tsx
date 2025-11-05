import { useEffect } from "react";
import { useForm } from "react-hook-form";

import { useCreateProject } from "../../hooks/useProjects";
import type { CreateProjectPayload } from "../../api-client/projects";

type ProjectFormProps = {
  onCreated?: (projectId: string) => void;
  onCancel?: () => void;
};

const defaultValues: CreateProjectPayload = {
  name: "",
  description: "",
  framework: "react",
  runtime: "node",
  model: "codellama"
};

const ProjectForm = ({ onCreated, onCancel }: ProjectFormProps) => {
  const { register, handleSubmit, reset } = useForm<CreateProjectPayload>({
    defaultValues
  });
  const { mutateAsync, isPending } = useCreateProject();

  useEffect(() => {
    reset(defaultValues);
  }, [reset]);

  const onSubmit = async (values: CreateProjectPayload) => {
    const project = await mutateAsync(values);
    if (project && onCreated) {
      onCreated(project.id);
    }
    reset(defaultValues);
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="rounded-xl border border-slate-800 bg-slate-900/70 p-4"
    >
      <div className="grid gap-4 md:grid-cols-2">
        <label className="flex flex-col gap-2 text-xs text-slate-400">
          Project name
          <input
            {...register("name", { required: true })}
            placeholder="Astro Analytics"
            className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white focus:border-kb-primary focus:outline-none"
            required
          />
        </label>
        <label className="flex flex-col gap-2 text-xs text-slate-400">
          Target model
          <input
            {...register("model", { required: true })}
            placeholder="codellama"
            className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white focus:border-kb-primary focus:outline-none"
            required
          />
        </label>
        <label className="flex flex-col gap-2 text-xs text-slate-400 md:col-span-2">
          Description
          <textarea
            {...register("description")}
            rows={2}
            placeholder="Offline CRM for field technicians"
            className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white focus:border-kb-primary focus:outline-none"
          />
        </label>
        <label className="flex flex-col gap-2 text-xs text-slate-400">
          Framework
          <select
            {...register("framework", { required: true })}
            className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white focus:border-kb-primary focus:outline-none"
          >
            <option value="react">React + Vite</option>
            <option value="next">Next.js (static)</option>
            <option value="express">Express</option>
            <option value="fastapi">FastAPI</option>
            <option value="django">Django</option>
            <option value="laravel">Laravel</option>
            <option value="custom">Custom</option>
          </select>
        </label>
        <label className="flex flex-col gap-2 text-xs text-slate-400">
          Runtime
          <select
            {...register("runtime", { required: true })}
            className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white focus:border-kb-primary focus:outline-none"
          >
            <option value="node">Node.js</option>
            <option value="python">Python</option>
            <option value="php">PHP</option>
            <option value="static">Static</option>
            <option value="mixed">Hybrid</option>
          </select>
        </label>
      </div>
      <div className="mt-4 flex gap-2">
        <button
          type="submit"
          className="rounded-lg bg-kb-primary px-4 py-2 text-sm font-medium text-slate-950 transition hover:bg-sky-300 disabled:opacity-50"
          disabled={isPending}
        >
          {isPending ? "Creating…" : "Create project"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-300"
        >
          Cancel
        </button>
      </div>
    </form>
  );
};

export default ProjectForm;
