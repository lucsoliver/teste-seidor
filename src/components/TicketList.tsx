import type { Chamado, Status, Usuario } from "../types/types";
import SlaBadge from "./SlaBadge";
import StatusBadge from "./StatusBadge";

function isOpenTicket(ticket: Chamado) {
  return ticket.status !== "resolvido" && ticket.status !== "fechado";
}

export default function TicketList({
  items,
  user,
  selectedId,
  statusLabels,
  onSelect,
  now,
}: {
  items: Chamado[];
  user: Usuario;
  selectedId: string | null;
  statusLabels: Record<Status, string>;
  onSelect: (id: string) => void;
  now: number;
}) {
  const mode = user.papel === "cliente" ? "client" : "staff";

  return (
    <>
      {items.map((ticket) => (
        <div
          key={ticket.id}
          className={`item ${selectedId === ticket.id ? "on" : ""}`}
          onClick={() => onSelect(ticket.id)}
        >
          <b>#{ticket.numero}</b> {ticket.titulo}
          <div className="row">
            <StatusBadge
              status={ticket.status}
              mode={mode}
              labels={statusLabels}
            />
            {isOpenTicket(ticket) && <SlaBadge ticket={ticket} now={now} />}
          </div>
        </div>
      ))}
    </>
  );
}
