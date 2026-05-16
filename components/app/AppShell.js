import AppNav from "./AppNav";
import ThemeToggle from "@/components/theme/ThemeToggle";
import { CoinIcon } from "@/components/ui/PixelSprite";

function formatCoins(value) {
  return Number(value ?? 0).toLocaleString("tr-TR");
}

export default function AppShell({ children, player }) {
  const login = player?.intra_login ?? "cadet";
  const initials = login.slice(0, 2).toUpperCase();

  return (
    <div className="min-h-screen text-g42-ink bg-[radial-gradient(var(--g42-grid)_1px,transparent_1px),linear-gradient(180deg,var(--g42-bg),var(--g42-bg-2))] [background-size:12px_12px,auto] flex flex-col">
      <header className="nes-container sticky top-0 z-20 w-[min(1180px,calc(100%-24px))] mx-auto mt-3 !bg-g42-paper shadow-[0_5px_0_var(--g42-line)] max-[560px]:w-[calc(100%-16px)] max-[560px]:mt-2 max-[560px]:!p-[10px]">
        {/* Top row: logo + coins + theme toggle */}
        <div className="flex items-center justify-between gap-3 pb-[10px] border-b-[3px] border-g42-line mb-[10px]">
          {/* Logo / user identity */}
          <div className="flex items-center gap-[10px] min-w-0">
            <div
              className="grid place-items-center shrink-0 w-9 h-9 border-[3px] border-g42-line bg-g42-accent-soft shadow-[2px_2px_0_var(--g42-line)] font-[var(--font-silkscreen),monospace] text-[13px] text-g42-ink font-bold"
              aria-hidden="true"
            >
              {initials}
            </div>
            <div className="min-w-0">
              <p className="m-0 font-[var(--font-silkscreen),monospace] text-[9px] text-g42-muted leading-none truncate">
                42 Tycoon
              </p>
              <p className="m-0 font-[var(--font-silkscreen),monospace] text-[13px] text-g42-ink leading-tight truncate max-[560px]:text-[11px]">
                {login}
              </p>
            </div>
          </div>

          {/* Right: coin balance + theme */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="flex items-center gap-[5px] px-[10px] py-[5px] border-[3px] border-g42-line bg-g42-coin shadow-[3px_3px_0_var(--g42-line)] font-[var(--font-silkscreen),monospace] text-[13px] text-g42-coin-ink font-bold whitespace-nowrap">
              <CoinIcon size={16} />
              <span>{formatCoins(player?.balance)}</span>
              <span className="text-[9px] opacity-70">LC</span>
            </div>
            <ThemeToggle size="sm" />
          </div>
        </div>

        {/* Bottom row: navigation */}
        <AppNav />
      </header>

      <main className="flex-1 mx-auto w-[min(1180px,100%)] p-[18px] max-[560px]:p-3">
        {children}
      </main>
    </div>
  );
}
