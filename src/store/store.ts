import type {
  Chamado,
  Dados,
  Evento,
  Historico,
  Mensagem,
} from "../types/types";

export interface Estado {
  chamados: Record<string, Chamado>;
  mensagens: Record<string, Mensagem[]>;
  historico: Record<string, Historico[]>;
  vistos: Record<string, true>;
}
export function inicial(d: Dados): Estado {
  const s: Estado = { chamados: {}, mensagens: {}, historico: {}, vistos: {} };
  d.chamados.forEach((c) => (s.chamados[c.id] = c));
  d.mensagens.forEach(
    (m) =>
      (s.mensagens[m.chamado_id] = [...(s.mensagens[m.chamado_id] ?? []), m]),
  );
  d.historico.forEach(
    (x) =>
      (s.historico[x.chamado_id] = [...(s.historico[x.chamado_id] ?? []), x]),
  );
  return s;
}

export function reduzir(s: Estado, e: Evento): Estado {
  if (s.vistos[e.id]) return s;
  const vistos = { ...s.vistos, [e.id]: true as const };
  switch (e.tipo) {
    case "chamado.aberto":
      return {
        ...s,
        vistos,
        chamados: {
          ...s.chamados,
          [e.payload.id]: s.chamados[e.payload.id] ?? e.payload,
        },
      };
    case "chamado.atribuido": {
      const c = s.chamados[e.payload.chamado_id];
      if (!c) return s;
      return {
        ...s,
        vistos,
        chamados: {
          ...s.chamados,
          [c.id]: { ...c, consultor_id: e.payload.consultor_id },
        },
      };
    }
    case "mensagem.adicionada": {
      const m = e.payload;
      if (!s.chamados[m.chamado_id]) return s;
      const l = s.mensagens[m.chamado_id] ?? [];
      if (l.some((x) => x.id === m.id)) return { ...s, vistos };
      return {
        ...s,
        vistos,
        mensagens: { ...s.mensagens, [m.chamado_id]: [...l, m] },
      };
    }
    case "status.alterado": {
      const p = e.payload;
      const c = s.chamados[p.chamado_id];
      if (!c) return s;
      const h: Historico = { ...p, em: e.ocorrido_em };
      return {
        ...s,
        vistos,
        chamados: { ...s.chamados, [c.id]: { ...c, status: p.para } },
        historico: {
          ...s.historico,
          [c.id]: [...(s.historico[c.id] ?? []), h],
        },
      };
    }
  }
}
