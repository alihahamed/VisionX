export default function Loading() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-6 py-8 lg:px-10">
      <div className="rounded-[2rem] border border-white/10 bg-white/6 p-8">
        <div className="h-4 w-28 animate-pulse rounded-full bg-white/10" />
        <div className="mt-5 h-10 w-72 animate-pulse rounded-2xl bg-white/10" />
        <div className="mt-10 grid gap-6 xl:grid-cols-2">
          <div className="h-80 animate-pulse rounded-[2rem] bg-white/8" />
          <div className="h-80 animate-pulse rounded-[2rem] bg-white/8" />
        </div>
        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <div className="h-48 animate-pulse rounded-[1.75rem] bg-white/8" />
          <div className="h-48 animate-pulse rounded-[1.75rem] bg-white/8" />
          <div className="h-48 animate-pulse rounded-[1.75rem] bg-white/8" />
        </div>
      </div>
    </main>
  );
}
