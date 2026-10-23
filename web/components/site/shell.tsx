// Page chrome for one staging variant: navbar, main, footer and the phone action bar, themed by data-site.
import { Navigation2 } from "@/components/navigation-2";
import Footer3 from "@/components/footer-3";
import { ActionBar } from "@/components/site/action-bar";
import { SiteProvider } from "@/lib/site";
import type { SiteId } from "@/lib/site-config";

export function Shell({ site, children }: { site: SiteId; children: React.ReactNode }) {
  return (
    <SiteProvider site={site}>
      <div data-site={site}>
        <Navigation2 />
        <main id="main" tabIndex={-1} className="outline-none">{children}</main>
        <Footer3 />
        <ActionBar />
      </div>
    </SiteProvider>
  );
}
