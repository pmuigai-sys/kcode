type WelcomeHeroProps = {
  stats: Array<{ label: string; value: string; hint: string }>;
};

const WelcomeHero = ({ stats }: WelcomeHeroProps) => {
  return (
    <section className="flex flex-col gap-6 rounded-2xl border border-slate-800 bg-slate-950/70 p-8 shadow-softer">
      <div className="flex flex-col gap-2">
        <h2 className="text-2xl font-semibold">Welcome back, Maker</h2>
        <p className="max-w-2xl text-sm text-slate-400">
          Kitana Builder keeps your entire application lifecycle offline—from prompting
          local Ollama models to running builds with zero external calls. Continue a
          project or spin up something entirely new.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl border border-slate-800 bg-slate-900/60 px-4 py-5"
          >
            <p className="text-xs uppercase tracking-wide text-slate-500">
              {stat.label}
            </p>
            <p className="text-3xl font-semibold text-white">{stat.value}</p>
            <p className="text-xs text-slate-400">{stat.hint}</p>
          </div>
        ))}
      </div>
    </section>
  );
};

export default WelcomeHero;
