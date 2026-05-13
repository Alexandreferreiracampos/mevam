// ============================================
// CONFIGURAÇÃO DE LOGIN SIMPLES (SEM FIREBASE AUTH)
// ============================================
const VALID_CREDENTIALS = {
  username: "admin",
  password: "1234",
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
const exportCsvBtn = document.getElementById("export-csv-btn");
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
  exportCsvBtn.addEventListener("click", exportToCSV);
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

  const results = appState.participants.filter(
    (p) =>
      p.nome.toLowerCase().includes(searchTerm) ||
      (p.idUnico && p.idUnico.toLowerCase().includes(searchTerm)),
  );

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
    // ----------------------------------

    handleSearch(); // Atualizar resultados
  } catch (error) {
    hideLoading();
    console.error("Erro ao fazer check-in:", error);
    alert("Erro ao fazer check-in!");
  }
}

function toggleAddForm() {
  addForm.classList.toggle("hidden");
  if (!addForm.classList.contains("hidden")) {
    newName.focus();
  }
}

async function handleAddNewParticipant() {
  const name = newName.value.trim();
  const observation = newObservation.value.trim();

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
      idEvento: appState.currentEventId,
      criadoEm: new Date(),
    });

    hideLoading();
    newName.value = "";
    newObservation.value = "";
    toggleAddForm();
    alert("Participante adicionado com sucesso!");
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
  editObservation.focus();
}

function closeEditModal() {
  editModal.classList.add("hidden");
  appState.editingParticipantId = null;
  editObservation.value = "";
}

async function handleSaveObservation() {
  const observation = editObservation.value.trim();
  const participantId = appState.editingParticipantId;

  if (!participantId) return;

  try {
    showLoading("Salvando observação...");
    await db.collection("participantes").doc(participantId).update({
      observacao: observation,
    });

    hideLoading();
    closeEditModal();
    alert("Observação salva com sucesso!");

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
      const lines = csv.split("\n");
      let addedCount = 0;

      for (let line of lines) {
        line = line.trim();
        if (!line) continue;

        const [nome, idUnico] = line.split(",").map((s) => s.trim());
        if (!nome) continue;

        await db.collection("participantes").add({
          nome: nome,
          idUnico: idUnico || generateId(),
          origem: "lista_paga",
          Confirmado: false,
          horaEntrada: null,
          observacao: "",
          idEvento: appState.currentEventId,
          criadoEm: new Date(),
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
  reader.readAsText(file);
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
    (p) => p.observacao,
  ).length;

  reportSummary.innerHTML = `
        <p><strong>Total na lista pré-paga:</strong> ${totalExpected}</p>
        <p><strong>Total que Confirmado:</strong> ${totalCheckedIn}</p>
        <p><strong>Total com observações:</strong> ${totalWithObservation}</p>
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
    filtered = filtered.filter(
      (p) => p.observacao && p.observacao.trim() !== "",
    );
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
    filtered = filtered.filter(
      (p) => p.observacao && p.observacao.trim() !== "",
    );
  }

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

  const details = document.createElement("div");
  details.className = "participant-details";
  details.textContent = `ID: ${participant.idUnico} | ${participant.Confirmado ? "✓ Confirmado" : "✗ Não Confirmado"}`;

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

  div.appendChild(info);

  const actions = document.createElement("div");
  actions.className = "participant-actions";

  if (isClickable && !participant.entrou) {
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

  if (actions.children.length > 0) {
    div.appendChild(actions);
  }

  return div;
}

function updateCounters() {
  const totalExpected = appState.participants.filter(
    (p) => p.origem === "lista_paga",
  ).length;
  const totalCheckedIn = appState.participants.filter(
    (p) => p.Confirmado,
  ).length;
  const totalMissing =
    totalExpected -
    appState.participants.filter(
      (p) => p.origem === "lista_paga" && p.Confirmado,
    ).length;

  expectedCount.textContent = totalExpected;
  checkedInCount.textContent = totalCheckedIn;
  missingCount.textContent = totalMissing;
}

function generateId() {
  return (
    "ID" + Date.now() + Math.random().toString(36).substr(2, 5).toUpperCase()
  );
}

// ============================================
// FILTROS RÁPIDOS NA TELA DE CHECK-IN
// ============================================
function quickCheckinFilter(type) {
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

  if (filtered.length === 0) {
    searchResults.innerHTML =
      "<p style='padding: 20px; text-align: center; color: #999;'>Nenhum participante encontrado</p>";
    return;
  }

  // Usa a função de criar elementos que já existe no seu código
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

menuToggle.addEventListener("click", () => {
  navTabs.classList.toggle("show");
});

// Fecha o menu automaticamente ao clicar em uma aba
document.querySelectorAll(".tab-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    navTabs.classList.remove("show");
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
