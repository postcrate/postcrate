import { IntField } from "@/components/int-field";

type Props = {
  id: string;
  value: number;
  onCommit: (n: number) => void;
};

export function PortInput({ id, value, onCommit }: Props) {
  return (
    <IntField id={id} value={value} onCommit={onCommit} min={1} max={65535} />
  );
}
