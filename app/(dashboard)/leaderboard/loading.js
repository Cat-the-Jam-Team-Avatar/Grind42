function SkeletonBox({ className = "" }) {
  return (
    <div
      className={[
        "animate-pulse border-[3px] border-g42-line bg-g42-paper-2",
        className,
      ].join(" ")}
    />
  );
}

export default function LeaderboardLoading() {
  return (
    <div className="flex flex-col gap-[18px]">
      <section className="nes-container min-w-0 !bg-g42-paper shadow-[0_5px_0_var(--g42-line)] ![font-family:var(--font-pixelify),system-ui,sans-serif] with-title">
        <p className="title">High Scores</p>
        <div className="grid gap-4 min-[760px]:grid-cols-[1fr_auto] min-[760px]:items-start">
          <div className="min-w-0">
            <SkeletonBox className="h-7 w-[min(360px,100%)]" />
            <SkeletonBox className="mt-3 h-6 w-[min(620px,100%)]" />
          </div>
          <div className="flex flex-wrap gap-2 min-[760px]:justify-end">
            <SkeletonBox className="h-10 w-40" />
            <SkeletonBox className="h-10 w-24" />
          </div>
        </div>
      </section>

      <section className="grid gap-3 min-[760px]:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <SkeletonBox className="h-[74px]" key={index} />
        ))}
      </section>

      <section className="flex flex-wrap gap-2">
        <SkeletonBox className="h-11 w-32" />
        <SkeletonBox className="h-11 w-36" />
      </section>

      <section className="grid gap-3 min-[760px]:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <SkeletonBox className="h-[154px]" key={index} />
        ))}
      </section>

      <SkeletonBox className="h-[82px]" />

      <section className="nes-container min-w-0 !bg-g42-paper shadow-[0_5px_0_var(--g42-line)] ![font-family:var(--font-pixelify),system-ui,sans-serif] with-title">
        <p className="title">Skor Tablosu</p>
        <div className="grid gap-3">
          {Array.from({ length: 8 }).map((_, index) => (
            <SkeletonBox className="h-12" key={index} />
          ))}
        </div>
      </section>
    </div>
  );
}
