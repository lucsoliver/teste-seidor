import type { Chamado, Evento, Status, Usuario } from "../types/types";
import type { Estado } from "../store/store";
import { CATEGORIAS, HORAS_SLA } from "../data/seed";

const rid = () => crypto.randomUUID();
export function conectar(
  emit: (e: Evento) => void,
  snap: () => Estado,
  usuarios: Usuario[],
) {
  const cons = usuarios.filter((u) => u.papel === "consultor");
  const t = setInterval(() => {
    const s = snap();
    const cs = Object.values(s.chamados);
    const c = cs[Math.floor(Math.random() * cs.length)];
    const x = Math.random();
    const agora = new Date().toISOString();
    let e: Evento;
    if (x < 0.15) {
      const cli = usuarios.filter((u) => u.papel === "cliente")[
        Math.floor(Math.random() * 6)
      ];
      const cat = Object.keys(CATEGORIAS)[Math.floor(Math.random() * 6)];
      const n: Chamado = {
        id: rid(),
        numero: Math.max(...cs.map((k) => k.numero)) + 1,
        titulo: "Novo problema reportado",
        descricao: "Chamado simulado.",
        status: "novo",
        prioridade: "media",
        categoria: cat,
        grupo_id: CATEGORIAS[cat],
        solicitante_id: cli.id,
        empresa: cli.empresa!,
        consultor_id: null,
        aberto_em: agora,
        prazo_sla: new Date(
          Date.now() + HORAS_SLA.media * 3600e3,
        ).toISOString(),
      };
      e = { id: rid(), tipo: "chamado.aberto", ocorrido_em: agora, payload: n };
    } else if (x < 0.6) {
      const autor =
        c.consultor_id && Math.random() < 0.5
          ? c.consultor_id
          : c.solicitante_id;
      e = {
        id: rid(),
        tipo: "mensagem.adicionada",
        ocorrido_em: agora,
        payload: {
          id: rid(),
          chamado_id: c.id,
          autor_id: autor,
          texto: "Mensagem em tempo real (simulada).",
          interna: false,
          criada_em: agora,
        },
      };
    } else if (x < 0.8) {
      e = {
        id: rid(),
        tipo: "chamado.atribuido",
        ocorrido_em: agora,
        payload: {
          chamado_id: c.id,
          consultor_id: cons[Math.floor(Math.random() * cons.length)].id,
        },
      };
    } else {
      const para = (
        ["em_atendimento", "aguardando_cliente", "resolvido"] as Status[]
      ).filter((p) => p !== c.status)[Math.floor(Math.random() * 2)];
      e = {
        id: rid(),
        tipo: "status.alterado",
        ocorrido_em: agora,
        payload: {
          chamado_id: c.id,
          de: c.status,
          para,
          motivo: "Atualização automática",
          usuario_id: c.consultor_id ?? "r1",
        },
      };
    }
    emit(e);
    if (Math.random() < 0.2) setTimeout(() => emit(e), 400); // duplicata
  }, 4000);
  return () => clearInterval(t);
}
