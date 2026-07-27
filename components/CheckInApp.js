"use client";

import {
  ArrowIcon,
  CalendarIcon,
  CheckIcon,
  CloseIcon,
  InfoIcon,
  PinIcon,
  RefreshIcon,
  SearchIcon,
  SparkleIcon,
  UserIcon,
  WifiOffIcon,
} from "@/components/Icons";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

function normalizeSearch(value) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim()
    .toLocaleLowerCase();
}

function makeRequestId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `request_${Date.now()}_${Math.random().toString(36).slice(2, 12)}`;
}

function Progress({ step }) {
  const labels = ["Find name", "Confirm", "Your seat"];

  return (
    <ol className="progress" aria-label={`Step ${step} of 3`}>
      {labels.map((label, index) => {
        const number = index + 1;
        const complete = number < step;
        const current = number === step;

        return (
          <li
            className={`progress__item${current ? " is-current" : ""}${
              complete ? " is-complete" : ""
            }`}
            key={label}
            aria-current={current ? "step" : undefined}
          >
            <span className="progress__dot" aria-hidden="true">
              {complete ? <CheckIcon size={13} /> : number}
            </span>
            <span className="progress__label">{label}</span>
          </li>
        );
      })}
    </ol>
  );
}

function ConfirmationDialog({
  guest,
  helpText,
  isSubmitting,
  error,
  onCancel,
  onConfirm,
  returnFocus,
}) {
  const dialogRef = useRef(null);
  const confirmRef = useRef(null);
  const submittingRef = useRef(isSubmitting);

  useEffect(() => {
    submittingRef.current = isSubmitting;
  }, [isSubmitting]);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    confirmRef.current?.focus();

    function handleKeyDown(event) {
      if (event.key === "Escape" && !submittingRef.current) {
        event.preventDefault();
        onCancel();
        return;
      }

      if (event.key !== "Tab") return;

      const focusable = dialogRef.current?.querySelectorAll(
        'button:not([disabled]), [href], input:not([disabled]), [tabindex]:not([tabindex="-1"])',
      );
      if (!focusable?.length) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
      returnFocus?.focus();
    };
  }, [onCancel, returnFocus]);

  return (
    <div className="dialog-layer" role="presentation">
      <button
        className="dialog-backdrop"
        type="button"
        aria-label="Close confirmation"
        disabled={isSubmitting}
        onClick={onCancel}
      />
      <section
        aria-describedby="confirm-description selected-guest-description"
        aria-busy={isSubmitting}
        aria-labelledby="confirm-title"
        aria-modal="true"
        className="confirm-dialog"
        ref={dialogRef}
        role="dialog"
      >
        <div className="dialog-handle" aria-hidden="true" />
        <button
          aria-label="Close"
          className="icon-button dialog-close"
          disabled={isSubmitting}
          onClick={onCancel}
          type="button"
        >
          <CloseIcon size={22} />
        </button>

        <div className="dialog-icon" aria-hidden="true">
          <UserIcon size={25} />
        </div>
        <p className="eyebrow">One quick check</p>
        <h2 id="confirm-title">Is this you?</h2>
        <p id="confirm-description" className="dialog-copy">
          You selected
        </p>

        <div className="selected-guest" id="selected-guest-description">
          <strong>{guest.name}</strong>
          {guest.group ? <span>{guest.group}</span> : null}
        </div>

        {error ? (
          <div className="inline-error" role="alert">
            <InfoIcon size={18} />
            <span>{error}</span>
          </div>
        ) : null}

        <div className="dialog-actions">
          <button
            aria-disabled={isSubmitting}
            className="button button--primary"
            onClick={onConfirm}
            ref={confirmRef}
            type="button"
          >
            {isSubmitting ? (
              <>
                <span className="spinner" aria-hidden="true" />
                Checking you in…
              </>
            ) : error ? (
              <>
                <RefreshIcon size={19} />
                Try again
              </>
            ) : (
              <>
                <CheckIcon size={20} />
                Yes, check me in
              </>
            )}
          </button>
          <button
            className="button button--secondary"
            disabled={isSubmitting}
            onClick={onCancel}
            type="button"
          >
            No, go back
          </button>
        </div>

        <p className="dialog-help">{helpText}</p>
      </section>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="loading-state" aria-label="Loading the guest list">
      <div className="search-skeleton skeleton" />
      <div className="skeleton-row skeleton" />
      <div className="skeleton-row skeleton" />
      <div className="skeleton-row skeleton" />
      <p>Loading the guest list…</p>
    </div>
  );
}

