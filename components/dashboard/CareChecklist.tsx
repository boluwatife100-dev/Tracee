"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AlertCircle, CalendarClock, Check, LoaderCircle } from "lucide-react";

type CareTask = {
  id: string;
  title: string;
  detail: string | null;
  dueAt: string | null;
  recurrence: string | null;
  done: boolean;
  scanId: string;
};

type TaskResponse = { tasks?: CareTask[]; error?: string };

export default function CareChecklist() {
  const [tasks, setTasks] = useState<CareTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [savingId, setSavingId] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    fetch("/api/care-tasks")
      .then(async (response) => {
        const data = (await response.json()) as TaskResponse;
        if (!response.ok) throw new Error(data.error ?? "Unable to load care tasks.");
        if (active) setTasks(data.tasks ?? []);
      })
      .catch((caughtError: unknown) => {
        if (active) {
          setError(
            caughtError instanceof Error
              ? caughtError.message
              : "Unable to load care tasks."
          );
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  async function toggleTask(task: CareTask) {
    setSavingId(task.id);
    setError("");
    try {
      const response = await fetch(`/api/care-tasks/${task.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ done: !task.done }),
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(data.error ?? "Could not update this task.");
      setTasks((current) =>
        current.map((item) =>
          item.id === task.id ? { ...item, done: !item.done } : item
        )
      );
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Could not update this task."
      );
    } finally {
      setSavingId(null);
    }
  }

  const doneCount = tasks.filter((task) => task.done).length;

  return (
    <section
      id="care-checklist"
      className="flex min-w-0 flex-col gap-5 rounded-2xl border border-forest/10 bg-white p-5 shadow-sm sm:p-6"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-forest">
            Today&apos;s Care Checklist
          </h2>
          <p className="mt-1 text-sm text-forest/60">
            Follow up on tasks from your plant diagnoses.
          </p>
        </div>
        {!loading && !error ? (
          <span className="inline-flex items-center rounded-full bg-mint px-3 py-1 text-xs font-semibold text-forest">
            {doneCount} of {tasks.length} done
          </span>
        ) : null}
      </div>

      {loading ? (
        <div className="flex flex-col gap-3" aria-label="Loading care tasks" role="status">
          {[1, 2, 3].map((item) => (
            <div
              key={item}
              className="h-16 animate-pulse rounded-xl bg-sage/60"
            />
          ))}
        </div>
      ) : error ? (
        <p className="flex items-start gap-2 text-sm text-red-700" role="alert">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          {error}
        </p>
      ) : tasks.length ? (
        <ul className="flex flex-col divide-y divide-forest/10">
          {tasks.map((task) => (
            <li
              key={task.id}
              className="flex items-start gap-3 py-4 first:pt-0 last:pb-0"
            >
              <input
                type="checkbox"
                checked={task.done}
                disabled={savingId === task.id}
                onChange={() => toggleTask(task)}
                aria-label={`${task.done ? "Mark incomplete" : "Complete"}: ${task.title}`}
                className="mt-1 h-4 w-4 shrink-0 accent-forest focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest disabled:opacity-50"
              />
              <div className="min-w-0 flex-1">
                <p
                  className={`text-sm font-semibold ${
                    task.done ? "text-forest/50 line-through" : "text-forest"
                  }`}
                >
                  {task.title}
                </p>
                {task.detail ? (
                  <p className="mt-1 text-xs leading-5 text-forest/60">
                    {task.detail}
                  </p>
                ) : null}
                <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-forest/55">
                  {task.dueAt ? (
                    <span className="inline-flex items-center gap-1">
                      <CalendarClock className="h-3.5 w-3.5" aria-hidden="true" />
                      {new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(
                        new Date(task.dueAt)
                      )}
                    </span>
                  ) : null}
                  {task.recurrence ? <span>{task.recurrence}</span> : null}
                  <Link
                    href={`/dashboard/my-plant/${task.scanId}`}
                    className="font-medium text-forest underline decoration-forest/30 underline-offset-2 hover:decoration-forest focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest"
                  >
                    Scan details
                  </Link>
                </div>
              </div>
              {savingId === task.id ? (
                <LoaderCircle
                  className="mt-1 h-4 w-4 shrink-0 animate-spin text-forest/60"
                  aria-label="Saving task"
                />
              ) : task.done ? (
                <Check className="mt-1 h-4 w-4 shrink-0 text-forest" aria-hidden="true" />
              ) : null}
            </li>
          ))}
        </ul>
      ) : (
        <div className="rounded-xl bg-sage/50 px-4 py-6 text-center">
          <p className="text-sm font-semibold text-forest">No care tasks yet</p>
          <p className="mt-1 text-sm text-forest/65">
            Your next plant scan can turn a diagnosis into a practical routine.
          </p>
          <Link
            href="/dashboard/scan"
            className="mt-4 inline-flex min-h-10 items-center rounded-lg bg-white px-4 text-sm font-semibold text-forest ring-1 ring-forest/15 hover:bg-sage focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest"
          >
            Scan a plant
          </Link>
        </div>
      )}
    </section>
  );
}
