/**
 * config.js
 * Configuração central do sistema de reserva do laboratório.
 * Ajuste os dias e horários aqui — o restante do app se adapta automaticamente.
 */

const CONFIG = {
  labNome: "Laboratório de Informática · Escola Prudente",

  // Dias disponíveis para reserva (livres para qualquer professor, sem horário fixo)
  dias: [
    { id: 1, sigla: "SEG", nome: "Segunda-feira" },
    { id: 2, sigla: "TER", nome: "Terça-feira" },
    { id: 3, sigla: "QUA", nome: "Quarta-feira" },
    { id: 4, sigla: "QUI", nome: "Quinta-feira" },
    { id: 5, sigla: "SEX", nome: "Sexta-feira" },
  ],

  // Horários das aulas. "id" é o valor do <select> e a referência na grade.
  periodos: [
    { id: "p1", turno: "manha", label: "1ª aula", inicio: "07:30", fim: "08:25" },
    { id: "p2", turno: "manha", label: "2ª aula", inicio: "08:25", fim: "09:40" },
    { id: "p3", turno: "manha", label: "3ª aula", inicio: "09:40", fim: "10:35" },
    { id: "p4", turno: "manha", label: "4ª aula", inicio: "10:35", fim: "11:00" },
  ],

  turnos: {
    manha: { label: "Manhã", cor: "var(--accent-amber)" },
  },
};
