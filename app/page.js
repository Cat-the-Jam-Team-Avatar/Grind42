"use client";

export default function LoginPage() {
  async function handleLogin() {
    const { createBrowserClient } = await import("@/lib/supabase/client");
    const supabase = createBrowserClient();
    await supabase.auth.signInWithOAuth({
      provider: "github", // 42 OAuth provider will replace this
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
  }

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
      <button type="button" className="nes-btn is-primary" onClick={handleLogin}>
        42 ile Giriş Yap
      </button>
    </main>
  );
}
