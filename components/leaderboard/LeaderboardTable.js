"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import ProfileAvatar from "@/components/ProfileAvatar";

const TABS = [
  { id: "weekly", label: "Bu Hafta" },
  { id: "allTime", label: "Tüm Zamanlar" },
];

const EMPTY_METRIC = {
  activePlayers: 0,
  currentUser: null,
  label: "",
  rows: [],
  scoreLabel: "LogCoin",
  topScore: 0,
  totalPlayers: 0,
  totalScore: 0,
};

const NUMBER_FORMAT = new Intl.NumberFormat("tr-TR");

function formatNumber(value) {
  return NUMBER_FORMAT.format(Number(value ?? 0));
}

function formatRank(rank) {
  return rank ? `#${rank}` : "-";
}

function getRankTone(rank) {
  if (rank === 1) return "bg-g42-coin text-g42-coin-ink";
  if (rank === 2) return "bg-g42-sky text-g42-ink";
  if (rank === 3) return "bg-g42-accent-soft text-g42-ink";

  return "bg-g42-bg-2 text-g42-ink";
}

function getDisplayName(row) {
  return row?.display_name ?? row?.intra_login ?? "cadet";
}

function StatTile({ label, value }) {
  return (
    <div className="min-w-0 border-[3px] border-g42-line bg-g42-paper-2 px-3 py-2 shadow-[3px_3px_0_var(--g42-line)]">
      <p className="m-0 text-[8px] uppercase leading-4 text-g42-muted">
        {label}
      </p>
      <p className="m-0 mt-1 truncate font-[var(--font-silkscreen),monospace] text-[14px] leading-5 text-g42-ink">
        {value}
      </p>
    </div>
  );
}

function TabButton({ active, children, onClick }) {
  return (
    <button
      aria-pressed={active}
      className={[
        "nes-btn min-w-[128px] px-3 py-2 text-[10px]",
        active ? "is-primary" : "",
      ].join(" ")}
      onClick={onClick}
      type="button"
    >
      {children}
    </button>
  );
}

function PodiumCard({ row }) {
  if (!row) {
    return (
      <article className="min-h-[154px] border-[3px] border-dashed border-g42-line bg-g42-paper-2 px-4 py-4 opacity-70">
        <p className="m-0 font-[var(--font-silkscreen),monospace] text-[11px] text-g42-muted">
          Boş slot
        </p>
      </article>
    );
  }

  return (
    <article
      className={[
        "relative min-h-[154px] overflow-hidden border-[3px] border-g42-line bg-g42-paper px-4 py-4 shadow-[4px_4px_0_var(--g42-line)]",
        row.isCurrentUser ? "ring-[3px] ring-g42-accent" : "",
      ].join(" ")}
    >
      <div className="absolute right-3 top-3 font-[var(--font-silkscreen),monospace] text-[32px] leading-none text-g42-coin-d opacity-25">
        {formatRank(row.rank)}
      </div>
      <div className="relative flex items-start gap-3">
        <span
          className={[
            "grid h-11 w-11 shrink-0 place-items-center border-[3px] border-g42-line font-[var(--font-silkscreen),monospace] text-[13px] shadow-[3px_3px_0_var(--g42-line)]",
            getRankTone(row.rank),
          ].join(" ")}
        >
          {row.rank}
        </span>
        <div className="min-w-0">
          <ProfileAvatar
            className="mb-3 border-g42-line"
            label={getDisplayName(row)}
            size={38}
            src={row.profile_image_url}
          />
          <p className="m-0 truncate font-[var(--font-silkscreen),monospace] text-[14px] leading-5 text-g42-ink">
            {getDisplayName(row)}
          </p>
          <p className="m-0 mt-1 truncate text-[12px] leading-5 text-g42-muted">
            @{row.intra_login}
          </p>
        </div>
      </div>
      <div className="relative mt-4 flex items-end justify-between gap-3">
        <p className="m-0 font-[var(--font-silkscreen),monospace] text-[18px] leading-none text-g42-coin-d">
          {formatNumber(row.score)} LC
        </p>
        <p className="m-0 whitespace-nowrap text-[12px] leading-5 text-g42-ink-soft">
          {formatNumber(row.current_streak)}g seri
        </p>
      </div>
    </article>
  );
}

