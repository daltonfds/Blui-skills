import Image from "next/image";
import Link from "next/link";

interface LogoProps {
  className?: string;
  size?: "sm" | "md" | "lg";
  priority?: boolean;
  href?: string;
  showName?: boolean;
}

const dimensions = {
  sm: { width: 38, height: 38 },
  md: { width: 44, height: 44 },
  lg: { width: 84, height: 84 },
} as const;

export function Logo({
  className = "",
  size = "md",
  priority = false,
  href = "/",
  showName = false,
}: LogoProps) {
  const { width, height } = dimensions[size];

  return (
    <Link
      href={href}
      aria-label="BluiSkill — Home"
      className={`inline-flex min-w-0 items-center gap-2.5 outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 focus-visible:ring-offset-2 ${className}`}
    >
      <Image
        src="/images/logo.png"
        alt="BluiSkill official logo"
        width={width}
        height={height}
        priority={priority}
        onError={(event) => {
          // Keep the interface usable until the official PNG is uploaded.
          if (!event.currentTarget.src.endsWith("/icon.svg")) {
            event.currentTarget.src = "/icon.svg";
          }
        }}
        className="block shrink-0 rounded-lg object-contain"
      />
      {showName && (
        <span className="whitespace-nowrap text-base font-semibold tracking-tight text-zinc-950 sm:text-lg">
          BluiSkill
        </span>
      )}
    </Link>
  );
}
