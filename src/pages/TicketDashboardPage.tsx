import { useEffect, useMemo, useReducer, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import NewTicketForm from "../components/NewTicketForm";
import TeamOverview from "../components/TeamOverview";
import TicketDetail from "../components/TicketDetail";
import TicketList from "../components/TicketList";
import { DEFAULT_PROFILE_ID, PROFILE_IDS, dados } from "../data/seed";
import { conectar } from "../services/api";
import { inicial, reduzir } from "../store/store";
import type { Chamado, Evento, Status, Usuario } from "../types/types";

const USERS_BY_ID: Record<string, Usuario> = Object.fromEntries(
  dados.usuarios.map((user) => [user.id, user]),
);
const GROUPS_BY_ID: Record<string, string> = Object.fromEntries(
  dados.grupos.map((group) => [group.id, group.nome]),
);
const STATUS_LABELS: Record<Status, string> = {
  novo: "Novo",
  em_atendimento: "Em atendimento",
  aguardando_cliente: "Aguardando cliente",
  resolvido: "Resolvido",
  fechado: "Fechado",
};
const CLIENT_STATUS_LABELS: Record<Status, string> = {
  novo: "Recebido",
  em_atendimento: "Em atendimento",
  aguardando_cliente: "Aguardando sua resposta",
  resolvido: "Resolvido",
  fechado: "Fechado",
};

function isTicketOpen(ticket: Chamado) {
  return ticket.status !== "resolvido" && ticket.status !== "fechado";
}

export default function TicketDashboardPage() {
  const { perfilId } = useParams();
  const navigate = useNavigate();
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [creatingTicket, setCreatingTicket] = useState(false);
  const [now, setNow] = useState(Date.now());
  const [activeTab, setActiveTab] = useState<"meus" | "fila" | "todos">("meus");
  const [searchTerm, setSearchTerm] = useState("");
  const [ticketsOpen, setTicketsOpen] = useState(true);
  const [state, dispatch] = useReducer(reduzir, dados, inicial);

  const userId =
    perfilId && USERS_BY_ID[perfilId] ? perfilId : DEFAULT_PROFILE_ID;
  const currentUser = USERS_BY_ID[userId];
  const ref = useRef(state);
  ref.current = state;

  useEffect(() => {
    const activeId =
      perfilId && USERS_BY_ID[perfilId] ? perfilId : DEFAULT_PROFILE_ID;
    if (perfilId !== activeId) {
      navigate(`/perfil/${activeId}`, { replace: true });
    }
  }, [perfilId, navigate]);

  useEffect(() => conectar(dispatch, () => ref.current, dados.usuarios), []);
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(timer);
  }, []);
  useEffect(() => {
    setSelectedTicketId(null);
    setCreatingTicket(false);
  }, [userId]);

  const emit = (event: Record<string, unknown>) =>
    dispatch({
      id: crypto.randomUUID(),
      ocorrido_em: new Date().toISOString(),
      ...event,
    } as Evento);

  const tickets = Object.values(state.chamados);
  const visibleTickets = useMemo(() => {
    const source =
      currentUser.papel === "cliente"
        ? tickets.filter((ticket) => ticket.solicitante_id === currentUser.id)
        : currentUser.papel === "gestor"
          ? tickets
          : tickets.filter(
              (ticket) =>
                ticket.grupo_id === currentUser.grupo_id ||
                ticket.consultor_id === currentUser.id,
            );

    return source
      .filter((ticket) => {
        if (currentUser.papel === "cliente") {
          return true;
        }

        const matchesTab =
          activeTab === "todos"
            ? true
            : activeTab === "meus"
              ? ticket.consultor_id === currentUser.id
              : !ticket.consultor_id && isTicketOpen(ticket);

        const matchesSearch =
          !searchTerm ||
          `${ticket.numero} ${ticket.titulo}`
            .toLowerCase()
            .includes(searchTerm.toLowerCase());

        return matchesTab && matchesSearch;
      })
      .sort(
        (a, b) =>
          Number(isTicketOpen(b)) - Number(isTicketOpen(a)) ||
          a.prazo_sla.localeCompare(b.prazo_sla),
      );
  }, [tickets, currentUser, activeTab, searchTerm]);

  const selectedTicket = selectedTicketId
    ? state.chamados[selectedTicketId]
    : undefined;

  const assignTicket = (consultorId: string) => {
    if (!selectedTicketId) return;
    emit({
      tipo: "chamado.atribuido",
      payload: { chamado_id: selectedTicketId, consultor_id: consultorId },
    });
    const selected = state.chamados[selectedTicketId];
    if (selected && selected.status === "novo") {
      emit({
        tipo: "status.alterado",
        payload: {
          chamado_id: selectedTicketId,
          de: selected.status,
          para: "em_atendimento",
          motivo: "Chamado assumido",
          usuario_id: currentUser.id,
        },
      });
    }
  };

  const changeStatus = (nextStatus: Status, reason: string) => {
    if (!selectedTicketId || !reason.trim()) return;
    const currentTicket = state.chamados[selectedTicketId];
    if (!currentTicket) return;
    emit({
      tipo: "status.alterado",
      payload: {
        chamado_id: selectedTicketId,
        de: currentTicket.status,
        para: nextStatus,
        motivo: reason.trim(),
        usuario_id: currentUser.id,
      },
    });
  };

  const sendMessage = (text: string, internal: boolean) => {
    if (!selectedTicketId || !text.trim()) return;
    emit({
      tipo: "mensagem.adicionada",
      payload: {
        id: crypto.randomUUID(),
        chamado_id: selectedTicketId,
        autor_id: currentUser.id,
        texto: text.trim(),
        interna: internal,
        criada_em: new Date().toISOString(),
      },
    });

    const currentTicket = state.chamados[selectedTicketId];
    if (!currentTicket) return;

    if (
      currentUser.papel === "cliente" &&
      currentTicket.status === "aguardando_cliente"
    ) {
      emit({
        tipo: "status.alterado",
        payload: {
          chamado_id: selectedTicketId,
          de: currentTicket.status,
          para: "em_atendimento",
          motivo: "Cliente respondeu",
          usuario_id: currentUser.id,
        },
      });
    }
  };

  const createTicket = (ticket: Chamado) => {
    emit({
      tipo: "chamado.aberto",
      payload: ticket,
    });
    setSelectedTicketId(ticket.id);
    setCreatingTicket(false);
  };

  const currentStatusLabels =
    currentUser.papel === "cliente" ? CLIENT_STATUS_LABELS : STATUS_LABELS;

  return (
    <>
      <header>
        <h1>Chamados ITSM</h1>
        <select
          value={userId}
          onChange={(event) => navigate(`/perfil/${event.target.value}`)}
          aria-label="Perfil"
        >
          {PROFILE_IDS.map((profileId) => (
            <option key={profileId} value={profileId}>
              {USERS_BY_ID[profileId].nome} ({USERS_BY_ID[profileId].papel})
            </option>
          ))}
        </select>
        <button
          className="primary"
          onClick={() => {
            setCreatingTicket(true);
            setSelectedTicketId(null);
          }}
        >
          Abrir chamado
        </button>
      </header>
      <main className={ticketsOpen ? undefined : "list-closed"}>
        <section className={ticketsOpen ? "tickets" : "tickets closed"}>
          <div className="section-bar">
            {ticketsOpen ? (
              <span className="section-title">Tickets</span>
            ) : null}
            <button
              type="button"
              className="secondary collapse-toggle collapse-button"
              aria-expanded={ticketsOpen}
              aria-controls="ticket-panel"
              onClick={() => setTicketsOpen((open) => !open)}
            >
              {ticketsOpen ? "-" : "+"}
            </button>
          </div>
          {ticketsOpen ? (
            <div id="ticket-panel">
              {currentUser.papel === "gestor" ? (
                <>
                  <div className="row">
                    <button
                      className="primary"
                      onClick={() => setSelectedTicketId(null)}
                    >
                      Visão geral
                    </button>
                  </div>
                  <TeamOverview
                    tickets={tickets}
                    users={dados.usuarios}
                    userMap={USERS_BY_ID}
                    now={now}
                    onSelect={setSelectedTicketId}
                  />
                </>
              ) : (
                <>
                  <div className="row">
                    {(["meus", "fila", "todos"] as const).map((tab) => (
                      <button
                        key={tab}
                        className={activeTab === tab ? "primary" : "secondary"}
                        onClick={() => setActiveTab(tab)}
                      >
                        {tab === "meus"
                          ? "Meus"
                          : tab === "fila"
                            ? "Fila do grupo"
                            : "Todos"}
                      </button>
                    ))}
                  </div>
                  <div
                    className="row"
                    style={{ marginTop: 12, marginBottom: 12 }}
                  >
                    <input
                      className="w"
                      placeholder="Buscar por nº ou título"
                      value={searchTerm}
                      onChange={(event) => setSearchTerm(event.target.value)}
                    />
                  </div>
                  <p className="muted">
                    {visibleTickets.length} chamado(s)
                    {" · ordenado por prazo"}
                  </p>
                  <TicketList
                    items={visibleTickets}
                    user={currentUser}
                    selectedId={selectedTicketId}
                    statusLabels={currentStatusLabels}
                    onSelect={(id) => {
                      setSelectedTicketId(id);
                      setCreatingTicket(false);
                    }}
                    now={now}
                  />
                </>
              )}
            </div>
          ) : null}
        </section>
        <section>
          {creatingTicket ? (
            <NewTicketForm
              user={currentUser}
              tickets={tickets}
              onCreate={createTicket}
            />
          ) : selectedTicket ? (
            <TicketDetail
              ticket={selectedTicket}
              user={currentUser}
              state={{
                messages: state.mensagens[selectedTicket.id] ?? [],
                history: state.historico[selectedTicket.id] ?? [],
              }}
              statusLabels={currentStatusLabels}
              userMap={USERS_BY_ID}
              groupMap={GROUPS_BY_ID}
              now={now}
              onAssign={assignTicket}
              onChangeStatus={changeStatus}
              onSendMessage={sendMessage}
            />
          ) : (
            <p className="muted">Selecione um chamado.</p>
          )}
        </section>
      </main>
    </>
  );
}
