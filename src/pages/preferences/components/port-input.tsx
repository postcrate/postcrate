import { Input } from "@/components/ui/input";

type Props = {
  id: string;
  value: number;
  onChange: (n: number) => void;
};

export function PortInput({ id, value, onChange }: Props) {
  return (
    <Input
      id={id}
      type="number"
      min={1}
      max={65535}
      value={value}
      onChange={(e) => onChange(Number(e.currentTarget.value) || 0)}
      className="h-8 w-24 text-right text-xs tabular-nums"
    />
  );
}
