import Image from "next/image";
import Link from "next/link";
import { getCurrentUser } from "@/lib/mock-auth";

export function NavBar() {
  const user = getCurrentUser();

  return (
    <nav className="sticky top-0 z-50 h-14 bg-ww-surface border-b border-ww-border flex items-center px-4 gap-4">
      <Link href="/" className="flex items-center gap-3 no-underline">
        <Image
          src="/ww-logo.jpg"
          alt="Whitewater Reinventions"
          width={100}
          height={32}
          className="h-8 w-auto"
          priority
        />
        <span className="text-ww-text-muted text-sm font-semibold">
          M Suite
        </span>
      </Link>
      <div className="flex-1" />
      <span className="text-sm text-ww-text-secondary">
        Welcome, {user.name}
      </span>
    </nav>
  );
}
