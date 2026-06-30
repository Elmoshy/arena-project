"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { loginAction } from "@/features/auth/actions";
import FormField from "@/components/ui/FormField";
import FormError from "@/components/ui/FormError";
import SubmitButton from "@/components/ui/SubmitButton";

export default function LoginForm({ next }: { next?: string }) {
  const t = useTranslations("LoginPage");
  const [state, formAction] = useActionState(loginAction, undefined);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="next" value={next ?? ""} />
      <FormError message={state?.error} />
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
        autoComplete="current-password"
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
