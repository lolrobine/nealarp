import Image from "next/image";
import { getAssetUrl } from "@/lib/utils/assets";

interface GameIconProps {
  src: string;
  className?: string;
}

export function GameIcon({ src, className }: GameIconProps) {
  return (
    <Image
      src={getAssetUrl(src)}
      alt=""
      width={48}
      height={48}
      sizes="48px"
      className={className}
    />
  );
}
