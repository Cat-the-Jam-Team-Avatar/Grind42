import PixelDesk from "@/components/dashboard/PixelDesk";
import ThemeToggle from "@/components/theme/ThemeToggle";

const AUTH_ERROR_MESSAGES = {
  database_policy_failed: "Veritabanı yapılandırması eksik.",
  database_schema_missing: "Veritabanı şeması kurulmamış.",
  missing_code: "Giriş kodu alınamadı.",
  missing_42_login: "42 hesap bilgisi alınamadı.",
  provider_profile_missing_id: "42 profil kimliği doğrulanamadı.",
  profile_sync_failed: "Profil güncellenemedi.",
  provider_start_failed: "42 girişi başlatılamadı.",
  session_exchange_failed: "Oturum doğrulaması başarısız.",
};

const FEATURES = [
  { icon: "🪙", label: "LogTime → LogCoin dönüşümü" },
  { icon: "🔥", label: "Günlük streak bonusları" },
  { icon: "🏆", label: "Liderlik tablosu" },
  { icon: "🛒", label: "Market & masa yükseltmeleri" },
];

export default async function LoginPage({ searchParams }) {
  const params = await searchParams;
  const authError = Array.isArray(params?.auth_error)
    ? params.auth_error[0]
    : params?.auth_error;
  const errorMessage = authError
    ? (AUTH_ERROR_MESSAGES[authError] ?? "Giriş tamamlanamadı.")
    : null;

  return (
    <main className="relative min-h-screen text-g42-ink bg-[radial-gradient(var(--g42-grid)_1px,transparent_1px),linear-gradient(180deg,var(--g42-bg),var(--g42-bg-2))] [background-size:12px_12px,auto] flex items-center justify-center p-4 sm:p-6">

      {/* Floating theme toggle */}
      <div className="absolute top-4 right-4 z-10">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-[960px] grid grid-cols-1 min-[860px]:grid-cols-[1fr_320px] gap-5 items-center">

        {/* ── Left: Hero ── */}
        <div className="flex flex-col gap-4">

          {/* Title card */}
          <div className="nes-container !bg-g42-paper shadow-[0_5px_0_var(--g42-line)] relative overflow-hidden">
            {/* Pixel sun */}
            <div
              aria-hidden="true"
              className="absolute right-4 top-4 w-10 h-10 bg-g42-coin border-[3px] border-g42-line shadow-[3px_3px_0_var(--g42-coin-d)]"
            />
            <p className="m-0 font-[var(--font-silkscreen),monospace] text-[9px] text-g42-muted uppercase tracking-wide">
              42 İstanbul · Daily Grind
            </p>
            <h1 className="m-0 mt-1 font-[var(--font-silkscreen),monospace] text-g42-ink text-[clamp(26px,5vw,50px)] leading-[0.92]">
              42 Tycoon
              <br />
              <span className="text-g42-accent">LogTime</span> Grind
            </h1>
            <p className="m-0 mt-3 text-g42-ink-soft text-[16px] leading-snug max-w-[440px]">
              Kampüste geçirdiğin süre{" "}
              <strong className="text-g42-coin-d">LogCoin</strong>&apos;e dönüşür.
              Serini koru, masanı geliştir, tabloya çık.
            </p>
          </div>

          {/* Pixel desk scene */}
          <PixelDesk
            inventory={["ergonomic_chair", "mech_keyboard", "dual_monitor", "pixel_cat", "loba_cup"]}
          />
        </div>

        {/* ── Right: Login card ── */}
        <section className="nes-container with-title !p-5 flex flex-col gap-4 shadow-[0_5px_0_var(--g42-line)] self-start min-[860px]:self-center">
          <p className="title">Giriş Yap</p>

          <div>
            <p className="m-0 font-[var(--font-silkscreen),monospace] text-g42-accent-2 text-[15px]">
              Cluster Kapısı
            </p>
            <p className="m-0 mt-2 text-[14px] text-g42-ink-soft leading-snug">
              42 hesabınla giriş yap ve oynamaya başla.
            </p>
          </div>

          {/* Features */}
          <ul className="m-0 p-0 list-none flex flex-col gap-2 border-t-[3px] border-g42-line pt-4">
            {FEATURES.map(({ icon, label }) => (
              <li key={label} className="flex items-center gap-2 text-[13px] text-g42-ink-soft">
                <span className="shrink-0 text-[15px]" aria-hidden="true">{icon}</span>
                <span>{label}</span>
              </li>
            ))}
          </ul>

          {/* Error */}
          {errorMessage && (
            <div className="nes-container !bg-g42-paper !p-3 shadow-[0_3px_0_var(--g42-line)]">
              <p className="m-0 nes-text is-error text-[11px] leading-relaxed">{errorMessage}</p>
            </div>
          )}

          {/* CTA */}
          <a
            href="/auth/sign-in"
            className="nes-btn is-primary block w-full text-center mt-1"
          >
            42 ile Giriş Yap
          </a>
        </section>

      </div>
    </main>
  );
}
