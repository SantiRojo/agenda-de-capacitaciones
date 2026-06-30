import { Redis } from "@upstash/redis";
import { NextResponse } from "next/server";

const redis = Redis.fromEnv();

function emptyBlock() {
  return { blocked: false, reason: "" };
}

export async function GET(request, { params }) {
  const { date } = params;
  const key = `bloqueo:${date}`;
  try {
    const raw = await redis.get(key);
    const data = raw || emptyBlock();
    return NextResponse.json({ date, data });
  } catch (err) {
    return NextResponse.json({ error: "No se pudo leer el bloqueo" }, { status: 500 });
  }
}

export async function POST(request, { params }) {
  const { date } = params;
  const key = `bloqueo:${date}`;
  try {
    const body = await request.json();
    const { blocked, reason } = body;

    if (typeof blocked !== "boolean") {
      return NextResponse.json({ error: "Valor inválido para blocked" }, { status: 400 });
    }
    if (blocked && (!reason || !reason.trim())) {
      return NextResponse.json({ error: "El motivo es obligatorio para bloquear el día" }, { status: 400 });
    }

    const data = {
      blocked,
      reason: blocked ? reason.trim() : "",
    };

    await redis.set(key, data);
    return NextResponse.json({ date, data });
  } catch (err) {
    return NextResponse.json({ error: "No se pudo guardar el bloqueo" }, { status: 500 });
  }
}
