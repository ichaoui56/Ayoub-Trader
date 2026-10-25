const steps = [
  { number: "01", title: "Arrive", detail: "We’ll meet you at the airport and get you on your way.", icon: "✈" },
  { number: "02", title: "Settle in", detail: "Check into your handpicked accommodation.", icon: "⌂" },
  { number: "03", title: "Explore", detail: "Enjoy curated experiences and make unforgettable memories.", icon: "⌁" },
];

export default function JourneySteps() {
  return (
    <section id="journey" className="travel-section pt-4">
      <div data-reveal>
        <p className="eyebrow">How it works</p>
        <h2 className="section-title mt-3">From arrival to adventure.</h2>
      </div>
      <ol className="journey-steps mt-10 grid gap-8 md:grid-cols-3" data-stagger>
        {steps.map((step) => (
          <li key={step.number} className="journey-step" data-card>
            <div className="flex items-center gap-4">
              <span className="step-number">{step.number}</span>
              <span className="text-2xl" aria-hidden="true">{step.icon}</span>
              <span className="hidden h-px flex-1 bg-signal/70 md:block" />
            </div>
            <h3 className="mt-4 font-display text-2xl font-bold uppercase">{step.title}</h3>
            <p className="mt-2 max-w-xs text-sm leading-relaxed text-ink/60">{step.detail}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}
