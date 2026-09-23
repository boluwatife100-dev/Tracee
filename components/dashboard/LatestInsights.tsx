import {
  ChevronRightIcon,
  BoxIcon,
  PlantIcon,
} from "@/components/ui/icons";

const ACTIVITY = [
  {
    title: "Plant diagnosed",
    detail: "Monstera — leaf spot · 92% confidence",
    time: "2h ago",
    tag: null,
    icon: PlantIcon,
  },
  {
    title: "Product scanned",
    detail: "Organic granola bar",
    time: "Yesterday",
    tag: "Safe",
    icon: BoxIcon,
  },
  {
    title: "Product scanned",
    detail: "Aloe face toner",
    time: "2d ago",
    tag: "Safe",
    icon: BoxIcon,
  },
  {
    title: "Plant diagnosed",
    detail: "Pothos — drooping leaves · 84% confidence",
    time: "3d ago",
    tag: null,
    icon: PlantIcon,
  },
];

export default function LatestInsights() {
  return (
    <section className="flex flex-col gap-6 rounded-3xl border border-forest/5 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-forest">Latest Insights</h2>
        <button
          type="button"
          className="flex h-8 w-8 items-center justify-center rounded-full text-forest/60 transition-colors hover:bg-forest/5 hover:text-forest"
          aria-label="Expand insights"
        >
          <ChevronRightIcon className="h-4 w-4" />
        </button>
      </div>

      <ul className="flex flex-col divide-y divide-forest/5">
        {ACTIVITY.map((item) => {
          const Icon = item.icon;
          return (
            <li
              key={`${item.title}-${item.time}-${item.detail}`}
              className="flex items-center gap-4 py-4"
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-sage text-forest">
                <Icon className="h-5 w-5" />
              </span>
              <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                <p className="truncate text-sm font-semibold text-forest">
                  {item.title}
                </p>
                <p className="flex items-center gap-2 truncate text-sm text-gray-500">
                  {item.detail}
                  {item.tag ? (
                    <span className="inline-flex items-center rounded-full bg-sage px-2.5 py-0.5 text-xs font-semibold text-foreground">
                      {item.tag}
                    </span>
                  ) : null}
                </p>
              </div>
              <span className="shrink-0 text-xs font-medium text-gray-400">
                {item.time}
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}