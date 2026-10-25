import { ALT, MEDIA, STEPS } from "../content";

export default function Approach() {
  return (
    <section id="approach" className="bg-cloud px-5 py-24 md:px-[4vw] md:py-36">
      <p className="border-b border-ink/20 pb-4 text-sm">03 / How we move</p>
      <h2 className="mt-10 max-w-[16ch] font-display text-[clamp(2.2rem,6vw,6rem)] font-extrabold leading-[0.96] tracking-tight">
        A little more thought. A lot less friction.
      </h2>

      <figure className="relative mt-14">
        <img src={MEDIA.warehouse} alt={ALT.warehouse} loading="lazy" decoding="async" sizes="100vw" className="aspect-[4/3] w-full object-cover md:aspect-[21/9]" />
        <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink/80 to-transparent p-5 pt-24 font-display text-[clamp(1.1rem,2.4vw,2.2rem)] font-extrabold uppercase leading-tight text-paper md:p-8">
          The last mile starts long before the last mile.
        </figcaption>
      </figure>

      <ol className="mt-14 grid gap-10 md:grid-cols-3 md:gap-8">
        {STEPS.map((s) => (
          <li key={s.n} className="border-t-2 border-ink pt-4">
            <p className="text-sm">{s.n} / {s.label}</p>
            <h3 className="mt-6 font-display text-[clamp(1.5rem,2.4vw,2.2rem)] font-extrabold leading-[1.05] tracking-tight">{s.title}</h3>
            <p className="mt-4 max-w-sm">{s.body}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}
