import Link from "next/link";

export default function Concierge() {
  return (
    <section id="concierge" className="story-section">
      <div className="story-section__inner">
        <div className="story-section__topline">
          <p className="eyebrow">Notre Histoire</p>
          <span aria-hidden="true">EST. WITH CARE · MOROCCO</span>
        </div>

        <div className="story-section__layout">
          <div className="story-section__visual" data-reveal>
            <figure className="story-section__image">
              <img
                src="https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=1500&q=85"
                alt="A warm sunset over the rooftops and minarets of a Moroccan city"
                loading="lazy"
                decoding="async"
              />
              <figcaption>
                <span>MADE FOR THE WAY YOU TRAVEL</span>
                <strong>Morocco, a little closer.</strong>
              </figcaption>
            </figure>
            <div className="story-section__seal" aria-hidden="true">
              <span>LOCAL</span><span>HEART</span><span>OPEN</span><span>ROADS</span>
            </div>
            <div className="story-section__image-index"><span>01</span> / A DIFFERENT KIND OF JOURNEY</div>
          </div>

          <div className="story-section__copy" data-reveal>
            <p className="story-section__kicker"><span /> BUILT AROUND YOU</p>
            <h2>
              Your trip.<br />
              Your pace.<br />
              Your kind of <span>Morocco.</span>
            </h2>
            <p className="story-section__body">
              We believe the best journeys feel effortless, personal, and full of moments you didn’t plan for. We bring the details together—from the first airport pickup to the local places you’ll remember long after you leave.
            </p>
            <div className="story-section__values">
              <div><span>01</span><p><strong>Thoughtful by nature</strong><small>Details considered before you arrive.</small></p></div>
              <div><span>02</span><p><strong>Rooted in Morocco</strong><small>Local knowledge, genuine connections.</small></p></div>
              <div><span>03</span><p><strong>Always your journey</strong><small>Made to move at your own pace.</small></p></div>
            </div>
            <Link href="#contact" className="story-section__link">
              Let’s plan your journey <span aria-hidden="true">↗</span>
            </Link>
          </div>
        </div>

        <div className="story-section__footer">
          <span>FROM THE FIRST HELLO</span>
          <span aria-hidden="true" className="story-section__footer-line" />
          <span>TO THE STORIES YOU TAKE HOME</span>
        </div>
      </div>
    </section>
  );
}
