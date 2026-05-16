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
      <header className="nes-container sticky top-0 z-20 grid items-center gap-4 w-[min(1180px,calc(100%-24px))] mx-auto mt-3 !bg-g42-paper shadow-[0_5px_0_var(--g42-line)] [grid-template-columns:minmax(190px,1fr)_auto_minmax(170px,1fr)] max-[920px]:[grid-template-columns:1fr] max-[920px]:justify-items-stretch max-[560px]:w-[calc(100%-16px)] max-[560px]:mt-2 max-[560px]:!p-[10px]">
        <div className="flex items-center min-w-0 gap-[10px] max-[920px]:justify-between">
          <div className="grid place-items-center shrink-0 font-bold text-g42-ink w-11 h-11 border-[3px] border-g42-line bg-g42-accent-soft shadow-[3px_3px_0_var(--g42-line)] font-[var(--font-silkscreen),monospace] text-base" aria-hidden="true">
            {initials}
          </div>
          <div>
            <p className="m-0 font-[var(--font-silkscreen),monospace] tracking-[0] text-g42-muted text-[10px]">42 Tycoon</p>
            <h1 className="m-0 font-[var(--font-silkscreen),monospace] tracking-[0] text-g42-ink text-[clamp(14px,2.2vw,20px)] leading-[1.05]">The LogTime Grind</h1>
          </div>
        </div>

        <AppNav />

        <div className="flex items-center justify-end min-w-0 gap-2 max-[920px]:justify-between">
          <div className="nes-container flex items-center whitespace-nowrap font-bold gap-[6px] !px-[10px] !py-[6px] !bg-g42-coin !text-g42-coin-ink shadow-[3px_3px_0_var(--g42-line)] font-[var(--font-silkscreen),monospace] text-[15px] [&_small]:text-[9px]">
            <CoinIcon size={20} />
            <span>{formatCoins(player?.balance)}</span>
            <small>LC</small>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <main className="flex-1 mx-auto w-[min(1180px,100%)] p-[18px] max-[560px]:p-3">{children}</main>
    </div>
  );
}
