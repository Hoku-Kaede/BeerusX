import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { getConnection } from "@/lib/sonarr";

export default async function CinewaveLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const connection = await getConnection();

  return (
    <>
      <SiteHeader connection={connection} />
      <main id="content">{children}</main>
      <SiteFooter connection={connection} />
    </>
  );
}
