"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";

const SLOTS = ["9:30", "10:30", "11:30", "12:30", "14:30", "15:30", "16:30"];
const DAY_NAMES = ["Lun", "Mar", "Mié", "Jue", "Vie"];
const MONTHS = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
const POLL_INTERVAL_MS = 8000;

const STATUS_META = {
  disponible: { label: "Disponible", emoji: "📭", bg: "#378ADD", text: "#FFFFFF" },
  ofrecido: { label: "Ofrecido", emoji: "⛔️", bg: "#E24B4A", text: "#FFFFFF" },
  agendado: { label: "Agendado", emoji: "✅", bg: "#639922", text: "#FFFFFF" },
};

function emptyDay() {
  const d = {};
  SLOTS.forEach((s) => (d[s] = { status: "disponible", legajo: "", offeredAt: null }));
  return d;
}

function formatDateParam(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function getMonday(d) {
  const dt = new Date(d);
  const day = dt.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  dt.setDate(dt.getDate() + diff);
  dt.setHours(0, 0, 0, 0);
  return dt;
}

function addDays(d, n) {
  const dt = new Date(d);
  dt.setDate(dt.getDate() + n);
  return dt;
}

function isSameDay(a, b) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function startOfDay(d) {
  const dt = new Date(d);
  dt.setHours(0, 0, 0, 0);
  return dt;
}

function Modal({ date, slot, dayData, onClose, onSave, saving }) {
  const s = dayData[slot];
  const [status, setStatus] = useState(s.status);
  const [legajo, setLegajo] = useState(s.legajo || "");
  const [error, setError] = useState(false);

  const dayIdx = date.getDay() - 1;
  const dayName = DAY_NAMES[dayIdx >= 0 ? dayIdx : 6];
  const dateStr = `${dayName} ${date.getDate()}/${date.getMonth() + 1}`;

  const handleSave = () => {
    if (status !== "disponible" && !legajo.trim()) {
      setError(true);
      return;
    }
    onSave({ status, legajo: legajo.trim() });
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 100,
        padding: 16,
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        style={{
          background: "var(--modal-bg)",
          border: "1px solid var(--border-color)",
          borderRadius: 16,
          padding: 24,
          width: 320,
          maxWidth: "100%",
        }}
      >
        <div style={{ fontSize: 17, fontWeight: 500, color: "var(--text-primary)", marginBottom: 4 }}>{slot} hs</div>
        <div style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 20 }}>{dateStr}</div>

        <label style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 6, display: "block" }}>
          Estado del turno
        </label>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          style={{
            width: "100%",
            marginBottom: 16,
            padding: "10px 10px",
            fontSize: 16,
            borderRadius: 8,
            border: "1px solid var(--input-border)",
            background: "var(--bg-card)",
            color: "var(--text-primary)",
          }}
        >
          <option value="disponible">📭 Disponible</option>
          <option value="ofrecido">⛔️ Ofrecido</option>
          <option value="agendado">✅ Agendado</option>
        </select>

        {status !== "disponible" && (
          <>
            <label style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 6, display: "block" }}>
              Legajo del cliente
            </label>
            <input
              type="text"
              value={legajo}
              onChange={(e) => {
                setLegajo(e.target.value);
                setError(false);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSave();
              }}
              placeholder="Ingresá el legajo"
              maxLength={30}
              autoFocus
              style={{
                width: "100%",
                marginBottom: 16,
                padding: "10px 10px",
                fontSize: 16,
                borderRadius: 8,
                border: error ? "1px solid var(--error-text)" : "1px solid var(--input-border)",
                background: "var(--bg-card)",
                color: "var(--text-primary)",
              }}
            />
          </>
        )}

        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <button
            onClick={onClose}
            style={{
              padding: "9px 16px",
              borderRadius: 8,
              border: "1px solid var(--input-border)",
              background: "transparent",
              color: "var(--text-primary)",
              fontSize: 14,
              cursor: "pointer",
            }}
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              padding: "9px 16px",
              borderRadius: 8,
              border: "none",
              background: "var(--accent-fill)",
              color: "#fff",
              fontSize: 14,
              fontWeight: 500,
              cursor: saving ? "default" : "pointer",
              opacity: saving ? 0.6 : 1,
            }}
          >
            {saving ? "Guardando…" : "Guardar"}
          </button>
        </div>
      </div>
    </div>
  );
}

