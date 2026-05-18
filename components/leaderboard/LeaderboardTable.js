"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import ProfileAvatar from "@/components/ProfileAvatar";

const TABS = [
  { id: "weekly", label: "Bu Hafta" },
  { id: "allTime", label: "Tüm Zamanlar" },
  { id: "coalition", label: "Koalisyon" },
];

const COALITION_METRIC_TABS = [
  { id: "weekly", label: "Haftalık" },
  { id: "allTime", label: "Toplam" },
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

function getCoalitionName(coalition) {
  return coalition?.name ?? coalition?.slug ?? "Koalisyon yok";
}

function CoalitionBadge({ coalition }) {
  if (!coalition) {
    return (
      <span className="inline-flex max-w-full items-center gap-2 truncate text-[11px] leading-4 text-g42-muted">
        <span className="h-3 w-3 shrink-0 border-[2px] border-g42-line bg-g42-bg-2" />
        <span className="truncate">Koalisyon yok</span>
      </span>
    );
  }

  return (
    <span className="inline-flex max-w-full items-center gap-2 truncate text-[11px] leading-4 text-g42-ink-soft">
      <span
        className="h-3 w-3 shrink-0 border-[2px] border-g42-line"
        style={{ backgroundColor: coalition.color ?? "var(--g42-accent)" }}
      />
      <span className="truncate">{getCoalitionName(coalition)}</span>
    </span>
  );
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
          <div className="mt-2">
            <CoalitionBadge coalition={row.coalition} />
          </div>
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
          <div className="mt-1">
            <CoalitionBadge coalition={row.coalition} />
          </div>
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

function CoalitionControls({
  metricId,
  onMetricChange,
  onSelect,
  options,
  selectedCoalition,
  selectedSlug,
}) {
  if (options.length === 0) {
    return (
      <section className="border-[3px] border-dashed border-g42-line bg-g42-paper-2 p-4 text-g42-ink-soft">
        <p className="m-0 font-[var(--font-silkscreen),monospace] text-[12px] leading-5 text-g42-accent-2">
          Koalisyon verisi bekleniyor
        </p>
        <p className="m-0 mt-1 text-[14px] leading-5">
          Backfill veya yeni giriş senkronizasyonu tamamlanınca koalisyon filtresi dolacak.
        </p>
      </section>
    );
  }

  return (
    <section className="grid gap-3 border-[3px] border-g42-line bg-g42-paper-2 p-3 shadow-[4px_4px_0_var(--g42-line)] min-[760px]:grid-cols-[minmax(220px,320px)_1fr_auto] min-[760px]:items-end">
      <label className="min-w-0">
        <span className="mb-1 block font-[var(--font-silkscreen),monospace] text-[9px] uppercase leading-4 text-g42-muted">
          Koalisyon
        </span>
        <select
          className="w-full border-[3px] border-g42-line bg-g42-paper px-3 py-2 font-[var(--font-pixelify),system-ui,sans-serif] text-[14px] leading-5 text-g42-ink shadow-[3px_3px_0_var(--g42-line)]"
          onChange={(event) => onSelect(event.target.value)}
          value={selectedSlug}
        >
          {options.map((option) => (
            <option key={option.slug} value={option.slug}>
              {option.name}
            </option>
          ))}
        </select>
      </label>

      <div className="min-w-0">
        <p className="m-0 mb-2 font-[var(--font-silkscreen),monospace] text-[9px] uppercase leading-4 text-g42-muted">
          Filtre
        </p>
        <div className="flex flex-wrap gap-2">
          {COALITION_METRIC_TABS.map((tab) => (
            <button
              aria-pressed={metricId === tab.id}
              className={[
                "nes-btn min-w-[108px] px-2 py-2 text-[10px]",
                metricId === tab.id ? "is-primary" : "",
              ].join(" ")}
              key={tab.id}
              onClick={() => onMetricChange(tab.id)}
              type="button"
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="min-w-0 border-[3px] border-g42-line bg-g42-paper px-3 py-2 shadow-[3px_3px_0_var(--g42-line)]">
        <p className="m-0 font-[var(--font-silkscreen),monospace] text-[9px] uppercase leading-4 text-g42-muted">
          Seçili
        </p>
        <div className="mt-1">
          <CoalitionBadge coalition={selectedCoalition} />
        </div>
        <p className="m-0 mt-1 text-[11px] leading-4 text-g42-ink-soft">
          {formatNumber(selectedCoalition?.totalPlayers ?? 0)} cadet
        </p>
      </div>
    </section>
  );
}

function CoalitionComparison({ standings }) {
  if (standings.length === 0) {
    return (
      <section className="border-[3px] border-dashed border-g42-line bg-g42-paper-2 p-4 text-g42-ink-soft">
        <p className="m-0 font-[var(--font-silkscreen),monospace] text-[12px] leading-5 text-g42-accent-2">
          Koalisyon karşılaştırması bekleniyor
        </p>
        <p className="m-0 mt-1 text-[14px] leading-5">
          Haftalık koalisyon toplamları, koalisyon backfill verisi geldikten sonra hesaplanacak.
        </p>
      </section>
    );
  }

  return (
    <section className="nes-container min-w-0 !bg-g42-paper shadow-[0_5px_0_var(--g42-line)] ![font-family:var(--font-pixelify),system-ui,sans-serif] with-title">
      <p className="title">Koalisyon Kapışması</p>
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <p className="m-0 font-[var(--font-silkscreen),monospace] text-[13px] leading-5 text-g42-accent-2">
            Haftalık Toplam LC
          </p>
          <p className="m-0 mt-1 text-[14px] leading-5 text-g42-ink-soft">
            Koalisyonlar bu hafta üyelerinin topladığı LogCoin toplamına göre sıralanır.
          </p>
        </div>
        <p className="m-0 font-[var(--font-silkscreen),monospace] text-[10px] leading-5 text-g42-muted">
          Tie-break: aktif cadet / üye / isim
        </p>
      </div>

      <div className="hidden overflow-x-auto min-[760px]:block">
        <table className="nes-table is-bordered g42-rank-table min-w-[760px] !bg-g42-paper !text-g42-ink w-full text-xs">
          <thead>
            <tr>
              <th className="align-middle !bg-g42-paper !text-g42-ink">#</th>
              <th className="align-middle !bg-g42-paper !text-g42-ink">
                Koalisyon
              </th>
              <th className="align-middle !bg-g42-paper !text-g42-ink">
                Haftalık LC
              </th>
              <th className="align-middle !bg-g42-paper !text-g42-ink">
                Aktif
              </th>
              <th className="align-middle !bg-g42-paper !text-g42-ink">
                Üye
              </th>
            </tr>
          </thead>
          <tbody>
            {standings.map((standing) => (
              <tr
                className={
                  standing.isCurrentUserCoalition
                    ? "g42-current-player"
                    : undefined
                }
                key={standing.coalition.slug}
              >
                <td className="align-middle !bg-g42-paper !text-g42-ink">
                  <span
                    className={[
                      "inline-grid h-[34px] w-[34px] place-items-center border-[3px] border-g42-line font-[var(--font-silkscreen),monospace]",
                      getRankTone(standing.rank),
                    ].join(" ")}
                  >
                    {standing.rank}
                  </span>
                </td>
                <td className="align-middle !bg-g42-paper !text-g42-ink">
                  <CoalitionBadge coalition={standing.coalition} />
                </td>
                <td className="align-middle !bg-g42-paper !text-g42-ink font-[var(--font-silkscreen),monospace] tracking-[0]">
                  {formatNumber(standing.weeklyScore)} LC
                </td>
                <td className="align-middle !bg-g42-paper !text-g42-ink font-[var(--font-silkscreen),monospace] tracking-[0]">
                  {formatNumber(standing.activePlayers)}
                </td>
                <td className="align-middle !bg-g42-paper !text-g42-ink font-[var(--font-silkscreen),monospace] tracking-[0]">
                  {formatNumber(standing.totalPlayers)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid gap-3 min-[760px]:hidden">
        {standings.map((standing) => (
          <article
            className={[
              "grid grid-cols-[auto_1fr] gap-3 border-[3px] border-g42-line bg-g42-paper-2 p-3 shadow-[3px_3px_0_var(--g42-line)]",
              standing.isCurrentUserCoalition
                ? "!bg-g42-coin !text-g42-coin-ink"
                : "",
            ].join(" ")}
            key={standing.coalition.slug}
          >
            <span
              className={[
                "grid h-10 w-10 place-items-center border-[3px] border-g42-line font-[var(--font-silkscreen),monospace] text-[12px]",
                getRankTone(standing.rank),
              ].join(" ")}
            >
              {standing.rank}
            </span>
            <div className="min-w-0">
              <CoalitionBadge coalition={standing.coalition} />
              <div className="mt-3 grid grid-cols-2 gap-2 text-[11px] leading-5">
                <span>Haftalık LC</span>
                <strong className="text-right font-[var(--font-silkscreen),monospace]">
                  {formatNumber(standing.weeklyScore)} LC
                </strong>
                <span>Aktif Cadet</span>
                <strong className="text-right font-[var(--font-silkscreen),monospace]">
                  {formatNumber(standing.activePlayers)}
                </strong>
                <span>Üye</span>
                <strong className="text-right font-[var(--font-silkscreen),monospace]">
                  {formatNumber(standing.totalPlayers)}
                </strong>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function EmptyState({ emptyMessage, errorMessage }) {
  return (
    <div className="border-[3px] border-dashed border-g42-line bg-g42-paper-2 p-6 text-center">
      <p className="m-0 font-[var(--font-silkscreen),monospace] text-[13px] leading-6 text-g42-accent-2">
        {errorMessage ? "Veri alınamadı" : "Sıralama henüz boş"}
      </p>
      <p className="m-0 mx-auto mt-2 max-w-[520px] text-[15px] leading-6 text-g42-ink-soft">
        {errorMessage ??
          emptyMessage ??
          "İlk claim veya click sync tamamlandığında tablo otomatik olarak dolacak."}
      </p>
    </div>
  );
}

function DesktopTable({ rows, scoreLabel }) {
  return (
    <div className="hidden overflow-x-auto min-[760px]:block">
      <table className="nes-table is-bordered g42-rank-table min-w-[860px] !bg-g42-paper !text-g42-ink w-full text-xs">
        <thead>
          <tr>
            <th className="align-middle !bg-g42-paper !text-g42-ink">#</th>
            <th className="align-middle !bg-g42-paper !text-g42-ink">
              Kullanıcı
            </th>
            <th className="align-middle !bg-g42-paper !text-g42-ink">
              Koalisyon
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
              <td className="align-middle !bg-g42-paper !text-g42-ink">
                <CoalitionBadge coalition={row.coalition} />
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
              <span>Koalisyon</span>
              <strong className="flex min-w-0 justify-end font-normal">
                <CoalitionBadge coalition={row.coalition} />
              </strong>
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
  const [coalitionMetricId, setCoalitionMetricId] = useState("weekly");
  const [isPending, startTransition] = useTransition();
  const coalitionOptions = leaderboard?.coalitions?.options ?? [];
  const coalitionStandings = leaderboard?.coalitions?.weeklyStandings ?? [];
  const preferredCoalitionSlug =
    leaderboard?.coalitions?.currentUserCoalitionSlug ?? "";
  const defaultCoalitionSlug = coalitionOptions.some(
    (option) => option.slug === preferredCoalitionSlug
  )
    ? preferredCoalitionSlug
    : coalitionOptions[0]?.slug ?? "";
  const [requestedCoalitionSlug, setRequestedCoalitionSlug] = useState("");
  const selectedCoalitionSlug = coalitionOptions.some(
    (option) => option.slug === requestedCoalitionSlug
  )
    ? requestedCoalitionSlug
    : defaultCoalitionSlug;
  const selectedCoalition =
    coalitionOptions.find((option) => option.slug === selectedCoalitionSlug) ??
    null;
  const isCoalitionTab = activeTab === "coalition";
  const metric = isCoalitionTab
    ? leaderboard?.coalitions?.metricsBySlug?.[selectedCoalitionSlug]?.[
        coalitionMetricId
      ] ?? EMPTY_METRIC
    : leaderboard?.[activeTab] ?? EMPTY_METRIC;
  const podiumRows = useMemo(() => metric.rows.slice(0, 3), [metric.rows]);
  const rows = metric.rows;
  const statLabels = isCoalitionTab
    ? {
        active: "Aktif Skor",
        leader: "Lider Skor",
        pool: "Koalisyon Havuzu",
        total: "Koalisyon Cadet",
      }
    : {
        active: "Aktif Skor",
        leader: "Lider Skor",
        pool: "Havuz",
        total: "Toplam Cadet",
      };
  const emptyMessage = isCoalitionTab
    ? "Koalisyon verisi profil senkronizasyonu veya backfill sonrası burada görünecek."
    : undefined;

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
              Haftanın grind listesi, tüm zamanlar ve koalisyon kapışması tek ekranda.
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
        <StatTile label={statLabels.total} value={formatNumber(metric.totalPlayers)} />
        <StatTile label={statLabels.active} value={formatNumber(metric.activePlayers)} />
        <StatTile label={statLabels.leader} value={`${formatNumber(metric.topScore)} LC`} />
        <StatTile label={statLabels.pool} value={`${formatNumber(metric.totalScore)} LC`} />
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

      {isCoalitionTab ? (
        <>
          <CoalitionComparison standings={coalitionStandings} />
          <CoalitionControls
            metricId={coalitionMetricId}
            onMetricChange={setCoalitionMetricId}
            onSelect={setRequestedCoalitionSlug}
            options={coalitionOptions}
            selectedCoalition={selectedCoalition}
            selectedSlug={selectedCoalitionSlug}
          />
        </>
      ) : null}

      {errorMessage || rows.length === 0 ? (
        <EmptyState emptyMessage={emptyMessage} errorMessage={errorMessage} />
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
