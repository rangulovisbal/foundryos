import { requireAuthenticatedUser } from "@/lib/auth";

export default async function ProductLayout({
  children
}: {
  children: React.ReactNode;
}) {
  await requireAuthenticatedUser("/app");
  return children;
}
