"use client";

import StackSpread from "@/components/ui/stack-spread";

/**
 * The same scroll-scatter mechanism as the rest of the site, reused as a
 * lifestyle gallery: the cluster holds while the headline lands, then spreads.
 */
export default function Gallery() {
  return (
    <div id="gallery" className="scroll-mt-14">
      <StackSpread
        bgColor="#08080a"
        textColor="#f5f5f4"
        cardRadius={14}
        stackScale={0.8}
        copy={{
          lead: "Built",
          mid: "For",
          tail: "Motion.",
          sub: "Tracked on wrists that run, ride, lift and swim — then wear it to dinner.",
        }}
      />
    </div>
  );
}
