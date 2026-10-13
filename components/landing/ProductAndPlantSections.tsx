import FeatureRow from "./FeatureRow";
import PhoneMockup from "@/components/illustrations/PhoneMockup";
import BasketIllustration from "@/components/illustrations/BasketIllustration";
import ScanIllustration from "@/components/illustrations/ScanIllustration";
import Image from "next/image";

export default function ProductAndPlantSections() {
  return (
    <>
      <FeatureRow
        id="product-check"
        eyebrow="Product Check"
        title="Before you buy it, trace it."
        body="Tracee helps you understand what’s behind the products you choose."
        illustration={<Image src="/traceit.png" alt="Scan Illustration" className="h-auto max-h-96 w-full object-cover lg:max-h-[30rem]" width={500} height={600} />}
      />

      <FeatureRow
        flip
        eyebrow="The Scan"
        title="Turn a quick Scan into clear answers"
        body="Scan a product and let Tracee identify relevant ingredients, certifications, and potential concerns."
        illustration={<Image src="/scanproduct.png" alt="Scan Illustration" className="h-auto max-h-96 w-full object-cover lg:max-h-120" width={500} height={600} />}
      />

      <FeatureRow
        eyebrow="Shop With Confidence"
        title="Shop with Confidence!"
        body="See the evidence behind each result, understand what it means, and decide what works for you."
        bullets={[
          { text: "Scanned history with quick re-checks" },
          { text: "Compare products side by side" },
          { text: "Share verdicts with family and friends" },
        ]}
        illustration={<Image src="/shopconfidence.png" alt="Shop With Confidence Illustration" className="h-auto max-h-120 object-contain w-full lg:max-h-120" width={500} height={600} />}
      />
    </>
  );
}