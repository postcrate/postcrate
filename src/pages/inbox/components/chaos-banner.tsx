import { Link } from "react-router-dom";
import {
  ArrowRightIcon,
  LightningIcon,
} from "@phosphor-icons/react/dist/ssr";

import { useMailbox } from "@/services/mailbox";
import { chaosIsActive, useChaos } from "@/services/chaos";

type Props = {
  mailboxId: string;
};

/**
 * Slim warning strip mounted above the inbox layout when chaos mode is
 * actively faulting incoming mail. Reads the same `useChaos` cache
 * that the Scenarios card writes to, so toggling chaos in another
 * window flips the banner live.
 */
export function ChaosBanner({ mailboxId }: Props) {
  const { chaos } = useChaos(mailboxId);
  const { mailbox } = useMailbox(mailboxId);

  if (!chaosIsActive(chaos)) return null;

  return (
    <div className="border-warn/30 bg-warn/10 flex shrink-0 items-center gap-2.5 border-b px-4 py-2">
      <LightningIcon
        size={13}
        weight="fill"
        className="text-warn shrink-0"
        aria-hidden
      />
      <p className="text-warn/90 min-w-0 flex-1 truncate text-[12px] leading-snug">
        Chaos mode is on
        {mailbox ? (
          <>
            {" for "}
            <span className="font-mono">{mailbox.name}</span>
          </>
        ) : null}
        {". Incoming mail is being faulted."}
      </p>
      <Link
        to="/scenarios"
        className="text-warn hover:text-warn/80 inline-flex items-center gap-1 text-[11.5px] font-medium tracking-tight"
      >
        Open scenarios
        <ArrowRightIcon size={10} weight="bold" />
      </Link>
    </div>
  );
}
