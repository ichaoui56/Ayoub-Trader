"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import { activities, getActivityImageUrl, type Activity, type ActivityBookingRate } from "../activities";

type ReservationLine = {
  id: number;
  slug: string;
  rateId: string;
  adults: number;
  children: number;
  time: string;
  extras: string[];
};

type ReservationContextValue = {
  openReservation: (activity: Activity) => void;
  openReservationCart: () => void;
};

const ReservationContext = createContext<ReservationContextValue | null>(null);

const formatPrice = (price: number) =>
  `${new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 }).format(price)} €`;

function getRate(activity: Activity, rateId: string): ActivityBookingRate {
  const rate = activity.reservation?.rates.find((item) => item.id === rateId);
  if (!rate) {
    throw new Error(`Missing reservation rate "${rateId}" for ${activity.slug}.`);
  }
  return rate;
}

function getUnits(rate: ActivityBookingRate, people: number) {
  return Math.max(1, Math.ceil(people / (rate.peoplePerUnit ?? 1)));
}

function getRateUnitName(rate: ActivityBookingRate) {
  if (rate.billing === "unit") return rate.unit.replace(/^per\s+/, "");
  return rate.description?.match(/\bper\s+([a-z ]+)/i)?.[1]?.trim() ?? "unit";
}

function pluralizeUnit(unit: string, count: number) {
  if (count === 1) return unit;
  if (unit === "buggy") return "buggies";
  if (unit === "jet ski") return "jet skis";
  return `${unit}s`;
}

function getLineTotal(activity: Activity, line: Omit<ReservationLine, "id">) {
  const config = activity.reservation;
  if (!config) return 0;

  const rate = getRate(activity, line.rateId);
  const people = line.adults + line.children;
  const units = getUnits(rate, people);
  let total = rate.billing === "person"
    ? (line.adults * rate.price) + (line.children * (config.childRate?.price ?? rate.price))
    : units * rate.price;

  for (const extraId of line.extras) {
    const extra = config.extras?.find((item) => item.id === extraId);
    if (extra) {
      total += extra.billing === "person" ? extra.price * people : extra.price * units;
    }
  }

  return total;
}

function getReservationDescription(activity: Activity, line: ReservationLine) {
  const config = activity.reservation;
  if (!config) return activity.title;

  const rate = getRate(activity, line.rateId);
  const people = line.adults + line.children;
  const units = getUnits(rate, people);
  const parts = [activity.title, rate.label];

  if (config.childRate) {
    parts.push(`${line.adults} adults`, `${line.children} children`);
  } else if (rate.peoplePerUnit || rate.billing === "unit") {
    const unit = getRateUnitName(rate);
    parts.push(`${people} people`, `${units} ${pluralizeUnit(unit, units)}`);
  } else {
    parts.push(`${people} people`);
  }

  if (line.time) parts.push(line.time);
  for (const extraId of line.extras) {
    const extra = config.extras?.find((item) => item.id === extraId);
    if (extra) parts.push(extra.label);
  }

  return parts.join(" · ");
}

export function useActivityReservations() {
  const context = useContext(ReservationContext);
  if (!context) {
    throw new Error("useActivityReservations must be used inside ActivityReservationProvider.");
  }
  return context;
}

