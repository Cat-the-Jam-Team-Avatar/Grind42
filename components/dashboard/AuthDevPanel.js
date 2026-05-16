import { formatLogtimeHours } from "@/lib/42api/logtime";
import { FORTY_TWO_PROVIDER, getFortyTwoLogin } from "@/lib/auth/forty-two";

const SENSITIVE_KEY_PATTERN = /(access|refresh)?_?token|secret|password|authorization|cookie/i;

function readPath(source, path) {
  return path.split(".").reduce((value, key) => value?.[key], source);
}

function readFirst(source, paths) {
  for (const path of paths) {
    const value = readPath(source, path);

    if (value !== undefined && value !== null && value !== "") {
      return value;
    }
  }

  return null;
}

function redactSensitive(value) {
  if (Array.isArray(value)) {
    return value.map(redactSensitive);
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, nestedValue]) => [
        key,
        SENSITIVE_KEY_PATTERN.test(key) ? "[redacted]" : redactSensitive(nestedValue),
      ])
    );
  }

  return value;
}

function formatValue(value) {
  if (value === undefined || value === null || value === "") return "-";
  if (typeof value === "boolean") return value ? "true" : "false";
  if (typeof value === "number") return String(value);

  if (Array.isArray(value)) {
    if (value.length === 0) return "-";
    return value
      .map((item) => (typeof item === "object" ? JSON.stringify(redactSensitive(item)) : item))
      .join(", ");
  }

  if (typeof value === "object") {
    return JSON.stringify(redactSensitive(value));
  }

  return value;
}

function safeJson(value) {
  if (value === undefined || value === null) return "{}";
  return JSON.stringify(redactSensitive(value), null, 2);
}

function DevRow({ label, value }) {
  return (
    <div className="grid min-w-0 grid-cols-1 gap-1 border-b border-white/10 py-2 sm:grid-cols-[minmax(0,130px)_minmax(0,1fr)] lg:grid-cols-1 xl:grid-cols-[minmax(0,130px)_minmax(0,1fr)]">
      <span className="min-w-0 break-words text-[8px] leading-5 text-white/45">{label}</span>
      <code className="min-w-0 break-words text-[9px] leading-5 text-[#f8d44b]">
        {formatValue(value)}
      </code>
    </div>
  );
}

function DevLinkRow({ label, href }) {
  if (!href) {
    return <DevRow label={label} value={null} />;
  }

  return (
    <div className="grid min-w-0 grid-cols-1 gap-1 border-b border-white/10 py-2 sm:grid-cols-[minmax(0,130px)_minmax(0,1fr)] lg:grid-cols-1 xl:grid-cols-[minmax(0,130px)_minmax(0,1fr)]">
      <span className="min-w-0 break-words text-[8px] leading-5 text-white/45">{label}</span>
      <a
        className="min-w-0 break-words text-[9px] leading-5 text-[#f8d44b] underline"
        href={href}
        rel="noreferrer"
        target="_blank"
      >
        {href}
      </a>
    </div>
  );
}

function JsonBlock({ title, value }) {
  return (
    <details className="border-b border-white/10 py-2">
      <summary className="cursor-pointer text-[8px] leading-5 text-[#22c55e]">{title}</summary>
      <pre className="mt-2 max-h-64 overflow-auto whitespace-pre-wrap break-words text-[8px] leading-4 text-white/65">
        {safeJson(value)}
      </pre>
    </details>
  );
}

function getProviderIdentity(user) {
  const identities = user?.identities ?? [];

  return (
    identities.find((identity) => identity.provider === FORTY_TWO_PROVIDER) ??
    identities[0] ??
    null
  );
}

function summarizeCursus(profile) {
  return profile?.cursus_users?.map((item) => {
    const name = item?.cursus?.name ?? item?.cursus_id ?? "cursus";
    const level = item?.level ?? "-";

    return `${name}: ${level}`;
  });
}

function summarizeCampus(profile) {
  return profile?.campus?.map((campus) => campus?.name ?? campus?.city ?? campus?.id);
}

function formatYesterdayLogtime(details) {
  if (!Number.isFinite(details?.hours)) return null;

  return `${formatLogtimeHours(details.hours)} (${details.hours.toFixed(2)} saat)`;
}

