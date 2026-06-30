import { setRequestLocale, getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import Section from "@/components/ui/Section";
import Badge from "@/components/ui/Badge";
import Card from "@/components/ui/Card";
import EditProfileForm from "@/components/auth/EditProfileForm";
import { getCurrentProfile } from "@/features/auth";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "ProfilePage" });
  return { title: t("title") };
}

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("ProfilePage");

  const profile = await getCurrentProfile();

  // proxy.ts already guards /profile against signed-out users; a null
  // profile here means the row genuinely doesn't exist yet (e.g. the
  // handle_new_user trigger hasn't run, see docs/sql/01_profiles.sql).
  if (!profile) {
    redirect("/login");
  }

  const formattedDate = new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(profile.createdAt));

  return (
    <Section containerSize="narrow">
      <div className="flex flex-col items-center gap-3 text-center">
        <Badge variant="dot" className="text-primary">
          {t("eyebrow")}
        </Badge>
        <h1 className="font-[family-name:var(--font-heading)] text-3xl font-bold text-text sm:text-4xl">
          {profile.displayName}
        </h1>
        <p className="text-muted">
          {t("memberSince", { date: formattedDate })}
        </p>
      </div>

      <Card className="mt-10">
        <EditProfileForm profile={profile} />
      </Card>
    </Section>
  );
}
