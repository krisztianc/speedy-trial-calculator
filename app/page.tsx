"use client";

import { addDays, format, startOfDay } from "date-fns";
import { useEffect, useMemo, useRef, useState } from "react";
import { DayPicker } from "react-day-picker";
import "react-day-picker/style.css";

const DEFAULT_COMMENCE = "2026-03-21";

function parseDateInput(value: string): Date | null {
  const parts = value.split("-").map(Number);
  if (parts.length !== 3 || parts.some((n) => Number.isNaN(n))) return null;
  const [y, m, d] = parts;
  return startOfDay(new Date(y, m - 1, d));
}

export default function Home() {
  const [commenceStr, setCommenceStr] = useState(DEFAULT_COMMENCE);
  const [inCustody, setInCustody] = useState(true);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const datePickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!calendarOpen) return;
    const onDocMouseDown = (e: MouseEvent) => {
      if (!datePickerRef.current?.contains(e.target as Node)) {
        setCalendarOpen(false);
      }
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setCalendarOpen(false);
    };
    document.addEventListener("mousedown", onDocMouseDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onDocMouseDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [calendarOpen]);

  const periodDays = inCustody ? 60 : 90;

  const deadline = useMemo(() => {
    const commence = parseDateInput(commenceStr);
    if (!commence) return null as Date | null;
    return addDays(commence, periodDays);
  }, [commenceStr, periodDays]);

  const commenceDate = parseDateInput(commenceStr);

  return (
    <main
      style={{
        minHeight: "100vh",
        padding: "clamp(1.25rem, 4vw, 2.5rem)",
        display: "flex",
        justifyContent: "center",
        alignItems: "flex-start",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "36rem",
        }}
      >
        <header style={{ marginBottom: "2rem", textAlign: "center" }}>
          <h1
            style={{
              margin: "0 0 0.35rem",
              fontSize: "clamp(2.025rem, 6vw, 2.625rem)",
              fontWeight: 300,
              letterSpacing: "0.02em",
              color: "#1a202c",
              fontFamily: "var(--font-news-cycle), var(--font-open-sans), sans-serif",
            }}
          >
            Washington Speedy Trial Calculator
          </h1>
          <p
            style={{
              margin: 0,
              fontSize: "0.95rem",
              color: "#4a5568",
              fontFamily: "var(--font-open-sans), sans-serif",
            }}
          >
            CrR 3.3 / CrRLJ 3.3
          </p>
        </header>

        <section
          style={{
            background: "#f7fafc",
            border: "1px solid #e2e8f0",
            borderRadius: "12px",
            padding: "1.5rem clamp(1rem, 3vw, 1.75rem)",
            marginBottom: "1.5rem",
            boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
          }}
        >
          <form
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "1.35rem",
            }}
            onSubmit={(e) => e.preventDefault()}
          >
            <div ref={datePickerRef} style={{ position: "relative" }}>
              <label
                htmlFor="commence-date-trigger"
                style={{
                  display: "block",
                  marginBottom: "0.45rem",
                  fontSize: "0.8rem",
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  color: "#4a5568",
                }}
              >
                Date of commencement
              </label>
              <button
                id="commence-date-trigger"
                type="button"
                aria-haspopup="dialog"
                aria-expanded={calendarOpen}
                aria-controls="commence-calendar"
                onClick={() => setCalendarOpen((o) => !o)}
                style={{
                  width: "100%",
                  maxWidth: "100%",
                  padding: "0.65rem 0.75rem",
                  fontSize: "1rem",
                  borderRadius: "8px",
                  border: "1px solid #cbd5e0",
                  background: "#ffffff",
                  color: "#1a202c",
                  textAlign: "left",
                  cursor: "pointer",
                }}
              >
                {commenceDate
                  ? format(commenceDate, "MMMM d, yyyy")
                  : "Select date"}
              </button>
              {calendarOpen && (
                <div
                  id="commence-calendar"
                  role="dialog"
                  aria-label="Choose commencement date"
                  style={{
                    position: "absolute",
                    zIndex: 50,
                    left: 0,
                    right: 0,
                    marginTop: "0.35rem",
                    padding: "0.65rem 0.5rem 0.75rem",
                    background: "#ffffff",
                    border: "1px solid #e2e8f0",
                    borderRadius: "12px",
                    boxShadow: "0 10px 40px rgba(0,0,0,0.12)",
                  }}
                >
                  <DayPicker
                    mode="single"
                    className="commence-day-picker"
                    selected={commenceDate ?? undefined}
                    defaultMonth={commenceDate ?? new Date()}
                    onSelect={(d) => {
                      if (d) {
                        setCommenceStr(format(startOfDay(d), "yyyy-MM-dd"));
                        setCalendarOpen(false);
                      }
                    }}
                  />
                </div>
              )}
            </div>

            <div>
              <div
                role="group"
                aria-label="Custody status"
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(9rem, 1fr))",
                  gap: "0.75rem",
                }}
              >
                <div style={{ display: "flex", flexDirection: "column", gap: "0.55rem" }}>
                  <span
                    style={{
                      fontSize: "0.8rem",
                      textTransform: "uppercase",
                      letterSpacing: "0.08em",
                      color: "#4a5568",
                    }}
                  >
                    In custody
                  </span>
                  <button
                    type="button"
                    onClick={() => setInCustody(true)}
                    aria-pressed={inCustody}
                    style={{
                      width: "100%",
                      padding: "0.65rem 1rem",
                      borderRadius: "8px",
                      border:
                        inCustody === true
                          ? "2px solid #790000"
                          : "1px solid #cbd5e0",
                      background:
                        inCustody === true
                          ? "rgba(121, 0, 0, 0.1)"
                          : "#ffffff",
                      color: "#1a202c",
                      fontSize: "0.95rem",
                      cursor: "pointer",
                    }}
                  >
                    60 DAYS
                  </button>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.55rem" }}>
                  <span
                    style={{
                      fontSize: "0.8rem",
                      textTransform: "uppercase",
                      letterSpacing: "0.08em",
                      color: "#4a5568",
                    }}
                  >
                    OUT OF CUSTODY
                  </span>
                  <button
                    type="button"
                    onClick={() => setInCustody(false)}
                    aria-pressed={!inCustody}
                    style={{
                      width: "100%",
                      padding: "0.65rem 1rem",
                      borderRadius: "8px",
                      border:
                        inCustody === false
                          ? "2px solid #790000"
                          : "1px solid #cbd5e0",
                      background:
                        inCustody === false
                          ? "rgba(121, 0, 0, 0.1)"
                          : "#ffffff",
                      color: "#1a202c",
                      fontSize: "0.95rem",
                      cursor: "pointer",
                    }}
                  >
                    90 DAYS
                  </button>
                </div>
              </div>
            </div>
          </form>
        </section>

        <section
          style={{
            background: "#f7fafc",
            border: "1px solid #e2e8f0",
            borderRadius: "14px",
            padding: "clamp(1.25rem, 4vw, 2rem)",
            textAlign: "center",
            boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
          }}
        >
          <p
            style={{
              margin: "0 0 0.75rem",
              fontSize: "clamp(1.5rem, 4vw, 1.75rem)",
              textTransform: "uppercase",
              letterSpacing: "0.12em",
              color: "#4a5568",
              fontFamily:
                "var(--font-news-cycle), var(--font-open-sans), sans-serif",
            }}
          >
            Trial deadline
          </p>
          <p
            style={{
              margin: "0 0 0.4rem",
              fontSize: "clamp(1rem, 3vw, 1.2rem)",
              fontWeight: 500,
              letterSpacing: "0.04em",
              color: "#4a5568",
            }}
          >
            {deadline ? format(deadline, "EEEE") : "—"}
          </p>
          <p
            style={{
              margin: 0,
              fontSize: "clamp(2rem, 8vw, 3rem)",
              fontWeight: 300,
              letterSpacing: "0.03em",
              color: "#1a202c",
              lineHeight: 1.15,
            }}
          >
            {deadline ? format(deadline, "MMMM d, yyyy") : "—"}
          </p>
        </section>
      </div>
    </main>
  );
}
