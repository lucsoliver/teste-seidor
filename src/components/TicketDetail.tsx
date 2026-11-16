import { useMemo, useState } from "react";
import type {
  Chamado,
  Historico,
  Mensagem,
  Status,
  Usuario,
} from "../types/types";
import SlaBadge from "./SlaBadge";
import StatusBadge from "./StatusBadge";

const formatDate = (iso: string) =>
  new Date(iso).toLocaleString("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  });

function isOpen(ticket: Chamado) {
  return ticket.status !== "resolvido" && ticket.status !== "fechado";
}

export default function TicketDetail({
  ticket,
  user,
  state,
  statusLabels,
  userMap,
  groupMap,
  now,
  onAssign,
  onChangeStatus,
  onSendMessage,
}: {
  ticket: Chamado;
  user: Usuario;
  state: {
    messages: Mensagem[];
    history: Historico[];
  };
  statusLabels: Record<Status, string>;
  userMap: Record<string, Usuario>;
  groupMap: Record<string, string>;
  now: number;
  onAssign: (consultorId: string) => void;
  onChangeStatus: (nextStatus: Status, reason: string) => void;
  onSendMessage: (text: string, internal: boolean) => void;
}) {
  const [messageText, setMessageText] = useState("");
  const [internalNote, setInternalNote] = useState(false);
  const [nextStatus, setNextStatus] = useState<Status>("em_atendimento");
  const [reason, setReason] = useState("");

  const staff = user.papel !== "cliente";
  const messages = useMemo(
    () =>
      (state.messages ?? [])
        .filter((message) => staff || !message.interna)
        .sort((a, b) => a.criada_em.localeCompare(b.criada_em)),
    [state.messages, staff],
  );
  const history = state.history ?? [];
  const closed = !isOpen(ticket);

  const sendMessage = () => {
    if (!messageText.trim()) return;
    onSendMessage(messageText.trim(), staff && internalNote);
    setMessageText("");
  };

  return (
    <>
      <h3>
        #{ticket.numero} {ticket.titulo}
      </h3>
      <div className="row">
        <StatusBadge
          status={ticket.status}
          mode={staff ? "staff" : "client"}
          labels={statusLabels}
        />
        <SlaBadge ticket={ticket} now={now} />
        {staff && (
          <span className="tag">
            {groupMap[ticket.grupo_id]} · {ticket.categoria} ·{" "}
            {ticket.prioridade}
          </span>
        )}
      </div>
      <p className="muted">
        Atendente:{" "}
        {ticket.consultor_id
          ? userMap[ticket.consultor_id].nome
          : "ainda não atribuído"}{" "}
        · Aberto em {formatDate(ticket.aberto_em)}
        {isOpen(ticket) && (
          <>
            {" "}
            · {staff ? "Prazo" : "Previsão de resposta"}:{" "}
            {formatDate(ticket.prazo_sla)}
          </>
        )}
      </p>
      <p>{ticket.descricao}</p>
      {!staff && history.length > 0 && (
        <p className="muted">
          Última atualização: {statusLabels[history[history.length - 1].para]}{" "}
          em {formatDate(history[history.length - 1].em)}
        </p>
      )}
      {staff && (
        <div className="row">
          {ticket.consultor_id !== user.id && user.papel === "consultor" && (
            <button className="primary" onClick={() => onAssign(user.id)}>
              Pegar para atender
            </button>
          )}
          {user.papel === "gestor" && (
            <select
              value={ticket.consultor_id ?? ""}
              onChange={(event) =>
                event.target.value && onAssign(event.target.value)
              }
            >
              <option value="">Redistribuir para…</option>
              {Object.values(userMap)
                .filter((item) => item.papel === "consultor")
                .map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.nome}
                  </option>
                ))}
            </select>
          )}
        </div>
      )}
      <h4>Conversa</h4>
      {messages.map((message) => (
        <div
          key={message.id}
          className={`msg ${message.autor_id === user.id ? "eu" : ""} ${message.interna ? "int" : ""}`}
        >
          <small className="muted">
            {userMap[message.autor_id]?.nome}
            {message.interna && " · nota interna"} ·{" "}
            {formatDate(message.criada_em)}
          </small>
          <div>{message.texto}</div>
        </div>
      ))}
      {!closed && (
        <>
          <textarea
            rows={3}
            value={messageText}
            onChange={(event) => setMessageText(event.target.value)}
            placeholder="Escreva uma mensagem"
          />
          <div className="row">
            <button
              className="primary send"
              disabled={!messageText.trim()}
              onClick={sendMessage}
            >
              Enviar
            </button>
            {staff && (
              <label>
                <input
                  type="checkbox"
                  checked={internalNote}
                  onChange={(event) => setInternalNote(event.target.checked)}
                />{" "}
                Nota interna (cliente não vê)
              </label>
            )}
          </div>
        </>
      )}
      {(staff || closed) && (
        <>
          <div className="status">
            <h4>{closed ? "Reabrir chamado" : "Alterar status"}</h4>
            <div className="row status-change">
              {staff && !closed && (
                <select
                  value={nextStatus}
                  onChange={(event) =>
                    setNextStatus(event.target.value as Status)
                  }
                >
                  {(Object.keys(statusLabels) as Status[])
                    .filter((status) => status !== ticket.status)
                    .map((status) => (
                      <option key={status} value={status}>
                        {statusLabels[status]}
                      </option>
                    ))}
                </select>
              )}
              <input
                className="w"
                style={{ flex: 1 }}
                placeholder="Motivo (obrigatório)"
                value={reason}
                onChange={(event) => setReason(event.target.value)}
              />
              <button
                disabled={!reason.trim()}
                className="primary"
                onClick={() => {
                  onChangeStatus(
                    closed ? "em_atendimento" : nextStatus,
                    reason.trim(),
                  );
                  setReason("");
                }}
              >
                {closed ? "Reabrir" : "Aplicar"}
              </button>
            </div>
          </div>
        </>
      )}
      {staff && history.length > 0 && (
        <>
          <div className="status">
            <h4>Histórico</h4>
            {history.map((entry, index) => (
              <div key={`${entry.em}-${index}`} className="muted">
                {formatDate(entry.em)} · {statusLabels[entry.de]} →{" "}
                {statusLabels[entry.para]} · {entry.motivo} (
                {userMap[entry.usuario_id]?.nome})
              </div>
            ))}
          </div>
        </>
      )}
    </>
  );
}
