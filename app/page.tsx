"use client";

import {
  addDays,
  differenceInCalendarDays,
  format,
  isValid,
  startOfDay,
} from "date-fns";
import dynamic from "next/dynamic";
import { useEffect, useMemo, useRef, useState } from "react";
import "react-day-picker/style.css";

const DayPicker = dynamic(
  () => import("react-day-picker").then((m) => m.DayPicker),
  { ssr: false, loading: () => null },
);

function getTodayString() {
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, "0");
  const dd = String(today.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function parseDateInput(value: string): Date | null {
  const parts = value.split("-").map(Number);
  if (parts.length !== 3 || parts.some((n) => Number.isNaN(n))) return null;
  const [y, m, d] = parts;
  const d0 = startOfDay(new Date(y, m - 1, d));
  return isValid(d0) ? d0 : null;
}

type ExcludedPeriod = { id: string; start: string; end: string };

function inclusiveDayCount(start: Date, end: Date): number {
  return differenceInCalendarDays(end, start) + 1;
}

function mergeIntervals(
  intervals: { start: Date; end: Date }[],
): { start: Date; end: Date }[] {
  if (intervals.length === 0) return [];
  const sorted = [...intervals].sort(
    (a, b) => a.start.getTime() - b.start.getTime(),
  );
  const out: { start: Date; end: Date }[] = [];
  let cur = { start: sorted[0].start, end: sorted[0].end };
  for (let i = 1; i < sorted.length; i++) {
    const n = sorted[i];
    const dayAfterCurEnd = addDays(cur.end, 1);
    if (n.start.getTime() <= dayAfterCurEnd.getTime()) {
      if (n.end > cur.end) cur = { start: cur.start, end: n.end };
    } else {
      out.push(cur);
      cur = { start: n.start, end: n.end };
    }
  }
  out.push(cur);
  return out;
}

export default function Home() {
  const [commenceStr, setCommenceStr] = useState(getTodayString());
  const [inCustody, setInCustody] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [excludedOpen, setExcludedOpen] = useState(false);
  const [excludedPeriods, setExcludedPeriods] = useState<ExcludedPeriod[]>([]);
  const [trialDateStr, setTrialDateStr] = useState("");
  const [trialDateOpen, setTrialDateOpen] = useState(true);
  const datePickerRef = useRef<HTMLDivElement>(null);
  const excludedIdRef = useRef(0);

  useEffect(() => {
    if (!calendarOpen || typeof document === "undefined") return;
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

  const baseDeadline = useMemo(() => {
    const commence = parseDateInput(commenceStr);
    if (!commence) return null as Date | null;
    const end = addDays(commence, periodDays);
    return isValid(end) ? end : null;
  }, [commenceStr, periodDays]);

  const totalExcludedDays = useMemo(() => {
    const commence = parseDateInput(commenceStr);
    if (!commence || !isValid(commence)) return 0;
    const excludedStart = addDays(commence, 1);
  
    const raw: { start: Date; end: Date }[] = [];
  
    for (const p of excludedPeriods) {
      const s = p.start.trim() ? parseDateInput(p.start) : null;
      const e = p.end.trim() ? parseDateInput(p.end) : null;
  
      if (!s || !e || !isValid(s) || !isValid(e)) continue;
      if (e < s) continue;
  
      // Ignore intervals that end before commencement
      if (e < excludedStart) continue;
  
      // Clip intervals so they only count on or after commencement
      const clippedStart = s < excludedStart ? excludedStart : s;
  
      if (e < clippedStart) continue;
  
      raw.push({ start: clippedStart, end: e });
    }
  
    const merged = mergeIntervals(raw);
  
    let total = 0;
    for (const m of merged) {
      total += inclusiveDayCount(m.start, m.end);
    }
  
    return Math.max(0, total);
  }, [excludedPeriods, commenceStr]);

  const finalDeadline = useMemo(() => {
    if (!baseDeadline) return null as Date | null;
    const extended = addDays(baseDeadline, totalExcludedDays);
    return isValid(extended) ? extended : null;
  }, [baseDeadline, totalExcludedDays]);

  const commenceDate = useMemo(() => parseDateInput(commenceStr), [commenceStr]);

  const elapsedDays = useMemo(() => {
    const commence = parseDateInput(commenceStr);
    const trial = parseDateInput(trialDateStr.trim());
    if (!trial || !isValid(trial)) return null;
    if (!commence || !isValid(commence)) return null;
    if (trial < commence) return 0;
    const elapsedStart = addDays(commence, 1);

    const totalDays = differenceInCalendarDays(trial, commence);

    const raw: { start: Date; end: Date }[] = [];
    for (const p of excludedPeriods) {
      const s = p.start.trim() ? parseDateInput(p.start) : null;
      const e = p.end.trim() ? parseDateInput(p.end) : null;

      if (!s || !e || !isValid(s) || !isValid(e)) continue;
      if (e < s) continue;

      if (e < elapsedStart) continue;
      if (s > trial) continue;

      const clippedStart = s < elapsedStart ? elapsedStart : s;
      const clippedEnd = e > trial ? trial : e;

      if (clippedEnd < clippedStart) continue;

      raw.push({ start: clippedStart, end: clippedEnd });
    }

    const merged = mergeIntervals(raw);
    let excludedDaysWithinRange = 0;
    for (const m of merged) {
      excludedDaysWithinRange += inclusiveDayCount(m.start, m.end);
    }

    return Math.max(0, totalDays - excludedDaysWithinRange);
  }, [commenceStr, trialDateStr, excludedPeriods]);

  return (
    <main
      style={{
        minHeight: "100dvh",
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
  <a
    href="https://www.courts.wa.gov/court_rules/pdf/CrR/SUP_CrR_03_03_00.pdf"
    target="_blank"
    rel="noopener noreferrer"
    style={{ color: "#790000", textDecoration: "underline", cursor: "pointer" }}
  >
    CrR 3.3
  </a>{" "}
  /{" "}
  <a
    href="https://www.courts.wa.gov/court_rules/pdf/CrRLJ/CLJ_CRRLJ_03_03_00.pdf"
    target="_blank"
    rel="noopener noreferrer"
    style={{ color: "#790000", textDecoration: "underline", cursor: "pointer" }}
  >
    CrRLJ 3.3
  </a>
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
            borderRadius: "12px",
            marginBottom: "1.5rem",
            boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
            overflow: "hidden",
          }}
        >
          <button
            type="button"
            aria-expanded={excludedOpen}
            onClick={() => setExcludedOpen((o) => !o)}
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "0.75rem",
              padding: "1rem clamp(1rem, 3vw, 1.75rem)",
              border: "none",
              background: "#f7fafc",
              color: "#1a202c",
              fontSize: "0.95rem",
              fontWeight: 600,
              textAlign: "left",
              cursor: "pointer",
              fontFamily: "var(--font-open-sans), sans-serif",
            }}
          >
            <span>Excluded Period</span>
            <span
              aria-hidden
              style={{
                fontSize: "1.25rem",
                lineHeight: 1,
                color: "#790000",
                fontWeight: 400,
              }}
            >
              {excludedOpen ? "−" : "+"}
            </span>
          </button>
          {excludedOpen && (
            <div
              style={{
                padding: "0.85rem clamp(1rem, 3vw, 1.75rem) 1.25rem",
                borderTop: "1px solid #e2e8f0",
              }}
            >
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.75rem",
                }}
              >
                {excludedPeriods.map((row) => (
                  <div key={row.id} className="excluded-row">
                    <div className="excluded-field">
                      <label
                        htmlFor={`ex-start-${row.id}`}
                        style={{
                          display: "block",
                          marginBottom: "0.35rem",
                          fontSize: "0.72rem",
                          textTransform: "uppercase",
                          letterSpacing: "0.06em",
                          color: "#4a5568",
                        }}
                      >
                        Start
                      </label>
                      <input
                        id={`ex-start-${row.id}`}
                        type="date"
                        value={row.start}
                        onChange={(e) => {
                          const v = e.target.value;
                          setExcludedPeriods((rows) =>
                            rows.map((r) =>
                              r.id === row.id ? { ...r, start: v } : r,
                            ),
                          );
                        }}
                        style={{
                          width: "100%",
                          padding: "0.5rem 0.45rem",
                          fontSize: "0.9rem",
                          borderRadius: "8px",
                          border: "1px solid #cbd5e0",
                          background: "#ffffff",
                          color: "#1a202c",
                          fontFamily: "var(--font-open-sans), sans-serif",
                        }}
                      />
                    </div>

                    <div className="excluded-field">
                      <label
                        htmlFor={`ex-end-${row.id}`}
                        style={{
                          display: "block",
                          marginBottom: "0.35rem",
                          fontSize: "0.72rem",
                          textTransform: "uppercase",
                          letterSpacing: "0.06em",
                          color: "#4a5568",
                        }}
                      >
                        End
                      </label>
                      <input
                        id={`ex-end-${row.id}`}
                        type="date"
                        value={row.end}
                        onChange={(e) => {
                          const v = e.target.value;
                          setExcludedPeriods((rows) =>
                            rows.map((r) =>
                              r.id === row.id ? { ...r, end: v } : r,
                            ),
                          );
                        }}
                        style={{
                          width: "100%",
                          padding: "0.5rem 0.45rem",
                          fontSize: "0.9rem",
                          borderRadius: "8px",
                          border: "1px solid #cbd5e0",
                          background: "#ffffff",
                          color: "#1a202c",
                          fontFamily: "var(--font-open-sans), sans-serif",
                        }}
                      />
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        setExcludedPeriods((rows) =>
                          rows.filter((r) => r.id !== row.id),
                        )
                      }
                      className="excluded-remove"
                      style={{
                        flex: "0 0 auto",
                        padding: "0.5rem 0.6rem",
                        fontSize: "0.8rem",
                        borderRadius: "8px",
                        border: "1px solid #cbd5e0",
                        background: "#ffffff",
                        color: "#790000",
                        cursor: "pointer",
                        fontFamily: "var(--font-open-sans), sans-serif",
                      }}
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={() => {
                  excludedIdRef.current += 1;
                  setExcludedPeriods((p) => [
                    ...p,
                    {
                      id: String(excludedIdRef.current),
                      start: "",
                      end: "",
                    },
                  ]);
                }}
                style={{
                  marginTop: "0.85rem",
                  padding: "0.55rem 0.9rem",
                  fontSize: "0.9rem",
                  borderRadius: "8px",
                  border: "1px solid #790000",
                  background: "rgba(121, 0, 0, 0.08)",
                  color: "#1a202c",
                  cursor: "pointer",
                  fontFamily: "var(--font-open-sans), sans-serif",
                }}
              >
                Add Excluded Period
              </button>
            </div>
          )}
        </section>

        <section
          style={{
            background: "#f7fafc",
            border: "1px solid #e2e8f0",
            borderRadius: "12px",
            marginBottom: "1.5rem",
            boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
            overflow: "hidden",
          }}
        >
          <button
            type="button"
            aria-expanded={trialDateOpen}
            onClick={() => setTrialDateOpen((o) => !o)}
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "0.75rem",
              padding: "1rem clamp(1rem, 3vw, 1.75rem)",
              border: "none",
              background: "#f7fafc",
              color: "#1a202c",
              fontSize: "0.95rem",
              fontWeight: 600,
              textAlign: "left",
              cursor: "pointer",
              fontFamily: "var(--font-open-sans), sans-serif",
            }}
          >
            <span>Trial Date</span>
            <span
              aria-hidden
              style={{
                fontSize: "1.25rem",
                lineHeight: 1,
                color: "#790000",
                fontWeight: 400,
              }}
            >
              {trialDateOpen ? "−" : "+"}
            </span>
          </button>
          {trialDateOpen && (
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                alignItems: "flex-end",
                gap: "0.5rem",
                padding: "0.85rem clamp(1rem, 3vw, 1.75rem) 1.25rem",
                borderTop: "1px solid #e2e8f0",
              }}
            >
              <input
                id="trial-date"
                type="date"
                value={trialDateStr}
                onChange={(e) => setTrialDateStr(e.target.value)}
                aria-label="Trial date"
                style={{
                  flex: "1 1 140px",
                  minWidth: 0,
                  padding: "0.5rem 0.45rem",
                  fontSize: "0.9rem",
                  borderRadius: "8px",
                  border: "1px solid #cbd5e0",
                  background: "#ffffff",
                  color: "#1a202c",
                  fontFamily: "var(--font-open-sans), sans-serif",
                }}
              />
              <button
                type="button"
                onClick={() => setTrialDateStr("")}
                style={{
                  flex: "0 0 auto",
                  padding: "0.5rem 0.6rem",
                  fontSize: "0.8rem",
                  borderRadius: "8px",
                  border: "1px solid #cbd5e0",
                  background: "#ffffff",
                  color: "#790000",
                  cursor: "pointer",
                  fontFamily: "var(--font-open-sans), sans-serif",
                }}
              >
                Remove
              </button>
            </div>
          )}
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
          {totalExcludedDays > 0 && (
            <div
              style={{
                margin: "0 0 1rem",
                fontSize: "0.9rem",
                color: "#4a5568",
                lineHeight: 1.65,
                fontFamily: "var(--font-open-sans), sans-serif",
              }}
            >
              <div>Base period: {periodDays} days</div>
              <div>Total excluded days: {totalExcludedDays}</div>
              <div
                style={{
                  marginTop: "0.35rem",
                  fontWeight: 600,
                  color: "#1a202c",
                }}
              >
                Final deadline
              </div>
            </div>
          )}
          <p
            style={{
              margin: "0 0 0.4rem",
              fontSize: "clamp(1rem, 3vw, 1.2rem)",
              fontWeight: 500,
              letterSpacing: "0.04em",
              color: "#4a5568",
            }}
          >
            {finalDeadline ? format(finalDeadline, "EEEE") : "—"}
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
            {finalDeadline ? format(finalDeadline, "MMMM d, yyyy") : "—"}
          </p>
          {elapsedDays !== null && (
            <>
              <p
                style={{
                  margin: "0.75rem 0 0",
                  fontSize: "1.8rem",
                  color:
                    elapsedDays > periodDays ? "#790000" : "#4a5568",
                  fontFamily: "var(--font-open-sans), sans-serif",
                }}
              >
                Days Elapsed: {elapsedDays}
              </p>
              {elapsedDays > periodDays && (
                <p
                  style={{
                    margin: "0.35rem 0 0",
                    fontSize: "0.9rem",
                    color: "#790000",
                    fontFamily: "var(--font-open-sans), sans-serif",
                  }}
                >
                  Past deadline
                </p>
              )}
            </>
          )}
        </section>
        <footer
          style={{
            marginTop: "1.75rem",
            textAlign: "center",
            fontSize: "0.85rem",
            color: "#4a5568",
            fontFamily: "var(--font-open-sans), sans-serif",
          }}
        >
          Coded by{" "}
          <a
            href="https://thepdxlawyer.com"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              color: "#790000",
              textDecoration: "none",
              fontWeight: 500,
            }}
          >
            Kris Carrasco Attorney at Law
          </a>
        </footer>
      </div>
    </main>
  );
}
