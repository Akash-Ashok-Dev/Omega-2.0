import { useEffect, useRef, useState, type FormEvent } from "react";

import { apiUrl } from "@/lib/api";

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
    teamName: string;
    name: string;
    mail: string;
    eventTitle: string;
    passTitle: string;
    memberCount: number;
  };
};

type Phase = "form" | "submitting" | "success" | "error";

type MemberField =
  | "name"
  | "mobileNumber"
  | "mail"
  | "department"
  | "college";
type MemberInput = Record<MemberField, string>;

const TEAM_SIZE = 4;
const EMPTY_MEMBER: MemberInput = {
  name: "",
  mobileNumber: "",
  mail: "",
  department: "",
  college: "",
};

function memberHasContent(member: MemberInput) {
  return Boolean(
    member.name.trim() ||
      member.mobileNumber.trim() ||
      member.mail.trim() ||
      member.department.trim() ||
      member.college.trim(),
  );
}

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
  const [teamName, setTeamName] = useState("");
  const [members, setMembers] = useState<MemberInput[]>(() =>
    Array.from({ length: TEAM_SIZE }, () => ({ ...EMPTY_MEMBER })),
  );

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

  function updateMember(index: number, field: MemberField, value: string) {
    setMembers((current) =>
      current.map((member, memberIndex) =>
        memberIndex === index ? { ...member, [field]: value } : member,
      ),
    );
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (fieldsDisabled) return;

    setError("");

    const formData = new FormData(event.currentTarget);
    const payload = {
      teamName: teamName.trim(),
      members: members.map((member) => ({
        name: member.name.trim(),
        mobileNumber: member.mobileNumber.trim(),
        mail: member.mail.trim(),
        department: member.department.trim(),
        college: member.college.trim(),
      })),
      ambassadorCode: String(formData.get("ambassadorCode") ?? "").trim(),
      eventTitle,
      passTitle,
    };

    setPhase("submitting");

    try {
      const response = await fetch(apiUrl("/api/register"), {
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

      const next = body as RegistrationResponse;
      setResult(next);
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
            <h2 id="registration-modal-title">
              {result ? "Registration received." : "Secure your pass."}
            </h2>
            {!result && (
              <p>
                Enter your team name and member details below. Member 1 is the
                team leader; members 2–4 are optional. Every required field must
                be complete before you continue.
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
                  Open the Google Form to complete your payment. Your pass will
                  be confirmed after the organizers verify your payment. Once
                  confirmed, the ticket QR will be emailed to you and available
                  on the ticket page.
                  Keep your registration ID safe — you will need it for
                  verification.
                </p>
                <p className="registration-modal__ref">
                  TEAM: {result.registration.teamName}
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
                <label className="registration-form__team-name">
                  Team name
                  <input
                    type="text"
                    value={teamName}
                    onChange={(event) => setTeamName(event.target.value)}
                    maxLength={255}
                    required
                    autoComplete="organization"
                    placeholder="Your team name"
                    disabled={fieldsDisabled}
                  />
                </label>

                {members.map((member, index) => {
                  const isLeader = index === 0;
                  const isRequired = isLeader || memberHasContent(member);

                  return (
                    <fieldset
                      className={`registration-team-member${
                        isLeader ? " registration-team-member--leader" : ""
                      }`}
                      key={index}
                    >
                      <legend>
                        {isLeader
                          ? "Team leader / Member 1"
                          : `Team member ${index + 1}`}
                        <span>{isLeader ? "required" : "optional"}</span>
                      </legend>
                      {!isLeader && (
                        <p className="registration-team-member__hint">
                          Leave blank if this member is not participating. If
                          any field is filled, all fields are required.
                        </p>
                      )}
                      <div className="registration-team-member__fields">
                        <label className="registration-team-member__field--third">
                          Name
                          <input
                            type="text"
                            value={member.name}
                            onChange={(event) =>
                              updateMember(index, "name", event.target.value)
                            }
                            maxLength={255}
                            required={isRequired}
                            autoComplete={isLeader ? "name" : "off"}
                            disabled={fieldsDisabled}
                          />
                        </label>
                        <label className="registration-team-member__field--third">
                          Mobile number
                          <input
                            type="tel"
                            inputMode="numeric"
                            pattern="[0-9]{10}"
                            maxLength={10}
                            value={member.mobileNumber}
                            onChange={(event) =>
                              updateMember(
                                index,
                                "mobileNumber",
                                event.target.value,
                              )
                            }
                            required={isRequired}
                            title="Enter a 10 digit mobile number"
                            autoComplete={isLeader ? "tel" : "off"}
                            disabled={fieldsDisabled}
                          />
                        </label>
                        <label className="registration-team-member__field--third">
                          Mail
                          <input
                            type="email"
                            pattern="[a-zA-Z0-9._%+-]+@gmail\.com"
                            maxLength={255}
                            value={member.mail}
                            onChange={(event) =>
                              updateMember(index, "mail", event.target.value)
                            }
                            required={isRequired}
                            title="Use a Gmail address ending in @gmail.com"
                            autoComplete={isLeader ? "email" : "off"}
                            disabled={fieldsDisabled}
                          />
                        </label>
                        <label className="registration-team-member__field--half">
                          Department
                          <input
                            type="text"
                            value={member.department}
                            onChange={(event) =>
                              updateMember(
                                index,
                                "department",
                                event.target.value,
                              )
                            }
                            maxLength={255}
                            required={isRequired}
                            autoComplete="off"
                            disabled={fieldsDisabled}
                          />
                        </label>
                        <label className="registration-team-member__field--half">
                          College
                          <input
                            type="text"
                            value={member.college}
                            onChange={(event) =>
                              updateMember(index, "college", event.target.value)
                            }
                            maxLength={255}
                            required={isRequired}
                            autoComplete={isLeader ? "organization" : "off"}
                            disabled={fieldsDisabled}
                          />
                        </label>
                      </div>
                    </fieldset>
                  );
                })}

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
