import Image from "next/image";
import { getAssetUrl } from "@/lib/utils/assets";
import { cn } from "@/lib/utils/cn";

interface GameIconProps {
  src: string;
  alt?: string;
  className?: string;
}

export function GameIcon({ src, alt = "", className }: GameIconProps) {
  return (
    <Image
      src={getAssetUrl(src)}
      alt={alt}
      width={48}
      height={48}
      sizes="48px"
      className={cn("h-12 w-12", className)}
    />
  );
}
