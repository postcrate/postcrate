import {
  PushPinSimpleIcon,
  StarIcon,
} from "@phosphor-icons/react/dist/ssr";

import { cn } from "@/lib/utils";
import { listColumnTime } from "@/lib/time";
import { type EmailSummary } from "@/services/email";

import { TagPill } from "./tag-pill";

type Props = {
  email: EmailSummary;
  selected: boolean;
  checked: boolean;
  onSelect: () => void;
  onToggleChecked: () => void;
};

/**
 * One row in the inbox list. The leading slot does double duty: it
 * shows the unread dot at rest and swaps to a checkbox on hover (or
 * stays as a checkbox once the row is part of a multi-selection).
 * That keeps the row tightly packed and recovers the column of
 * whitespace the dedicated checkbox used to claim.
 */
export function EmailRow({
  email,
  selected,
  checked,
  onSelect,
  onToggleChecked,
}: Props) {
  const unread = !email.read;
  const display = displayFrom(email.from);
  const subject = email.subject?.trim() || "(no subject)";

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect();
        }
      }}
      data-state={selected ? "selected" : undefined}
      data-email-id={email.id}
      className={cn(
        "group border-border/50 hover:bg-muted/40 flex w-full cursor-pointer items-start gap-1.5 border-b py-2.5 pr-3 pl-1.5 text-left transition-colors",
        "data-[state=selected]:bg-muted/60",
      )}
    >
      <button
        type="button"
        role="checkbox"
        aria-checked={checked}
        aria-label={`Select message from ${display}`}
        onClick={(e) => {
          e.stopPropagation();
          onToggleChecked();
        }}
        className="relative mt-1 inline-flex size-4 shrink-0 items-center justify-center"
      >
        {checked ? (
          <span aria-hidden className="bg-foreground size-2 rounded-full" />
        ) : unread ? (
          <span
            aria-hidden
            className="bg-brand size-2 rounded-full transition-opacity group-hover:opacity-0"
          />
        ) : null}
        {checked ? null : (
          <span
            aria-hidden
            className="border-foreground/40 absolute size-2 rounded-full border opacity-0 transition-opacity group-hover:opacity-100"
          />
        )}
      </button>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "text-foreground truncate text-[12.5px]",
              unread ? "font-semibold" : "font-medium",
            )}
          >
            {display}
          </span>
          <span className="text-muted-foreground/70 ml-auto shrink-0 text-[11px] tabular-nums">
            {listColumnTime(email.receivedAt)}
          </span>
        </div>
        <div
          className={cn(
            "text-foreground/90 mt-0.5 truncate text-[12.5px]",
            unread && "font-semibold",
          )}
        >
          {subject}
        </div>
        <div className="text-muted-foreground mt-1 flex items-center gap-2 text-[11.5px]">
          <span className="truncate">{email.to.join(", ")}</span>
          <span className="ml-auto flex shrink-0 items-center gap-1.5">
            <TagPill tag={email.tag} />
            {email.starred ? (
              <StarIcon
                size={12}
                weight="fill"
                className="text-warn"
                aria-label="Starred"
              />
            ) : null}
            {email.pinned ? (
              <PushPinSimpleIcon
                size={12}
                weight="fill"
                className="text-info"
                aria-label="Pinned"
              />
            ) : null}
          </span>
        </div>
      </div>
    </div>
  );
}

function displayFrom(from: string): string {
  const match = /^\s*"?([^"<]+?)"?\s*<.+>\s*$/.exec(from);
  return match ? match[1].trim() : from;
}
