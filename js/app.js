/**
 * app.js
 * Estado, renderização e interações do sistema de agendamento.
 */

const state = {
  agendamentos: [],
  semanaRef: startOfWeek(new Date()), // segunda-feira da semana visível na grade
  editandoId: null,
  filtro: "",
};

// ---------- Helpers de data ----------

function startOfWeek(date) {
  const d = new Date(date);
  const dia = d.getDay(); // 0 = domingo
  const diff = dia === 0 ? -6 : 1 - dia; // volta até a segunda-feira
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function addDays(date, n) {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

function toISODate(date) {
  const d = new Date(date);
  const off = d.getTimezoneOffset();
  return new Date(d.getTime() - off * 60000).toISOString().slice(0, 10);
}

function formatarDataBR(isoDate) {
  const [ano, mes, dia] = isoDate.split("-");
  return `${dia}/${mes}/${ano}`;
}

function formatarDataExtenso(isoDate) {
  const d = new Date(`${isoDate}T00:00:00`);
  return d.toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long" });
}

// ---------- Referências de DOM ----------

const el = {
  form: document.getElementById("form-agendamento"),
  professor: document.getElementById("input-professor"),
  disciplina: document.getElementById("input-disciplina"),
  turma: document.getElementById("input-turma"),
  data: document.getElementById("input-data"),
  periodo: document.getElementById("input-periodo"),
  observacoes: document.getElementById("input-observacoes"),
  btnSubmit: document.getElementById("btn-submit"),
  btnCancelarEdicao: document.getElementById("btn-cancelar-edicao"),
  formTitulo: document.getElementById("form-titulo"),
  formErro: document.getElementById("form-erro"),

  weekLabel: document.getElementById("week-label"),
  weekPrev: document.getElementById("week-prev"),
  weekNext: document.getElementById("week-next"),
  weekToday: document.getElementById("week-today"),
  grid: document.getElementById("patch-grid"),

  buscaInput: document.getElementById("input-busca"),
  listaAgenda: document.getElementById("lista-agenda"),
  contadorAgenda: document.getElementById("contador-agenda"),
  estadoVazio: document.getElementById("estado-vazio"),

  toast: document.getElementById("toast"),

  btnTema: document.getElementById("btn-tema"),
};

// ---------- Tema claro/escuro ----------

function aplicarTema(tema) {
  if (tema === "claro") {
    document.documentElement.setAttribute("data-tema", "claro");
    el.btnTema.querySelector(".btn-tema__icone").textContent = "☀";
  } else {
    document.documentElement.removeAttribute("data-tema");
    el.btnTema.querySelector(".btn-tema__icone").textContent = "☾";
  }
  try {
    localStorage.setItem("prudente_tema", tema);
  } catch (err) {
    console.warn("Não foi possível salvar a preferência de tema:", err);
  }
}

function initTema() {
  const salvo = document.documentElement.getAttribute("data-tema") === "claro" ? "claro" : "escuro";
  aplicarTema(salvo);
  el.btnTema.addEventListener("click", () => {
    const atual = document.documentElement.getAttribute("data-tema") === "claro" ? "claro" : "escuro";
    aplicarTema(atual === "claro" ? "escuro" : "claro");
  });
}

// ---------- Inicialização ----------

async function init() {
  initTema();
  preencherSelectPeriodos();
  el.data.min = toISODate(new Date());
  el.data.value = toISODate(new Date());

  state.agendamentos = await Storage.getAll();

  renderGrade();
  renderAgenda();

  el.form.addEventListener("submit", onSubmitForm);
  el.btnCancelarEdicao.addEventListener("click", cancelarEdicao);
  el.weekPrev.addEventListener("click", () => mudarSemana(-7));
  el.weekNext.addEventListener("click", () => mudarSemana(7));
  el.weekToday.addEventListener("click", () => {
    state.semanaRef = startOfWeek(new Date());
    renderGrade();
  });
  el.buscaInput.addEventListener("input", (e) => {
    state.filtro = e.target.value.trim().toLowerCase();
    renderAgenda();
  });
}

function preencherSelectPeriodos() {
  const grupos = { manha: [] };
  CONFIG.periodos.forEach((p) => grupos[p.turno].push(p));

  el.periodo.innerHTML = "";
  Object.entries(grupos).forEach(([turno, periodos]) => {
    if (!periodos.length) return;
    const optgroup = document.createElement("optgroup");
    optgroup.label = CONFIG.turnos[turno].label;
    periodos.forEach((p) => {
      const opt = document.createElement("option");
      opt.value = p.id;
      const rotuloCurto = p.label.replace(" aula", "").replace(" horário", "");
      opt.textContent = `${rotuloCurto} ${p.inicio}-${p.fim}`;
      optgroup.appendChild(opt);
    });
    el.periodo.appendChild(optgroup);
  });
}

// ---------- Formulário ----------

async function onSubmitForm(e) {
  e.preventDefault();
  esconderErroForm();

  const dados = {
    professor: el.professor.value.trim(),
    disciplina: el.disciplina.value.trim(),
    turma: el.turma.value.trim(),
    data: el.data.value,
    periodoId: el.periodo.value,
    observacoes: el.observacoes.value.trim(),
  };

  if (!dados.professor || !dados.disciplina || !dados.data || !dados.periodoId) {
    mostrarErroForm("Preencha professor, disciplina, data e horário.");
    return;
  }

  if (!CONFIG.dias.some((d) => d.id === _diaSemanaDeData(dados.data))) {
    mostrarErroForm("Escolha um dia útil (segunda a sexta).");
    return;
  }

  const conflito = await Storage.encontrarConflito(dados.data, dados.periodoId, state.editandoId);
  if (conflito) {
    const periodo = CONFIG.periodos.find((p) => p.id === conflito.periodoId);
    mostrarErroForm(
      `Horário já reservado por ${conflito.professor} (${conflito.disciplina}) — ${periodo.label}.`
    );
    return;
  }

  if (state.editandoId) {
    await Storage.update(state.editandoId, dados);
    mostrarToast("Agendamento atualizado.");
  } else {
    await Storage.add(dados);
    mostrarToast("Aula agendada com sucesso.");
  }

  state.agendamentos = await Storage.getAll();
  cancelarEdicao();
  renderGrade();
  renderAgenda();
}

function iniciarEdicao(id) {
  const item = state.agendamentos.find((a) => a.id === id);
  if (!item) return;

  state.editandoId = id;
  el.professor.value = item.professor;
  el.disciplina.value = item.disciplina;
  el.turma.value = item.turma || "";
  el.data.value = item.data;
  el.periodo.value = item.periodoId;
  el.observacoes.value = item.observacoes || "";

  el.formTitulo.textContent = "Editar agendamento";
  el.btnSubmit.textContent = "Salvar alterações";
  el.btnCancelarEdicao.hidden = false;
  el.form.scrollIntoView({ behavior: "smooth", block: "start" });
  el.professor.focus();
}

function cancelarEdicao() {
  state.editandoId = null;
  el.form.reset();
  el.data.value = toISODate(new Date());
  el.formTitulo.textContent = "Nova reserva";
  el.btnSubmit.textContent = "Agendar aula";
  el.btnCancelarEdicao.hidden = true;
  esconderErroForm();
}

async function excluirAgendamento(id) {
  const item = state.agendamentos.find((a) => a.id === id);
  if (!item) return;
  const ok = confirm(
    `Cancelar a aula de ${item.disciplina} (${item.professor}) em ${formatarDataBR(item.data)}?`
  );
  if (!ok) return;

  await Storage.remove(id);
  state.agendamentos = await Storage.getAll();
  if (state.editandoId === id) cancelarEdicao();
  renderGrade();
  renderAgenda();
  mostrarToast("Agendamento cancelado.");
}

function mostrarErroForm(msg) {
  el.formErro.textContent = msg;
  el.formErro.hidden = false;
}
function esconderErroForm() {
  el.formErro.hidden = true;
  el.formErro.textContent = "";
}

// ---------- Grade semanal ("patch panel") ----------

function mudarSemana(delta) {
  state.semanaRef = addDays(state.semanaRef, delta);
  renderGrade();
}

function renderGrade() {
  const dias = CONFIG.dias.map((d) => addDays(state.semanaRef, d.id - 1));
  const inicio = dias[0];
  const fim = dias[dias.length - 1];
  el.weekLabel.textContent = `${inicio.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
  })} – ${fim.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}`;

  const isoDias = dias.map(toISODate);


  let html = `<div class="grid-row grid-row--head">
    <div class="grid-cell grid-cell--corner">Horário</div>
    ${CONFIG.dias
      .map(
        (d, i) => `<div class="grid-cell grid-cell--head">
          <span class="dia-sigla">${d.sigla}</span>
          <span class="dia-data">${dias[i].getDate().toString().padStart(2, "0")}/${(dias[i].getMonth() + 1).toString().padStart(2, "0")}</span>
        </div>`
      )
      .join("")}
  </div>`;

  CONFIG.periodos.forEach((periodo) => {
    html += `<div class="grid-row" data-turno="${periodo.turno}">
      <div class="grid-cell grid-cell--label">
        <span class="periodo-label">${periodo.label}</span>
        <span class="periodo-horario">${periodo.inicio}–${periodo.fim}</span>
      </div>
      ${CONFIG.dias
        .map((diaCfg, i) => {
          const isoDia = isoDias[i];

          const ocupado = state.agendamentos.find(
            (a) => a.data === isoDia && a.periodoId === periodo.id
          );
          if (ocupado) {
            return `<button type="button" class="jack jack--ocupado" data-turno="${periodo.turno}"
              data-id="${ocupado.id}" title="${ocupado.disciplina} · ${ocupado.professor}">
              <span class="jack-dot"></span>
              <span class="jack-info">
                <strong>${escapeHtml(ocupado.disciplina)}</strong>
                <small>${escapeHtml(ocupado.professor)}</small>
              </span>
            </button>`;
          }
          return `<button type="button" class="jack jack--livre" data-data="${isoDia}" data-periodo="${periodo.id}" title="Horário livre — clique para reservar">
              <span class="jack-dot"></span>
            </button>`;
        })
        .join("")}
    </div>`;
  });

  el.grid.innerHTML = html;

  el.grid.querySelectorAll(".jack--ocupado").forEach((btn) => {
    btn.addEventListener("click", () => iniciarEdicao(btn.dataset.id));
  });
  el.grid.querySelectorAll(".jack--livre").forEach((btn) => {
    btn.addEventListener("click", () => {
      el.data.value = btn.dataset.data;
      el.periodo.value = btn.dataset.periodo;
      el.form.scrollIntoView({ behavior: "smooth", block: "start" });
      el.professor.focus();
    });
  });
}

// ---------- Agenda (lista) ----------

function renderAgenda() {
  const hoje = toISODate(new Date());
  let itens = [...state.agendamentos]
    .filter((a) => a.data >= hoje)
    .sort((a, b) => (a.data + a.periodoId).localeCompare(b.data + b.periodoId));

  if (state.filtro) {
    itens = itens.filter((a) =>
      [a.professor, a.disciplina, a.turma].join(" ").toLowerCase().includes(state.filtro)
    );
  }

  el.contadorAgenda.textContent = itens.length;
  el.estadoVazio.hidden = itens.length !== 0;
  el.listaAgenda.innerHTML = itens
    .map((item) => {
      const periodo = CONFIG.periodos.find((p) => p.id === item.periodoId);
      return `<li class="agenda-card" data-turno="${periodo.turno}">
        <div class="agenda-card__data">
          <span class="agenda-card__dia">${formatarDataExtenso(item.data)}</span>
          <span class="agenda-card__horario">${periodo.label} · ${periodo.inicio}–${periodo.fim}</span>
        </div>
        <div class="agenda-card__corpo">
          <strong>${escapeHtml(item.disciplina)}</strong>
          <span>${escapeHtml(item.professor)}${item.turma ? " · " + escapeHtml(item.turma) : ""}</span>
          ${item.observacoes ? `<p class="agenda-card__obs">${escapeHtml(item.observacoes)}</p>` : ""}
        </div>
        <div class="agenda-card__acoes">
          <button type="button" class="btn-icon" data-acao="editar" data-id="${item.id}" aria-label="Editar">✎</button>
          <button type="button" class="btn-icon btn-icon--perigo" data-acao="excluir" data-id="${item.id}" aria-label="Cancelar">✕</button>
        </div>
      </li>`;
    })
    .join("");

  el.listaAgenda.querySelectorAll('[data-acao="editar"]').forEach((btn) =>
    btn.addEventListener("click", () => iniciarEdicao(btn.dataset.id))
  );
  el.listaAgenda.querySelectorAll('[data-acao="excluir"]').forEach((btn) =>
    btn.addEventListener("click", () => excluirAgendamento(btn.dataset.id))
  );
}

// ---------- Utilidades ----------

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str ?? "";
  return div.innerHTML;
}

let toastTimeout;
function mostrarToast(msg) {
  el.toast.textContent = msg;
  el.toast.classList.add("toast--visivel");
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => el.toast.classList.remove("toast--visivel"), 3000);
}

document.addEventListener("DOMContentLoaded", init);

// ---------- PWA: registro do service worker ----------
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("sw.js").catch((err) => {
      console.warn("Falha ao registrar service worker:", err);
    });
  });
}
