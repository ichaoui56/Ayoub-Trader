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
import { getActivityImageUrl, type Activity, type ActivityBookingRate } from "../activities";
import { translate } from "../i18n";
import { submitActivityReservation } from "../server/activity-reservation-actions";
import { useLocale } from "./LocaleProvider";

type ReservationLine = {
  id: number;
  activity: Activity;
  rateId: string;
  adults: number;
  children: number;
  date: string;
  time: string;
  extras: string[];
};

type ReservationConflict = {
  line: ReservationLine;
  existingLines: ReservationLine[];
};

const RESERVATION_LINES_STORAGE_KEY = "morocco-activity-reservation-lines";

type ReservationContextValue = {
  openReservation: (activity: Activity) => void;
  openReservationCart: () => void;
};

const ReservationContext = createContext<ReservationContextValue | null>(null);

const formatPrice = (price: number, locale: "en" | "fr") =>
  `${new Intl.NumberFormat(locale === "fr" ? "fr-FR" : "en", { maximumFractionDigits: 0 }).format(price)} €`;

function getTodayDate() {
  const today = new Date();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${today.getFullYear()}-${month}-${day}`;
}

function formatReservationDate(date: string, locale: "en" | "fr") {
  return new Intl.DateTimeFormat(locale === "fr" ? "fr-FR" : "en", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${date}T00:00:00Z`));
}

function normalizeReservationTime(time: string) {
  return time.replace(":", "h");
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function restoreReservationLines(value: unknown): ReservationLine[] {
  if (!Array.isArray(value)) return [];

  const restored: ReservationLine[] = [];
  for (const candidate of value) {
    if (!isRecord(candidate) || !isRecord(candidate.activity)) continue;
    const activity = candidate.activity;
    const reservation = activity.reservation;
    if (
      typeof activity.slug !== "string" ||
      typeof activity.title !== "string" ||
      typeof activity.image !== "string" ||
      !isRecord(reservation) ||
      !Array.isArray(reservation.rates) ||
      typeof candidate.rateId !== "string" ||
      !reservation.rates.some((rate) => isRecord(rate) && rate.id === candidate.rateId) ||
      !Number.isInteger(candidate.adults) || Number(candidate.adults) < 1 ||
      !Number.isInteger(candidate.children) || Number(candidate.children) < 0 ||
      typeof candidate.date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(candidate.date) ||
      typeof candidate.time !== "string" || !/^(?:[01]\d|2[0-3])(?::|h)[0-5]\d$/.test(candidate.time) ||
      !Array.isArray(candidate.extras) || !candidate.extras.every((extra) => typeof extra === "string")
    ) continue;

    restored.push({
      id: restored.length + 1,
      activity: activity as unknown as Activity,
      rateId: candidate.rateId,
      adults: Number(candidate.adults),
      children: Number(candidate.children),
      date: candidate.date,
      time: candidate.time,
      extras: candidate.extras,
    });
  }
  return restored;
}

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
  if (rate.billing === "unit") return rate.unit.replace(/^(?:per|par)\s+/, "");
  return rate.description?.match(/\bper\s+([a-z ]+)/i)?.[1]?.trim() ?? "unit";
}

