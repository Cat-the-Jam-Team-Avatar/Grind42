import AppNav from "./AppNav";
import ThemeToggle from "@/components/theme/ThemeToggle";
import LiveBalanceBadge from "./LiveBalanceBadge";
import ProfileAvatar from "@/components/ProfileAvatar";
import LevelUpSound from "./LevelUpSound";
import SoundToggle from "./SoundToggle";

export default function AppShell({ children, player }) {
  const login = player?.intra_login ?? "cadet";
  
  // Extract full name from the saved 42 profile if available
  const ftProfile = player?.forty_two_profile;
  const extractedFullName = ftProfile?.usual_full_name || (ftProfile?.first_name ? `${ftProfile.first_name} ${ftProfile.last_name}` : null) || ftProfile?.displayname;
  const displayName = extractedFullName || player?.display_name || login;
  const avatarUrl = player?.profile_image_url;
  const serverBalance = player?.balance ?? 0;

  return (
    <div className="min-h-screen text-g42-ink bg-[radial-gradient(var(--g42-grid)_1px,transparent_1px),linear-gradient(180deg,var(--g42-bg),var(--g42-bg-2))] [background-size:12px_12px,auto] flex flex-col">
      <LevelUpSound />
      <header className="nes-container sticky top-0 z-20 w-[min(1180px,calc(100%-24px))] mx-auto mt-3 !bg-g42-paper shadow-[0_5px_0_var(--g42-line)] max-[560px]:w-[calc(100%-16px)] max-[560px]:mt-2 max-[560px]:!p-3">
        {/* ── Desktop (≥860px): single row — identity | nav center | actions ── */}
        <div className="hidden min-[860px]:grid [grid-template-columns:auto_1fr_auto] items-center gap-4">
          {/* Zone 1: identity */}
          <div className="flex items-center gap-[10px] shrink-0">
            <ProfileAvatar label={displayName} size={36} src={avatarUrl} />
            <div>
              <p className="m-0 font-[var(--font-silkscreen),monospace] text-[13px] text-g42-ink leading-tight">
                {displayName}
              </p>
              <p className="m-0 font-[var(--font-silkscreen),monospace] text-[9px] text-g42-muted leading-none mt-[4px]">
                {login}
              </p>
            </div>
          </div>

          {/* Zone 2: nav (centered) */}
          <div className="flex justify-center">
            <AppNav />
          </div>

          {/* Zone 3: actions */}
          <div className="flex items-center gap-2 shrink-0">
            <LiveBalanceBadge serverBalance={serverBalance} />
            <SoundToggle size="sm" />
            <ThemeToggle size="sm" />
          </div>
        </div>

        {/* ── Mobile (<860px): two rows ── */}
        <div className="min-[860px]:hidden flex flex-col gap-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 min-w-0">
              <ProfileAvatar label={displayName} size={32} src={avatarUrl} />
              <div className="flex flex-col min-w-0">
                <p className="m-0 font-[var(--font-silkscreen),monospace] text-[12px] text-g42-ink truncate leading-tight">
                  {displayName}
                </p>
                <p className="m-0 font-[var(--font-silkscreen),monospace] text-[9px] text-g42-muted truncate leading-none mt-[2px]">
                  {login}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <LiveBalanceBadge serverBalance={serverBalance} size="sm" />
              <SoundToggle size="sm" />
              <ThemeToggle size="sm" />
            </div>
          </div>
          <div className="overflow-x-auto -mx-1 px-1">
            <AppNav />
          </div>
        </div>
      </header>

      <main className="flex-1 mx-auto w-[min(1180px,100%)] p-[18px] max-[560px]:p-3">
        {children}
      </main>
    </div>
  );
}

