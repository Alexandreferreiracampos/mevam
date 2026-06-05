// ============================================
// CONFIGURAÇÃO DE LOGIN SIMPLES (SEM FIREBASE AUTH)
// ============================================
const VALID_CREDENTIALS = {
  username: "mevam",
  password: "mevam123",
};

// ============================================
// ESTADO GLOBAL
// ============================================
// ============================================
// ESTADO GLOBAL (COM MEMÓRIA DE LOGIN)
// ============================================
const appState = {
  // Verifica se já existe um login salvo no celular
  isLoggedIn: localStorage.getItem("isLoggedIn") === "true",
  participants: [],
  currentEventId: "evento_padrao",
  editingParticipantId: null,
};

// ============================================
// ELEMENTOS DO DOM
// ============================================
const loginScreen = document.getElementById("login-screen");
const mainScreen = document.getElementById("main-screen");
const loginForm = document.getElementById("login-form");
const usernameInput = document.getElementById("username");
const passwordInput = document.getElementById("password");
const loginError = document.getElementById("login-error");
const logoutBtn = document.getElementById("logout-btn");
const confirmModal = document.getElementById("confirm-modal");
const confirmMessage = document.getElementById("confirm-message");
const confirmYesBtn = document.getElementById("confirm-yes-btn");
const confirmNoBtn = document.getElementById("confirm-no-btn");
const editPaid = document.getElementById("edit-paid");
const newPaid = document.getElementById("new-paid");
let currentQuickFilter = "all";
let participantIdToConfirm = null; // Para guardar quem estamos confirmando

// Modal de Carregamento
const loadingModal = document.getElementById("loading-modal");
const loadingText = document.getElementById("loading-text");

// Abas
const tabBtns = document.querySelectorAll(".tab-btn");
const tabContents = document.querySelectorAll(".tab-content");

// Check-in
const searchInput = document.getElementById("search-input");
const searchResults = document.getElementById("search-results");
const expectedCount = document.getElementById("expected-count");
const checkedInCount = document.getElementById("checked-in-count");
const missingCount = document.getElementById("missing-count");
const toggleAddBtn = document.getElementById("toggle-add-btn");
const addForm = document.getElementById("add-form");
const newName = document.getElementById("new-name");
const newObservation = document.getElementById("new-observation");
const saveNewBtn = document.getElementById("save-new-btn");
const cancelNewBtn = document.getElementById("cancel-new-btn");

// Modal de edição
const editModal = document.getElementById("edit-modal");
const editObservation = document.getElementById("edit-observation");
const saveObservationBtn = document.getElementById("save-observation-btn");
const closeModalBtn = document.getElementById("close-modal-btn");

// Gerenciamento
const csvFile = document.getElementById("csv-file");
const importBtn = document.getElementById("import-btn");
const managementList = document.getElementById("management-list");

// Relatório
const reportSummary = document.getElementById("report-summary");
const reportSearch = document.getElementById("report-search");
const reportFilter = document.getElementById("report-filter");
const exportPdfBtn = document.getElementById("export-pdf-btn");
const reportList = document.getElementById("report-list");

// ============================================
// INICIALIZAÇÃO
// ============================================
document.addEventListener("DOMContentLoaded", () => {
  setupEventListeners();
  loadParticipantsFromFirestore();
});

// ============================================
// CONFIGURAÇÃO DE EVENT LISTENERS
// ============================================
function setupEventListeners() {
  // Login
  loginForm.addEventListener("submit", handleLogin);
  logoutBtn.addEventListener("click", handleLogout);

  // Abas
  tabBtns.forEach((btn) => {
    btn.addEventListener("click", switchTab);
  });

  // Check-in
  searchInput.addEventListener("input", handleSearch);
  toggleAddBtn.addEventListener("click", toggleAddForm);
  saveNewBtn.addEventListener("click", handleAddNewParticipant);
  cancelNewBtn.addEventListener("click", toggleAddForm);

  // Modal
  saveObservationBtn.addEventListener("click", handleSaveObservation);
  closeModalBtn.addEventListener("click", closeEditModal);
  editModal.addEventListener("click", (e) => {
    if (e.target === editModal) closeEditModal();
  });

  // Gerenciamento
  importBtn.addEventListener("click", handleCsvImport);

  // Relatório
  reportSearch.addEventListener("input", filterReport);
  reportFilter.addEventListener("change", filterReport);
  exportPdfBtn.addEventListener("click", exportToPDF);
}

