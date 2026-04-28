export default function Loading() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-4xl flex-col px-6 py-8 lg:px-10">
      <div className="rounded-[2rem] border border-white/10 bg-white/6 p-8">
        <div className="h-4 w-32 animate-pulse rounded-full bg-white/10" />
        <div className="mt-4 h-10 w-80 animate-pulse rounded-2xl bg-white/10" />
        <div className="mt-8 h-52 animate-pulse rounded-[2rem] bg-white/8" />
      </div>
    </main>
  );
}
