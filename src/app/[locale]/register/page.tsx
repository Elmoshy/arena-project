import { setRequestLocale, getTranslations } from "next-intl/server";
import { Link } from "@/lib/i18n/navigation";
import RegisterForm from "@/components/auth/RegisterForm";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "RegisterPage" });
  return { title: t("title") };
}

export default async function RegisterPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("RegisterPage");

  return (
    <section className="flex items-center justify-center px-6 py-24">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="font-[family-name:var(--font-heading)] text-3xl font-bold text-text">
            {t("title")}
          </h1>
          <p className="mt-2 text-sm text-muted">{t("description")}</p>
        </div>

        <div className="rounded-2xl border border-border bg-surface p-6">
          <RegisterForm />
        </div>

        <p className="mt-6 text-center text-sm text-muted">
          {t("switchPrompt")}{" "}
          <Link href="/login" className="font-medium text-primary hover:underline">
            {t("switchAction")}
          </Link>
        </p>
      </div>
    </section>
  );
}
