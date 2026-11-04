"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { MEDIA } from "../content";
import { createTransferRequest } from "../server/transfer-actions";
import { translate, type Locale } from "../i18n";
import type {
  PrivateServiceData,
  ReservedPrivateSlot,
  TransferLocationData,
  TransferRouteData,
} from "../transfers/types";

type BookingTab = "routes" | "private" | "custom";
type FieldValues = Record<string, string>;
type FieldOption = string | { value: string; label: string };

type Catalog = {
  locale: Locale;
  bookingEnabled: boolean;
  routes: TransferRouteData[];
  services: PrivateServiceData[];
  locations: TransferLocationData[];
  reservedPrivateSlots: ReservedPrivateSlot[];
};

const tabs: { id: BookingTab; label: string; mobileLabel: string; icon: string }[] = [
  { id: "routes", label: "Transferts aéroport & trajets", mobileLabel: "Trajets", icon: "✈" },
  { id: "private", label: "Sorties privées", mobileLabel: "Sorties privées", icon: "♙" },
  { id: "custom", label: "Transfert sur mesure", mobileLabel: "Sur mesure", icon: "✿" },
];

const sharedImageUrl = (id: string) =>
  id.startsWith("data:image/") || /^https?:\/\//i.test(id)
    ? id
    : `https://images.unsplash.com/${id || "photo-1501785888041-af3ef285b470"}?auto=format&fit=crop&w=520&q=80`;

function Field({
  name,
  label,
  values,
  setValue,
  type = "text",
  options,
  placeholder,
  required = false,
  helper,
}: {
  name: string;
  label: string;
  values: FieldValues;
  setValue: (name: string, value: string) => void;
  type?: string;
  options?: readonly FieldOption[];
  placeholder?: string;
  required?: boolean;
  helper?: string;
}) {
  const className = "booking-control";

  return (
    <label className="booking-field">
      <span className="booking-field__label">
        {label}
        {!required && <span className="booking-optional"> (facultatif)</span>}
      </span>
      {options ? (
        <select
          className={className}
          name={name}
          value={values[name] ?? ""}
          onChange={(event) => setValue(name, event.target.value)}
          required={required}
        >
          <option value="">{placeholder ?? "Choisir"}</option>
          {options.map((option) => typeof option === "string"
            ? <option key={option}>{option}</option>
            : <option key={option.value} value={option.value}>{option.label}</option>)}
        </select>
      ) : (
        <input
          className={className}
          name={name}
          type={type}
          value={values[name] ?? ""}
          onChange={(event) => setValue(name, event.target.value)}
          placeholder={placeholder}
          required={required}
          min={type === "number" ? 1 : undefined}
          max={type === "number" ? 8 : undefined}
        />
      )}
      {helper && <span className="booking-field__helper">{helper}</span>}
    </label>
  );
}

function formatStartTime(time: string) {
  const [hours, minutes] = time.split(":");
  return `${Number(hours)}h${minutes}`;
}

