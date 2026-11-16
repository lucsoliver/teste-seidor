import { useState } from "react";
import { CATEGORIAS, HORAS_SLA } from "../data/seed";
import type { Chamado, Usuario } from "../types/types";

export default function NewTicketForm({
  user,
  tickets,
  onCreate,
}: {
  user: Usuario;
  tickets: Chamado[];
  onCreate: (ticket: Chamado) => void;
}) {
  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [category, setCategory] = useState(Object.keys(CATEGORIAS)[0]);

  const words = titulo
    .toLowerCase()
    .split(/\W+/)
    .filter((word) => word.length > 3);

  const similarTickets =
    words.length === 0
      ? []
      : tickets.filter(
          (ticket) =>
            ticket.solicitante_id === user.id &&
            ticket.status === "fechado" &&
            words.filter((word) => ticket.titulo.toLowerCase().includes(word))
              .length >= Math.min(2, words.length),
        );

  const create = () => {
    const now = new Date();
    const created: Chamado = {
      id: crypto.randomUUID(),
      numero: Math.max(...tickets.map((ticket) => ticket.numero)) + 1,
      titulo,
      descricao,
      status: "novo",
      prioridade: "media",
      categoria: category,
      grupo_id: CATEGORIAS[category],
      solicitante_id: user.id,
      empresa: user.empresa ?? "",
      consultor_id: null,
      aberto_em: now.toISOString(),
      prazo_sla: new Date(+now + HORAS_SLA.media * 3600e3).toISOString(),
    };

    onCreate(created);
  };

  return (
    <>
      <h3>Abrir chamado</h3>
      <div className="new-ticket-form">
        <div className="row row-wrapper">
          <input
            className="w-20"
            placeholder="Título"
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
          />

          {user.papel !== "cliente" && (
            <div className="row">
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                {Object.keys(CATEGORIAS).map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
            </div>
          )}
        </div>
        {similarTickets.length > 0 && (
          <div className="tag warn" style={{ display: "block", padding: 8 }}>
            Parece o mesmo problema de um chamado fechado:
            {similarTickets.map((ticket) => (
              <div key={ticket.id}>
                #{ticket.numero} {ticket.titulo}{" "}
                <button onClick={() => onCreate(ticket)}>Ver / reabrir</button>
              </div>
            ))}
          </div>
        )}
        <div className="row">
          <textarea
            rows={4}
            placeholder="O que aconteceu?"
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
          />
        </div>

        <button
          className="primary w-20"
          disabled={!titulo.trim() || !descricao.trim()}
          onClick={create}
        >
          Abrir
        </button>
      </div>
    </>
  );
}
