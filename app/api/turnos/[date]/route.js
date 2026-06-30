import { kv } from "@vercel/kv";
import { NextResponse } from "next/server";

const SLOTS = ["9:30", "10:30", "11:30", "12:30", "14:30", "15:30", "16:30"];
const RESET_HOUR = 19;

function emptyDay() {
  const d = {};
  SLOTS.forEach((s) => (d[s] = { status: "disponible", legajo: "", offeredAt: null }));
  return d;
}

function getLastResetThreshold() {
  const now = new Date();
  const threshold = new Date(now);
  threshold.setHours(RESET_HOUR, 0, 0, 0);
  if (now < threshold) threshold.setDate(threshold.getDate() - 1);
  return threshold;
}

function applyReset(dayData) {
  const threshold = getLastResetThreshold();
  let changed = false;
  const next = { ...dayData };
  SLOTS.forEach((s) => {
    const slot = next[s];
    if (slot && slot.status === "ofrecido") {
      const offeredAt = slot.offeredAt ? new Date(slot.offeredAt) : null;
      if (!offeredAt || offeredAt <= threshold) {
        next[s] = { status: "disponible", legajo: "", offeredAt: null };
        changed = true;
      }
    }
  });
  return { data: next, changed };
}

export async function GET(request, { params }) {
  const { date } = params;
  const key = `turnos:${date}`;
  try {
    const raw = await kv.get(key);
    const data = raw || emptyDay();
    const { data: resetData, changed } = applyReset(data);
    if (changed) {
      await kv.set(key, resetData);
    }
    return NextResponse.json({ date, data: resetData });
  } catch (err) {
    return NextResponse.json({ error: "No se pudo leer el turno" }, { status: 500 });
  }
}

export async function POST(request, { params }) {
  const { date } = params;
  const key = `turnos:${date}`;
  try {
    const body = await request.json();
    const { slot, status, legajo, offeredAt } = body;

    if (!SLOTS.includes(slot)) {
      return NextResponse.json({ error: "Horario inválido" }, { status: 400 });
    }
    if (!["disponible", "ofrecido", "agendado"].includes(status)) {
      return NextResponse.json({ error: "Estado inválido" }, { status: 400 });
    }

    const raw = await kv.get(key);
    const current = raw || emptyDay();
    current[slot] = {
      status,
      legajo: status === "disponible" ? "" : legajo || "",
      offeredAt: status === "ofrecido" ? offeredAt || Date.now() : null,
    };

    await kv.set(key, current);
    return NextResponse.json({ date, data: current });
  } catch (err) {
    return NextResponse.json({ error: "No se pudo guardar el turno" }, { status: 500 });
  }
}
