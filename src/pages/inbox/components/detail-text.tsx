type Props = {
  text: string;
};

/**
 * Plain-text body view. Whitespace is preserved; long lines wrap.
 */
export function DetailText({ text }: Props) {
  return (
    <pre className="text-foreground font-mono text-[12.5px] leading-relaxed whitespace-pre-wrap px-6 py-5">
      {text}
    </pre>
  );
}
