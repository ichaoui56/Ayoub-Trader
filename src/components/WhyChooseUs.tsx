const features = [
  { icon: "✈", title: "Reliable transfers", detail: "On time, every time." },
  { icon: "⌂", title: "Curated stays", detail: "Quality, comfort, character." },
  { icon: "◎", title: "Local expertise", detail: "Authentic experiences." },
  { icon: "◇", title: "Personalized service", detail: "Your journey, our priority." },
];

export default function WhyChooseUs() {
  return (
    <section className="bg-ink px-5 py-10 text-paper md:px-[4vw] md:py-14">
      <div className="mx-auto grid max-w-[1500px] gap-8 lg:grid-cols-[1.1fr_2fr] lg:items-center">
        <div data-reveal>
          <p className="eyebrow">Why choose us</p>
          <h2 className="section-title mt-3 text-paper">Less stress.<br />More discovery.</h2>
        </div>
        <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4" data-stagger>
          {features.map((feature) => (
            <li key={feature.title} className="border-t border-paper/25 pt-4" data-card>
              <span className="text-2xl text-signal" aria-hidden="true">{feature.icon}</span>
              <h3 className="mt-4 font-display text-base font-bold uppercase">{feature.title}</h3>
              <p className="mt-1 text-xs text-paper/60">{feature.detail}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