function PrivateStartTimePicker({
  locale,
  service,
  date,
  value,
  setValue,
  reservedSlots,
}: {
  locale: Locale;
  service: PrivateServiceData;
  date: string;
  value: string;
  setValue: (name: string, value: string) => void;
  reservedSlots: ReservedPrivateSlot[];
}) {
  const t = (phrase: string) => translate(locale, phrase);
  const reservedTimes = reservedSlots
    .filter((slot) => slot.privateServiceId === service.id && slot.serviceDate === date)
    .map((slot) => slot.serviceTime);
  const times = [...new Set([...service.startTimes, ...reservedTimes])].sort();
  if (!service.startTimes.length) {
    return (
      <Field
        name="time"
        label={t("Heure")}
        values={{ time: value }}
        setValue={setValue}
        type="time"
        required
      />
    );
  }

  return (
    <fieldset className="booking-field booking-start-times">
      <legend className="booking-field__label">{t("Heure de départ")} <span className="booking-optional">({t("obligatoire")})</span></legend>
      {!date && <p className="booking-field__helper">{t("Choisissez une date pour voir les heures déjà réservées.")}</p>}
      <div className="booking-start-times__options">
        {times.map((time) => {
          const reserved = reservedTimes.includes(time);
          return (
            <button
              type="button"
              key={time}
              className={`booking-start-times__option${value === time ? " is-selected" : ""}${reserved ? " is-reserved" : ""}`}
              disabled={reserved}
              aria-pressed={!reserved && value === time}
              aria-label={`${formatStartTime(time)}${reserved ? ` — ${t("réservé")}` : ""}`}
              onClick={() => setValue("time", time)}
            >
              <span>{formatStartTime(time)}</span>
              {reserved && <span className="booking-start-times__reserved">× {t("Réservé")}</span>}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

function ContactFields({
  locale,
  values,
  setValue,
  sectionLabel = "Vos coordonnées",
  variant = "standard",
}: {
  locale: Locale;
  values: FieldValues;
  setValue: (name: string, value: string) => void;
  sectionLabel?: string;
  variant?: "standard" | "custom";
}) {
  const t = (phrase: string) => translate(locale, phrase);
  return (
    <fieldset className={`booking-contact booking-contact--${variant}`}>
      <legend>{t(sectionLabel)}</legend>
      <div className="booking-contact__grid">
        <Field name="name" label={t("Nom")} values={values} setValue={setValue} placeholder={t("Votre nom")} required />
        <Field name="phone" label={t("Téléphone / WhatsApp")} values={values} setValue={setValue} type="tel" placeholder="+212 6 12 34 56 78" required />
        <Field
          name="email"
          label={t("E-mail")}
          values={values}
          setValue={setValue}
          type="email"
          placeholder={t("votre@email.com")}
          required
          helper={t("Nous utilisons votre adresse uniquement pour cette demande.")}
        />
      </div>
      <label className="booking-field booking-field--remarks">
        <span className="booking-field__label">{t("Remarques")} <span className="booking-optional">({t("facultatif")})</span></span>
        <textarea
          className="booking-control booking-control--textarea"
          name="remarks"
          value={values.remarks ?? ""}
          onChange={(event) => setValue("remarks", event.target.value)}
          placeholder={t("Toute information supplémentaire...")}
          rows={2}
        />
      </label>
    </fieldset>
  );
}

function TravelFields({
  locale,
  values,
  setValue,
  passengerLimit = 8,
  variant = "standard",
  privateService,
  reservedPrivateSlots = [],
}: {
  locale: Locale;
  values: FieldValues;
  setValue: (name: string, value: string) => void;
  passengerLimit?: number;
  variant?: "standard" | "custom";
  privateService?: PrivateServiceData;
  reservedPrivateSlots?: ReservedPrivateSlot[];
}) {
  const t = (phrase: string) => translate(locale, phrase);
  const hotelField = <Field name="hotel" label={t("Hôtel / adresse")} values={values} setValue={setValue} placeholder={t("Hôtel, adresse ou point de rencontre")} />;
  const dateField = <Field name="date" label={t("Date")} values={values} setValue={setValue} type="date" required />;
  const timeField = privateService
    ? <PrivateStartTimePicker
      service={privateService}
      locale={locale}
      date={values.date ?? ""}
      value={values.time ?? ""}
      setValue={setValue}
      reservedSlots={reservedPrivateSlots}
    />
    : <Field name="time" label={t("Heure")} values={values} setValue={setValue} type="time" required />;
  const passengerField = (
    <Field
      name="passengers"
      label={t("Passagers")}
      values={values}
      setValue={setValue}
      options={Array.from({ length: passengerLimit }, (_, index) => `${index + 1}`)}
      placeholder={t("Choisir")}
      required
    />
  );
  const flightField = <Field name="flight" label={t("N° de vol")} values={values} setValue={setValue} placeholder={t("Ex. AT123")} />;
  const luggageField = (
    <Field
      name="luggage"
      label={t("Bagages")}
      values={values}
      setValue={setValue}
      options={["0", "1", "2", "3", "4", "5", "6", "7", "8"]}
      placeholder={t("Sélectionner")}
    />
  );

  return (
    <div className={`booking-travel-fields booking-travel-fields--${variant}`}>
      {variant === "custom" ? (
        <>
          {dateField}
          {timeField}
          {passengerField}
          {luggageField}
          {hotelField}
          {flightField}
        </>
      ) : (
        <>
          {hotelField}
          {dateField}
          {timeField}
          {passengerField}
          {luggageField}
          {flightField}
        </>
      )}
    </div>
  );
}

function BookingSubmit({
  locale,
  message,
  onClear,
  busy,
  bookingEnabled,
}: {
  locale: Locale;
  message: string;
  onClear: () => void;
  busy: boolean;
  bookingEnabled: boolean;
}) {
  const t = (phrase: string) => translate(locale, phrase);
  return (
    <>
      <button type="submit" className="booking-send" disabled={busy || !bookingEnabled}>
        <span aria-hidden="true">↗</span> {busy ? t("Envoi en cours…") : t("Envoyer la demande")} <span aria-hidden="true">→</span>
      </button>
      {!bookingEnabled && (
        <p className="booking-message" role="status">
          {t("Les réservations en ligne ne sont pas encore configurées. Veuillez contacter notre équipe directement.")}
        </p>
      )}
      <p className="booking-confirmation">
        <span aria-hidden="true">ⓘ</span>
        {t("Notre équipe vous confirme la disponibilité, le véhicule et l'heure de prise en charge.")}
        {t("Paiement directement au chauffeur au moment du service.")}
      </p>
      {message && (
        <p className="booking-message" role="status">
          {message}
          <button type="button" onClick={onClear} aria-label={t("Fermer le message")}>×</button>
        </p>
      )}
    </>
  );
}

export default function AirportTransfer({
  locale,
  bookingEnabled,
  routes,
  services: privateServices,
  locations,
  reservedPrivateSlots,
}: Catalog) {
  const t = (phrase: string) => translate(locale, phrase);
  const [activeTab, setActiveTab] = useState<BookingTab>("routes");
  const [mobileRouteStep, setMobileRouteStep] = useState<"choose" | "booking">("choose");
  const [mobilePrivateStep, setMobilePrivateStep] = useState<"choose" | "booking">("choose");
  const [selectedRouteId, setSelectedRouteId] = useState(routes[0]?.id ?? "");
  const [selectedPrivateId, setSelectedPrivateId] = useState(privateServices[0]?.id ?? "");
  const [values, setValues] = useState<FieldValues>({
    passengers: "1",
    luggage: "0",
  });
  const [message, setMessage] = useState("");
  const [successToastOpen, setSuccessToastOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const routeListRef = useRef<HTMLDivElement>(null);
  const privateListRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!successToastOpen) return;
    const timeout = window.setTimeout(() => setSuccessToastOpen(false), 7000);
    return () => window.clearTimeout(timeout);
  }, [successToastOpen]);

  const selectedRoute = routes.find((route) => route.id === selectedRouteId);
  const selectedPrivate = privateServices.find((service) => service.id === selectedPrivateId);
  const routeFrom = (route: TransferRouteData) => locale === "fr" ? route.fromFr || route.from : route.from;
  const routeTo = (route: TransferRouteData) => locale === "fr" ? route.toFr || route.to : route.to;
  const serviceName = (service: PrivateServiceData) => locale === "fr" ? service.nameFr || service.name : service.name;
  const serviceDescription = (service: PrivateServiceData) => locale === "fr" ? service.descriptionFr || service.description : service.description;
  const serviceDuration = (service: PrivateServiceData) => locale === "fr" ? service.durationFr || service.duration : service.duration;
  const isOtherLocation = (value: string | undefined) => {
    if (!value) return false;
    const location = locations.find((item) => item.name === value);
    return /^(autre|other)\b/i.test(value) || !!location && /\b(autre|other)\b/i.test(`${location.name} ${location.nameFr}`);
  };

  const setValue = (name: string, value: string) => {
    setValues((current) => ({
      ...current,
      [name]: value,
      ...(name === "date" ? { time: "" } : {}),
    }));
    setMessage("");
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (busy) return;

    if (activeTab === "private" && !values.time) {
      setMessage(t("Choisissez une heure de départ disponible."));
      return;
    }

    if (activeTab === "custom") {
      if (values.departure && values.departure === values.arrival) {
        setMessage(t("Le départ et l'arrivée doivent être différents."));
        const departure = event.currentTarget.elements.namedItem("departure");
        if (departure instanceof HTMLSelectElement) departure.focus();
        return;
      }
      if (
        (isOtherLocation(values.departure) || isOtherLocation(values.arrival)) &&
        !values.remarks?.trim()
      ) {
        setMessage(t("Précisez votre lieu de départ ou d'arrivée dans les remarques."));
        const remarks = event.currentTarget.elements.namedItem("remarks");
        if (remarks instanceof HTMLTextAreaElement) remarks.focus();
        return;
      }
    }

    setBusy(true);
    setMessage("");
    setSuccessToastOpen(false);
    try {
      await createTransferRequest({
        serviceType: activeTab === "routes"
          ? "AIRPORT_ROUTE"
          : activeTab === "private"
            ? "PRIVATE_SERVICE"
            : "CUSTOM_ROUTE",
        routeId: activeTab === "routes" ? selectedRouteId : undefined,
        privateServiceId: activeTab === "private" ? selectedPrivateId : undefined,
        departure: values.departure,
        arrival: values.arrival,
        serviceDate: values.date ?? "",
        serviceTime: values.time,
        passengerCount: Number(values.passengers),
        luggageCount: Number(values.luggage || "0"),
        hotelAddress: values.hotel,
        flightNumber: values.flight,
        customerName: values.name ?? "",
        customerPhone: values.phone ?? "",
        customerEmail: values.email ?? "",
        notes: values.remarks,
      });
      setSuccessToastOpen(true);
      setValues({ passengers: "1", luggage: "0" });
    } catch (error) {
      setMessage(error instanceof Error ? t(error.message) : t("Votre demande n’a pas pu être envoyée. Veuillez réessayer."));
    } finally {
      setBusy(false);
    }
  };

  const renderSubmit = () => (
    <BookingSubmit locale={locale} message={message} onClear={() => setMessage("")} busy={busy} bookingEnabled={bookingEnabled} />
  );

  const renderContactAndSubmit = () => (
    <>
      <ContactFields locale={locale} values={values} setValue={setValue} variant="standard" />
      {renderSubmit()}
    </>
  );

  return (
    <section id="transfer" className="arrival-section scroll-mt-20">
      <div className="arrival-hero">
        <div className="arrival-copy" data-reveal>
          <p className="eyebrow">{t("Travel / Concierge")}</p>
          <h2 className="arrival-title">
            <span>{t("Hero title line one")}</span>
            <span><em>{t("Hero title line two")}</em></span>
            <span>{t("Hero title line three")}</span>
            <em>{t("Hero title line four")}</em>
          </h2>
          <p className="arrival-intro">
            {t("Seamless airport pickup, handpicked stays and unforgettable experiences—all in one premium concierge service.")}
          </p>
          <a href="#arrival-booking" className="arrival-text-link">
            {t("Plan your arrival")} <span aria-hidden="true">↓</span>
          </a>
        </div>

        <div className="arrival-visuals" aria-label={t("A glimpse of your Morocco arrival")}>
          <figure className="arrival-visual arrival-visual--pickup">
            <img
              src={MEDIA.poster}
              alt="A private car arriving at a palm-lined Moroccan resort"
              loading="lazy"
              decoding="async"
              className="arrival-image"
            />
            <figcaption className="arrival-photo-caption"><span>{t("Your arrival, made easy")}</span></figcaption>
          </figure>
          <figure className="arrival-visual arrival-visual--riad">
            <img
              src="https://images.unsplash.com/photo-1539020140153-e479b8c22e70?auto=format&fit=crop&w=900&q=85"
              alt="A peaceful riad courtyard in Morocco"
              loading="lazy"
              decoding="async"
              className="arrival-image"
            />
            <figcaption className="arrival-photo-caption"><span>{t("Feel at home")}</span></figcaption>
          </figure>
          <p className="arrival-visual-note">{t("Your Morocco, thoughtfully connected.")}</p>
        </div>
      </div>

      <div id="arrival-booking" className="arrival-booking">
        <div className="booking-tabs" role="tablist" aria-label={t("Choisir un service de transport")}>
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              id={`booking-tab-${tab.id}`}
              aria-label={t(tab.label)}
              aria-selected={activeTab === tab.id}
              aria-controls={`booking-panel-${tab.id}`}
              className={`booking-tab${activeTab === tab.id ? " is-active" : ""}`}
              onClick={() => {
                setActiveTab(tab.id);
                setMessage("");
              }}
              onKeyDown={(event) => {
                if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;
                event.preventDefault();
                const currentIndex = tabs.findIndex((item) => item.id === tab.id);
                const offset = event.key === "ArrowRight" ? 1 : -1;
                const next = tabs[(currentIndex + offset + tabs.length) % tabs.length];
                setActiveTab(next.id);
                setMessage("");
                document.getElementById(`booking-tab-${next.id}`)?.focus();
              }}
            >
              <span aria-hidden="true">{tab.icon}</span>
              <span className="booking-tab__label">{t(tab.label)}</span>
              <span className="booking-tab__mobile-label" aria-hidden="true">{t(tab.mobileLabel)}</span>
            </button>
          ))}
        </div>

        <div
          id={`booking-panel-${activeTab}`}
          className="booking-panel"
          role="tabpanel"
          aria-labelledby={`booking-tab-${activeTab}`}
        >
          {activeTab === "routes" && (
            <div className={`booking-layout booking-layout--routes${mobileRouteStep === "booking" ? " booking-layout--mobile-booking" : ""}`}>
              <div className="booking-options" ref={routeListRef}>
                <div className="booking-routes-heading">
                  <div>
                    <p className="booking-intro">{t("Prix en euros. Choisissez votre trajet.")}</p>
                    <p className="booking-routes-subtitle">{t("Tarifs indicatifs, confirmés selon votre demande.")}</p>
                  </div>
                  <span className="booking-route-count">{routes.length} {t("trajets")}</span>
                </div>
                <div className="booking-option-list">
                  {routes.map((route) => (
                    <article
                      key={route.id}
                      className={`booking-option${selectedRouteId === route.id ? " is-selected" : ""}`}
                    >
                      <span className="booking-option__icon" aria-hidden="true">✈</span>
                      <span className="booking-option__route">
                        <span className="booking-option__from">{routeFrom(route)}</span>
                        <span className="booking-option__destination"><span aria-hidden="true">→</span> {routeTo(route)}</span>
                      </span>
                      <span className="booking-option__price"><span>{t("À partir de")}</span><strong>{route.price} €</strong></span>
                      <button
                        type="button"
                        className="booking-option__button"
                        aria-pressed={selectedRouteId === route.id}
                        onClick={() => {
                          setSelectedRouteId(route.id);
                          setValue("pickup", route.from);
                          setValue("destination", route.to);
                          if (window.matchMedia("(max-width: 660px)").matches) {
                            setMobileRouteStep("booking");
                          }
                        }}
                      >
                        <span className="booking-option__desktop-label">{t("Choisir")}</span>
                        <span className="booking-option__mobile-label">{t("Continuer")}</span>
                        <span aria-hidden="true">→</span>
                      </button>
                    </article>
                  ))}
                </div>
                {routes.length === 0 && <p className="booking-empty">{t("Aucun trajet n’est disponible pour le moment.")}</p>}
                <button
                  type="button"
                  className="booking-continue"
                  disabled={!selectedRoute}
                  onClick={() => setMobileRouteStep("booking")}
                >
                  {t("Continuer avec")} {selectedRoute ? routeTo(selectedRoute) : t("un trajet")}
                  <span>{t("À partir de")} {selectedRoute?.price ?? "—"} €</span>
                  <span aria-hidden="true">→</span>
                </button>
              </div>

              {selectedRoute ? <form className="booking-detail" onSubmit={submit}>
                <div className="booking-selected">
                  <button
                    type="button"
                    className="booking-mobile-back"
                    onClick={() => setMobileRouteStep("choose")}
                  >
                    <span aria-hidden="true">←</span> Tous les trajets
                  </button>
                  <span className="booking-selected__icon" aria-hidden="true">✈</span>
                  <div>
                    <span className="booking-selected__eyebrow">{t("Votre trajet")}</span>
                    <h3>{routeFrom(selectedRoute)} <span aria-hidden="true">→</span> {routeTo(selectedRoute)}</h3>
                    <p>{t("À partir de")} <strong>{selectedRoute.price} €</strong></p>
                  </div>
                  <button
                    type="button"
                    className="booking-edit"
                    onClick={() => {
                      if (window.matchMedia("(max-width: 660px)").matches) {
                        setMobileRouteStep("choose");
                        routeListRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
                      } else {
                        routeListRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
                      }
                    }}
                  >
                    <span aria-hidden="true">↗</span> {t("Modifier")}
                  </button>
                </div>
                <p className="booking-selected-note">{t("Prix indicatif · Le tarif final est confirmé selon votre demande.")}</p>
                <div className="booking-standard-form-heading">
                  <span aria-hidden="true">01</span>
                  <h4>{t("Détails du trajet")}</h4>
                </div>
                <TravelFields locale={locale} values={values} setValue={setValue} />
                {renderContactAndSubmit()}
              </form> : <div className="booking-detail"><p className="booking-empty">{t("Choisissez un trajet disponible pour continuer.")}</p></div>}
            </div>
          )}

          {activeTab === "private" && (
            <div className={`booking-layout booking-layout--private${mobilePrivateStep === "booking" ? " booking-layout--mobile-booking" : ""}`}>
              <div className="booking-options" ref={privateListRef}>
                <div className="booking-section-intro">
                  <h3>{t("Sorties privées")}</h3>
                  <p>{t("Un véhicule avec chauffeur rien que pour vous, avec des horaires de départ définis pour chaque sortie.")}</p>
                </div>
                <div className="booking-option-list booking-option-list--private">
                  {privateServices.map((service) => (
                    <article
                      key={service.id}
                      className={`booking-private-card${selectedPrivateId === service.id ? " is-selected" : ""}`}
                    >
                      <img src={sharedImageUrl(service.image)} alt={locale === "fr" ? service.imageAltFr || service.imageAlt : service.imageAlt} loading="lazy" decoding="async" />
                      <div className="booking-private-card__body">
                        <span className="booking-badge">♙ {t("Privé")}</span>
                        <h4>{serviceName(service)}</h4>
                        <p>{serviceDescription(service)}</p>
                        <small className="booking-private-card__capacity">
                          {t("Jusqu'à")} {service.passengerLimit} {t("personnes")} · {serviceDuration(service)}
                        </small>
                        {service.startTimes.length > 0 && (
                          <small className="booking-private-card__capacity">
                            {t("Départs :")} {service.startTimes.map(formatStartTime).join(" · ")}
                          </small>
                        )}
                        <strong>{t("à partir de")} {service.price} €</strong>
                      </div>
                      <button
                        type="button"
                        className="booking-private-card__choose"
                        aria-pressed={selectedPrivateId === service.id}
                        onClick={() => {
                          setSelectedPrivateId(service.id);
                          setValue("time", "");
                          if (window.matchMedia("(max-width: 660px)").matches) {
                            setMobilePrivateStep("booking");
                          }
                        }}
                      >
                        {t("Choisir")} <span aria-hidden="true">→</span>
                      </button>
                    </article>
                  ))}
                </div>
                {privateServices.length === 0 && <p className="booking-empty">{t("Aucune sortie privée n’est disponible pour le moment.")}</p>}
              </div>

              {selectedPrivate ? <form className="booking-detail" onSubmit={submit}>
                <div className="booking-selected">
                  <img src={sharedImageUrl(selectedPrivate.image)} alt="" />
                  <div>
                    <span className="booking-badge">♙ {t("Privé")}</span>
                    <h3>{serviceName(selectedPrivate)}</h3>
                    <p>{serviceDescription(selectedPrivate)}</p>
                    <small className="booking-private-card__capacity">
                      {t("Jusqu'à")} {selectedPrivate.passengerLimit} {t("personnes")} · {serviceDuration(selectedPrivate)}
                    </small>
                    <strong className="booking-selected__price">{selectedPrivate.price} €</strong>
                  </div>
                  <button
                    type="button"
                    className="booking-edit"
                    onClick={() => {
                      if (window.matchMedia("(max-width: 660px)").matches) {
                        setMobilePrivateStep("choose");
                        privateListRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
                      } else {
                        privateListRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
                      }
                    }}
                  >
                    <span aria-hidden="true">↗</span> {t("Modifier")}
                  </button>
                </div>
                <div className="booking-standard-form-heading">
                  <span aria-hidden="true">01</span>
                  <h4>{t("Détails de votre sortie")}</h4>
                </div>
                <TravelFields
                  locale={locale}
                  values={values}
                  setValue={setValue}
                  passengerLimit={selectedPrivate.passengerLimit}
                  privateService={selectedPrivate}
                  reservedPrivateSlots={reservedPrivateSlots}
                />
                {renderContactAndSubmit()}
              </form> : <div className="booking-detail"><p className="booking-empty">{t("Choisissez une sortie privée disponible pour continuer.")}</p></div>}
            </div>
          )}

          {activeTab === "custom" && (
            <div className="booking-layout booking-layout--custom">
              <div className="booking-custom-aside">
                <div className="booking-section-intro">
                  <span className="booking-custom-kicker">{t("Votre itinéraire, à votre façon")}</span>
                  <h3>{t("Besoin d'un autre trajet ?")}</h3>
                  <p>{t("Un autre trajet, ou le retour : dites-nous où et quand.")}</p>
                </div>
                <figure className="booking-custom-visual">
                  <img
                    className="booking-custom-image"
                    src="https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1000&q=85"
                    alt="A scenic winding road through Morocco's coastline"
                    loading="lazy"
                    decoding="async"
                  />
                  <figcaption>{t("Votre route. Votre rythme.")}</figcaption>
                </figure>
                <ul className="booking-benefits">
                  <li><span aria-hidden="true">⌖</span> {t("Trajets sur mesure selon vos besoins")}</li>
                  <li><span aria-hidden="true">◇</span> {t("Véhicules confortables et sécurisés")}</li>
                  <li><span aria-hidden="true">♙</span> {t("Chauffeurs professionnels et ponctuels")}</li>
                </ul>
              </div>

              <form className="booking-detail booking-detail--custom" onSubmit={submit}>
                <div className="booking-custom-form-heading">
                  <span className="booking-custom-step">01</span>
                  <div>
                    <h3>{t("Votre trajet")}</h3>
                    <p>{t("Indiquez votre départ et votre destination.")}</p>
                  </div>
                </div>
                <div className="booking-location-grid">
                  <Field name="departure" label={t("Départ")} values={values} setValue={setValue} options={locations.filter((location) => location.isDeparture).map((location) => ({ value: location.name, label: locale === "fr" ? location.nameFr || location.name : location.name }))} placeholder={t("Choisir")} required />
                  <Field name="arrival" label={t("Arrivée")} values={values} setValue={setValue} options={locations.filter((location) => location.isArrival).map((location) => ({ value: location.name, label: locale === "fr" ? location.nameFr || location.name : location.name }))} placeholder={t("Choisir")} required />
                </div>
                {(isOtherLocation(values.departure) || isOtherLocation(values.arrival)) && (
                  <p className="booking-field__helper booking-location-helper">
                    {t("Indiquez votre lieu exact dans les remarques ci-dessous.")}
                  </p>
                )}
                <p className="booking-price-notice"><span aria-hidden="true">ⓘ</span><span><strong>{t("Tarif personnalisé")}</strong><br />{t("Notre équipe confirme le prix selon votre trajet.")}</span></p>
                <div className="booking-custom-form-heading booking-custom-form-heading--details">
                  <span className="booking-custom-step">02</span>
                  <div>
                    <h3>{t("Les détails du voyage")}</h3>
                    <p>{t("Date, horaires et passagers.")}</p>
                  </div>
                </div>
                <TravelFields locale={locale} values={values} setValue={setValue} variant="custom" />
                <ContactFields locale={locale} values={values} setValue={setValue} sectionLabel="03 · Vos coordonnées" variant="custom" />
                {renderSubmit()}
              </form>
            </div>
          )}
        </div>
      </div>
      {successToastOpen && (
        <div className="booking-success-toast" role="status" aria-live="polite" aria-atomic="true">
          <span className="booking-success-toast__icon" aria-hidden="true">✓</span>
          <div>
            <h3>{t("Votre demande a bien été envoyée")}</h3>
            <p>{t("Notre équipe vous contactera rapidement pour confirmer les détails de votre réservation.")}</p>
          </div>
          <button type="button" aria-label="Fermer la confirmation" onClick={() => setSuccessToastOpen(false)}>×</button>
        </div>
      )}
    </section>
  );
}
