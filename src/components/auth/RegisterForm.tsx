"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { registerAction } from "@/features/auth/actions";
import FormField from "@/components/ui/FormField";
import FormError from "@/components/ui/FormError";
import SubmitButton from "@/components/ui/SubmitButton";

export default function RegisterForm() {
  const t = useTranslations("RegisterPage");
  const [state, formAction] = useActionState(registerAction, undefined);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <FormError message={state?.error} />
      <FormField
        label={t("nameLabel")}
        type="text"
        name="name"
        autoComplete="name"
        error={state?.fieldErrors?.name}
      />
      <FormField
        label={t("emailLabel")}
        type="email"
        name="email"
        autoComplete="email"
        error={state?.fieldErrors?.email}
      />
      <FormField
        label={t("passwordLabel")}
        type="password"
        name="password"
        autoComplete="new-password"
        error={state?.fieldErrors?.password}
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