// ============================================
// AUTENTICAÇÃO (LOGIN SIMPLES)
// ============================================
function handleLogin(e) {
  e.preventDefault();
  const username = usernameInput.value;
  const password = passwordInput.value;

  if (
    username === VALID_CREDENTIALS.username &&
    password === VALID_CREDENTIALS.password
  ) {
    appState.isLoggedIn = true;
    localStorage.setItem("isLoggedIn", "true");
    loginError.textContent = "";
    loginScreen.classList.add("hidden");
    mainScreen.classList.remove("hidden");
    loadParticipantsFromFirestore(); // Adicionado para carregar os dados
    usernameInput.value = "";
    passwordInput.value = "";
  } else {
    loginError.textContent = "Usuário ou senha incorretos!";
  }
}

function handleLogout() {
  appState.isLoggedIn = false;
  localStorage.removeItem("isLoggedIn");
  loginScreen.classList.remove("hidden");
  mainScreen.classList.add("hidden");
  loginError.textContent = "";
  usernameInput.value = "";
  passwordInput.value = "";
}

// ============================================
// NAVEGAÇÃO DE ABAS
// ============================================
function switchTab(e) {
  const tabName = e.target.dataset.tab;

  // Remover classe active de todos os botões
  tabBtns.forEach((btn) => btn.classList.remove("active"));
  tabContents.forEach((content) => content.classList.remove("active"));

  // Adicionar classe active ao botão clicado
  e.target.classList.add("active");

  // Mostrar conteúdo da aba
  document.getElementById(`${tabName}-tab`).classList.add("active");

  // Atualizar dados se necessário
  if (tabName === "report") {
    displayReport();
  } else if (tabName === "management") {
    displayManagementList();
  }
}

// ============================================
// CARREGAMENTO DE DADOS DO FIRESTORE
// ============================================
function loadParticipantsFromFirestore() {
  db.collection("participantes")
    .where("idEvento", "==", appState.currentEventId)
    .onSnapshot(
      (snapshot) => {
        appState.participants = [];
        snapshot.forEach((doc) => {
          appState.participants.push({
            id: doc.id,
            ...doc.data(),
          });
        });
        updateCounters();
        displayManagementList();
      },
      (error) => {
        console.error("Erro ao carregar participantes:", error);
      },
    );
}

// ============================================
// CHECK-IN
// ============================================
function handleSearch() {
  const searchTerm = searchInput.value.toLowerCase().trim();

  searchResults.innerHTML = "";

  if (!searchTerm) {
    searchResults.innerHTML =
      "<p style='padding: 20px; text-align: center; color: #999;'>Digite um nome ou ID para buscar</p>";

    return;
  }

  const results = appState.participants
    .filter(
      (p) =>
        p.nome.toLowerCase().includes(searchTerm) ||
        (p.idUnico && p.idUnico.toLowerCase().includes(searchTerm)),
    )

    .sort((a, b) => {
      // Confirmados primeiro
      if (a.Confirmado && !b.Confirmado) {
        return 1;
      }

      if (!a.Confirmado && b.Confirmado) {
        return -1;
      }

      // Ordem alfabética
      return a.nome.localeCompare(b.nome, "pt-BR", {
        sensitivity: "base",
      });
    });

  if (results.length === 0) {
    searchResults.innerHTML =
      "<p style='padding: 20px; text-align: center; color: #999;'>Nenhum participante encontrado</p>";

    return;
  }

  results.forEach((participant) => {
    searchResults.appendChild(createParticipantElement(participant, true));
  });
}

async function handleCheckin(participantId) {
  try {
    showLoading("Registrando entrada...");
    await db.collection("participantes").doc(participantId).update({
      Confirmado: true,
      horaEntrada: new Date(),
    });
    hideLoading();
    // --- ADICIONE ESTA LINHA ABAIXO ---
    searchInput.value = ""; // Limpa o campo de busca
    verUltimoParticipante();
  } catch (error) {
    hideLoading();
    console.error("Erro ao fazer check-in:", error);
    alert("Erro ao fazer check-in!");
  }
}

