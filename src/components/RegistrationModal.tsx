import { useEffect, useRef, useState } from "react";

type RegistrationModalProps = {
  passTitle: string;
  onClose: () => void;
  onSubmitDetails?: (details: RegistrationDetails) => void;
};

export type RegistrationDetails = {
  name: string;
  mobile: string;
  email: string;
  department: string;
  college: string;
  ambassadorCode: string;
  passTitle: string;
};

const GOOGLE_FORM_URL = "https://forms.google.com/";
const QR_SIZE = 21;

function isFinderCell(row: number, column: number) {
  const inTopLeft = row < 7 && column < 7;
  const inTopRight = row < 7 && column >= QR_SIZE - 7;
  const inBottomLeft = row >= QR_SIZE - 7 && column < 7;
  if (!inTopLeft && !inTopRight && !inBottomLeft) return false;

  const localRow = row < 7 ? row : row - (QR_SIZE - 7);
  const localColumn = column >= QR_SIZE - 7 ? column - (QR_SIZE - 7) : column;
  return (
    localRow === 0 ||
    localRow === 6 ||
    localColumn === 0 ||
    localColumn === 6 ||
    (localRow >= 2 && localRow <= 4 && localColumn >= 2 && localColumn <= 4)
  );
}

function qrCell(row: number, column: number) {
  if (isFinderCell(row, column)) return true;
  if (
    (row < 8 && column < 8) ||
    (row < 8 && column > QR_SIZE - 9) ||
    (row > QR_SIZE - 9 && column < 8)
  ) {
    return false;
  }
  return ((row * 17 + column * 31 + row * column * 7) % 11) < 5;
}

function QrPlaceholder() {
  return (
    <svg
      className="registration-modal__qr"
      viewBox={`0 0 ${QR_SIZE} ${QR_SIZE}`}
      role="img"
      aria-label="Placeholder QR code for registration payment"
    >
      <rect width={QR_SIZE} height={QR_SIZE} fill="#fff" />
      {Array.from({ length: QR_SIZE * QR_SIZE }, (_, index) => {
        const row = Math.floor(index / QR_SIZE);
        const column = index % QR_SIZE;
        return qrCell(row, column) ? (
          <rect key={index} x={column} y={row} width="1" height="1" fill="#111" />
        ) : null;
      })}
    </svg>
  );
}

export function RegistrationModal({
  passTitle,
  onClose,
  onSubmitDetails,
}: RegistrationModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const [submitted, setSubmitted] = useState(false);
  const [department, setDepartment] = useState("");
  const [departmentOpen, setDepartmentOpen] = useState(false);
  const departments = ["CS", "EC", "EE", "Mech", "Others"];

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
        'button:not([disabled]), input, select, a[href]',
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
            submitted ? " has-payment" : ""
          }`}
        >
          <div className="registration-modal__intro">
            <p className="eyebrow">REGISTRATION / {passTitle}</p>
            <h2 id="registration-modal-title">Secure your pass.</h2>
            <p>
              Enter your details below. Every required field must be complete
              before you continue.
            </p>
          </div>

          <form
            className="registration-form"
            onSubmit={(event) => {
              event.preventDefault();
              const formData = new FormData(event.currentTarget);
              onSubmitDetails?.({
                name: String(formData.get("name") ?? ""),
                mobile: String(formData.get("mobile") ?? ""),
                email: String(formData.get("email") ?? ""),
                department: String(formData.get("department") ?? ""),
                college: String(formData.get("college") ?? ""),
                ambassadorCode: String(formData.get("ambassadorCode") ?? ""),
                passTitle,
              });
              setSubmitted(true);
            }}
          >
            <label>
              Name
              <input name="name" type="text" required autoComplete="name" />
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
                  onClick={() => setDepartmentOpen((open) => !open)}
                  onKeyDown={(event) => {
                    if (event.key === "ArrowDown" || event.key === "Enter") {
                      event.preventDefault();
                      setDepartmentOpen(true);
                    }
                    if (event.key === "Escape") setDepartmentOpen(false);
                  }}
                >
                  <span>{department || "Select department"}</span>
                  <span className="registration-select__arrow" aria-hidden="true">
                    {departmentOpen ? "⌃" : "⌄"}
                  </span>
                </button>
                {departmentOpen && (
                  <span className="registration-select__menu" role="listbox">
                    <span className="registration-select__hint">
                      SELECT YOUR UNIT
                    </span>
                    {departments.map((option) => (
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
                          {String(departments.indexOf(option) + 1).padStart(2, "0")}
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
              <input name="college" type="text" required autoComplete="organization" />
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
              />
            </label>

            <button className="registration-form__submit" type="submit">
              {submitted ? "Details saved ✓" : "Continue to payment ↗"}
            </button>
          </form>

          {submitted && (
            <div className="registration-modal__payment">
              <div>
                <p className="eyebrow">PAYMENT QR / PLACEHOLDER</p>
                <p>Replace this generated placeholder with the final payment QR.</p>
              </div>
              <div className="registration-modal__qr-block">
                <QrPlaceholder />
                <a href={GOOGLE_FORM_URL} target="_blank" rel="noreferrer">
                  Open Google Form ↗
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default RegistrationModal;
