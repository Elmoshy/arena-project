"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { updateProfileAction } from "@/features/auth/actions";
import FormField from "@/components/ui/FormField";
import FormError from "@/components/ui/FormError";
import SubmitButton from "@/components/ui/SubmitButton";
import type { Profile } from "@/features/auth/types";

export default function EditProfileForm({ profile }: { profile: Profile }) {
  const t = useTranslations("ProfilePage");
  const [state, formAction] = useActionState(updateProfileAction, undefined);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <FormError message={state?.error} />
      <FormField
        label={t("usernameLabel")}
        type="text"
        name="username"
        defaultValue={profile.username}
        autoComplete="off"
        error={state?.fieldErrors?.username}
      />
      <FormField
        label={t("displayNameLabel")}
        type="text"
        name="displayName"
        defaultValue={profile.displayName}
        autoComplete="off"
        error={state?.fieldErrors?.displayName}
      />
      {state?.success ? (
        <p className="text-sm text-primary">{t("saveSuccess")}</p>
      ) : null}
      <SubmitButton
        variant="primary"
        className="mt-2 w-full"
        pendingChildren={t("savePending")}
      >
        {t("save")}
      </SubmitButton>
    </form>
  );
}
