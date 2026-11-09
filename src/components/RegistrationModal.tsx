import { useEffect, useRef, useState, type FormEvent } from "react";

type RegistrationModalProps = {
  eventTitle: string;
  passTitle: string;
  onClose: () => void;
};

type RegistrationResponse = {
  id: string;
  paymentStatus: string;
  googleFormUrl: string;
  registration: {
    name: string;
    mail: string;
    eventTitle: string;
    passTitle: string;
  };
};

type Phase = "form" | "submitting" | "success" | "error";

const DEPARTMENTS = ["CS", "EC", "EE", "Mech", "Others"] as const;

export function RegistrationModal({
  eventTitle,
  passTitle,
  onClose,
}: RegistrationModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const [phase, setPhase] = useState<Phase>("form");
  const [error, setError] = useState("");
  const [result, setResult] = useState<RegistrationResponse | null>(null);
  const [department, setDepartment] = useState("");
  const [departmentOpen, setDepartmentOpen] = useState(false);

  const isSubmitting = phase === "submitting";
  const isComplete = phase === "success";
  const fieldsDisabled = isSubmitting || isComplete;

  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
        return;
      }

      if (event.key !== "Tab") return;
      const dialog = dialogRef.current;
      if (!dialog) return;
      const focusable = dialog.querySelectorAll<HTMLElement>(
        'button:not([disabled]), input:not([disabled]), select, a[href]',
      );
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = overflow;
      previous?.focus();
    };
  }, [onClose]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (fieldsDisabled) return;

    setError("");

    if (!department) {
      setError("Select your department before continuing.");
      setDepartmentOpen(true);
      return;
    }

    const formData = new FormData(event.currentTarget);
    const payload = {
      name: String(formData.get("name") ?? "").trim(),
      mobile: String(formData.get("mobile") ?? "").trim(),
      email: String(formData.get("email") ?? "").trim(),
      department,
      college: String(formData.get("college") ?? "").trim(),
      ambassadorCode: String(formData.get("ambassadorCode") ?? "").trim(),
      eventTitle,
      passTitle,
    };

    setPhase("submitting");

    try {
      const response = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const body = await response.json().catch(() => null);

      if (!response.ok) {
        const fieldError = body?.fields
          ? Object.values(body.fields)[0]
          : undefined;
        const message =
          typeof fieldError === "string" ? fieldError : body?.error;
        throw new Error(
          typeof message === "string"
            ? message
            : "Registration failed. Please try again.",
        );
      }

      setResult(body as RegistrationResponse);
      setPhase("success");
    } catch (caught) {
      setPhase("error");
      setError(
        caught instanceof Error
          ? caught.message
          : "Registration failed. Please try again.",
      );
    }
  }

  return (
    <div
      className="registration-modal"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        className="registration-modal__window"
        role="dialog"
        aria-modal="true"
        aria-labelledby="registration-modal-title"
        ref={dialogRef}
      >
        <button
          className="registration-modal__close"
          type="button"
          onClick={onClose}
          ref={closeRef}
          aria-label="Close registration form"
        >
          ×
        </button>

        <div
          className={`registration-modal__content${
            result ? " has-payment" : ""
          }`}
        >
          <div className="registration-modal__intro">
            <p className="eyebrow">
              REGISTRATION / {eventTitle} / {passTitle}
            </p>
            <h2 id="registration-modal-title">Secure your pass.</h2>
            {!result && (
              <p>
                Enter your details below. Every required field must be complete
                before you continue.
              </p>
            )}
          </div>

          {result && (
            <div className="registration-modal__payment">
              <div className="registration-modal__payment-details">
                <p className="eyebrow">
                  PAYMENT / {result.registration.eventTitle} /{" "}
                  {result.registration.passTitle}
                </p>
                <p>
                  Open the Google Form to complete your payment.
                  Your pass will only be confirmed after you visit the Google
                  Form and finish the payment.
                  Keep your registration ID safe — you will need it for
                  verification.
                </p>
                <p className="registration-modal__ref">ID: {result.id}</p>
                <p className="registration-modal__ref">
                  STATUS: {result.paymentStatus}
                </p>
              </div>
              <div className="registration-modal__form-link">
                <a href={result.googleFormUrl} target="_blank" rel="noreferrer">
                  Open Google Form ↗
                </a>
              </div>
            </div>
          )}

          {!result && (
            <>
              <form className="registration-form" onSubmit={handleSubmit}>
                <label>
                  Name
                  <input
                    name="name"
                    type="text"
                    required
                    autoComplete="name"
                    disabled={fieldsDisabled}
                  />
                </label>
                <label>
                  Mobile number
                  <input
                    name="mobile"
                    type="tel"
                    inputMode="numeric"
                    pattern="[0-9]{10}"
                    maxLength={10}
                    required
                    title="Enter a 10 digit mobile number"
                    autoComplete="tel"
                    disabled={fieldsDisabled}
                  />
                </label>
                <label>
                  Mail
                  <input
                    name="email"
                    type="email"
                    pattern="[a-zA-Z0-9._%+-]+@gmail\.com"
                    required
                    title="Use a Gmail address ending in @gmail.com"
                    autoComplete="email"
                    disabled={fieldsDisabled}
                  />
                </label>
                <label>
                  Department
                  <span className="registration-select">
                    <input
                      className="registration-select__value"
                      name="department"
                      value={department}
                      required
                      readOnly
                      tabIndex={-1}
                      aria-hidden="true"
                    />
                    <button
                      className={`registration-select__trigger${
                        department ? " has-value" : ""
                      }`}
                      type="button"
                      aria-haspopup="listbox"
                      aria-expanded={departmentOpen}
                      disabled={fieldsDisabled}
                      onClick={() => setDepartmentOpen((open) => !open)}
                      onKeyDown={(event) => {
                        if (
                          event.key === "ArrowDown" ||
                          event.key === "Enter"
                        ) {
                          event.preventDefault();
                          setDepartmentOpen(true);
                        }
                        if (event.key === "Escape") setDepartmentOpen(false);
                      }}
                    >
                      <span>{department || "Select department"}</span>
                      <span
                        className="registration-select__arrow"
                        aria-hidden="true"
                      >
                        {departmentOpen ? "⌃" : "⌄"}
                      </span>
                    </button>
                    {departmentOpen && !fieldsDisabled && (
                      <span
                        className="registration-select__menu"
                        role="listbox"
                      >
                        <span className="registration-select__hint">
                          SELECT YOUR UNIT
                        </span>
                        {DEPARTMENTS.map((option) => (
                          <button
                            className={`registration-select__option${
                              department === option ? " is-selected" : ""
                            }`}
                            type="button"
                            role="option"
                            aria-selected={department === option}
                            key={option}
                            onClick={() => {
                              setDepartment(option);
                              setDepartmentOpen(false);
                            }}
                          >
                            <span className="registration-select__option-index">
                              {String(
                                DEPARTMENTS.indexOf(option) + 1,
                              ).padStart(2, "0")}
                            </span>
                            {option}
                            {department === option && (
                              <span aria-hidden="true">✓</span>
                            )}
                          </button>
                        ))}
                      </span>
                    )}
                  </span>
                </label>
                <label>
                  College
                  <input
                    name="college"
                    type="text"
                    required
                    autoComplete="organization"
                    disabled={fieldsDisabled}
                  />
                </label>
                <label>
                  Ambassador code <span>(optional)</span>
                  <input
                    name="ambassadorCode"
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]{6}"
                    maxLength={6}
                    title="Enter a 6 digit ambassador code"
                    disabled={fieldsDisabled}
                  />
                </label>

                {error && (
                  <p className="registration-form__error" role="alert">
                    {error}
                  </p>
                )}

                <button
                  className="registration-form__submit"
                  type="submit"
                  disabled={fieldsDisabled}
                >
                  {isSubmitting ? "Saving details…" : "Continue to payment ↗"}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default RegistrationModal;
