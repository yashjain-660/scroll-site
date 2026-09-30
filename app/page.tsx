import Experience from "@/components/experience";
import Gallery from "@/components/sections/gallery";
import Reserve from "@/components/sections/reserve";
import SiteFooter from "@/components/site-footer";
import SiteNav from "@/components/site-nav";

export default function Home() {
  return (
    <div id="top" className="bg-[#08080a]">
      <SiteNav />
      <Experience />
      <Gallery />
      <Reserve />
      <SiteFooter />
    </div>
  );
}
