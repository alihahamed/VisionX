import { RepoSubmission } from "@/components/repo-submission";

const highlights = [
  {
    title: "Decision moments",
    body: "Surface commits that changed the direction of the project, not just volume of output.",
  },
  {
    title: "Influence graph",
    body: "Map who created the surface area others built on top of.",
  },
  {
    title: "Explainable narratives",
    body: "Every role tag and summary links back to evidence.",
  },
];

export default function Home() {
  const backendDocsUrl = `${process.env.NEXT_PUBLIC_API_BASE_URL ?? "/backend-api"}/docs`;

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-6 py-8 lg:px-10">
      <header className="flex items-center justify-between border-b border-white/8 pb-6">
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-amber-200/70">Proof of Thinking</p>
          <h1 className="mt-2 text-2xl font-semibold text-white">See who shaped the project</h1>
        </div>
        <a
          href={backendDocsUrl}
          target="_blank"
          rel="noreferrer"
          className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-200 transition hover:border-amber-300/30 hover:bg-amber-300/10"
        >
          Backend docs
        </a>
      </header>

      <section className="grid flex-1 gap-8 py-12 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
        <div className="max-w-3xl space-y-6">
          <div className="inline-flex rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs uppercase tracking-[0.3em] text-slate-300">
            Git history intelligence
          </div>
          <h2 className="text-5xl font-semibold leading-tight text-white md:text-6xl">
            Turn commits into
            <span className="text-amber-200"> decision evidence</span>.
          </h2>
          <p className="max-w-2xl text-lg leading-8 text-slate-300">
            Drop in a public GitHub repo. The backend mines commit history, finds key decision
            moments, builds an influence graph, and returns contributor narratives you can inspect.
          </p>

          <RepoSubmission />

          <div className="grid gap-4 md:grid-cols-3">
            {highlights.map((item) => (
              <article
                key={item.title}
                className="rounded-[1.5rem] border border-white/8 bg-white/5 p-4"
              >
                <h3 className="text-sm font-semibold text-white">{item.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-400">{item.body}</p>
              </article>
            ))}
          </div>
        </div>

        <aside className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(15,23,42,0.86),rgba(2,6,23,0.94))] p-6">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(251,191,36,0.18),transparent_36%)]" />
          <div className="relative space-y-4">
            <p className="text-xs uppercase tracking-[0.3em] text-white/40">Live pipeline</p>
            <div className="space-y-3">
              {["Clone repo", "Classify commits", "Detect decisions", "Build graph", "Narrate impact"].map((item, index) => (
                <div
                  key={item}
                  className="flex items-center gap-3 rounded-2xl border border-white/8 bg-white/5 px-4 py-3"
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-300/15 text-sm font-semibold text-amber-200">
                    {index + 1}
                  </span>
                  <div>
                    <p className="text-sm font-medium text-white">{item}</p>
                    <p className="text-xs text-slate-400">Backend-owned analysis step</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </section>
    </main>
  );
}
