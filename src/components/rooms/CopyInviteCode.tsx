"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import Badge from "@/components/ui/Badge";
import { cn } from "@/lib/utils";

export default function CopyInviteCode({ code }: { code: string }) {
  const t = useTranslations("RoomDetailPage");
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API can fail (no permission, insecure context). The
      // code is still visible on screen, so there's nothing else to do.
    }
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="group flex items-center gap-2"
      aria-label={t("copyCode")}
    >
      <span className="rounded-lg border border-border bg-background px-4 py-2 font-mono text-lg font-semibold tracking-[0.3em] text-text transition-colors group-hover:border-primary/60">
        {code}
      </span>
      <Badge
        variant={copied ? "solid" : "outline"}
        className={cn("transition-colors", !copied && "group-hover:border-primary/60")}
      >
        {copied ? t("codeCopied") : t("copyCode")}
      </Badge>
    </button>
  );
}