function toggleAddForm() {
  searchInput.value = ""; // Limpa a busca ao abrir o formulário
  searchResults.innerHTML = "";

  addForm.classList.toggle("hidden");
  if (!addForm.classList.contains("hidden")) {
    newName.focus();
  }
}

async function handleAddNewParticipant() {
  const name = newName.value.trim();

  const observation = newObservation.value.trim();

  const pago = newPaid.checked;

  if (!name || !observation) {
    alert("Nome e observação são obrigatórios!");
    return;
  }

  try {
    showLoading("Adicionando participante...");
    await db.collection("participantes").add({
      nome: name,
      idUnico: generateId(),
      origem: "adicionado_na_hora",
      Confirmado: true,
      horaEntrada: new Date(),
      observacao: observation,
      pago: pago,
      idEvento: appState.currentEventId,
      criadoEm: new Date(),
    });

    hideLoading();
    newName.value = "";
    newObservation.value = "";
    toggleAddForm();
  } catch (error) {
    hideLoading();
    console.error("Erro ao adicionar participante:", error);
    alert("Erro ao adicionar participante!");
  }
}

// ============================================
// EDIÇÃO DE OBSERVAÇÕES
// ============================================
function openEditModal(participantId) {
  const participant = appState.participants.find((p) => p.id === participantId);
  if (!participant) return;

  appState.editingParticipantId = participantId;
  editObservation.value = participant.observacao || "";
  editModal.classList.remove("hidden");
  editPaid.checked = participant.pago || false;

  //abrri o teclado automaticamente no celular
  //editObservation.focus();
}

function closeEditModal() {
  editModal.classList.add("hidden");
  appState.editingParticipantId = null;
  editObservation.value = "";
}

async function handleSaveObservation() {
  const observation = editObservation.value.trim();
  const pago = editPaid.checked;
  const participantId = appState.editingParticipantId;

  if (!participantId) return;

  try {
    showLoading("Salvando observação...");
    await db.collection("participantes").doc(participantId).update({
      observacao: observation,
      pago: pago,
    });

    hideLoading();
    closeEditModal();

    quickCheckinFilter(currentQuickFilter);

    // ATUALIZAÇÃO INTELIGENTE:
    // Se estiver na busca do Check-in, atualiza a busca
    if (searchInput.value.trim() !== "") {
      handleSearch();
    }
    // Se a aba de Relatório estiver aberta, atualiza o relatório
    if (document.getElementById("report-tab").classList.contains("active")) {
      displayReport();
    }
    // Se a aba de Gerenciamento estiver aberta, atualiza a lista
    if (
      document.getElementById("management-tab").classList.contains("active")
    ) {
      displayManagementList();
    }
  } catch (error) {
    hideLoading();
    console.error("Erro ao salvar observação:", error);
    alert("Erro ao salvar observação!");
  }
}

