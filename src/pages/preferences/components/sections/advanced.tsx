import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { usePreferencesStore } from "@/stores/use-preferences-store";
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
  const a = usePreferencesStore((s) => s.advanced);
  const update = usePreferencesStore((s) => s.update);
  const reset = usePreferencesStore((s) => s.reset);

  return (
    <Section
      title="Advanced"
      description="Diagnostics, raw captures, and a way to start over."
    >
      <Row
        label="Debug logging"
        description="Verbose logs for troubleshooting. Increases disk usage."
        htmlFor="debug-logging"
      >
        <Switch
          id="debug-logging"
          checked={a.debugLogging}
          onCheckedChange={(v) => update("advanced", { debugLogging: v })}
        />
      </Row>
      <Row
        label="Preserve SMTP transcript"
        description="Keep the raw conversation for each captured email."
        htmlFor="preserve-smtp"
      >
        <Switch
          id="preserve-smtp"
          checked={a.preserveSmtpTranscript}
          onCheckedChange={(v) =>
            update("advanced", { preserveSmtpTranscript: v })
          }
        />
      </Row>
      <Row
        label={<span className="text-destructive">Reset all preferences</span>}
        description="Restore every setting to its default value. Cannot be undone."
      >
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" size="sm" className="h-8 text-xs">
              Reset…
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Reset all preferences?</AlertDialogTitle>
              <AlertDialogDescription>
                Every setting on every tab will return to its default. Your
                captured emails are not affected.
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