function CurrentUserPanel({ row, scoreLabel }) {
  if (!row) {
    return (
      <div className="border-[3px] border-g42-line bg-g42-paper-2 p-4 shadow-[4px_4px_0_var(--g42-line)]">
        <p className="m-0 font-[var(--font-silkscreen),monospace] text-[12px] text-g42-muted">
          Sıra bilgisi bekleniyor
        </p>
        <p className="m-0 mt-2 text-[14px] leading-6 text-g42-ink-soft">
          Kullanıcı satırın henüz liderlik verisinde görünmüyor.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-3 border-[3px] border-g42-line bg-g42-coin px-4 py-3 text-g42-coin-ink shadow-[4px_4px_0_var(--g42-line)] min-[760px]:grid-cols-[auto_1fr_auto] min-[760px]:items-center">
      <div className="font-[var(--font-silkscreen),monospace] text-[26px] leading-none">
        {formatRank(row.rank)}
      </div>
      <div className="flex min-w-0 items-center gap-3">
        <ProfileAvatar
          className="border-g42-line"
          label={getDisplayName(row)}
          size={40}
          src={row.profile_image_url}
        />
        <div className="min-w-0">
          <p className="m-0 truncate font-[var(--font-silkscreen),monospace] text-[13px] leading-5">
            {getDisplayName(row)}
          </p>
          <p className="m-0 truncate text-[12px] leading-5">@{row.intra_login}</p>
        </div>
      </div>
      <div className="min-[760px]:text-right">
        <p className="m-0 text-[9px] uppercase leading-4">{scoreLabel}</p>
        <p className="m-0 font-[var(--font-silkscreen),monospace] text-[16px] leading-5">
          {formatNumber(row.score)} LC
        </p>
      </div>
    </div>
  );
}

function EmptyState({ errorMessage }) {
  return (
    <div className="border-[3px] border-dashed border-g42-line bg-g42-paper-2 p-6 text-center">
      <p className="m-0 font-[var(--font-silkscreen),monospace] text-[13px] leading-6 text-g42-accent-2">
        {errorMessage ? "Veri alınamadı" : "Sıralama henüz boş"}
      </p>
      <p className="m-0 mx-auto mt-2 max-w-[520px] text-[15px] leading-6 text-g42-ink-soft">
        {errorMessage ??
          "İlk claim veya click sync tamamlandığında tablo otomatik olarak dolacak."}
      </p>
    </div>
  );
}

function DesktopTable({ rows, scoreLabel }) {
  return (
    <div className="hidden overflow-x-auto min-[760px]:block">
      <table className="nes-table is-bordered g42-rank-table min-w-[720px] !bg-g42-paper !text-g42-ink w-full text-xs">
        <thead>
          <tr>
            <th className="align-middle !bg-g42-paper !text-g42-ink">#</th>
            <th className="align-middle !bg-g42-paper !text-g42-ink">
              Kullanıcı
            </th>
            <th className="align-middle !bg-g42-paper !text-g42-ink">
              {scoreLabel}
            </th>
            <th className="align-middle !bg-g42-paper !text-g42-ink">Seri</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              className={row.isCurrentUser ? "g42-current-player" : undefined}
              key={`${row.rank}-${row.intra_login}`}
            >
              <td className="align-middle !bg-g42-paper !text-g42-ink">
                <span
                  className={[
                    "inline-grid h-[34px] w-[34px] place-items-center border-[3px] border-g42-line font-[var(--font-silkscreen),monospace]",
                    getRankTone(row.rank),
                  ].join(" ")}
                >
                  {row.rank}
                </span>
              </td>
              <td className="align-middle !bg-g42-paper !text-g42-ink">
                <div className="flex min-w-0 items-center gap-2">
                  <ProfileAvatar
                    className="border-g42-line"
                    label={getDisplayName(row)}
                    size={30}
                    src={row.profile_image_url}
                  />
                  <div className="min-w-0">
                    <p className="m-0 truncate font-[var(--font-silkscreen),monospace] text-[11px] leading-5">
                      {getDisplayName(row)}
                    </p>
                    <p className="m-0 truncate text-[11px] leading-4 text-g42-muted">
                      @{row.intra_login}
                    </p>
                  </div>
                </div>
              </td>
              <td className="align-middle !bg-g42-paper !text-g42-ink font-[var(--font-silkscreen),monospace] tracking-[0]">
                {formatNumber(row.score)} LC
              </td>
              <td className="align-middle !bg-g42-paper !text-g42-ink font-[var(--font-silkscreen),monospace] tracking-[0]">
                {formatNumber(row.current_streak)}g
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function MobileRows({ rows, scoreLabel }) {
  return (
    <div className="grid gap-3 min-[760px]:hidden">
      {rows.map((row) => (
        <article
          className={[
            "grid grid-cols-[auto_1fr] gap-3 border-[3px] border-g42-line bg-g42-paper-2 p-3 shadow-[3px_3px_0_var(--g42-line)]",
            row.isCurrentUser ? "!bg-g42-coin !text-g42-coin-ink" : "",
          ].join(" ")}
          key={`${row.rank}-${row.intra_login}`}
        >
          <span
            className={[
              "grid h-10 w-10 place-items-center border-[3px] border-g42-line font-[var(--font-silkscreen),monospace] text-[12px]",
              getRankTone(row.rank),
            ].join(" ")}
          >
            {row.rank}
          </span>
          <div className="min-w-0">
            <div className="flex min-w-0 items-center gap-2">
              <ProfileAvatar
                className="border-g42-line"
                label={getDisplayName(row)}
                size={30}
                src={row.profile_image_url}
              />
              <div className="min-w-0">
                <p className="m-0 truncate font-[var(--font-silkscreen),monospace] text-[12px] leading-5">
                  {getDisplayName(row)}
                </p>
                <p className="m-0 truncate text-[11px] leading-4">
                  @{row.intra_login}
                </p>
              </div>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2 text-[11px] leading-5">
              <span>{scoreLabel}</span>
              <strong className="text-right font-[var(--font-silkscreen),monospace]">
                {formatNumber(row.score)} LC
              </strong>
              <span>Seri</span>
              <strong className="text-right font-[var(--font-silkscreen),monospace]">
                {formatNumber(row.current_streak)}g
              </strong>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}

export default function LeaderboardTable({ errorMessage, leaderboard }) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("weekly");
  const [isPending, startTransition] = useTransition();
  const metric = leaderboard?.[activeTab] ?? EMPTY_METRIC;
  const podiumRows = useMemo(() => metric.rows.slice(0, 3), [metric.rows]);
  const rows = metric.rows;

  function refreshLeaderboard() {
    startTransition(() => {
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-[18px]">
      <section className="nes-container min-w-0 !bg-g42-paper shadow-[0_5px_0_var(--g42-line)] ![font-family:var(--font-pixelify),system-ui,sans-serif] with-title">
        <p className="title">High Scores</p>
        <div className="grid gap-4 min-[760px]:grid-cols-[1fr_auto] min-[760px]:items-start">
          <div className="min-w-0">
            <p className="m-0 font-[var(--font-silkscreen),monospace] tracking-[0] text-g42-accent-2 text-[18px] leading-7">
              Kampüs Sıralaması
            </p>
            <p className="m-0 mt-2 max-w-[720px] text-[17px] leading-snug text-g42-ink-soft">
              Haftanın grind listesi ve tüm zamanlar LogCoin tablosu tek ekranda.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 min-[760px]:justify-end">
            <span className="border-[3px] border-g42-line bg-g42-paper-2 px-3 py-2 font-[var(--font-silkscreen),monospace] text-[9px] text-g42-muted shadow-[3px_3px_0_var(--g42-line)]">
              {leaderboard?.generatedAtLabel
                ? `Son güncelleme ${leaderboard.generatedAtLabel}`
                : "Veri bekleniyor"}
            </span>
            <button
              className="nes-btn px-3 py-2 text-[10px]"
              disabled={isPending}
              onClick={refreshLeaderboard}
              type="button"
            >
              {isPending ? "Yenileniyor" : "Yenile"}
            </button>
          </div>
        </div>
      </section>

      <section className="grid gap-3 min-[760px]:grid-cols-4">
        <StatTile label="Toplam Cadet" value={formatNumber(metric.totalPlayers)} />
        <StatTile label="Aktif Skor" value={formatNumber(metric.activePlayers)} />
        <StatTile label="Lider Skor" value={`${formatNumber(metric.topScore)} LC`} />
        <StatTile label="Havuz" value={`${formatNumber(metric.totalScore)} LC`} />
      </section>

      <section className="flex flex-wrap gap-2">
        {TABS.map((tab) => (
          <TabButton
            active={activeTab === tab.id}
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </TabButton>
        ))}
      </section>

      {errorMessage || rows.length === 0 ? (
        <EmptyState errorMessage={errorMessage} />
      ) : (
        <>
          <section className="grid gap-3 min-[760px]:grid-cols-3">
            {podiumRows.map((row) => (
              <PodiumCard key={`${row.rank}-${row.intra_login}`} row={row} />
            ))}
            {podiumRows.length < 3 &&
              Array.from({ length: 3 - podiumRows.length }).map((_, index) => (
                <PodiumCard key={`empty-${index}`} row={null} />
              ))}
          </section>

          <CurrentUserPanel
            row={metric.currentUser}
            scoreLabel={metric.scoreLabel}
          />

          <section className="nes-container min-w-0 !bg-g42-paper shadow-[0_5px_0_var(--g42-line)] ![font-family:var(--font-pixelify),system-ui,sans-serif] with-title">
            <p className="title">Skor Tablosu</p>
            <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="m-0 font-[var(--font-silkscreen),monospace] text-[13px] leading-5 text-g42-accent-2">
                  {metric.label}
                </p>
                <p className="m-0 mt-1 text-[14px] leading-5 text-g42-ink-soft">
                  İlk {leaderboard?.limit ?? 20} cadet listeleniyor.
                </p>
              </div>
              <p className="m-0 font-[var(--font-silkscreen),monospace] text-[10px] leading-5 text-g42-muted">
                Tie-break: skor / seri / login
              </p>
            </div>
            <DesktopTable rows={rows} scoreLabel={metric.scoreLabel} />
            <MobileRows rows={rows} scoreLabel={metric.scoreLabel} />
          </section>
        </>
      )}
    </div>
  );
}
