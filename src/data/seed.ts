import dadosRaw from "./dados.json";
import type { Dados, Prioridade, Status, Usuario } from "../types/types";

type RawUsuario = {
  id: string;
  nome: string;
  email?: string;
  perfil: "gestor" | "consultor" | "cliente";
  locale?: string;
  zoneinfo?: string;
  grupo_id?: string;
  grupos_ids?: string[];
  empresa?: string;
};

type RawCategoria = {
  id: string;
  nome: string;
  grupo_id: string;
};

type RawTicket = {
  id: string;
  numero: number;
  titulo: string;
  descricao: string;
  categoria_id: string;
  grupo_id: string;
  prioridade: Prioridade;
  status: Status;
  solicitante_id: string;
  responsavel_id?: string | null;
  aberto_em: string;
  atualizado_em?: string | null;
  primeira_resposta_em?: string | null;
  prazo_primeira_resposta?: string | null;
  prazo_resolucao?: string | null;
  sla_pausado?: boolean;
  resolvido_em?: string | null;
  fechado_em?: string | null;
};

type RawHistorico = {
  id?: string;
  chamado_id: string;
  de?: Status | string | null;
  para?: Status | string | null;
  motivo?: string | null;
  usuario_id: string;
  em?: string;
  ocorrido_em?: string;
  tipo?: string;
};

type RawDados = {
  grupos: Array<{ id: string; nome: string; gestor_id?: string }>;
  categorias: RawCategoria[];
  usuarios: RawUsuario[];
  chamados: RawTicket[];
  mensagens: Array<{
    id: string;
    chamado_id: string;
    autor_id: string;
    texto: string;
    interna: boolean;
    criada_em: string;
  }>;
  historico: RawHistorico[];
  sla: Array<{
    prioridade: Prioridade;
    primeira_resposta_horas: number;
    resolucao_horas: number;
  }>;
};

const raw = dadosRaw as unknown as RawDados;

const normalizarStatus = (status?: string | null): Status => {
  switch (status) {
    case "aberto":
    case "novo":
      return "novo";
    case "em_atendimento":
    case "em atendimento":
      return "em_atendimento";
    case "aguardando_cliente":
    case "aguardando cliente":
      return "aguardando_cliente";
    case "resolvido":
      return "resolvido";
    case "fechado":
      return "fechado";
    default:
      return "novo";
  }
};

const categoriasById = Object.fromEntries(
  raw.categorias.map((categoria) => [categoria.id, categoria.nome]),
) as Record<string, string>;

const usuariosNormalizados: Usuario[] = raw.usuarios.map((usuario) => ({
  id: usuario.id,
  nome: usuario.nome,
  papel: usuario.perfil,
  grupo_id: usuario.grupo_id ?? usuario.grupos_ids?.[0],
  empresa: usuario.empresa,
}));

const usuarioPorId = Object.fromEntries(
  usuariosNormalizados.map((usuario) => [usuario.id, usuario]),
) as Record<string, Usuario>;

export const CATEGORIAS: Record<string, string> = Object.fromEntries(
  raw.categorias.map((categoria) => [categoria.nome, categoria.grupo_id]),
);

export const HORAS_SLA: Record<Prioridade, number> = Object.fromEntries(
  raw.sla.map((sla) => [sla.prioridade, sla.resolucao_horas]),
) as Record<Prioridade, number>;

export const PROFILE_IDS = [
  raw.usuarios.find((usuario) => usuario.perfil === "gestor")?.id,
  raw.usuarios.find((usuario) => usuario.perfil === "consultor")?.id,
  raw.usuarios.find((usuario) => usuario.perfil === "cliente")?.id,
].filter((value): value is string => Boolean(value));

export const DEFAULT_PROFILE_ID =
  raw.usuarios.find((usuario) => usuario.perfil === "consultor")?.id ??
  raw.usuarios[0]?.id ??
  "";

export const dados: Dados = {
  usuarios: usuariosNormalizados,
  grupos: raw.grupos.map((grupo) => ({
    id: grupo.id,
    nome: grupo.nome,
  })),
  chamados: raw.chamados.map((chamado) => ({
    id: chamado.id,
    numero: chamado.numero,
    titulo: chamado.titulo,
    descricao: chamado.descricao,
    status: normalizarStatus(chamado.status),
    prioridade: chamado.prioridade,
    categoria: categoriasById[chamado.categoria_id] ?? "Sem categoria",
    grupo_id: chamado.grupo_id,
    solicitante_id: chamado.solicitante_id,
    empresa: usuarioPorId[chamado.solicitante_id]?.empresa ?? "",
    consultor_id: chamado.responsavel_id ?? null,
    aberto_em: chamado.aberto_em,
    prazo_sla: chamado.prazo_resolucao ?? chamado.aberto_em,
  })),
  mensagens: raw.mensagens,
  historico: raw.historico.map((item) => ({
    chamado_id: item.chamado_id,
    de: normalizarStatus(item.de ?? "novo"),
    para: normalizarStatus(item.para ?? "novo"),
    motivo: item.motivo ?? "Atualização do histórico",
    usuario_id: item.usuario_id,
    em: item.em ?? item.ocorrido_em ?? new Date().toISOString(),
  })),
};