function DayColumn({ date, dayName, dayData, isToday, isPast, statusFilter, onSlotClick }) {
  const visibleSlots = SLOTS.filter((slot) => {
    if (statusFilter === "todos") return true;
    const s = dayData[slot] || { status: "disponible" };
    return s.status === statusFilter;
  });

  return (
    <div
      style={{
        background: "var(--bg-card)",
        border: "1px solid var(--border-color)",
        borderRadius: 12,
        overflow: "hidden",
        opacity: isPast ? 0.55 : 1,
      }}
    >
      <div
        style={{
          padding: "10px 10px 8px",
          borderBottom: "1px solid var(--border-color)",
          textAlign: "center",
          background: isToday ? "var(--accent-bg)" : "transparent",
        }}
      >
        <div
          style={{
            fontSize: 12,
            fontWeight: 500,
            textTransform: "uppercase",
            letterSpacing: "0.04em",
            color: isToday ? "var(--accent-text)" : "var(--text-secondary)",
          }}
        >
          {dayName}
          {isToday && (
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: "var(--accent-fill)",
                display: "inline-block",
                marginLeft: 4,
              }}
            />
          )}
        </div>
        <div style={{ fontSize: 20, fontWeight: 500, color: isToday ? "var(--accent-text)" : "var(--text-primary)" }}>
          {date.getDate()}
        </div>
      </div>

      {visibleSlots.length === 0 && (
        <div style={{ fontSize: 12, color: "var(--text-muted)", textAlign: "center", padding: "16px 10px" }}>
          Sin turnos en este estado
        </div>
      )}

      {visibleSlots.map((slot) => {
        const s = dayData[slot] || { status: "disponible", legajo: "" };
        const meta = STATUS_META[s.status];
        return (
          <div
            key={slot}
            onClick={() => !isPast && onSlotClick(slot)}
            style={{
              padding: "10px 10px",
              borderBottom: "1px solid var(--border-color)",
              cursor: isPast ? "not-allowed" : "pointer",
            }}
          >
            <div style={{ fontSize: 13, fontWeight: 500, color: "var(--text-primary)", marginBottom: 4 }}>
              {slot} {isPast && "🔒"}
            </div>
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
                fontSize: 11,
                fontWeight: 500,
                padding: "2px 8px",
                borderRadius: 20,
                background: meta.bg,
                color: meta.text,
              }}
            >
              <span aria-hidden="true">{meta.emoji}</span>
              {meta.label}
            </span>
            {s.legajo && (
              <div style={{ fontSize: 11, color: "var(--text-secondary)", marginTop: 3 }}>👤 {s.legajo}</div>
            )}
          </div>
        );
      })}

      {isPast && (
        <div
          style={{
            fontSize: 10,
            color: "var(--text-muted)",
            textAlign: "center",
            padding: 6,
            borderTop: "1px solid var(--border-color)",
          }}
        >
          🔒 Día finalizado
        </div>
      )}
    </div>
  );
}

