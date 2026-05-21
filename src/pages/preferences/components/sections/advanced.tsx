import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { reportIpcError } from "@/lib/bridge/ipc";
import { IntField } from "@/components/int-field";
import { Skeleton } from "@/components/ui/skeleton";
import { usePreferencesStore } from "@/stores/use-preferences-store";
import {
  updateAdvancedPrefs,
  useBackendSettings,
  type AdvancedPrefs,
} from "@/services/settings";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

import { Row } from "../row";
import { Section } from "../section";

export function AdvancedSection() {
  const { settings } = useBackendSettings();
  const a = settings?.advanced;
  const reset = usePreferencesStore((s) => s.reset);

  function commit(patch: Partial<AdvancedPrefs>) {
    if (!a) return;
    updateAdvancedPrefs({ ...a, ...patch }).catch((err) =>
      reportIpcError(err, "Couldn't update advanced settings"),
    );
  }

  return (
    <Section
      title="Advanced"
      description="Diagnostics, raw captures, and a way to start over."
    >
      <Row
        label="Debug logging"
        description="Write detailed logs to help diagnose issues. Applies live."
        htmlFor="debug-logging"
      >
        {a ? (
          <Switch
            id="debug-logging"
            checked={a.debugLogging}
            onCheckedChange={(v) => commit({ debugLogging: v })}
          />
        ) : (
          <Skeleton className="h-5 w-9 rounded-full" />
        )}
      </Row>
      <Row
        label="Preserve SMTP transcript"
        description="Save the wire conversation with each captured email. Visible in the Transcript tab. AUTH credentials are redacted."
        htmlFor="preserve-smtp"
      >
        {a ? (
          <Switch
            id="preserve-smtp"
            checked={a.preserveSmtpTranscript}
            onCheckedChange={(v) => commit({ preserveSmtpTranscript: v })}
          />
        ) : (
          <Skeleton className="h-5 w-9 rounded-full" />
        )}
      </Row>
      <Row
        label="Audit log retention"
        description="Days to keep audit entries before they're pruned."
        htmlFor="audit-retain"
      >
        {a ? (
          <IntField
            id="audit-retain"
            value={a.auditRetainDays}
            onCommit={(n) => commit({ auditRetainDays: n })}
            min={1}
            max={3650}
          />
        ) : (
          <Skeleton className="h-8 w-24" />
        )}
      </Row>
      <Row
        label={<span className="text-destructive">Reset UI preferences</span>}
        description="Restore appearance, notifications, and other app settings. Engine settings (network, agents, inbox, advanced) stay as they are."
      >
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" size="sm" className="h-8 text-xs">
              Reset…
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Reset UI preferences?</AlertDialogTitle>
              <AlertDialogDescription>
                Appearance, general, notifications, privacy, updates, and the
                inbox view return to their defaults. Engine settings and your
                captured emails stay as they are.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={reset}>Reset</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </Row>
    </Section>
  );
}
