const steps = [
  { number: "01", title: "Arrive", detail: "We’ll meet you at the airport and get you on your way.", icon: "✈" },
  { number: "02", title: "Settle in", detail: "Check into your handpicked accommodation.", icon: "⌂" },
  { number: "03", title: "Explore", detail: "Enjoy curated experiences and make unforgettable memories.", icon: "⌁" },
];

export default function JourneySteps() {
  return (
    <section id="journey" className="travel-section journey-section pt-4">
      <div data-reveal>
        <p className="eyebrow">How it works</p>
        <h2 className="section-title mt-3">From arrival to adventure.</h2>
      </div>
      <ol className="journey-steps mt-10" data-stagger>
        {steps.map((step) => (
          <li key={step.number} className="journey-step" data-card>
            <div className="journey-step__marker" aria-hidden="true">
              <span>{step.icon}</span>
              <i />
            </div>
            {step.number !== "03" && (
              <span className="journey-step__connector" aria-hidden="true">
                <i />
                <b>›</b>
              </span>
            )}
            <div className="journey-step__card">
              <span className="journey-step__number">STEP {step.number}</span>
              <h3>{step.title}</h3>
              <p>{step.detail}</p>
              <span className="journey-step__accent" aria-hidden="true">{step.number}</span>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