export default function Home() {
  const [monday, setMonday] = useState(() => getMonday(new Date()));
  const [weekData, setWeekData] = useState({});
  const [loading, setLoading] = useState(true);
  const [activeModal, setActiveModal] = useState(null);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [statusFilter, setStatusFilter] = useState("todos");
  const mondayRef = useRef(monday);
  mondayRef.current = monday;

  const weekDates = useMemo(() => Array.from({ length: 5 }, (_, i) => addDays(monday, i)), [monday]);

  const fetchWeek = useCallback(async (mondayDate, silent) => {
    if (!silent) setLoading(true);
    const dates = Array.from({ length: 5 }, (_, i) => addDays(mondayDate, i));
    try {
      const responses = await Promise.all(
        dates.map((date) => fetch(`/api/turnos/${formatDateParam(date)}`).then((r) => r.json()))
      );
      const next = {};
      responses.forEach((res, i) => {
        next[formatDateParam(dates[i])] = res.data || emptyDay();
      });
      setWeekData(next);
      setErrorMsg("");
    } catch (e) {
      setErrorMsg("No se pudieron cargar los turnos. Revisá tu conexión.");
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWeek(monday, false);
  }, [monday, fetchWeek]);

  useEffect(() => {
    const interval = setInterval(() => {
      fetchWeek(mondayRef.current, true);
    }, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [fetchWeek]);

  const handleSaveSlot = async (date, slot, { status, legajo }) => {
    setSaving(true);
    const key = formatDateParam(date);
    try {
      const res = await fetch(`/api/turnos/${key}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slot, status, legajo, offeredAt: status === "ofrecido" ? Date.now() : null }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Error al guardar");
      setWeekData((prev) => ({ ...prev, [key]: json.data }));
      setActiveModal(null);
      setErrorMsg("");
    } catch (e) {
      setErrorMsg("No se pudo guardar el cambio. Probá de nuevo.");
    } finally {
      setSaving(false);
    }
  };

  const weekLabel = (() => {
    const friday = addDays(monday, 4);
    return `${monday.getDate()} ${MONTHS[monday.getMonth()]} — ${friday.getDate()} ${MONTHS[friday.getMonth()]} ${friday.getFullYear()}`;
  })();

  const today = new Date();

  return (
    <div style={{ maxWidth: 800, margin: "0 auto", padding: "1.25rem 1rem" }}>
      <h1 style={{ fontSize: 20, fontWeight: 500, color: "var(--text-primary)", marginBottom: 20, textAlign: "center" }}>
        Horarios para meets
      </h1>

      <div
        className="week-nav-row"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          marginBottom: 16,
        }}
      >
        <button
          onClick={() => setMonday(addDays(monday, -7))}
          style={{
            padding: "8px 14px",
            borderRadius: 8,
            border: "1px solid var(--input-border)",
            background: "var(--bg-card)",
            color: "var(--text-primary)",
            cursor: "pointer",
            fontSize: 14,
            whiteSpace: "nowrap",
          }}
        >
          ← Anterior
        </button>
        <div style={{ fontSize: 17, fontWeight: 500, color: "var(--text-primary)", textAlign: "center" }}>
          {weekLabel}
        </div>
        <button
          onClick={() => setMonday(addDays(monday, 7))}
          style={{
            padding: "8px 14px",
            borderRadius: 8,
            border: "1px solid var(--input-border)",
            background: "var(--bg-card)",
            color: "var(--text-primary)",
            cursor: "pointer",
            fontSize: 14,
            whiteSpace: "nowrap",
          }}
        >
          Siguiente →
        </button>
      </div>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 24, flexWrap: "wrap" }}>
        <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>Mostrar:</span>
        {["todos", "disponible", "ofrecido", "agendado"].map((opt) => {
          const isActive = statusFilter === opt;
          const meta = opt === "todos" ? null : STATUS_META[opt];
          return (
            <button
              key={opt}
              onClick={() => setStatusFilter(opt)}
              style={{
                padding: "6px 12px",
                borderRadius: 20,
                border: isActive ? "1px solid var(--accent-fill)" : "1px solid var(--input-border)",
                background: isActive ? "var(--accent-bg)" : "var(--bg-card)",
                color: isActive ? "var(--accent-text)" : "var(--text-secondary)",
                cursor: "pointer",
                fontSize: 13,
                fontWeight: isActive ? 500 : 400,
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
              }}
            >
              {meta && <span aria-hidden="true">{meta.emoji}</span>}
              {opt === "todos" ? "Todos" : meta.label}
            </button>
          );
        })}
      </div>

      {errorMsg && (
        <div
          style={{
            background: "var(--error-bg)",
            color: "var(--error-text)",
            fontSize: 13,
            padding: "8px 12px",
            borderRadius: 8,
            marginBottom: 12,
          }}
        >
          {errorMsg}
        </div>
      )}

      {loading ? (
        <div style={{ fontSize: 14, color: "var(--text-muted)", textAlign: "center", padding: "2rem 0" }}>
          Cargando turnos…
        </div>
      ) : (
        <div className="week-grid">
          {weekDates.map((date, i) => {
            const key = formatDateParam(date);
            const dayData = weekData[key] || emptyDay();
            const isPast = startOfDay(date) < startOfDay(today);
            return (
              <DayColumn
                key={key}
                date={date}
                dayName={DAY_NAMES[i]}
                dayData={dayData}
                isToday={isSameDay(date, today)}
                isPast={isPast}
                statusFilter={statusFilter}
                onSlotClick={(slot) => setActiveModal({ date, slot })}
              />
            );
          })}
        </div>
      )}

      <div style={{ fontSize: 12, color: "var(--text-muted)", textAlign: "center", marginTop: 20 }}>
        Los cambios se sincronizan automáticamente cada {POLL_INTERVAL_MS / 1000} segundos.
      </div>

      {activeModal && (
        <Modal
          date={activeModal.date}
          slot={activeModal.slot}
          dayData={weekData[formatDateParam(activeModal.date)] || emptyDay()}
          onClose={() => setActiveModal(null)}
          onSave={(payload) => handleSaveSlot(activeModal.date, activeModal.slot, payload)}
          saving={saving}
        />
      )}
    </div>
  );
}
