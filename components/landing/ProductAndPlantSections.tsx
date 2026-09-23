import FeatureRow from "./FeatureRow";
import PhoneMockup from "@/components/illustrations/PhoneMockup";
import BasketIllustration from "@/components/illustrations/BasketIllustration";
import ScanIllustration from "@/components/illustrations/ScanIllustration";

export default function ProductAndPlantSections() {
  return (
    <>
      <FeatureRow
        id="product-check"
        eyebrow="Product Check"
        title="Before you buy it, trace it."
        body="Point Tracee at any label — food, cosmetics, packaged goods — and get a crystal-clear ingredient breakdown, GMO likelihood, and certification check before it reaches your basket."
        bullets={[
          { text: "Full ingredient list, decoded in plain language" },
          { text: "GMO likelihood and certification verification" },
          { text: "Instantly flagged concerns tied to your profile" },
        ]}
        illustration={<ScanIllustration className="w-full" />}
      />

      <FeatureRow
        flip
        eyebrow="The Scan"
        title="Turn a quick scan into clear answers"
        body="Snap, scan, done. In seconds you get a simple safety verdict — safe, cautious, or avoid — with the reasons spelled out and better alternatives suggested."
        bullets={[
          { text: "Clear safety verdict with evidence behind it" },
          { text: "Personalized allergy and sensitivity alerts" },
          { text: "Smarter alternatives when something isn\u2019t right" },
        ]}
        illustration={<PhoneMockup className="w-full" />}
      />

      <FeatureRow
        eyebrow="Shop With Confidence"
        title="Shop with confidence!"
        body="Every scan is saved to your history, so you can compare products at a glance and keep a running personal log of everything you trace."
        bullets={[
          { text: "Scanned history with quick re-checks" },
          { text: "Compare products side by side" },
          { text: "Share verdicts with family and friends" },
        ]}
        illustration={<BasketIllustration className="w-full" />}
      />
    </>
  );
}