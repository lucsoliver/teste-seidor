import { useState } from "react";
import type { Chamado, Usuario } from "../types/types";
import SlaBadge from "./SlaBadge";

export default function TeamOverview({
  tickets,
  users,
  userMap,
  now,
  onSelect,
}: {
  tickets: Chamado[];
  users: Usuario[];
  userMap: Record<string, Usuario>;
  now: number;
  onSelect: (id: string) => void;
}) {
  const riskWindowMs = 4 * 3600e3;
  const rows = users
    .filter((user) => user.papel === "consultor")
    .map((user) => {
      const opened = tickets.filter(
        (ticket) =>
          ticket.consultor_id === user.id &&
          ticket.status !== "resolvido" &&
          ticket.status !== "fechado",
      );
      const atRisk = opened.filter(
        (ticket) =>
          new Date(ticket.prazo_sla).getTime() - now < riskWindowMs &&
          ticket.status !== "resolvido" &&
          ticket.status !== "fechado",
      );

      return { user, count: opened.length, atRisk: atRisk.length };
    })
    .sort((a, b) => b.count - a.count);

  const unassigned = tickets.filter(
    (ticket) =>
      ticket.status !== "resolvido" &&
      ticket.status !== "fechado" &&
      !ticket.consultor_id,
  );

  const critical = tickets
    .filter(
      (ticket) =>
        ticket.status !== "resolvido" &&
        ticket.status !== "fechado" &&
        new Date(ticket.prazo_sla).getTime() - now < riskWindowMs,
    )
    .sort((a, b) => a.prazo_sla.localeCompare(b.prazo_sla))
    .slice(0, 15);

  const [tab, setTab] = useState<"equipe" | "urgentes">("equipe");

  return (
    <>
      <div className="row tabs" role="tablist">
        <button
          role="tab"
          aria-selected={tab === "equipe"}
          className={tab === "equipe" ? "primary" : "secondary"}
          onClick={() => setTab("equipe")}
        >
          Equipe
        </button>
        <button
          role="tab"
          aria-selected={tab === "urgentes"}
          className={tab === "urgentes" ? "primary" : "secondary"}
          onClick={() => setTab("urgentes")}
        >
          Mais urgentes
        </button>
      </div>
      {tab === "equipe" ? (
        <>
          <table>
            <thead>
              <tr>
                <th>Consultor</th>
                <th>Abertos</th>
                <th>SLA em risco</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.user.id}>
                  <td>{row.user.nome}</td>
                  <td>
                    {row.count === 0 ? (
                      <span className="tag warn">sem chamados</span>
                    ) : (
                      row.count
                    )}
                  </td>
                  <td>{row.atRisk || "–"}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p>
            Sem responsável: <b>{unassigned.length}</b>
          </p>
        </>
      ) : (
        <>
          {critical.length === 0 ? (
            <p className="muted">Nenhum chamado urgente.</p>
          ) : (
            critical.map((ticket) => (
              <div
                key={ticket.id}
                className="item"
                onClick={() => onSelect(ticket.id)}
              >
                <b>#{ticket.numero}</b> {ticket.titulo} ·{" "}
                {ticket.consultor_id
                  ? userMap[ticket.consultor_id].nome
                  : "sem responsável"}{" "}
                <SlaBadge ticket={ticket} now={now} />
              </div>
            ))
          )}
        </>
      )}
    </>
  );
}
