import Link from "next/link";
import { LogoMark } from "@/components/icons";
import { storeBlurb, storeName } from "@/lib/store";

export function StoreFooter() {
  return (
    <footer className="mt-8 border-t border-white/[0.06] bg-ink-950 md:mt-14">
      <div className="mx-auto w-full max-w-[1680px] px-5 py-16 md:px-9 md:py-20">
        <div className="flex flex-col gap-12 md:flex-row md:items-start md:justify-between">
          <div className="max-w-sm">
            <div className="flex items-center gap-2.5">
              <LogoMark className="size-7" />
              <span className="font-display text-[17px] font-semibold tracking-tight text-mist-50">
                {storeName.split(" ")[0]}
                <span className="text-ember-500">.</span>
              </span>
            </div>
            <p className="mt-4 text-[13px] leading-relaxed text-mist-500">{storeBlurb}</p>
          </div>

          <div className="grid grid-cols-2 gap-x-14 gap-y-8 sm:grid-cols-3">
            <div>
              <p className="text-[10.5px] font-semibold uppercase tracking-[0.18em] text-mist-600">
                Shop
              </p>
              <ul className="mt-3 space-y-2 text-[13px] text-mist-400">
                <li><Link className="hover:text-white" href="#shop">The lineup</Link></li>
                <li><Link className="hover:text-white" href="#featured">Trail 40L</Link></li>
                <li><Link className="hover:text-white" href="#story">Repairs</Link></li>
              </ul>
            </div>
            <div>
              <p className="text-[10.5px] font-semibold uppercase tracking-[0.18em] text-mist-600">
                Company
              </p>
              <ul className="mt-3 space-y-2 text-[13px] text-mist-400">
                <li><Link className="hover:text-white" href="#story">Our story</Link></li>
                <li><Link className="hover:text-white" href="#top">Journal</Link></li>
                <li><Link className="hover:text-white" href="#top">Contact</Link></li>
              </ul>
            </div>
            <div>
              <p className="text-[10.5px] font-semibold uppercase tracking-[0.18em] text-mist-600">
                Support
              </p>
              <ul className="mt-3 space-y-2 text-[13px] text-mist-400">
                <li><Link className="hover:text-white" href="#top">Shipping</Link></li>
                <li><Link className="hover:text-white" href="#top">Returns</Link></li>
                <li><Link className="hover:text-white" href="#top">Warranty</Link></li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-14 flex flex-col gap-3 border-t border-white/[0.06] pt-6 text-[11.5px] text-mist-600 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} {storeName}. Built for the long way.</p>
          <p>Demo storefront — pricing and stock are illustrative.</p>
        </div>
      </div>
    </footer>
  );
}