export default function AuthDevPanel({ user, player, yesterdayLogtime }) {
  const providerIdentity = getProviderIdentity(user);
  const identityData = providerIdentity?.identity_data ?? {};
  const metadata = user?.user_metadata ?? {};
  const fortyTwoProfile = player?.forty_two_profile ?? null;
  const mergedProfile = {
    ...metadata,
    ...identityData,
    ...(fortyTwoProfile ?? {}),
  };
  const playerSnapshot = player
    ? {
        ...player,
        forty_two_profile: fortyTwoProfile ? "[shown in 42 /v2/me raw JSON]" : null,
      }
    : null;
  const profileUrl = readFirst(mergedProfile, ["url", "profile"]);
  const avatarLinks = [
    ["Avatar original", readFirst(mergedProfile, ["image.link", "avatar_url", "picture"])],
    ["Avatar large", readPath(mergedProfile, "image.versions.large")],
    ["Avatar medium", readPath(mergedProfile, "image.versions.medium")],
    ["Avatar small", readPath(mergedProfile, "image.versions.small")],
    ["Avatar micro", readPath(mergedProfile, "image.versions.micro")],
  ];

  return (
    <div className="nes-container is-dark with-title min-w-0">
      <p className="title nes-text text-xs">Dev: 42 Auth</p>

      <div className="flex min-w-0 flex-col gap-5">
        <section>
          <h2 className="mb-2 text-[9px] text-[#22c55e]">Kullanılabilir Alanlar</h2>
          <DevRow label="Supabase user id" value={user?.id} />
          <DevRow label="Auth provider" value={providerIdentity?.provider} />
          <DevRow label="Provider user id" value={providerIdentity?.id} />
          <DevRow label="42 id" value={player?.forty_two_id ?? readFirst(mergedProfile, ["id"])} />
          <DevRow label="42 login" value={player?.intra_login ?? getFortyTwoLogin(user)} />
          <DevRow label="Dünkü tarih" value={yesterdayLogtime?.date} />
          <DevRow label="Dünkü campus süresi" value={formatYesterdayLogtime(yesterdayLogtime)} />
          <DevRow label="Dünkü raw logtime" value={yesterdayLogtime?.rawValue} />
          <DevRow label="Logtime timezone" value={yesterdayLogtime?.timeZone} />
          <DevRow label="Logtime error" value={yesterdayLogtime?.error} />
          <DevRow label="Email" value={readFirst(mergedProfile, ["email"]) ?? user?.email} />
          <DevRow
            label="Display name"
            value={readFirst(mergedProfile, ["displayname", "name", "full_name"])}
          />
          <DevRow
            label="Ad soyad"
            value={[
              readFirst(mergedProfile, ["first_name", "usual_first_name", "given_name"]),
              readFirst(mergedProfile, ["last_name", "family_name"]),
            ]
              .filter(Boolean)
              .join(" ")}
          />
          <DevLinkRow label="Profil URL" href={profileUrl} />
          {avatarLinks.map(([label, href]) => (
            <DevLinkRow key={label} label={label} href={href} />
          ))}
          <DevRow label="Campus" value={summarizeCampus(fortyTwoProfile)} />
          <DevRow label="Cursus level" value={summarizeCursus(fortyTwoProfile)} />
          <DevRow label="Wallet" value={readFirst(mergedProfile, ["wallet"])} />
          <DevRow label="Correction point" value={readFirst(mergedProfile, ["correction_point"])} />
          <DevRow label="Location" value={readFirst(mergedProfile, ["location"])} />
          <DevRow label="Pool" value={[mergedProfile.pool_month, mergedProfile.pool_year].filter(Boolean).join(" ")} />
          <DevRow label="Kind" value={readFirst(mergedProfile, ["kind"])} />
          <DevRow label="Staff" value={mergedProfile["staff?"]} />
          <DevRow label="Alumni" value={mergedProfile["alumni?"]} />
          <DevRow label="Active" value={mergedProfile["active?"]} />
          <DevRow label="Projects count" value={fortyTwoProfile?.projects_users?.length} />
          <DevRow label="Achievements" value={fortyTwoProfile?.achievements?.length} />
          <DevRow label="Languages" value={fortyTwoProfile?.languages_users?.length} />
          <DevRow label="Last sign in" value={user?.last_sign_in_at} />
          <DevRow label="Profile cached" value={player?.forty_two_profile_updated_at} />
        </section>

        {!fortyTwoProfile && (
          <p className="text-[8px] leading-5 text-white/45">
            42 /v2/me ham profili henüz DB&apos;de yok. Sonraki girişte provider token gelirse
            saklanır; bunun için supabase/schema.sql içindeki yeni kolonlar uygulanmalı.
          </p>
        )}

        <section>
          <h2 className="mb-2 text-[9px] text-[#22c55e]">Ham Veriler</h2>
          <JsonBlock title="42 /v2/me raw JSON" value={fortyTwoProfile} />
          <JsonBlock title="42 locations_stats raw JSON" value={yesterdayLogtime?.raw} />
          <JsonBlock title="Supabase identity_data" value={identityData} />
          <JsonBlock title="Supabase user_metadata" value={metadata} />
          <JsonBlock title="Supabase identities" value={user?.identities ?? []} />
          <JsonBlock title="App users row" value={playerSnapshot} />
        </section>
      </div>
    </div>
  );
}