export function ActivityReservationProvider({ children }: { children: ReactNode }) {
  const [activeActivity, setActiveActivity] = useState<Activity | null>(null);
  const [selectedRateId, setSelectedRateId] = useState("");
  const [adults, setAdults] = useState(2);
  const [childrenCount, setChildrenCount] = useState(0);
  const [selectedTime, setSelectedTime] = useState("");
  const [selectedExtras, setSelectedExtras] = useState<string[]>([]);
  const [lines, setLines] = useState<ReservationLine[]>([]);
  const [notice, setNotice] = useState("");
  const [requestStatus, setRequestStatus] = useState("");
  const [open, setOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const nextLineId = useRef(0);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const cartCloseButtonRef = useRef<HTMLButtonElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  const openReservation = useCallback((activity: Activity) => {
    if (!activity.reservation) {
      throw new Error(`Activity "${activity.slug}" has no reservation configuration.`);
    }
    previousFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    setCartOpen(false);
    setActiveActivity(activity);
    setSelectedRateId(activity.reservation.rates[0]?.id ?? "");
    setAdults(activity.reservation.rates[0]?.peoplePerUnit === 1 ? 1 : 2);
    setChildrenCount(0);
    setSelectedTime("");
    setSelectedExtras([]);
    setNotice("");
    setRequestStatus("");
    setOpen(true);
  }, []);

  const openReservationCart = useCallback(() => {
    previousFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    setCartOpen(true);
  }, []);

  useEffect(() => {
    if (!open && !cartOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    if (open) closeButtonRef.current?.focus();
    if (cartOpen) cartCloseButtonRef.current?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        setCartOpen(false);
      }
    };
    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
      previousFocusRef.current?.focus();
    };
  }, [open, cartOpen]);

  const activeReservation = activeActivity?.reservation;
  const activeRate = activeReservation
    ? activeReservation.rates.find((rate) => rate.id === selectedRateId) ?? activeReservation.rates[0]
    : undefined;
  const activeLine = activeActivity && activeRate
    ? {
      slug: activeActivity.slug,
      rateId: activeRate.id,
      adults,
      children: childrenCount,
      time: selectedTime,
      extras: selectedExtras,
    }
    : undefined;
  const activeTotal = activeActivity && activeLine ? getLineTotal(activeActivity, activeLine) : 0;
  const cartTotal = useMemo(
    () => lines.reduce((total, line) => {
      const activity = activities.find((item) => item.slug === line.slug);
      return activity ? total + getLineTotal(activity, line) : total;
    }, 0),
    [lines],
  );
  const needsPriceConfirmation = lines.some((line) =>
    activities.find((activity) => activity.slug === line.slug)?.reservation?.priceNeedsConfirmation,
  );

  const toggleExtra = (extraId: string) => {
    if (activeActivity?.reservation?.extraSelectionMode === "single") {
      setSelectedExtras((current) => current.includes(extraId) ? [] : [extraId]);
    } else {
      setSelectedExtras((current) =>
        current.includes(extraId) ? current.filter((id) => id !== extraId) : [...current, extraId],
      );
    }
  };

  const addSelection = () => {
    if (!activeActivity || !activeActivity.reservation || !activeRate) return;
    if (activeActivity.reservation.times?.length && !selectedTime) {
      setNotice("Choose an available time before adding this activity.");
      return;
    }

    nextLineId.current += 1;
    setLines((current) => [...current, {
      id: nextLineId.current,
      slug: activeActivity.slug,
      rateId: activeRate.id,
      adults,
      children: childrenCount,
      time: selectedTime,
      extras: selectedExtras,
    }]);
    setNotice(`${activeActivity.title} added to your selection.`);
    setRequestStatus("");
    setOpen(false);
    setCartOpen(true);
  };

  const removeLine = (lineId: number) => {
    setLines((current) => current.filter((line) => line.id !== lineId));
    setRequestStatus("");
  };

  const closeDialog = () => setOpen(false);

  const copyRequest = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!lines.length) {
      setRequestStatus("Add at least one activity to your selection first.");
      return;
    }

    const formData = new FormData(event.currentTarget);
    const requestLines = lines.map((line) => {
      const activity = activities.find((item) => item.slug === line.slug);
      if (!activity) return "";
      return `• ${getReservationDescription(activity, line)} — ${formatPrice(getLineTotal(activity, line))}`;
    });
    const phone = String(formData.get("phone") || "").trim();
    const countryCode = String(formData.get("countryCode") || "");
    const formattedPhone = phone.startsWith("+") || countryCode === "other"
      ? phone
      : `${countryCode} ${phone}`.trim();
    const summary = [
      "MOROCCO JOURNEYS — ACTIVITY REQUEST",
      "",
      ...requestLines,
      "",
      `Estimated total: ${formatPrice(cartTotal)}${needsPriceConfirmation ? " (final price to be confirmed)" : ""}`,
      `Date: ${String(formData.get("date") || "To be confirmed")}`,
      `Pickup / hotel: ${String(formData.get("hotel") || "To be confirmed")}`,
      `Name: ${String(formData.get("name") || "")}`,
      `Phone / WhatsApp: ${formattedPhone}`,
      `Email: ${String(formData.get("email") || "Not provided")}`,
      `Notes: ${String(formData.get("notes") || "None")}`,
      "",
      "Please confirm availability and final details. No online payment has been made.",
    ].join("\n");

    if (!navigator.clipboard?.writeText) {
      setRequestStatus("Copy is unavailable in this browser. Please select and copy your request details manually.");
      return;
    }

    try {
      await navigator.clipboard.writeText(summary);
      setRequestStatus("Request copied. Paste it into a message to our team to confirm availability.");
    } catch {
      setRequestStatus("We couldn’t copy the request. Check clipboard permissions and try again.");
    }
  };

  return (
    <ReservationContext.Provider value={{ openReservation, openReservationCart }}>
      {children}
      {lines.length > 0 && !open && !cartOpen && (
        <button type="button" className="activity-cart-trigger" onClick={openReservationCart}>
          <span aria-hidden="true">▤</span>
          Your selection
          <strong>{lines.length}</strong>
          <b>{formatPrice(cartTotal)}</b>
        </button>
      )}
      {open && activeActivity && activeReservation && activeRate && (
        <div className="activity-reservation-backdrop" onMouseDown={(event) => {
          if (event.target === event.currentTarget) closeDialog();
        }}>
          <section className="activity-reservation-dialog" role="dialog" aria-modal="true" aria-labelledby="activity-reservation-title">
            <header className="activity-reservation-header">
              <div>
                <p className="eyebrow">Build your Morocco moment</p>
                <h2 id="activity-reservation-title">Plan your experience</h2>
              </div>
              <button ref={closeButtonRef} type="button" className="activity-reservation-close" onClick={closeDialog} aria-label="Close reservation dialog">
                ×
              </button>
            </header>

            <div className="activity-reservation-layout">
              <div className="activity-reservation-config">
                <div className="activity-reservation-product">
                  <img src={getActivityImageUrl(activeActivity.image)} alt="" />
                  <div>
                    <span>{activeActivity.category} · {activeActivity.location}</span>
                    <h3>{activeActivity.title}</h3>
                    <p>{activeActivity.summary}</p>
                  </div>
                </div>

                {activeReservation.rates.length > 1 && (
                  <fieldset className="activity-reservation-fieldset">
                    <legend>Choose your experience</legend>
                    <div className="activity-reservation-rates">
                      {activeReservation.rates.map((rate) => (
                        <button
                          key={rate.id}
                          type="button"
                          className={`activity-reservation-rate${selectedRateId === rate.id ? " is-selected" : ""}`}
                          aria-pressed={selectedRateId === rate.id}
                          onClick={() => {
                            setSelectedRateId(rate.id);
                            if (rate.peoplePerUnit === 1) setAdults(1);
                            setNotice("");
                          }}
                        >
                          <span>{rate.label}</span>
                          <strong>{formatPrice(rate.price)}</strong>
                          <small>{rate.unit}{rate.description ? ` · ${rate.description}` : ""}</small>
                        </button>
                      ))}
                    </div>
                  </fieldset>
                )}

                {activeReservation.times && (
                  <fieldset className="activity-reservation-fieldset">
                    <legend>Choose a time</legend>
                    <div className="activity-reservation-times">
                      {activeReservation.times.map((time) => (
                        <button
                          key={time}
                          type="button"
                          className={selectedTime === time ? "is-selected" : ""}
                          aria-pressed={selectedTime === time}
                          onClick={() => { setSelectedTime(time); setNotice(""); }}
                        >
                          {time}
                        </button>
                      ))}
                    </div>
                  </fieldset>
                )}

                <fieldset className="activity-reservation-fieldset">
                  <legend>{activeReservation.childRate ? "Travellers" : "People"}</legend>
                  <div className="activity-reservation-guests">
                    <div className="activity-reservation-guest">
                      <span>
                        <strong>{activeReservation.childRate ? "Adults" : "People"}</strong>
                        <small>{activeReservation.childRate ? formatPrice(activeRate.price) + " / person" : "Select your group size"}</small>
                      </span>
                      <div className="activity-stepper">
                        <button type="button" aria-label="Remove one adult" disabled={adults <= 1} onClick={() => setAdults((value) => Math.max(1, value - 1))}>−</button>
                        <output>{adults}</output>
                        <button type="button" aria-label="Add one adult" disabled={adults + childrenCount >= 30} onClick={() => setAdults((value) => Math.min(30 - childrenCount, value + 1))}>+</button>
                      </div>
                    </div>
                    {activeReservation.childRate && (
                      <div className="activity-reservation-guest">
                        <span>
                          <strong>{activeReservation.childRate.label}</strong>
                          <small>{formatPrice(activeReservation.childRate.price)} / child</small>
                        </span>
                        <div className="activity-stepper">
                          <button type="button" aria-label="Remove one child" disabled={childrenCount <= 0} onClick={() => setChildrenCount((value) => Math.max(0, value - 1))}>−</button>
                          <output>{childrenCount}</output>
                          <button type="button" aria-label="Add one child" disabled={adults + childrenCount >= 30} onClick={() => setChildrenCount((value) => Math.min(30 - adults, value + 1))}>+</button>
                        </div>
                      </div>
                    )}
                  </div>
                  {activeRate.peoplePerUnit && (
                    <p className="activity-reservation-hint">
                      {getUnits(activeRate, adults + childrenCount)} {pluralizeUnit(getRateUnitName(activeRate), getUnits(activeRate, adults + childrenCount))} for {adults + childrenCount} {adults + childrenCount === 1 ? "person" : "people"} · up to {activeRate.peoplePerUnit} per {getRateUnitName(activeRate)}
                    </p>
                  )}
                </fieldset>

                {activeReservation.extras && activeReservation.extras.length > 0 && (
                  <fieldset className="activity-reservation-fieldset">
                    <legend>Add an extra</legend>
                    {activeReservation.extraSelectionMode === "single" && (
                      <button
                        type="button"
                        className={`activity-reservation-clear-extra${selectedExtras.length ? "" : " is-selected"}`}
                        aria-pressed={!selectedExtras.length}
                        onClick={() => setSelectedExtras([])}
                      >
                        No extra
                      </button>
                    )}
                    <div className="activity-reservation-extras">
                      {activeReservation.extras.map((extra) => (
                        <label key={extra.id} className={`activity-reservation-extra${selectedExtras.includes(extra.id) ? " is-selected" : ""}`}>
                          <input
                            type={activeReservation.extraSelectionMode === "single" ? "radio" : "checkbox"}
                            name={activeReservation.extraSelectionMode === "single" ? "activity-extra" : undefined}
                            checked={selectedExtras.includes(extra.id)}
                            onChange={() => toggleExtra(extra.id)}
                          />
                          <span>{extra.label}<small>{extra.unit}</small></span>
                          <strong>+{formatPrice(extra.price)}</strong>
                        </label>
                      ))}
                    </div>
                  </fieldset>
                )}

                {notice && <p className="activity-reservation-notice" role="status">{notice}</p>}
                <div className="activity-reservation-add-row">
                  <div><small>Current activity estimate</small><strong>{formatPrice(activeTotal)}</strong></div>
                  <button type="button" className="activity-reservation-add" onClick={addSelection} disabled={!!activeReservation.times?.length && !selectedTime}>
                    Add to selection <span aria-hidden="true">＋</span>
                  </button>
                </div>
                {activeActivity.bookingUrl && (
                  <a className="activity-reservation-partner" href={activeActivity.bookingUrl} target="_blank" rel="noopener noreferrer">
                    Prefer to book directly with the partner? <span>Open partner page ↗</span>
                  </a>
                )}
              </div>
            </div>
          </section>
        </div>
      )}
      {cartOpen && (
        <div className="activity-cart-backdrop" onMouseDown={(event) => {
          if (event.target === event.currentTarget) setCartOpen(false);
        }}>
          <aside className="activity-reservation-summary activity-cart-panel" aria-label="Your activity selection" role="dialog" aria-modal="true">
            <div className="activity-cart-panel__top">
              <div className="activity-reservation-summary__heading">
                <div>
                  <p className="eyebrow">Your trip, coming together</p>
                  <h3>Your selection <span>{lines.length}</span></h3>
                </div>
                <span aria-hidden="true">✳</span>
              </div>
              <button
                ref={cartCloseButtonRef}
                type="button"
                className="activity-reservation-close"
                onClick={() => setCartOpen(false)}
                aria-label="Close your selection"
              >
                ×
              </button>
            </div>

            {lines.length ? (
              <ul className="activity-reservation-lines">
                {lines.map((line) => {
                  const activity = activities.find((item) => item.slug === line.slug);
                  if (!activity) return null;
                  return (
                    <li key={line.id}>
                      <div>
                        <strong>{activity.title}</strong>
                        <span>{getReservationDescription(activity, line)}</span>
                      </div>
                      <strong>{formatPrice(getLineTotal(activity, line))}</strong>
                      <button type="button" aria-label={`Remove ${activity.title}`} onClick={() => removeLine(line.id)}>×</button>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <div className="activity-reservation-empty">
                <span aria-hidden="true">✳</span>
                <strong>Your selection starts here</strong>
                <p>Choose a time, group size, or extra and add an experience.</p>
              </div>
            )}

            <form id="activity-reservation-form" className="activity-reservation-form" onSubmit={copyRequest}>
              <p className="activity-cart-panel__intro">Your plans are ready. Add your details so our team can confirm availability.</p>
              <label>
                <span>Date</span>
                <input name="date" type="date" required />
              </label>
              <label>
                <span>Hotel / pickup location</span>
                <input name="hotel" type="text" placeholder="Hotel name or address" />
              </label>
              <div className="activity-reservation-form__contact">
                <label>
                  <span>Your name</span>
                  <input name="name" type="text" autoComplete="name" placeholder="Full name" required />
                </label>
                <label>
                  <span>Phone / WhatsApp</span>
                  <div className="activity-reservation-phone">
                    <select name="countryCode" aria-label="Phone country code" autoComplete="tel-country-code">
                      <option value="+212">Morocco (+212)</option>
                      <option value="+33">France (+33)</option>
                      <option value="+32">Belgium (+32)</option>
                      <option value="+44">United Kingdom (+44)</option>
                      <option value="+34">Spain (+34)</option>
                      <option value="+49">Germany (+49)</option>
                      <option value="+31">Netherlands (+31)</option>
                      <option value="+39">Italy (+39)</option>
                      <option value="+41">Switzerland (+41)</option>
                      <option value="+351">Portugal (+351)</option>
                      <option value="+353">Ireland (+353)</option>
                      <option value="+1">United States / Canada (+1)</option>
                      <option value="other">Other (enter full number)</option>
                    </select>
                    <input name="phone" type="tel" autoComplete="tel-national" inputMode="tel" placeholder="6 12 34 56 78" required />
                  </div>
                </label>
              </div>
              <label>
                <span>Email <small>(optional)</small></span>
                <input name="email" type="email" autoComplete="email" placeholder="you@example.com" />
              </label>
              <label>
                <span>Notes <small>(optional)</small></span>
                <textarea name="notes" rows={2} placeholder="Anything else we should know?" />
              </label>

              <div className="activity-reservation-total">
                <span>{needsPriceConfirmation ? "Estimated total*" : "Estimated total"}</span>
                <strong>{formatPrice(cartTotal)}</strong>
              </div>
              {needsPriceConfirmation && <p className="activity-reservation-confirm-note">Some prices require confirmation by our team.</p>}
              <p className="activity-reservation-payment-note">No online payment. Availability and final details are confirmed by the activity team.</p>
              <button type="submit" className="activity-reservation-submit" disabled={!lines.length}>
                Copy request details <span aria-hidden="true">↗</span>
              </button>
              {requestStatus && <p className="activity-reservation-status" role="status">{requestStatus}</p>}
              <button type="button" className="activity-cart-continue" onClick={() => setCartOpen(false)}>
                Continue planning
              </button>
            </form>
          </aside>
        </div>
      )}
    </ReservationContext.Provider>
  );
}
