/**
 * storage.js
 * Camada de persistência de dados.
 *
 * Hoje os dados vivem no localStorage do navegador. A interface abaixo
 * (getAll / add / update / remove) foi desenhada para que, no futuro,
 * baste trocar a implementação interna por chamadas ao Firestore sem
 * precisar alterar o restante do app (app.js só conhece esses métodos).
 */

const DB_KEY = "prudente_agendamentos_v1";

function _lerTudo() {
  try {
    const raw = localStorage.getItem(DB_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (err) {
    console.error("Erro ao ler o armazenamento local:", err);
    return [];
  }
}

function _salvarTudo(lista) {
  try {
    localStorage.setItem(DB_KEY, JSON.stringify(lista));
    return true;
  } catch (err) {
    console.error("Erro ao salvar no armazenamento local:", err);
    return false;
  }
}

function _gerarId() {
  return `ag_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

function _diaSemanaDeData(isoDate) {
  const d = new Date(`${isoDate}T00:00:00`);
  const js = d.getDay(); // 0 = domingo, 1 = segunda, ... 6 = sábado
  return js === 0 ? 7 : js;
}

const Storage = {
  /**
   * Retorna todos os agendamentos.
   * @returns {Promise<Array>}
   */
  async getAll() {
    return _lerTudo();
  },

  /**
   * Cria um novo agendamento.
   * @param {Object} dados { professor, disciplina, turma, data, periodoId, observacoes }
   * @returns {Promise<Object>} o registro criado (com id)
   */
  async add(dados) {
    const lista = _lerTudo();
    const registro = {
      id: _gerarId(),
      criadoEm: new Date().toISOString(),
      ...dados,
    };
    lista.push(registro);
    _salvarTudo(lista);
    return registro;
  },

  /**
   * Atualiza um agendamento existente.
   * @param {string} id
   * @param {Object} dados campos a atualizar
   * @returns {Promise<Object|null>}
   */
  async update(id, dados) {
    const lista = _lerTudo();
    const idx = lista.findIndex((item) => item.id === id);
    if (idx === -1) return null;
    lista[idx] = { ...lista[idx], ...dados, atualizadoEm: new Date().toISOString() };
    _salvarTudo(lista);
    return lista[idx];
  },

  /**
   * Remove um agendamento.
   * @param {string} id
   * @returns {Promise<boolean>}
   */
  async remove(id) {
    const lista = _lerTudo();
    const nova = lista.filter((item) => item.id !== id);
    _salvarTudo(nova);
    return nova.length !== lista.length;
  },

  /**
   * Verifica se já existe agendamento conflitante (mesma data + período),
   * (mesma data + mesmo horário).
   * @param {string} data ISO yyyy-mm-dd
   * @param {string} periodoId
   * @param {string} [ignorarId] id a ignorar (usado em edições)
   * @returns {Promise<Object|null>} o item conflitante, se houver
   */
  async encontrarConflito(data, periodoId, ignorarId = null) {
    const lista = _lerTudo();
    const conflitoAvulso = lista.find(
      (item) => item.data === data && item.periodoId === periodoId && item.id !== ignorarId
    );
    if (conflitoAvulso) return conflitoAvulso;

    return null;
  },
};