function pluralizeUnit(unit: string, count: number, locale: "en" | "fr") {
  if (count === 1) return unit;
  if (unit === "buggy") return locale === "fr" ? "buggys" : "buggies";
  if (unit === "jet ski" || unit === "jet-ski") return locale === "fr" ? "jet-skis" : "jet skis";
  if (unit === "bateau") return "bateaux";
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

function getReservationDescription(activity: Activity, line: ReservationLine, locale: "en" | "fr") {
  const t = (phrase: string) => translate(locale, phrase);
  const config = activity.reservation;
  if (!config) return activity.title;

  const rate = getRate(activity, line.rateId);
  const people = line.adults + line.children;
  const units = getUnits(rate, people);
  const parts = [activity.title, rate.label];

  if (config.childRate) {
    parts.push(`${line.adults} ${t("adults")}`, `${line.children} ${t("children")}`);
  } else if (rate.peoplePerUnit || rate.billing === "unit") {
    const unit = getRateUnitName(rate);
    parts.push(`${people} ${t(people === 1 ? "person" : "people")}`, `${units} ${pluralizeUnit(unit, units, locale)}`);
  } else {
    parts.push(`${people} ${t(people === 1 ? "person" : "people")}`);
  }

  parts.push(formatReservationDate(line.date, locale));
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
  const { locale } = useLocale();
  const t = (phrase: string) => translate(locale, phrase);
  const [activeActivity, setActiveActivity] = useState<Activity | null>(null);
  const [selectedRateId, setSelectedRateId] = useState("");
  const [adults, setAdults] = useState(2);
  const [childrenCount, setChildrenCount] = useState(0);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [selectedExtras, setSelectedExtras] = useState<string[]>([]);
  const [lines, setLines] = useState<ReservationLine[]>([]);
  const [linesHydrated, setLinesHydrated] = useState(false);
  const [notice, setNotice] = useState("");
  const [requestStatus, setRequestStatus] = useState("");
  const [bookedTimes, setBookedTimes] = useState<string[]>([]);
  const [availabilityError, setAvailabilityError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successToastOpen, setSuccessToastOpen] = useState(false);
  const [reservationConflict, setReservationConflict] = useState<ReservationConflict | null>(null);
  const [open, setOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const nextLineId = useRef(0);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const cartCloseButtonRef = useRef<HTMLButtonElement>(null);
  const conflictKeepButtonRef = useRef<HTMLButtonElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    try {
      const savedLines = window.localStorage.getItem(RESERVATION_LINES_STORAGE_KEY);
      if (savedLines) {
        const restoredLines = restoreReservationLines(JSON.parse(savedLines));
        setLines(restoredLines);
        nextLineId.current = restoredLines.length;
      }
    } catch (error) {
      console.warn("Could not restore the activity selection.", error);
    }
    setLinesHydrated(true);
  }, []);

  useEffect(() => {
    if (!linesHydrated) return;
    try {
      if (lines.length) {
        window.localStorage.setItem(RESERVATION_LINES_STORAGE_KEY, JSON.stringify(lines));
      } else {
        window.localStorage.removeItem(RESERVATION_LINES_STORAGE_KEY);
      }
    } catch (error) {
      console.warn("Could not save the activity selection.", error);
    }
  }, [lines, linesHydrated]);

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
    setSelectedDate("");
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
        if (reservationConflict) {
          setReservationConflict(null);
          setSelectedTime("");
          return;
        }
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
  }, [open, cartOpen, reservationConflict]);

  useEffect(() => {
    if (reservationConflict) conflictKeepButtonRef.current?.focus();
  }, [reservationConflict]);

  useEffect(() => {
    if (!successToastOpen) return;
    const timeout = window.setTimeout(() => setSuccessToastOpen(false), 7000);
    return () => window.clearTimeout(timeout);
  }, [successToastOpen]);

  useEffect(() => {
    if (!activeActivity || !selectedDate) {
      setBookedTimes([]);
      setAvailabilityError("");
      return;
    }

    const controller = new AbortController();
    setBookedTimes([]);
    setAvailabilityError("");
    void fetch(`/api/activities/availability?slug=${encodeURIComponent(activeActivity.slug)}&date=${encodeURIComponent(selectedDate)}`, {
      cache: "no-store",
      signal: controller.signal,
    })
      .then(async (response) => {
        const result: unknown = await response.json();
        if (!response.ok || typeof result !== "object" || result === null || !("bookedTimes" in result) || !Array.isArray(result.bookedTimes)) {
          throw new Error(t("Could not check time availability. Please try again."));
        }
        setBookedTimes(result.bookedTimes.filter((time): time is string => typeof time === "string"));
      })
      .catch((error: unknown) => {
        if (error instanceof Error && error.name === "AbortError") return;
        setAvailabilityError(error instanceof Error ? error.message : t("Could not check time availability. Please try again."));
      });

    return () => controller.abort();
  }, [activeActivity?.slug, selectedDate, locale]);

  const activeReservation = activeActivity?.reservation;
  const activeRate = activeReservation
    ? activeReservation.rates.find((rate) => rate.id === selectedRateId) ?? activeReservation.rates[0]
    : undefined;
  const hasDateSchedule = Boolean(activeReservation?.availability?.length);
  const availableDateSchedules = (activeReservation?.availability ?? []).filter((schedule) => schedule.date >= getTodayDate());
  const selectedDateSchedule = availableDateSchedules.find((schedule) => schedule.date === selectedDate);
  const availableTimes = hasDateSchedule
    ? selectedDateSchedule?.times ?? []
    : activeReservation?.times ?? [];
  const activeLine = activeActivity && activeRate
    ? {
      activity: activeActivity,
      rateId: activeRate.id,
      adults,
      children: childrenCount,
      date: selectedDate,
      time: selectedTime,
      extras: selectedExtras,
    }
    : undefined;
  const activeTotal = activeActivity && activeLine ? getLineTotal(activeActivity, activeLine) : 0;
  const cartTotal = useMemo(
    () => lines.reduce((total, line) => total + getLineTotal(line.activity, line), 0),
    [lines],
  );
  const needsPriceConfirmation = lines.some((line) => line.activity.reservation?.priceNeedsConfirmation);

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
    if (!selectedDate) {
      setNotice(hasDateSchedule ? t("Choose one of the available dates before adding this activity.") : t("Choose a date before adding this activity."));
      return;
    }
    if (!selectedTime) {
      setNotice(availableTimes.length
        ? t("Choose an available time before adding this activity.")
        : t("Choose a preferred time before adding this activity."));
      return;
    }
    if (bookedTimes.includes(selectedTime)) {
      setNotice(t("That time has already been confirmed. Choose another time."));
      return;
    }

    const line: ReservationLine = {
      id: nextLineId.current + 1,
      activity: activeActivity,
      rateId: activeRate.id,
      adults,
      children: childrenCount,
      date: selectedDate,
      time: selectedTime,
      extras: selectedExtras,
    };
    const existingLines = lines.filter((existing) =>
      existing.date === line.date &&
      normalizeReservationTime(existing.time) === normalizeReservationTime(line.time),
    );
    if (existingLines.length) {
      setReservationConflict({ line, existingLines });
      return;
    }
    addLineToSelection(line);
  };

  const addLineToSelection = (line: ReservationLine, replacedLineIds: number[] = []) => {
    nextLineId.current = Math.max(nextLineId.current, line.id);
    const replacedIds = new Set(replacedLineIds);
    setLines((current) => [...current.filter((existing) => !replacedIds.has(existing.id)), line]);
    setNotice(`${line.activity.title} ${t("added to your selection.")}`);
    setRequestStatus("");
    setReservationConflict(null);
    setOpen(false);
    setCartOpen(true);
  };

  const keepExistingAndChooseAnotherTime = () => {
    setReservationConflict(null);
    setSelectedTime("");
    setNotice(t("Choose another time to avoid overlapping activities."));
  };

  const replaceExistingSelection = () => {
    if (!reservationConflict) return;
    addLineToSelection(reservationConflict.line, reservationConflict.existingLines.map((line) => line.id));
  };

  const removeLine = (lineId: number) => {
    setLines((current) => current.filter((line) => line.id !== lineId));
    setRequestStatus("");
  };

  const closeDialog = () => setOpen(false);

  const submitRequest = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!lines.length || isSubmitting) {
      setRequestStatus(t("Add at least one activity to your selection first."));
      return;
    }

    const formData = new FormData(event.currentTarget);
    const phone = String(formData.get("phone") || "").trim();
    const countryCode = String(formData.get("countryCode") || "");
    const formattedPhone = phone.startsWith("+") || countryCode === "other"
      ? phone
      : `${countryCode} ${phone}`.trim();
    setIsSubmitting(true);
    setRequestStatus("");
    try {
      await submitActivityReservation({
        customerName: String(formData.get("name") || ""),
        customerPhone: formattedPhone,
        customerEmail: String(formData.get("email") || ""),
        hotelAddress: String(formData.get("hotel") || ""),
        notes: String(formData.get("notes") || ""),
        lines: lines.map((line) => ({
          activitySlug: line.activity.slug,
          rateId: line.rateId,
          adults: line.adults,
          children: line.children,
          date: line.date,
          time: line.time,
          extras: line.extras,
        })),
      });
      setLines([]);
      setRequestStatus("");
      setCartOpen(false);
      setSuccessToastOpen(true);
    } catch (error) {
      setRequestStatus(error instanceof Error ? t(error.message) : t("Your reservation could not be submitted. Please try again."));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ReservationContext.Provider value={{ openReservation, openReservationCart }}>
      {children}
      {successToastOpen && (
        <div className="booking-success-toast" role="status" aria-live="polite" aria-atomic="true">
          <span className="booking-success-toast__icon" aria-hidden="true">✓</span>
          <div>
            <h3>{t("Your reservation was successfully submitted.")}</h3>
            <p>{t("Your reservation request has been submitted. Our team will contact you soon.")}</p>
          </div>
          <button type="button" aria-label={t("Close confirmation")} onClick={() => setSuccessToastOpen(false)}>×</button>
        </div>
      )}
      {lines.length > 0 && !open && !cartOpen && (
        <button type="button" className="activity-cart-trigger" onClick={openReservationCart}>
          <span aria-hidden="true">▤</span>
          Your selection
          <strong>{lines.length}</strong>
          <b>{formatPrice(cartTotal, locale)}</b>
        </button>
      )}
      {open && activeActivity && activeReservation && activeRate && (
        <div className="activity-reservation-backdrop" onMouseDown={(event) => {
          if (event.target === event.currentTarget) closeDialog();
        }}>
          <section className="activity-reservation-dialog" role="dialog" aria-modal="true" aria-labelledby="activity-reservation-title">
            <header className="activity-reservation-header">
              <div>
                <p className="eyebrow">{t("Build your Morocco moment")}</p>
                <h2 id="activity-reservation-title">{t("Plan your experience")}</h2>
              </div>
              <button ref={closeButtonRef} type="button" className="activity-reservation-close" onClick={closeDialog} aria-label={t("Close reservation dialog")}>
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
                    <legend>{t("Choose your experience")}</legend>
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
                          <strong>{formatPrice(rate.price, locale)}</strong>
                          <small>{rate.unit}{rate.description ? ` · ${rate.description}` : ""}</small>
                        </button>
                      ))}
                    </div>
                  </fieldset>
                )}

                <fieldset className="activity-reservation-fieldset">
                  <legend>{t("Choose a date")}</legend>
                  {hasDateSchedule ? (
                    availableDateSchedules.length ? (
                      <label className="activity-reservation-date">
                        <span>{t("Available dates")}</span>
                        <select value={selectedDate} onChange={(event) => { setSelectedDate(event.target.value); setSelectedTime(""); setNotice(""); }} required>
                          <option value="">{t("Choose a date")}</option>
                          {availableDateSchedules.map((schedule) => <option key={schedule.date} value={schedule.date}>{formatReservationDate(schedule.date, locale)}</option>)}
                        </select>
                      </label>
                    ) : <p className="activity-reservation-hint">{t("No future dates are currently available. Please contact our team.")}</p>
                  ) : (
                    <label className="activity-reservation-date">
                        <span>{t("Date for this experience")}</span>
                      <input type="date" value={selectedDate} min={getTodayDate()} onChange={(event) => { setSelectedDate(event.target.value); setNotice(""); }} required />
                    </label>
                  )}
                </fieldset>

                {hasDateSchedule && !selectedDate ? (
                  <fieldset className="activity-reservation-fieldset">
                    <legend>{t("Choose a time")}</legend>
                    <p className="activity-reservation-hint">{t("Choose a date to see its available departure times.")}</p>
                  </fieldset>
                ) : availableTimes.length ? (
                  <fieldset className="activity-reservation-fieldset">
                    <legend>{t("Choose a time")}</legend>
                    <div className="activity-reservation-times">
                      {availableTimes.map((time) => {
                        const isBooked = bookedTimes.includes(time);
                        return (
                          <button
                            key={time}
                            type="button"
                            className={`${selectedTime === time ? "is-selected" : ""}${isBooked ? " is-taken" : ""}`}
                            aria-label={isBooked ? `${time}, ${t("Taken")}` : time}
                            aria-pressed={selectedTime === time}
                            disabled={isBooked}
                            onClick={() => { setSelectedTime(time); setNotice(""); }}
                          >
                            <span>{time}</span>{isBooked && <span aria-hidden="true">×</span>}
                          </button>
                        );
                      })}
                    </div>
                  </fieldset>
                ) : (
                  <fieldset className="activity-reservation-fieldset">
                    <legend>{t("Choose a preferred time")}</legend>
                    <label className="activity-reservation-date">
                      <span>{t("Preferred time")}</span>
                      <input type="time" value={selectedTime} onChange={(event) => { setSelectedTime(event.target.value); setNotice(""); }} required />
                    </label>
                    {bookedTimes.length > 0 && (
                      <div className="activity-reservation-times activity-reservation-times--booked" aria-label={t("Taken times")}>
                        {bookedTimes.map((time) => <span key={time}><span>{time}</span><b aria-hidden="true">×</b></span>)}
                      </div>
                    )}
                    <p className="activity-reservation-hint">{t("The activity team will confirm availability for your preferred time.")}</p>
                  </fieldset>
                )}
                {availabilityError && <p className="activity-reservation-notice" role="alert">{availabilityError}</p>}

                <fieldset className="activity-reservation-fieldset">
                  <legend>{t(activeReservation.childRate ? "Travellers" : "People")}</legend>
                  <div className="activity-reservation-guests">
                    <div className="activity-reservation-guest">
                      <span>
                        <strong>{t(activeReservation.childRate ? "Adults" : "People")}</strong>
                        <small>{activeReservation.childRate ? formatPrice(activeRate.price, locale) + ` / ${t("person")}` : t("Select your group size")}</small>
                      </span>
                      <div className="activity-stepper">
                        <button type="button" aria-label={t("Remove one adult")} disabled={adults <= 1} onClick={() => setAdults((value) => Math.max(1, value - 1))}>−</button>
                        <output>{adults}</output>
                        <button type="button" aria-label={t("Add one adult")} disabled={adults + childrenCount >= 30} onClick={() => setAdults((value) => Math.min(30 - childrenCount, value + 1))}>+</button>
                      </div>
                    </div>
                    {activeReservation.childRate && (
                      <div className="activity-reservation-guest">
                        <span>
                          <strong>{activeReservation.childRate.label}</strong>
                          <small>{formatPrice(activeReservation.childRate.price, locale)} / {t("child")}</small>
                        </span>
                        <div className="activity-stepper">
                          <button type="button" aria-label={t("Remove one child")} disabled={childrenCount <= 0} onClick={() => setChildrenCount((value) => Math.max(0, value - 1))}>−</button>
                          <output>{childrenCount}</output>
                          <button type="button" aria-label={t("Add one child")} disabled={adults + childrenCount >= 30} onClick={() => setChildrenCount((value) => Math.min(30 - adults, value + 1))}>+</button>
                        </div>
                      </div>
                    )}
                  </div>
                  {activeRate.peoplePerUnit && (
                    <p className="activity-reservation-hint">
                      {getUnits(activeRate, adults + childrenCount)} {pluralizeUnit(getRateUnitName(activeRate), getUnits(activeRate, adults + childrenCount), locale)} {t("for")} {adults + childrenCount} {t(adults + childrenCount === 1 ? "person" : "people")} · {t("up to")} {activeRate.peoplePerUnit} {t("per")} {getRateUnitName(activeRate)}
                    </p>
                  )}
                </fieldset>

                {activeReservation.extras && activeReservation.extras.length > 0 && (
                  <fieldset className="activity-reservation-fieldset">
                    <legend>{t("Add an extra")}</legend>
                    {activeReservation.extraSelectionMode === "single" && (
                      <button
                        type="button"
                        className={`activity-reservation-clear-extra${selectedExtras.length ? "" : " is-selected"}`}
                        aria-pressed={!selectedExtras.length}
                        onClick={() => setSelectedExtras([])}
                      >
                        {t("No extra")}
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
                          <strong>+{formatPrice(extra.price, locale)}</strong>
                        </label>
                      ))}
                    </div>
                  </fieldset>
                )}

                {notice && <p className="activity-reservation-notice" role="status">{notice}</p>}
                <div className="activity-reservation-add-row">
                  <div><small>{t("Current activity estimate")}</small><strong>{formatPrice(activeTotal, locale)}</strong></div>
                  <button type="button" className="activity-reservation-add" onClick={addSelection}>
                    {t("Add to selection")} <span aria-hidden="true">＋</span>
                  </button>
                </div>
               
              </div>
            </div>
          </section>
        </div>
      )}
      {reservationConflict && (
        <div
          className="activity-reservation-conflict-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) keepExistingAndChooseAnotherTime();
          }}
        >
          <section
            className="activity-reservation-conflict"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="activity-reservation-conflict-title"
            aria-describedby="activity-reservation-conflict-description"
          >
            <header className="activity-reservation-conflict__header">
              <span aria-hidden="true">!</span>
              <div>
                <p>{t("Time overlap")}</p>
                <h2 id="activity-reservation-conflict-title">{t("You already have an activity at this time")}</h2>
              </div>
            </header>
            <p className="activity-reservation-conflict__description" id="activity-reservation-conflict-description">
              {t("These activities share the same date and time. Replace the existing selection, or keep it and choose another time.")}
            </p>
            <div className="activity-reservation-conflict__slot">
              <small>{t("New activity")}</small>
              <strong>{reservationConflict.line.activity.title}</strong>
              <span>{formatReservationDate(reservationConflict.line.date, locale)} · {reservationConflict.line.time}</span>
            </div>
            <div className="activity-reservation-conflict__existing">
              <small>{t("Already in your selection")}</small>
              {reservationConflict.existingLines.map((line) => (
                <div key={line.id}>
                  <strong>{line.activity.title}</strong>
                  <span>{line.time} · {formatPrice(getLineTotal(line.activity, line), locale)}</span>
                </div>
              ))}
            </div>
            <footer className="activity-reservation-conflict__actions">
              <button
                ref={conflictKeepButtonRef}
                type="button"
                className="activity-reservation-conflict__keep"
                onClick={keepExistingAndChooseAnotherTime}
              >
                {t("Keep existing and choose another time")}
              </button>
              <button type="button" className="activity-reservation-conflict__replace" onClick={replaceExistingSelection}>
                {t("Replace existing selection")}
              </button>
            </footer>
          </section>
        </div>
      )}
      {cartOpen && (
        <div className="activity-cart-backdrop" onMouseDown={(event) => {
          if (event.target === event.currentTarget) setCartOpen(false);
        }}>
          <aside className="activity-reservation-summary activity-cart-panel" aria-label={t("Your activity selection")} role="dialog" aria-modal="true">
            <div className="activity-cart-panel__top">
              <div className="activity-reservation-summary__heading">
                <div>
                  <p className="eyebrow">{t("Your trip, coming together")}</p>
                  <h3>{t("Your selection")} <span>{lines.length}</span></h3>
                </div>
                <span aria-hidden="true">✳</span>
              </div>
              <button
                ref={cartCloseButtonRef}
                type="button"
                className="activity-reservation-close"
                onClick={() => setCartOpen(false)}
                aria-label={t("Close your selection")}
              >
                ×
              </button>
            </div>

            {lines.length ? (
              <ul className="activity-reservation-lines">
                {lines.map((line) => {
                  const activity = line.activity;
                  return (
                    <li key={line.id}>
                      <img className="activity-reservation-lines__image" src={getActivityImageUrl(activity.image, 180)} alt="" />
                      <div>
                        <strong>{activity.title}</strong>
                        <span>{getReservationDescription(activity, line, locale)}</span>
                      </div>
                      <strong>{formatPrice(getLineTotal(activity, line), locale)}</strong>
                      <button type="button" aria-label={`${t("Remove")} ${activity.title}`} onClick={() => removeLine(line.id)}>×</button>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <div className="activity-reservation-empty">
                <span aria-hidden="true">✳</span>
                <strong>{t("Your selection starts here")}</strong>
                <p>{t("Choose a time, group size, or extra and add an experience.")}</p>
              </div>
            )}

            <form id="activity-reservation-form" className="activity-reservation-form" onSubmit={submitRequest}>
              <p className="activity-cart-panel__intro">{t("Your plans are ready. Add your details so our team can confirm availability.")}</p>
              <label>
                <span>{t("Hotel / pickup location")}</span>
                <input name="hotel" type="text" placeholder={t("Hotel name or address")} />
              </label>
              <div className="activity-reservation-form__contact">
                <label>
                  <span>{t("Your name")}</span>
                  <input name="name" type="text" autoComplete="name" placeholder={t("Full name")} required />
                </label>
                <label>
                  <span>{t("Phone / WhatsApp")}</span>
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
                      <option value="other">{t("Other (enter full number)")}</option>
                    </select>
                    <input name="phone" type="tel" autoComplete="tel-national" inputMode="tel" placeholder="6 12 34 56 78" required />
                  </div>
                </label>
              </div>
              <label>
                <span>{t("Email")} <small>({t("optional")})</small></span>
                <input name="email" type="email" autoComplete="email" placeholder="you@example.com" />
              </label>
              <label>
                <span>{t("Notes")} <small>({t("optional")})</small></span>
                <textarea name="notes" rows={2} placeholder={t("Anything else we should know?")} />
              </label>

              <div className="activity-reservation-total">
                <span>{t(needsPriceConfirmation ? "Estimated total*" : "Estimated total")}</span>
                <strong>{formatPrice(cartTotal, locale)}</strong>
              </div>
              {needsPriceConfirmation && <p className="activity-reservation-confirm-note">{t("Some prices require confirmation by our team.")}</p>}
              <p className="activity-reservation-payment-note">{t("No online payment. Availability and final details are confirmed by the activity team.")}</p>
              <button type="submit" className="activity-reservation-submit" disabled={!lines.length || isSubmitting}>
                {isSubmitting ? t("Submitting...") : t("Submit reservation request")} <span aria-hidden="true">↗</span>
              </button>
              {requestStatus && <p className="activity-reservation-status" role="status">{requestStatus}</p>}
              <button type="button" className="activity-cart-continue" onClick={() => setCartOpen(false)}>
                {t("Continue planning")}
              </button>
            </form>
          </aside>
        </div>
      )}
    </ReservationContext.Provider>
  );
}
