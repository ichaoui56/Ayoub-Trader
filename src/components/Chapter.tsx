type Props = { chapter: { n: string; kicker: string; title: string; body: string } };

export default function Chapter({ chapter }: Props) {
  return (
    <article>
      <p className="mb-3 text-sm text-paper/75"><span className="mr-2 text-signal">{chapter.n}</span>{chapter.kicker}</p>
      <h2 className="font-display text-[clamp(1.9rem,3.6vw,3.4rem)] font-extrabold leading-[1.02] tracking-tight">{chapter.title}</h2>
      <p className="mt-4 max-w-sm text-base text-paper/85">{chapter.body}</p>
    </article>
  );
}
