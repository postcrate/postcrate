import { EnvelopeIcon } from "@phosphor-icons/react/dist/ssr";

/** Right-pane placeholder when no email is selected. */
export function DetailEmpty() {
  return (
    <div className="text-muted-foreground flex h-full flex-col items-center justify-center gap-2 px-6 text-center">
      <EnvelopeIcon
        size={28}
        weight="regular"
        className="text-muted-foreground/40"
      />
      <p className="text-[12.5px]">Pick a message to read</p>
    </div>
  );
}
