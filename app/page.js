import PixelDesk from "@/components/dashboard/PixelDesk";
import ThemeToggle from "@/components/theme/ThemeToggle";

const AUTH_ERROR_MESSAGES = {
  database_policy_failed: "Veritabanı RLS policy ayarı eksik.",
  database_schema_missing: "Supabase veritabanı şeması kurulmamış.",
  missing_code: "Giriş kodu alınamadı.",
  missing_42_login: "42 login bilgisi alınamadı.",
  provider_profile_missing_id: "42 profil kimliği Supabase'e map edilemedi.",
  profile_sync_failed: "Profil eşitleme tamamlanamadı.",
  provider_start_failed: "42 giriş akışı başlatılamadı.",
  session_exchange_failed: "Oturum doğrulaması tamamlanamadı.",
};

const FEATURES = [
  { emoji: "🪙", label: "Logtime → LogCoin dönüşümü" },
  { emoji: "🔥", label: "Günlük streak bonusları" },
  { emoji: "🏆", label: "Liderlik tablosu" },
  { emoji: "🛒", label: "Masanı geliştir, market'ten al" },
];

export default async function LoginPage({ searchParams }) {
  const params = await searchParams;
  const authError = Array.isArray(params?.auth_error)
    ? params.auth_error[0]
    : params?.auth_error;
  const errorMessage = authError
    ? (AUTH_ERROR_MESSAGES[authError] ?? "42 giriş akışı tamamlanamadı.")
    : null;

  return (
    <main className="min-h-screen text-g42-ink bg-[radial-gradient(var(--g42-grid)_1px,transparent_1px),linear-gradient(180deg,var(--g42-bg),var(--g42-bg-2))] [background-size:12px_12px,auto] flex items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-[980px] grid grid-cols-1 min-[920px]:grid-cols-[minmax(0,1.15fr)_minmax(280px,0.9fr)] gap-4 items-start">
        {/* ── Left: Title card + Pixel desk scene ── */}
        <div className="flex flex-col gap-4">
          {/* Hero title card */}
          <div className="nes-container !bg-g42-paper ![font-family:var(--font-pixelify),system-ui,sans-serif] shadow-[0_5px_0_var(--g42-line)] relative overflow-hidden">
            {/* Pixel sun decoration */}
            <div
              aria-hidden="true"
              className="absolute right-[18px] top-[14px] w-[44px] h-[44px] bg-g42-coin border-[3px] border-g42-line shadow-[3px_3px_0_var(--g42-coin-d)]"
            />
            <p className="m-0 font-[var(--font-silkscreen),monospace] text-[9px] tracking-wide text-g42-muted uppercase">
              42 İstanbul · Daily Grind Oyunu
            </p>
            <h1 className="m-0 mt-1 font-[var(--font-silkscreen),monospace] text-g42-ink text-[clamp(28px,4.8vw,48px)] leading-[0.94]">
              42 Tycoon
              <br />
              <span className="text-g42-accent">LogTime</span> Grind
            </h1>
            <p className="m-0 mt-3 text-g42-ink-soft text-[17px] leading-snug max-w-[460px] max-[560px]:text-[15px]">
              Kampüste geçirdiğin süre{" "}
              <span className="font-bold text-g42-coin-d">LogCoin</span>
              &apos;e dönüşür. Serini koru, masanı geliştir, sıralamaya çık.
            </p>
          </div>

          {/* Pixel art desk scene — standalone, no redundant wrapper */}
          <PixelDesk
            inventory={[
              "ergonomic_chair",
              "mech_keyboard",
              "dual_monitor",
              "pixel_cat",
              "loba_cup",
            ]}
          />
        </div>

        {/* ── Right: Login card ── */}
        <section className="nes-container with-title !p-[22px] ![font-family:var(--font-pixelify),system-ui,sans-serif] flex flex-col gap-5 shadow-[0_5px_0_var(--g42-line)]">
          <p className="title">Giriş Yap</p>

          {/* Card header */}
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="m-0 font-[var(--font-silkscreen),monospace] text-g42-accent-2 text-[17px]">
                Cluster Kapısı
              </p>
              <p className="m-0 mt-2 text-[16px] leading-snug text-g42-ink-soft">
                42 hesabınla giriş yap, dünkü logtime ödülünü güvenli backend
                üzerinden topla.
              </p>
            </div>
            <ThemeToggle />
          </div>

          {/* Feature list */}
          <ul className="list-none p-0 m-0 flex flex-col gap-[10px] border-t-[3px] border-g42-line pt-[18px]">
            {FEATURES.map(({ emoji, label }) => (
              <li
                key={label}
                className="flex items-center gap-3 text-[14px] text-g42-ink-soft"
              >
                <span className="text-[17px] leading-none" aria-hidden="true">
                  {emoji}
                </span>
                <span>{label}</span>
              </li>
            ))}
          </ul>

          {/* Auth error */}
          {errorMessage && (
            <div className="nes-container !bg-g42-paper shadow-[0_3px_0_var(--g42-line)] !p-3">
              <p className="nes-text is-error text-[12px] leading-loose m-0">
                {errorMessage}
              </p>
            </div>
          )}

          {/* CTA */}
          <div className="flex flex-col gap-3 mt-auto">
            <a
              href="/auth/sign-in"
              className="nes-btn is-primary block w-full text-center"
            >
              42 ile Giriş Yap
            </a>
            <p className="m-0 text-[12px] text-g42-muted text-center leading-snug">
              Supabase Auth + 42 OAuth · Güvenli giriş
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