// ============================================
// GERENCIAMENTO - IMPORTAÇÃO CSV
// ============================================
async function handleCsvImport() {
  const file = csvFile.files[0];

  if (!file) {
    alert("Selecione um arquivo CSV!");
    return;
  }

  showLoading("Importando arquivo...");

  const reader = new FileReader();

  reader.onload = async (e) => {
    try {
      const csv = e.target.result;

      // Divide linhas
      const lines = csv.split("\n");

      let addedCount = 0;

      // Remove cabeçalho
      lines.shift();

      for (let line of lines) {
        line = line.trim();

        if (!line) continue;

        // Regex para CSV com aspas
        const cols = line.match(/(".*?"|[^",]+)(?=\s*,|\s*$)/g);

        if (!cols || cols.length < 2) continue;

        // Limpa aspas
        const clean = cols.map((c) => c.replace(/^"|"$/g, "").trim());

        // ============================================
        // COLUNAS DA PLANILHA
        // ============================================

        const [
          dataHora,
          nome,
          telefone,
          cidade,
          ministerio,
          pastor,
          cargo,
          dormeEscola,
        ] = clean;

        // Ignora sem nome
        if (!nome) continue;

        // ============================================
        // SALVA FIRESTORE
        // ============================================

        await db.collection("participantes").add({
          nome: nome,

          telefone: telefone || "",

          cidade: cidade || "",

          ministerio: ministerio || "",

          pastor: pastor || "",

          cargo: cargo || "",

          dormeEscola: dormeEscola || "",

          idUnico: generateId(),

          origem: "lista_paga",

          Confirmado: false,

          pago: true,

          horaEntrada: null,

          observacao: "",

          idEvento: appState.currentEventId,

          criadoEm: dataHora ? new Date(dataHora) : new Date(),
        });

        addedCount++;
      }

      hideLoading();

      alert(`${addedCount} participante(s) importado(s)!`);

      csvFile.value = "";
    } catch (error) {
      hideLoading();

      console.error("Erro ao importar CSV:", error);

      alert("Erro ao importar CSV!");
    }
  };

  // IMPORTANTE:
  // Corrige acentos UTF-8
  reader.readAsText(file, "UTF-8");
}

function displayManagementList() {
  managementList.innerHTML = "";

  if (appState.participants.length === 0) {
    managementList.innerHTML =
      "<p style='padding: 20px; text-align: center; color: #999;'>Nenhum participante cadastrado</p>";
    return;
  }

  appState.participants.forEach((participant) => {
    managementList.appendChild(createParticipantElement(participant, false));
  });
}

// ============================================
// RELATÓRIO
// ============================================
function displayReport() {
  const totalExpected = appState.participants.filter(
    (p) => p.origem === "lista_paga",
  ).length;
  const totalCheckedIn = appState.participants.filter(
    (p) => p.Confirmado,
  ).length;
  const totalWithObservation = appState.participants.filter(
    (p) => !p.pago,
  ).length;

  const totalDormeEscola = appState.participants.filter(
    (p) => p.dormeEscola && p.dormeEscola.toLowerCase().includes("sim"),
  ).length;

  reportSummary.innerHTML = `
  
        <p><strong>Total de Check-in:</strong> ${totalCheckedIn}</p>
        <p><strong>Aguardando Pagamento:</strong> ${totalWithObservation}</p>
        <p><strong>Vão dormir na escola:</strong> ${totalDormeEscola}</p>
    `;

  filterReport();
}

function filterReport() {
  const searchTerm = reportSearch.value.toLowerCase().trim();
  const statusFilter = reportFilter.value;

  let filtered = appState.participants;

  if (searchTerm) {
    filtered = filtered.filter(
      (p) =>
        p.nome.toLowerCase().includes(searchTerm) ||
        (p.idUnico && p.idUnico.toLowerCase().includes(searchTerm)),
    );
  }

  if (statusFilter === "Confirmado") {
    filtered = filtered.filter((p) => p.Confirmado);
  } else if (statusFilter === "nao-Confirmado") {
    filtered = filtered.filter((p) => !p.Confirmado);
  } else if (statusFilter === "com-observacao") {
    filtered = filtered.filter((p) => !p.pago);
  } else if (statusFilter === "dorme-escola") {
    filtered = filtered.filter((p) => {
      if (!p.dormeEscola) return false;

      return p.dormeEscola.toLowerCase().includes("sim");
    });
  }

  reportList.innerHTML = "";

  if (filtered.length === 0) {
    reportList.innerHTML =
      "<p style='padding: 20px; text-align: center; color: #999;'>Nenhum resultado encontrado</p>";
    return;
  }

  filtered.forEach((participant) => {
    reportList.appendChild(createParticipantElement(participant, false));
  });
}

function exportToCSV() {
  let csv = "Nome,ID,Origem,Confirmado,Hora Entrada,Observação\n";

  appState.participants.forEach((p) => {
    const horaEntrada = p.horaEntrada
      ? new Date(p.horaEntrada.toDate()).toLocaleString("pt-BR")
      : "";
    csv += `"${p.nome}","${p.idUnico}","${p.origem}","${p.Confirmado ? "Sim" : "Não"}","${horaEntrada}","${p.observacao}"\n`;
  });

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);

  link.setAttribute("href", url);
  link.setAttribute(
    "download",
    `relatorio_${new Date().toISOString().split("T")[0]}.csv`,
  );
  link.style.visibility = "hidden";

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

async function exportToPDF() {
  const searchTerm = reportSearch.value.toLowerCase().trim();
  const statusFilter = reportFilter.value;

  let filtered = appState.participants;

  console.log("Exportando PDF com os seguintes filtros:");

  if (searchTerm) {
    filtered = filtered.filter(
      (p) =>
        p.nome.toLowerCase().includes(searchTerm) ||
        (p.idUnico && p.idUnico.toLowerCase().includes(searchTerm)),
    );
  }

  if (statusFilter === "Confirmado") {
    filtered = filtered.filter((p) => p.Confirmado);
  } else if (statusFilter === "nao-Confirmado") {
    filtered = filtered.filter((p) => !p.Confirmado);
  } else if (statusFilter === "com-observacao") {
    filtered = filtered.filter((p) => !p.pago);
  } else if (statusFilter === "dorme-escola") {
    filtered = filtered.filter((p) => {
      if (!p.dormeEscola) return false;

      return p.dormeEscola.toLowerCase().includes("sim");
    });
  }

  filtered.sort((a, b) => {
    // Primeiro: Confirmados no topo
    if (a.Confirmado && !b.Confirmado) return -1;
    if (!a.Confirmado && b.Confirmado) return 1;

    // Depois: ordem alfabética
    return a.nome.localeCompare(b.nome, "pt-BR", {
      sensitivity: "base",
    });
  });

  const { jsPDF } = window.jspdf;

  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  // Título
  doc.setFontSize(18);

  doc.text("Relatório - CONFERÊNCIA HOMENS DE SACERDÓCIO", 105, 15, {
    align: "center",
  });

  // Informações
  doc.setFontSize(11);

  doc.text(`Data: ${new Date().toLocaleDateString("pt-BR")}`, 14, 30);

  doc.text(`Total Exibido: ${filtered.length}`, 14, 37);

  doc.text(
    `Confirmado: ${filtered.filter((p) => p.Confirmado).length}`,
    14,
    44,
  );

  doc.text(
    `Não Confirmado: ${filtered.filter((p) => !p.Confirmado).length}`,
    14,
    51,
  );

  // Dados da tabela
  const tableData = filtered.map((p) => [
    p.nome || "-",

    p.Confirmado ? "Confirmado" : "Não Confirmado",

    p.horaEntrada?.toDate
      ? new Date(p.horaEntrada.toDate()).toLocaleString("pt-BR")
      : "-",

    p.observacao || "-",
  ]);

  doc.autoTable({
    startY: 60,

    head: [["Nome", "Status", "Data de Entrada", "Observação"]],

    body: tableData,

    theme: "grid",

    styles: {
      fontSize: 9,
      cellPadding: 3,
      overflow: "linebreak",
      valign: "middle",
    },

    headStyles: {
      fillColor: [102, 126, 234],
      textColor: 255,
      fontStyle: "bold",
    },

    columnStyles: {
      0: { cellWidth: 45 },
      1: { cellWidth: 45 },
      2: { cellWidth: 30 },
      3: { cellWidth: 60 },
    },

    margin: {
      top: 20,
      left: 10,
      right: 10,
      bottom: 15,
    },

    pageBreak: "auto",

    rowPageBreak: "avoid",
  });

  doc.save(`relatorio_${new Date().toISOString().split("T")[0]}.pdf`);
}

// ============================================
// FUNÇÕES DE LOADING
// ============================================
function showLoading(message = "Processando...") {
  loadingText.textContent = message;
  loadingModal.classList.remove("hidden");
}

function hideLoading() {
  loadingModal.classList.add("hidden");
}

// ============================================
// UTILITÁRIOS
// ============================================
function createParticipantElement(participant, isClickable = false) {
  const div = document.createElement("div");
  div.className = "participant-item";

  if (participant.Confirmado) {
    div.classList.add("checked-in");
  } else if (participant.origem === "adicionado_na_hora") {
    div.classList.add("exception");
  }

  const info = document.createElement("div");
  info.className = "participant-info";

  const name = document.createElement("div");
  name.className = "participant-name";
  name.textContent = participant.nome;

  name.style.cursor = "pointer";

  name.addEventListener("click", async () => {
    const confirmar = confirm(
      `Deseja excluir o participante "${participant.nome}"?`,
    );

    if (!confirmar) return;

    const senha = prompt("Digite a senha para excluir:");

    if (senha !== "1234") {
      alert("Senha incorreta!");
      return;
    }

    try {
      showLoading("Excluindo participante...");

      await db.collection("participantes").doc(participant.id).delete();

      hideLoading();

      alert("Participante excluído com sucesso!");
    } catch (error) {
      hideLoading();
      console.error("Erro ao excluir participante:", error);
      alert("Erro ao excluir participante!");
    }
  });

  const details = document.createElement("div");
  details.className = "participant-details";
  details.textContent = `${participant.Confirmado ? "✓ Check-in" : "✗ Não Confirmado"}`;

  if (participant.horaEntrada) {
    const hora = new Date(participant.horaEntrada.toDate()).toLocaleTimeString(
      "pt-BR",
    );
    details.textContent += ` às ${hora}`;
  }

  info.appendChild(name);
  info.appendChild(details);

  if (participant.observacao) {
    const obs = document.createElement("div");
    obs.className = "participant-observation";
    obs.textContent = `📝 ${participant.observacao}`;
    info.appendChild(obs);
  }

  // MOSTRA STATUS DE PAGAMENTO
  if (participant.pago) {
    const paid = document.createElement("div");

    paid.className = "participant-paid";

    paid.textContent = "💰 Pago";

    info.appendChild(paid);
  }

  div.appendChild(info);

  const actions = document.createElement("div");
  actions.className = "participant-actions";

  if (isClickable && !participant.Confirmado) {
    const checkinBtn = document.createElement("button");
    checkinBtn.className = "btn-success";
    checkinBtn.textContent = "Check-in";

    checkinBtn.addEventListener("click", () => {
      // Em vez de confirm(), abre o modal personalizado
      participantIdToConfirm = participant.id;
      confirmMessage.innerHTML = `Deseja confirmar a entrada de:  
<strong>${participant.nome}</strong>?`;
      confirmModal.classList.remove("hidden");
    });

    actions.appendChild(checkinBtn);
  }

  // Botão de editar observação
  const editBtn = document.createElement("button");
  editBtn.className = "btn-edit";
  editBtn.textContent = "✎ Obs";
  editBtn.addEventListener("click", () => openEditModal(participant.id));
  actions.appendChild(editBtn);

  if (participant.Confirmado) {
    const undoBtn = document.createElement("button");

    undoBtn.className = "btn-warning";

    undoBtn.textContent = "↩ Remover";

    undoBtn.addEventListener("click", async () => {
      const confirmar = confirm(`Remover check-in de ${participant.nome}?`);

      if (!confirmar) return;

      try {
        showLoading("Removendo check-in...");

        await db.collection("participantes").doc(participant.id).update({
          Confirmado: false,

          horaEntrada: null,
        });

        hideLoading();

        // Atualiza busca/lista atual
        handleSearch();

        // Atualiza filtros rápidos
        if (typeof currentQuickFilter !== "undefined") {
          quickCheckinFilter(currentQuickFilter);
        }
      } catch (error) {
        hideLoading();

        console.error("Erro ao remover check-in:", error);

        alert("Erro ao remover check-in!");
      }
    });

    actions.appendChild(undoBtn);
  }

  if (actions.children.length > 0) {
    div.appendChild(actions);
  }

  return div;
}

function updateCounters() {
  console.log(appState.participants);
  const totalExpected = appState.participants.filter(
    (p) => p.origem === "lista_paga",
  ).length;
  const totalCheckedIn = appState.participants.filter(
    (p) => p.Confirmado,
  ).length;
  const totalMissing = appState.participants.filter(
    (p) => !p.Confirmado,
  ).length;

  expectedCount.textContent = appState.participants.length;
  checkedInCount.textContent = totalCheckedIn;
  missingCount.textContent = totalMissing;
}

function generateId() {
  return (
    "ID" + Date.now() + Math.random().toString(36).substr(2, 5).toUpperCase()
  );
}

function verUltimoParticipante() {
  // Limpa lista
  searchResults.innerHTML = "";

  // Apenas confirmados
  let filtered = appState.participants.filter((p) => p.Confirmado);

  // ORDENA DO MAIS NOVO PARA O MAIS ANTIGO
  filtered.sort((a, b) => {
    const dataA = a.horaEntrada?.toDate ? a.horaEntrada.toDate() : new Date(0);

    const dataB = b.horaEntrada?.toDate ? b.horaEntrada.toDate() : new Date(0);

    return dataB - dataA;
  });

  console.log("Confirmados ordenados:", filtered);

  if (filtered.length === 0) {
    searchResults.innerHTML =
      "<p style='padding: 20px; text-align: center; color: #999;'>Nenhum participante encontrado</p>";

    return;
  }

  // Renderiza
  filtered.forEach((participant) => {
    searchResults.appendChild(createParticipantElement(participant, true));
  });
}

// ============================================
// FILTROS RÁPIDOS NA TELA DE CHECK-IN
// ============================================
function quickCheckinFilter(type) {
  // GUARDA O FILTRO ATUAL
  currentQuickFilter = type;

  // Limpa a lista atual
  searchResults.innerHTML = "";

  let filtered = [];

  if (type === "all") {
    filtered = appState.participants;
  } else if (type === "checked") {
    filtered = appState.participants.filter((p) => p.Confirmado);
  } else if (type === "missing") {
    filtered = appState.participants.filter((p) => !p.Confirmado);
  }

  // Ordenação
  filtered.sort((a, b) => {
    // Confirmados primeiro
    if (a.Confirmado && !b.Confirmado) {
      return 1;
    }

    if (!a.Confirmado && b.Confirmado) {
      return -1;
    }

    // Ordem alfabética
    return a.nome.localeCompare(b.nome, "pt-BR", {
      sensitivity: "base",
    });
  });

  if (filtered.length === 0) {
    searchResults.innerHTML =
      "<p style='padding: 20px; text-align: center; color: #999;'>Nenhum participante encontrado</p>";

    return;
  }

  // Renderiza os participantes
  filtered.forEach((participant) => {
    searchResults.appendChild(createParticipantElement(participant, true));
  });
}
// Atribui os cliques aos cards
document.getElementById("counter-all").onclick = () =>
  quickCheckinFilter("all");
document.getElementById("counter-checked").onclick = () =>
  quickCheckinFilter("checked");
document.getElementById("counter-missing").onclick = () =>
  quickCheckinFilter("missing");

// Lógica do Menu Sanduíche
const menuToggle = document.getElementById("menu-toggle");
const navTabs = document.getElementById("nav-tabs");

const overlay = document.querySelector(".menu-overlay");

menuToggle.addEventListener("click", () => {
  navTabs.classList.toggle("show");

  overlay.style.display = navTabs.classList.contains("show")
    ? "inline"
    : "none";
});
// Fecha o menu automaticamente ao clicar em uma aba
document.querySelectorAll(".tab-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    navTabs.classList.remove("show");
    overlay.style.display = "none";
  });
});

