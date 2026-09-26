import Link from "next/link";
import { BoxIcon, PlantIcon, HistoryIcon, ArrowRightIcon } from "@/components/ui/icons";

const ACTION_CARDS = [
  {
    title: "Scan a Product",
    description: "Check ingredients, certifications, and safety factors.",
    buttonLabel: "Scan Now",
    href: "/scan",
    icon: BoxIcon,
  },
  {
    title: "Diagnose a Plant",
    description: "Identify disease, deficiencies, and watering needs.",
    buttonLabel: "Scan Plant",
    href: "/scan/result",
    icon: PlantIcon,
  },
  {
    title: "View History",
    description: "Revisit your past scans and saved verdicts.",
    buttonLabel: "View History",
    href: "/history",
    icon: HistoryIcon,
  },
];

export default function ActionCards() {
  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {ACTION_CARDS.map((card) => {
        const Icon = card.icon;
        return (
          <article
            key={card.title}
            className="flex flex-col gap-5 rounded-3xl border border-forest/5 bg-white p-6 shadow-sm"
          >
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-mint text-forest">
              <Icon className="h-6 w-6" />
            </span>
            <div className="flex flex-col gap-2">
              <h3 className="text-lg font-semibold text-forest">{card.title}</h3>
              <p className="text-sm leading-relaxed text-gray-500">
                {card.description}
              </p>
            </div>
            <Link
              href={card.href}
              className="mt-auto inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-forest text-sm font-semibold text-white transition-colors hover:bg-forest-dark"
            >
              {card.buttonLabel}
              <ArrowRightIcon className="h-4 w-4" />
            </Link>
          </article>
        );
      })}
    </div>
  );
}