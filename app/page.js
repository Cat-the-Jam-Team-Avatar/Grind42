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

export default async function LoginPage({ searchParams }) {
  const params = await searchParams;
  const authError = Array.isArray(params?.auth_error)
    ? params.auth_error[0]
    : params?.auth_error;
  const errorMessage = authError
    ? AUTH_ERROR_MESSAGES[authError] ?? "42 giriş akışı tamamlanamadı."
    : null;

  return (
    <main className="grid min-h-screen place-items-center p-[22px] text-g42-ink bg-[radial-gradient(var(--g42-grid)_1px,transparent_1px),linear-gradient(180deg,var(--g42-bg),var(--g42-bg-2))] [background-size:12px_12px,auto]">
      <div className="grid [grid-template-columns:minmax(0,1.15fr)_minmax(260px,0.85fr)] gap-[18px] w-[min(980px,100%)] max-[920px]:[grid-template-columns:1fr]">
        <section className="nes-container relative overflow-hidden min-h-0 !bg-g42-paper shadow-[0_5px_0_var(--g42-line)] ![font-family:var(--font-pixelify),system-ui,sans-serif] before:content-[''] before:absolute before:inset-0 before:z-0 before:bg-[linear-gradient(180deg,var(--g42-sky),var(--g42-sky-2)_48%,var(--g42-bg-2)_48%),radial-gradient(circle_at_20%_22%,var(--g42-coin)_0_18px,transparent_19px)] [&>*]:relative [&>*]:z-[1] max-[560px]:min-h-[390px]">
          <div className="pt-[22px] px-[24px] pb-3 max-w-[590px] max-[560px]:p-[18px]">
            <p className="m-0 font-[var(--font-silkscreen),monospace] tracking-[0] text-g42-muted text-[10px]">42 İstanbul için daily grind oyunu</p>
            <h1 className="m-0 text-g42-ink font-[var(--font-silkscreen),monospace] text-[clamp(30px,5.4vw,52px)] leading-[0.94]">
              42 Tycoon
              <br />
              LogTime Grind
            </h1>
            <p className="max-w-[520px] mt-3 text-g42-ink-soft text-[19px] leading-[1.24] max-[560px]:text-[16px]">
              Kampüste geçirdiğin süre LogCoin&apos;e dönüşür. Serini koru, masanı geliştir,
              high score tablosuna çık.
            </p>
          </div>
          <div className="pt-0 px-[22px] pb-[18px]">
            <div className="[&>*]:min-h-[218px]">
              <PixelDesk
                inventory={["ergonomic_chair", "mech_keyboard", "dual_monitor", "pixel_cat", "loba_cup"]}
              />
            </div>
          </div>
        </section>

        <section className="nes-container self-stretch flex flex-col justify-start gap-[18px] !p-[22px] ![font-family:var(--font-pixelify),system-ui,sans-serif] with-title">
          <p className="title">Giriş</p>
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="m-0 font-[var(--font-silkscreen),monospace] tracking-[0] text-g42-accent-2 text-[18px]">Cluster kapısı</p>
              <p className="mt-2 text-[18px] leading-snug text-g42-ink-soft">
                42 hesabınla giriş yap, dünkü logtime ödülünü güvenli backend üzerinden topla.
              </p>
            </div>
            <ThemeToggle />
          </div>

          {errorMessage && (
            <div className="nes-container min-w-0 !bg-g42-paper shadow-[0_5px_0_var(--g42-line)] ![font-family:var(--font-pixelify),system-ui,sans-serif]">
              <p className="nes-text is-error text-xs leading-loose">{errorMessage}</p>
            </div>
          )}

          <div className="flex flex-col mt-auto gap-[14px]">
            <a href="/auth/sign-in" className="nes-btn is-primary text-center">
              42 ile Giriş Yap
            </a>
            <p className="text-[16px] leading-snug text-g42-muted">
              Supabase Auth ve 42 provider akışı değişmeden korunur.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
