import { getCurrentUser } from "@/features/auth";
import NavbarClient from "./NavbarClient";

/** Server Component wrapper: resolves auth state once per request, then hands off to the client component that owns scroll/menu interactivity. */
export default async function Navbar() {
  const user = await getCurrentUser();
  return <NavbarClient isAuthenticated={Boolean(user)} />;
}
