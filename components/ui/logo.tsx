import Image from "next/image";
import Link from "next/link";

interface LogoProps {
  className?: string;
  size?: "sm" | "md" | "lg";
  priority?: boolean;
  href?: string;
}

const dimensions = {
  sm: { width: 110, height: 28 },
  md: { width: 140, height: 36 },
  lg: { width: 180, height: 46 },
} as const;

export function Logo({ className = "", size = "md", priority = false, href = "/" }: LogoProps) {
  const { width, height } = dimensions[size];

  return (
    <Link
      href={href}
      aria-label="BluiSkill — Home"
      className={`inline-flex min-w-0 items-center outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 focus-visible:ring-offset-2 ${className}`}
    >
      <Image
        src="/images/logo.png"
        alt="BluiSkill"
        width={width}
        height={height}
        priority={priority}
        className="h-auto max-w-full object-contain"
      />
    </Link>
  );
}
