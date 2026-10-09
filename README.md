# reserva-lab-prudente
Reserva do Laboratório de Informática · Escola Prudente

PWA para reserva de horários do laboratório de informática. Qualquer professor(a) dos anos finais pode reservar qualquer dia útil, sem horário fixo: basta informar professor(a), disciplina, turma, data e horário.

Funcionalidades
Cadastro de reservas: professor(a), disciplina, turma (opcional), data, horário e observações.
Horários: 7h30min–8h25min, 8h25min–9h40min, 9h40min–10h35min e 10h35min–11h.
Dias livres de segunda a sexta, sem grade fixa.
Detecção de conflito: impede duas reservas no mesmo dia e horário.
Painel semanal de reservas com navegação entre semanas; clique em um horário livre para pré-preencher o formulário.
Lista de próximas reservas com busca, edição e cancelamento.
Modo claro/escuro (preferência salva no aparelho).
Instalável como app (PWA) e funciona offline.
Dados salvos no localStorage do navegador.
Estrutura de arquivos
reserva-lab-prudente/
├── index.html
├── manifest.json
├── sw.js
├── css/
│   └── style.css
├── js/
│   ├── config.js      # dias e horários (edite aqui)
│   ├── storage.js     # camada de dados (localStorage, pronta p/ Firebase)
│   └── app.js         # estado, renderização e interações
└── icons/
    ├── icon-192.png
    ├── icon-512.png
    ├── icon-maskable-512.png
    └── apple-touch-icon.png
Publicar no GitHub Pages e gerar o app
Crie um repositório e envie todo o conteúdo desta pasta (mantendo css/, js/ e icons/).
Em Settings → Pages, escolha a branch principal e a raiz (/).
Copie a URL gerada (https://<usuario>.github.io/<repositorio>/).
Cole essa URL em um gerador de PWA (ex.: PWABuilder.com) para criar o aplicativo.

Os ícones de 192 px e 512 px já estão em icons/ e referenciados no manifest.json.

Personalização

Para mudar horários ou dias, edite apenas js/config.js.
