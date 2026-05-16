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
    <main className="flex flex-col items-center justify-center min-h-screen gap-8 p-4">
      <h1 className="nes-text is-primary text-center text-sm leading-loose">
        42 Tycoon
        <br />
        The LogTime Grind
      </h1>
      <p className="nes-text text-xs text-center opacity-70">
        Kampüste ter dök. Sanal cluster&apos;ın parlasın.
      </p>
      {errorMessage && (
        <p className="nes-text is-error text-xs text-center">{errorMessage}</p>
      )}
      <a href="/auth/sign-in" className="nes-btn is-primary">
        42 ile Giriş Yap
      </a>
    </main>
  );
}
