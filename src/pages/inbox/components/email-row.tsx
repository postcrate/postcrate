import {
  PushPinSimpleIcon,
  StarIcon,
} from "@phosphor-icons/react/dist/ssr";

import { cn } from "@/lib/utils";
import { listColumnTime } from "@/lib/time";
import { type EmailSummary } from "@/services/email";
import { usePreferencesStore } from "@/stores/use-preferences-store";

import { TagPill } from "./tag-pill";

type Props = {
  email: EmailSummary;
  selected: boolean;
  checked: boolean;
  onSelect: () => void;
  onToggleChecked: () => void;
};

/**
 * One row in the inbox list. Two visual modes driven by the appearance
 * density preference:
 *
 *   - `comfortable` — three lines (sender + time, subject, recipients
 *     with status). Default.
 *   - `compact` — two lines (sender + time, subject with recipients
 *     inlined and status pulled right). Drops one line and trims the
 *     outer padding so ~50 % more rows fit per viewport, without
 *     shrinking the type.
 *
 * The leading slot in both modes is a unread-dot / hover-checkbox combo
 * that recovers the column of whitespace a dedicated checkbox would claim.
 */
export function EmailRow(props: Props) {
  const density = usePreferencesStore((s) => s.appearance.density);
  return density === "compact" ? (
    <CompactRow {...props} />
  ) : (
    <ComfortableRow {...props} />
  );
}

function ComfortableRow({
  email,
  selected,
  checked,
  onSelect,
  onToggleChecked,
}: Props) {
  const unread = !email.read;
  const display = displayFrom(email.from);
  const subject = email.subject?.trim() || "No subject";

  return (
    <RowShell
      email={email}
      selected={selected}
      onSelect={onSelect}
      className="items-start gap-1.5 py-2.5 pr-3 pl-1.5"
    >
      <LeadingMarker
        unread={unread}
        checked={checked}
        display={display}
        onToggleChecked={onToggleChecked}
        wrapperClassName="mt-1"
      />

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
            <StatusIcons email={email} />
          </span>
        </div>
      </div>
    </RowShell>
  );
}

function CompactRow({
  email,
  selected,
  checked,
  onSelect,
  onToggleChecked,
}: Props) {
  const unread = !email.read;
  const display = displayFrom(email.from);
  const subject = email.subject?.trim() || "No subject";
  const recipients = email.to.join(", ");

  return (
    <RowShell
      email={email}
      selected={selected}
      onSelect={onSelect}
      className="items-start gap-1.5 py-1.5 pr-3 pl-1.5"
    >
      <LeadingMarker
        unread={unread}
        checked={checked}
        display={display}
        onToggleChecked={onToggleChecked}
        wrapperClassName="mt-0.5"
      />

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
        <div className="mt-0.5 flex items-center gap-2">
          <div className="min-w-0 flex-1 truncate text-[12.5px]">
            <span
              className={cn(
                "text-foreground/90",
                unread && "font-semibold",
              )}
            >
              {subject}
            </span>
            {recipients ? (
              <span className="text-muted-foreground/80 ml-1.5 text-[11.5px]">
                to {recipients}
              </span>
            ) : null}
          </div>
          <span className="flex shrink-0 items-center gap-1.5">
            <TagPill tag={email.tag} />
            <StatusIcons email={email} />
          </span>
        </div>
      </div>
    </RowShell>
  );
}

function RowShell({
  email,
  selected,
  onSelect,
  className,
  children,
}: {
  email: EmailSummary;
  selected: boolean;
  onSelect: () => void;
  className?: string;
  children: React.ReactNode;
}) {
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
        "group border-border/50 hover:bg-muted/40 flex w-full cursor-pointer border-b text-left transition-colors",
        "data-[state=selected]:bg-muted/60",
        className,
      )}
    >
      {children}
    </div>
  );
}

function LeadingMarker({
  unread,
  checked,
  display,
  onToggleChecked,
  wrapperClassName,
}: {
  unread: boolean;
  checked: boolean;
  display: string;
  onToggleChecked: () => void;
  wrapperClassName?: string;
}) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      aria-label={`Select message from ${display}`}
      onClick={(e) => {
        e.stopPropagation();
        onToggleChecked();
      }}
      className={cn(
        "relative inline-flex size-4 shrink-0 items-center justify-center",
        wrapperClassName,
      )}
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
  );
}

function StatusIcons({ email }: { email: EmailSummary }) {
  if (!email.starred && !email.pinned) return null;
  return (
    <>
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
    </>
  );
}

function displayFrom(from: string): string {
  const match = /^\s*"?([^"<]+?)"?\s*<.+>\s*$/.exec(from);
  return match ? match[1].trim() : from;
}