function ErrorState({ onRetry, helpText }) {
  return (
    <div className="empty-state" role="alert">
      <div className="empty-state__icon">
        <InfoIcon size={26} />
      </div>
      <h2>Check-in is temporarily unavailable</h2>
      <p>We couldn’t load the guest list. Please check your connection.</p>
      <button className="button button--primary" onClick={onRetry} type="button">
        <RefreshIcon size={19} />
        Try again
      </button>
      <small>{helpText}</small>
    </div>
  );
}

function SuccessState({ result, eventName, onAnotherGuest, focusRef }) {
  const alreadyCheckedIn = result.status === "already-checked-in";

  return (
    <section
      className="success-state"
      aria-labelledby="success-title"
      ref={focusRef}
      tabIndex="-1"
    >
      <div className="success-burst" aria-hidden="true">
        <span className="success-ring">
          <CheckIcon size={34} />
        </span>
        <SparkleIcon className="sparkle sparkle--one" size={26} />
        <SparkleIcon className="sparkle sparkle--two" size={18} />
      </div>

      <p className="eyebrow">
        {alreadyCheckedIn ? "Welcome back" : "You’re on the list"}
      </p>
      <h1 id="success-title">
        {alreadyCheckedIn
          ? "You’re already checked in!"
          : "You’re all checked in!"}
      </h1>
      <p className="success-copy">
        {alreadyCheckedIn
          ? "Your attendance was already recorded. Here’s your seat again."
          : `Welcome to ${eventName}, ${result.guest.name}. Your attendance has been recorded.`}
      </p>

      <div className="seat-card">
        <div className="seat-card__accent" aria-hidden="true" />
        <span className="seat-card__label">Your place for the evening</span>
        <strong>{result.guest.seatLabel}</strong>
        <span className="seat-card__name">{result.guest.name}</span>
      </div>

      <div className="recorded-note">
        <span className="recorded-note__icon" aria-hidden="true">
          <CheckIcon size={16} />
        </span>
        <span>Attendance recorded</span>
      </div>

      <button
        className="button button--secondary button--wide"
        onClick={onAnotherGuest}
        type="button"
      >
        Check in another guest
      </button>
    </section>
  );
}