// ============================================
// PERSISTÊNCIA DE LOGIN (CORRIGIDO)
// ============================================

// Função para mostrar a tela principal
function goToMainScreen() {
  loginScreen.classList.add("hidden");
  mainScreen.classList.remove("hidden");
  loadParticipantsFromFirestore(); // Nome corrigido aqui!
}

// Função para mostrar a tela de login
function goToLoginScreen() {
  loginScreen.classList.remove("hidden");
  mainScreen.classList.add("hidden");
}

// Verificação ao carregar a página
window.addEventListener("load", () => {
  const savedLogin = localStorage.getItem("isLoggedIn");
  if (savedLogin === "true") {
    appState.isLoggedIn = true;
    goToMainScreen();
  } else {
    goToLoginScreen();
  }
});

// Lógica do Modal de Confirmação
confirmYesBtn.onclick = () => {
  if (participantIdToConfirm) {
    handleCheckin(participantIdToConfirm);
    confirmModal.classList.add("hidden");
    participantIdToConfirm = null;
  }
};

confirmNoBtn.onclick = () => {
  confirmModal.classList.add("hidden");
  participantIdToConfirm = null;
};

// Fechar ao clicar fora do modal
confirmModal.onclick = (e) => {
  if (e.target === confirmModal) {
    confirmModal.classList.add("hidden");
    participantIdToConfirm = null;
  }
};
