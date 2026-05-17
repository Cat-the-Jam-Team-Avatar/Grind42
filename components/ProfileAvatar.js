import Image from "next/image";

function getInitials(label) {
  const words = String(label ?? "42")
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (words.length === 0) return "42";

  return words
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();
}

export default function ProfileAvatar({ className = "", label, size = 48, src }) {
  const baseClasses = [
    "shrink-0 overflow-hidden rounded border-2 border-white/30",
    className,
  ]
    .filter(Boolean)
    .join(" ");
  const fallbackClasses = [
    "relative flex shrink-0 items-center justify-center overflow-hidden rounded border-2 border-white/30 bg-[#151515] text-[10px] text-[#f8d44b]",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  if (!src) {
    return (
      <div className={fallbackClasses} style={{ height: size, width: size }}>
        {getInitials(label)}
      </div>
    );
  }

  return (
    <Image
      alt={label ? `${label} profil fotoğrafı` : "42 profil fotoğrafı"}
      className={`${baseClasses} object-cover`}
      height={size}
      src={src}
      style={{ width: size, height: size }}
      width={size}
    />
  );
}
