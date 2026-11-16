import type { Chamado } from "../types/types";

export default function SlaBadge({
  ticket,
  now,
}: {
  ticket: Chamado;
  now: number;
}) {
  if (ticket.status === "resolvido" || ticket.status === "fechado") {
    return null;
  }

  const ms = new Date(ticket.prazo_sla).getTime() - now;
  const hours = Math.abs(ms) / 3600e3;
  const label =
    hours < 1
      ? `${Math.round(hours * 60)}min`
      : `${hours.toFixed(hours < 10 ? 1 : 0)}h`;

  return (
    <span className={`tag ${ms < 0 ? "bad" : ms < 4 * 3600e3 ? "warn" : "ok"}`}>
      {ms < 0 ? `estourou há ${label}` : `SLA ${label}`}
    </span>
  );
}
