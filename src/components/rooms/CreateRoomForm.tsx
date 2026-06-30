"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { createRoomAction } from "@/features/rooms/actions";
import FormField from "@/components/ui/FormField";
import FormError from "@/components/ui/FormError";
import SubmitButton from "@/components/ui/SubmitButton";

export default function CreateRoomForm() {
  const t = useTranslations("CreateRoomPage");
  const [state, formAction] = useActionState(createRoomAction, undefined);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <FormError message={state?.error} />
      <FormField
        label={t("nameLabel")}
        type="text"
        name="name"
        placeholder={t("namePlaceholder")}
        autoComplete="off"
        maxLength={60}
        error={state?.fieldErrors?.name}
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