export function CheckInApp({ event }) {
  const [loadState, setLoadState] = useState("loading");
  const [guests, setGuests] = useState([]);
  const [source, setSource] = useState(null);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const [selectedGuest, setSelectedGuest] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [result, setResult] = useState(null);
  const [toast, setToast] = useState("");
  const [isOnline, setIsOnline] = useState(true);

  const inputRef = useRef(null);
  const successRef = useRef(null);
  const lastTriggerRef = useRef(null);
  const requestIdRef = useRef(null);
  const keyboardNavigationRef = useRef(false);

  const loadGuests = useCallback(async () => {
    setLoadState("loading");

    try {
      const response = await fetch("/api/guests", {
        cache: "no-store",
        headers: { Accept: "application/json" },
      });
      const data = await response.json();
      if (!response.ok || !data.ok || !Array.isArray(data.guests)) {
        throw new Error("Guest list unavailable");
      }

      setGuests(data.guests);
      setSource(data.source);
      setLoadState("ready");
    } catch {
      setLoadState("error");
    }
  }, []);

  useEffect(() => {
    loadGuests();
  }, [loadGuests]);

  useEffect(() => {
    const updateConnection = () => setIsOnline(navigator.onLine);
    updateConnection();
    window.addEventListener("online", updateConnection);
    window.addEventListener("offline", updateConnection);
    return () => {
      window.removeEventListener("online", updateConnection);
      window.removeEventListener("offline", updateConnection);
    };
  }, []);

  useEffect(() => {
    if (!toast) return undefined;
    const timer = window.setTimeout(() => setToast(""), 4200);
    return () => window.clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    if (!result) return;
    window.requestAnimationFrame(() => {
      successRef.current?.focus({ preventScroll: true });
      successRef.current?.scrollIntoView({ block: "start", behavior: "auto" });
    });
  }, [result]);

  const filteredGuests = useMemo(() => {
    const normalizedQuery = normalizeSearch(query);
    if (!normalizedQuery) return guests;

    return guests.filter((guest) =>
      normalizeSearch(`${guest.name} ${guest.group || ""}`).includes(
        normalizedQuery,
      ),
    );
  }, [guests, query]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  useEffect(() => {
    if (!keyboardNavigationRef.current) return;
    const activeGuest = filteredGuests[activeIndex];
    if (!activeGuest) return;

    document
      .getElementById(`guest-option-${activeGuest.id}`)
      ?.scrollIntoView({ block: "nearest" });
    keyboardNavigationRef.current = false;
  }, [activeIndex, filteredGuests]);

  const chooseGuest = useCallback((guest, trigger) => {
    lastTriggerRef.current = trigger || inputRef.current;
    requestIdRef.current = makeRequestId();
    setSubmitError("");
    setSelectedGuest(guest);
  }, []);

  const closeDialog = useCallback(() => {
    setSelectedGuest(null);
    setSubmitError("");
    requestIdRef.current = null;
  }, []);

  const submitCheckIn = useCallback(async () => {
    if (!selectedGuest || isSubmitting) return;

    if (!navigator.onLine) {
      setSubmitError("You appear to be offline. Reconnect, then try again.");
      return;
    }

    setIsSubmitting(true);
    setSubmitError("");
    if (!requestIdRef.current) requestIdRef.current = makeRequestId();

    try {
      const response = await fetch("/api/check-in", {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          guestId: selectedGuest.id,
          requestId: requestIdRef.current,
        }),
      });
      const data = await response.json();

      if (!response.ok || !data.ok) {
        throw new Error(
          data.message || "We couldn’t record your attendance. Please try again.",
        );
      }

      setResult(data);
      setSource(data.source);
      setSelectedGuest(null);
      setToast(
        data.status === "already-checked-in"
          ? "You were already checked in"
          : "Attendance recorded",
      );
    } catch (error) {
      setSubmitError(
        error?.message || "We couldn’t record your attendance. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }, [isSubmitting, selectedGuest]);

  function handleSearchKeyDown(event) {
    if (!filteredGuests.length) return;

    if (event.key === "ArrowDown") {
      event.preventDefault();
      keyboardNavigationRef.current = true;
      setActiveIndex((index) => (index + 1) % filteredGuests.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      keyboardNavigationRef.current = true;
      setActiveIndex(
        (index) => (index - 1 + filteredGuests.length) % filteredGuests.length,
      );
    } else if (event.key === "Enter") {
      event.preventDefault();
      chooseGuest(
        filteredGuests[Math.min(activeIndex, filteredGuests.length - 1)],
        inputRef.current,
      );
    } else if (event.key === "Escape" && query) {
      event.preventDefault();
      setQuery("");
    }
  }

  function resetForAnotherGuest() {
    setResult(null);
    setQuery("");
    setSubmitError("");
    requestIdRef.current = null;
    window.requestAnimationFrame(() => inputRef.current?.focus());
  }

  const currentStep = result ? 3 : selectedGuest ? 2 : 1;

  return (
    <div className="site-shell">
      <div className="ambient ambient--one" aria-hidden="true" />
      <div className="ambient ambient--two" aria-hidden="true" />

      <header className="event-header">
        <a className="brand" href="/" aria-label={`${event.name} check-in home`}>
          <span className="brand__mark" aria-hidden="true">
            {event.monogram}
          </span>
          <span>
            <strong>{event.name}</strong>
            <small>Guest welcome</small>
          </span>
        </a>
        <span className="check-in-pill">
          <span aria-hidden="true" />
          Check-in open
        </span>
      </header>

      <main className="main">
        <section className="event-intro" aria-labelledby="event-heading">
          <p className="eyebrow">
            <SparkleIcon size={15} />
            So glad you’re here
          </p>
          <h1 id="event-heading">Welcome. Let’s find your seat.</h1>
          <p>
            Find your name in the guest list, confirm it’s you, and we’ll show
            you where to go.
          </p>

          <div className="event-meta" aria-label="Event details">
            <span>
              <CalendarIcon size={17} />
              {event.date}
            </span>
            <span>
              <PinIcon size={17} />
              {event.venue}
            </span>
          </div>
        </section>

        <section className="check-in-card" aria-label="Guest check-in">
          <Progress step={currentStep} />

          {!isOnline && !result ? (
            <div className="offline-banner" role="status">
              <WifiOffIcon size={19} />
              <span>You’re offline. Reconnect to check in.</span>
            </div>
          ) : null}

          {result ? (
            <SuccessState
              eventName={event.name}
              focusRef={successRef}
              onAnotherGuest={resetForAnotherGuest}
              result={result}
            />
          ) : (
            <>
              <div className="card-heading">
                <span className="step-number">01</span>
                <div>
                  <p className="eyebrow">Guest list</p>
                  <h2>Find your name</h2>
                  <p>Type to search, or scroll through the list below.</p>
                </div>
              </div>

              {source === "demo" && loadState === "ready" ? (
                <div className="preview-note" role="note">
                  <InfoIcon size={18} />
                  <span>
                    Preview mode is using sample guests. Connect your Google
                    Sheet when you’re ready.
                  </span>
                </div>
              ) : null}

              {loadState === "loading" ? <LoadingState /> : null}
              {loadState === "error" ? (
                <ErrorState helpText={event.helpText} onRetry={loadGuests} />
              ) : null}

              {loadState === "ready" ? (
                <div className="guest-finder">
                  <label htmlFor="guest-search">Your name</label>
                  <div className="search-wrap">
                    <SearchIcon className="search-icon" size={21} />
                    <input
                      aria-activedescendant={
                        filteredGuests[activeIndex]
                          ? `guest-option-${filteredGuests[activeIndex].id}`
                          : undefined
                      }
                      aria-autocomplete="list"
                      aria-controls={
                        filteredGuests.length ? "guest-list" : undefined
                      }
                      aria-expanded={Boolean(filteredGuests.length)}
                      autoComplete="off"
                      id="guest-search"
                      onChange={(event) => {
                        setActiveIndex(0);
                        setQuery(event.target.value);
                      }}
                      onKeyDown={handleSearchKeyDown}
                      placeholder="Search the guest list"
                      ref={inputRef}
                      role="combobox"
                      spellCheck="false"
                      type="search"
                      value={query}
                    />
                    {query ? (
                      <button
                        aria-label="Clear search"
                        className="clear-search"
                        onClick={() => {
                          setQuery("");
                          inputRef.current?.focus();
                        }}
                        type="button"
                      >
                        <CloseIcon size={19} />
                      </button>
                    ) : (
                      <span className="search-shortcut" aria-hidden="true">
                        A–Z
                      </span>
                    )}
                  </div>

                  <div className="list-heading" aria-live="polite">
                    <span>
                      {query ? "Search results" : "Browse all guests"}
                    </span>
                    <span>
                      {filteredGuests.length}{" "}
                      {filteredGuests.length === 1 ? "guest" : "guests"}
                    </span>
                  </div>

                  {filteredGuests.length ? (
                    <div
                      aria-label="Guest names"
                      className="guest-list"
                      id="guest-list"
                      role="listbox"
                    >
                      {filteredGuests.map((guest, index) => (
                        <button
                          aria-selected={index === activeIndex}
                          className="guest-option"
                          data-active={index === activeIndex ? "true" : "false"}
                          id={`guest-option-${guest.id}`}
                          key={guest.id}
                          onClick={(event) =>
                            chooseGuest(guest, event.currentTarget)
                          }
                          onFocus={() => setActiveIndex(index)}
                          onMouseEnter={() => setActiveIndex(index)}
                          role="option"
                          tabIndex={-1}
                          type="button"
                        >
                          <span className="guest-avatar" aria-hidden="true">
                            {guest.name.charAt(0).toUpperCase()}
                          </span>
                          <span className="guest-name">
                            <strong>{guest.name}</strong>
                            {guest.group ? <small>{guest.group}</small> : null}
                          </span>
                          <span className="choose-label">
                            <span className="choose-label__text">Select</span>
                            <ArrowIcon size={17} />
                          </span>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="no-results" role="status">
                      <div className="no-results__icon">
                        <SearchIcon size={24} />
                      </div>
                      <strong>We couldn’t find that name</strong>
                      <p>Check the spelling, or browse the full guest list.</p>
                      <button
                        className="text-button"
                        onClick={() => {
                          setQuery("");
                          inputRef.current?.focus();
                        }}
                        type="button"
                      >
                        Clear search
                      </button>
                    </div>
                  )}

                  <p className="host-help">
                    Can’t find your name? {event.helpText}
                  </p>
                </div>
              ) : null}
            </>
          )}
        </section>
      </main>

      <footer>
        <span>Private guest check-in</span>
        <span aria-hidden="true">·</span>
        <span>Attendance is only recorded after you confirm</span>
      </footer>

      {selectedGuest ? (
        <ConfirmationDialog
          error={submitError}
          guest={selectedGuest}
          helpText={event.helpText}
          isSubmitting={isSubmitting}
          onCancel={closeDialog}
          onConfirm={submitCheckIn}
          returnFocus={lastTriggerRef.current}
        />
      ) : null}

      {toast ? (
        <div className="toast" aria-hidden="true">
          <span aria-hidden="true">
            <CheckIcon size={17} />
          </span>
          {toast}
        </div>
      ) : null}

      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {loadState === "loading" ? "Loading the guest list." : ""}
        {loadState === "error" ? "The guest list could not be loaded." : ""}
        {isSubmitting ? "Checking you in." : ""}
        {result
          ? result.status === "already-checked-in"
            ? `${result.guest.name} was already checked in. ${result.guest.seatLabel}.`
            : `${result.guest.name}, ${result.guest.seatLabel}. Attendance recorded.`
          : ""}
      </div>
    </div>
  );
}
