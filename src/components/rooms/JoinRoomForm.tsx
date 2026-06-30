"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { joinRoomAction } from "@/features/rooms/actions";
import FormField from "@/components/ui/FormField";
import FormError from "@/components/ui/FormError";
import SubmitButton from "@/components/ui/SubmitButton";

export default function JoinRoomForm() {
  const t = useTranslations("JoinRoomPage");
  const [state, formAction] = useActionState(joinRoomAction, undefined);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <FormError message={state?.error} />
      <FormField
        label={t("codeLabel")}
        type="text"
        name="code"
        placeholder="ABCD12"
        autoComplete="off"
        autoCapitalize="characters"
        maxLength={6}
        className="font-mono uppercase tracking-[0.2em]"
        error={state?.fieldErrors?.code}
      />
      <SubmitButton
        variant="primary"
        className="mt-2 w-full"
        pendingChildren={t("submitPending")}
      >
        {t("submit")}
      </SubmitButton>
    </form>
  );
}
