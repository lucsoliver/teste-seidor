export type Papel = "consultor" | "gestor" | "cliente";
export type Status =
  | "novo"
  | "em_atendimento"
  | "aguardando_cliente"
  | "resolvido"
  | "fechado";
export type Prioridade = "baixa" | "media" | "alta" | "critica";
export interface Usuario {
  id: string;
  nome: string;
  papel: Papel;
  grupo_id?: string;
  empresa?: string;
}
export interface Grupo {
  id: string;
  nome: string;
}
export interface Chamado {
  id: string;
  numero: number;
  titulo: string;
  descricao: string;
  status: Status;
  prioridade: Prioridade;
  categoria: string;
  grupo_id: string;
  solicitante_id: string;
  empresa: string;
  consultor_id: string | null;
  aberto_em: string;
  prazo_sla: string;
}
export interface Mensagem {
  id: string;
  chamado_id: string;
  autor_id: string;
  texto: string;
  interna: boolean;
  criada_em: string;
}
export interface Historico {
  chamado_id: string;
  de: Status;
  para: Status;
  motivo: string;
  usuario_id: string;
  em: string;
}
export interface Dados {
  usuarios: Usuario[];
  grupos: Grupo[];
  chamados: Chamado[];
  mensagens: Mensagem[];
  historico: Historico[];
}
type Base = { id: string; ocorrido_em: string };
export type Evento = Base &
  (
    | { tipo: "chamado.aberto"; payload: Chamado }
    | {
        tipo: "chamado.atribuido";
        payload: { chamado_id: string; consultor_id: string };
      }
    | { tipo: "mensagem.adicionada"; payload: Mensagem }
    | {
        tipo: "status.alterado";
        payload: {
          chamado_id: string;
          de: Status;
          para: Status;
          motivo: string;
          usuario_id: string;
        };
      }
  );
