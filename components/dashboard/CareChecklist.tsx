const TASKS = [
  {
    title: "Water the Monstera",
    description: "Check the top 2 inches of soil first",
    done: true,
  },
  {
    title: "Mist the Pothos",
    description: "Morning mist keeps humidity steady",
    done: true,
  },
  {
    title: "Turn the fiddle-leaf fig",
    description: "Quarter turn for even growth",
    done: true,
  },
  {
    title: "Check the ZZ plant soil",
    description: "It prefers to dry out fully between waterings",
    done: false,
  },
  {
    title: "Wipe dust off the leaves",
    description: "A damp cloth is all you need",
    done: false,
  },
];

export default function CareChecklist() {
  const doneCount = TASKS.filter((task) => task.done).length;

  return (
    <section className="flex flex-col gap-6 rounded-3xl border border-forest/5 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-forest">
          Today&apos;s Care Checklist
        </h2>
        <span className="inline-flex items-center rounded-full bg-mint px-3 py-1 text-xs font-semibold text-forest">
          {doneCount} of {TASKS.length} tasks completed
        </span>
      </div>

      <ul className="flex flex-col gap-3">
        {TASKS.map((task) => (
          <li
            key={task.title}
            className={`flex items-center gap-3 rounded-2xl px-4 py-3 ${
              task.done ? "bg-mint" : "bg-white"
            }`}
          >
            <span
              aria-hidden="true"
              className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 ${
                task.done ? "border-forest bg-forest" : "border-forest/40"
              }`}
            >
              {task.done ? (
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-3 w-3 text-white"
                >
                  <path d="M4 12l5 5 11-11" />
                </svg>
              ) : null}
            </span>
            <div className="flex flex-col gap-0.5">
              <p className="text-sm font-bold text-forest">{task.title}</p>
              <p className="text-xs text-gray-500">{task.description}</p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}