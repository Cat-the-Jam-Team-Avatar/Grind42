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
  { icon: "🪙", label: "LogTime → LogCoin" },
  { icon: "🔥", label: "Günlük streak" },
  { icon: "🏆", label: "Liderlik tablosu" },
  { icon: "🛒", label: "Market & masa" },
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
    <>
      <style>{`
        @keyframes g42-slide-in {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes g42-float {
          0%, 100% { transform: translateY(0px); }
          50%       { transform: translateY(-8px); }
        }
        .g42-card { animation: g42-slide-in 0.5s cubic-bezier(.22,1,.36,1) both; }
        .g42-coin { animation: g42-float 3s ease-in-out infinite; display: inline-block; }
        .g42-btn {
          display: block; width: 100%; text-align: center;
          background: var(--g42-accent);
          color: #fff;
          font-family: var(--font-silkscreen), monospace;
          font-size: 11px;
          letter-spacing: .14em;
          text-transform: uppercase;
          padding: 16px 0;
          border: 3px solid var(--g42-line);
          box-shadow: 4px 4px 0 var(--g42-line);
          transition: box-shadow 60ms, transform 60ms;
          text-decoration: none;
        }
        .g42-btn:hover  { box-shadow: none; transform: translate(4px, 4px); }
        .g42-btn:active { box-shadow: none; transform: translate(4px, 4px); }
      `}</style>

      <main
        className="relative min-h-dvh flex items-center justify-center p-6
          bg-[radial-gradient(var(--g42-grid)_1px,transparent_1px),linear-gradient(160deg,var(--g42-bg)_0%,var(--g42-bg-2)_100%)]
          bg-size-[14px_14px,auto]"
      >
        {/* Tema değiştirici */}
        <div className="absolute top-5 right-5 z-10">
          <ThemeToggle />
        </div>

        {/* Ana kart */}
        <div className="g42-card w-full max-w-sm">
          {/* Üst turuncu şerit */}
          <div className="h-1 bg-g42-accent" />

          {/* Kart gövdesi */}
          <div className="border-[3px] border-t-0 border-g42-line bg-g42-paper shadow-[6px_6px_0_var(--g42-line)] px-8 pt-8 pb-9 flex flex-col gap-7">

            {/* Başlık */}
            <div className="flex flex-col items-center text-center gap-3">
              <span className="g42-coin text-[48px] leading-none" aria-hidden="true">🪙</span>
              <div>
                <p className="m-0 font-[var(--font-silkscreen),monospace] text-[8px] text-g42-muted tracking-[.2em] uppercase">
                  42 İstanbul · Daily Grind
                </p>
                <h1
                  className="m-0 mt-3 font-[var(--font-silkscreen),monospace] text-g42-ink leading-[.9]"
                  style={{ fontSize: "clamp(32px,9vw,48px)" }}
                >
                  42 <span className="text-g42-accent">Tycoon</span>
                </h1>
                <p className="m-0 mt-3 font-[var(--font-silkscreen),monospace] text-[7px] text-g42-muted tracking-[.18em]">
                  LOGTIME GRIND
                </p>
              </div>
            </div>

            {/* Ayırıcı çizgi */}
            <div className="h-0.5 bg-g42-line opacity-20" />

            {/* Açıklama */}
            <p className="m-0 text-center text-[14px] text-g42-ink-soft leading-relaxed">
              Kampüste geçirdiğin süre{" "}
              <strong className="text-g42-coin-d">LogCoin</strong>
              &apos;e dönüşür. Serini koru, masanı yükselt, tabloya çık.
            </p>

            {/* Özellik çipleri */}
            <div className="grid grid-cols-2 gap-2">
              {FEATURES.map(({ icon, label }) => (
                <div
                  key={label}
                  className="flex items-center gap-2 bg-g42-bg border-2 border-g42-line px-3 py-2.5"
                >
                  <span className="text-[14px] shrink-0" aria-hidden="true">{icon}</span>
                  <span className="font-[var(--font-silkscreen),monospace] text-[7.5px] text-g42-ink-soft leading-snug">
                    {label}
                  </span>
                </div>
              ))}
            </div>

            {/* Hata mesajı */}
            {errorMessage && (
              <div className="border-2 border-g42-danger px-4 py-3">
                <p className="m-0 text-g42-danger text-[11px] leading-relaxed">⚠ {errorMessage}</p>
              </div>
            )}

            {/* Giriş butonu */}
            <div className="flex flex-col items-center gap-3">
              <a href="/auth/sign-in" className="g42-btn">
                ▶&nbsp;&nbsp;42 ile Giriş Yap
              </a>
              <p className="m-0 font-[var(--font-silkscreen),monospace] text-[7px] text-g42-muted tracking-wide">
                42 intra hesabın gerekli
              </p>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
