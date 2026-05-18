import {
  EnvelopeIcon,
  RobotIcon,
  ShieldCheckIcon,
} from "@phosphor-icons/react/dist/ssr";

const BULLETS = [
  {
    Icon: EnvelopeIcon,
    title: "Capture every email",
    body: "A local SMTP listener catches everything your apps send while you build.",
  },
  {
    Icon: ShieldCheckIcon,
    title: "Inspect like a pro",
    body: "Headers, HTML, text, links, attachments — all offline, all local.",
  },
  {
    Icon: RobotIcon,
    title: "Agent-ready",
    body: "An MCP server lets Claude, Cursor and other agents read and act on captures.",
  },
];

export function StepIntro() {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <ul className="divide-border/60 border-border/60 divide-y rounded-lg border">
        {BULLETS.map(({ Icon, title, body }) => (
          <li key={title} className="flex items-start gap-3 px-3.5 py-3">
            <span className="bg-muted text-muted-foreground border-border/60 mt-px grid size-7 shrink-0 place-items-center rounded-md border">
              <Icon size={14} weight="regular" />
            </span>
            <div className="min-w-0">
              <div className="text-foreground text-[13px] font-medium">
                {title}
              </div>
              <p className="text-muted-foreground mt-0.5 text-[12px] leading-snug">
                {body}
              </p>
            </div>
          </li>
        ))}
      </ul>

      <p className="text-muted-foreground/80 mt-4 text-[11.5px] leading-relaxed">
        Three quick steps — name a project, pick a port, copy a snippet.
        Nothing leaves your machine.
      </p>
    </div>
  );
}
