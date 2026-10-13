"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { AlertTriangle, Check, LoaderCircle, X } from "lucide-react";

type Action = "approve" | "needs_info" | "reject";

function ActionButton({
  action,
  pendingAction,
  onSelect,
  className,
  pending,
  children,
}: {
  action: Action;
  pendingAction: Action | null;
  onSelect: (action: Action) => void;
  className: string;
  pending: boolean;
  children: React.ReactNode;
}) {
  const isPending = pending && pendingAction === action;

  return (
    <button
      type="submit"
      name="action"
      value={action}
      onClick={() => onSelect(action)}
      disabled={pending}
      aria-busy={isPending}
      className={`inline-flex h-11 items-center gap-2 rounded-xl px-4 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-wait disabled:opacity-60 ${className}`}
    >
      {isPending ? (
        <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
      ) : (
        children
      )}
    </button>
  );
}

export default function ReviewActions() {
  const { pending } = useFormStatus();
  const [pendingAction, setPendingAction] = useState<Action | null>(null);

  return (
    <div className="flex flex-wrap gap-3">
      <ActionButton
        action="approve"
        pendingAction={pendingAction}
        onSelect={setPendingAction}
        pending={pending}
        className="bg-green-600 text-white hover:bg-green-700 focus-visible:outline-green-600"
      >
        <Check className="h-4 w-4" aria-hidden="true" />
        Approve &amp; clear
      </ActionButton>
      <ActionButton
        action="needs_info"
        pendingAction={pendingAction}
        onSelect={setPendingAction}
        pending={pending}
        className="border border-forest/20 bg-white text-forest hover:bg-sage focus-visible:outline-forest"
      >
        <AlertTriangle className="h-4 w-4" aria-hidden="true" />
        Request more info
      </ActionButton>
      <ActionButton
        action="reject"
        pendingAction={pendingAction}
        onSelect={setPendingAction}
        pending={pending}
        className="bg-red-100 text-red-700 hover:bg-red-200 focus-visible:outline-red-600"
      >
        <X className="h-4 w-4" aria-hidden="true" />
        Reject
      </ActionButton>
    </div>
  );
}
