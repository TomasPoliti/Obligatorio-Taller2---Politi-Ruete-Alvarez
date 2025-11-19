const STATUS = {
  0: "ACTIVA",
  1: "ACEPTADA",
  2: "RECHAZADA",
};

function formatStatusBadge(status, isTreasury) {
  let cls;
  if (status === 0) cls = "badge-status-active";
  else if (status === 1) cls = "badge-status-accepted";
  else cls = "badge-status-rejected";

  const label = STATUS[status] ?? "DESCONOCIDO";
  const extra = isTreasury ? "badge-status-treasury ms-1" : "badge-status-normal ms-1";

  return `
    <span class="badge ${cls}">${label}</span>
    ${isTreasury ? '<span class="badge ' + extra + '">Treasury</span>' : ""}
  `;
}

function formatTimestamp(ts) {
  if (!ts) return "-";
  const d = new Date(ts * 1000);
  return d.toLocaleString();
}

function formatEtherOrToken(value) {
  if (!value) return "-";
  try {
    const big = BigInt(value);
    const ether = Number(big) / 1e18;
    return ether.toLocaleString("es-UY", {
      minimumFractionDigits: 4,
      maximumFractionDigits: 4,
    });
  } catch {
    return value;
  }
}

function setActiveView(viewId) {
  document.querySelectorAll(".view-section").forEach((el) => {
    el.classList.toggle("d-none", el.id !== `view-${viewId}`);
  });

  document.querySelectorAll('a[data-view]').forEach((link) => {
    link.classList.toggle("active", link.dataset.view === viewId);
  });
}

function showAlert(message, type = "info", timeout = 4000) {
  const container = document.getElementById("alerts-container");
  const wrapper = document.createElement("div");
  wrapper.className = `alert alert-${type} alert-dismissible fade show`;
  wrapper.role = "alert";
  wrapper.innerHTML = `
    ${message}
    <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
  `;
  container.appendChild(wrapper);
  if (timeout) {
    setTimeout(() => {
      wrapper.classList.remove("show");
      setTimeout(() => wrapper.remove(), 200);
    }, timeout);
  }
}

async function fetchJSON(path) {
  const res = await fetch(path);
  if (!res.ok) throw new Error(`Error HTTP ${res.status}`);
  return res.json();
}

async function loadParameters() {
  try {
    const params = await fetchJSON("/dao/parameters");

    const daoStatusPill = document.getElementById("dao-status-pill");
    const panic = params.panicWallet && params.panicWallet !== "0x0000000000000000000000000000000000000000";
    daoStatusPill.textContent = params.paused ? "DAO en PÁNICO" : "DAO operativa";
    daoStatusPill.className =
      "badge rounded-pill small-text " +
      (params.paused ? "text-bg-danger" : "text-bg-success");

    const summary = document.getElementById("dao-summary");
    summary.innerHTML = `
      <li>Wallet de pánico: <span class="text-accent">${panic ? params.panicWallet : "no configurada"}</span></li>
      <li>Estado: <span class="text-accent">${params.paused ? "Pausada" : "Activa"}</span></li>
    `;

    document.getElementById("token-price").textContent =
      formatEtherOrToken(params.tokenPriceWei) + " ETH / token";
    document.getElementById("tokens-per-vote").textContent = formatEtherOrToken(params.tokensPerVotePower);
    document.getElementById("stake-min-vote").textContent = formatEtherOrToken(params.minStakeForVoting) + " tokens";
    document.getElementById("stake-min-propose").textContent =
      formatEtherOrToken(params.minStakeForProposing) + " tokens";

    const lockMinutes = Math.round(params.minStakeLockTime / 60);
    const propHours = Math.round(params.proposalDuration / 3600);
    document.getElementById("lock-minutes").textContent = lockMinutes;
    document.getElementById("prop-hours").textContent = propHours;
  } catch (err) {
    console.error(err);
    showAlert("No se pudieron cargar los parámetros de la DAO", "danger");
  }
}

async function loadProposals() {
  try {
    const data = await fetchJSON("/dao/proposals");
    const tbody = document.getElementById("dashboard-proposals-body");
    const list = document.getElementById("proposals-list");

    document.getElementById("proposals-count-pill").textContent = `${data.count} propuestas`;

    if (!data.proposals.length) {
      tbody.innerHTML = `
        <tr><td colspan="6" class="text-center text-muted py-3">
          No hay propuestas aún.
        </td></tr>
      `;
      list.innerHTML = `
        <div class="col-12 text-center text-muted">
          No hay propuestas aún.
        </div>
      `;
      return;
    }

    tbody.innerHTML = "";
    data.proposals
      .slice()
      .reverse()
      .forEach((p) => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
          <td>${p.id}</td>
          <td>${p.title || "-"}</td>
          <td class="text-truncate" style="max-width: 140px;">
            <span class="small">${p.proposer}</span>
          </td>
          <td>
            <span class="badge rounded-pill ${
              p.isTreasury ? "badge-status-treasury" : "badge-status-normal"
            }">${p.isTreasury ? "Treasury" : "Normal"}</span>
          </td>
          <td>${formatStatusBadge(p.status, p.isTreasury)}</td>
          <td class="small">${formatTimestamp(p.endTime)}</td>
        `;
        tr.addEventListener("click", () => openProposalDetail(p.id));
        tbody.appendChild(tr);
      });

    list.innerHTML = "";
    data.proposals
      .slice()
      .reverse()
      .forEach((p) => {
        const col = document.createElement("div");
        col.className = "col-md-6 col-lg-4";
        col.innerHTML = `
          <div class="card bg-card proposal-card h-100" data-status="${p.status}" data-treasury="${p.isTreasury}">
            <div class="card-body">
              <div class="d-flex justify-content-between align-items-start mb-2">
                <span class="badge bg-secondary small-text">#${p.id}</span>
                <div>${formatStatusBadge(p.status, p.isTreasury)}</div>
              </div>
              <h6 class="card-title mb-1">${p.title || "(sin título)"}</h6>
              <p class="card-text small text-muted mb-2 text-truncate">
                Proponente: ${p.proposer}
              </p>
              <p class="card-text small mb-0">
                Termina: <span class="text-accent">${formatTimestamp(p.endTime)}</span>
              </p>
            </div>
          </div>
        `;
        col.querySelector(".proposal-card").addEventListener("click", () => openProposalDetail(p.id));
        list.appendChild(col);
      });
  } catch (err) {
    console.error(err);
    showAlert("No se pudieron cargar las propuestas", "danger");
  }
}

async function openProposalDetail(id) {
  try {
    const data = await fetchJSON(`/dao/proposals/${id}`);

    document.getElementById("proposal-detail-title").textContent = `Propuesta #${data.id}`;

    const content = document.getElementById("proposal-detail-content");
    content.innerHTML = `
      <p class="text-accent fw-semibold mb-1">${data.title || "(sin título)"}</p>
      <p class="small text-muted mb-2">${data.description || "(sin descripción)"}</p>
      <hr />
      <p class="small mb-1">
        Proponente:<br />
        <span class="text-accent">${data.proposer}</span>
      </p>
      <p class="small mb-1">
        Tipo:
        <span class="badge rounded-pill ${
          data.isTreasury ? "badge-status-treasury" : "badge-status-normal"
        }">${data.isTreasury ? "Treasury" : "Normal"}</span>
      </p>
      <p class="small mb-1">
        Estado: ${formatStatusBadge(data.status, data.isTreasury)}
      </p>
      <p class="small mb-1">
        Inicio: <span class="text-accent">${formatTimestamp(data.startTime)}</span><br/>
        Fin: <span class="text-accent">${formatTimestamp(data.endTime)}</span>
      </p>
      <p class="small mb-1">
        Votos a favor: <span class="text-accent">${data.forVotes}</span><br/>
        Votos en contra: <span class="text-accent">${data.againstVotes}</span>
      </p>
      ${
        data.isTreasury
          ? `
        <hr />
        <p class="small mb-1">
          Destinatario treasury:<br/>
          <span class="text-accent">${data.treasuryRecipient}</span>
        </p>
        <p class="small mb-1">
          Monto (ETH equivalente): <span class="text-accent">${formatEtherOrToken(
            data.treasuryAmount
          )}</span>
        </p>
      `
          : ""
      }
      <hr />
      <p class="small text-muted">
        Las acciones de votar, crear propuestas y ejecutar propuestas de treasury se realizan directamente desde la dApp usando tu wallet.
      </p>
    `;

    const offcanvasEl = document.getElementById("proposal-detail");
    const offcanvas = new bootstrap.Offcanvas(offcanvasEl);
    offcanvas.show();
  } catch (err) {
    console.error(err);
    showAlert("No se pudo cargar el detalle de la propuesta", "danger");
  }
}

async function loadAccount(address) {
  if (!address) return;
  try {
    const data = await fetchJSON(`/dao/user/${address}`);

    document.getElementById("account-address").textContent = data.address;
    document.getElementById("account-balance").textContent =
      formatEtherOrToken(data.tokenBalance) + " tokens";
    document.getElementById("account-voting-power").textContent = data.votingPower;

    document.getElementById("account-stake-vote").textContent =
      formatEtherOrToken(data.votingStake.amount) + " tokens";
    document.getElementById("account-stake-vote-since").textContent =
      data.votingStake.since ? formatTimestamp(data.votingStake.since) : "-";

    document.getElementById("account-stake-propose").textContent =
      formatEtherOrToken(data.proposingStake.amount) + " tokens";
    document.getElementById("account-stake-propose-since").textContent =
      data.proposingStake.since ? formatTimestamp(data.proposingStake.since) : "-";
  } catch (err) {
    console.error(err);
    showAlert("No se pudo cargar la información de tu cuenta", "danger");
  }
}

async function connectMetamask() {
  if (typeof window.ethereum === "undefined") {
    showAlert("Metamask no está disponible en este navegador.", "warning", 6000);
    return;
  }
  try {
    const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
    const address = accounts[0];
    document.getElementById("account-address").textContent = address;
    showAlert("Wallet conectada correctamente.", "success");
    await loadAccount(address);
  } catch (err) {
    console.error(err);
    showAlert("No se pudo conectar con Metamask.", "danger");
  }
}

function setupNavigation() {
  document.querySelectorAll('a[data-view]').forEach((link) => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      const view = link.dataset.view;
      setActiveView(view);
      if (view === "proposals") {
        loadProposals();
      }
    });
  });
}

function setupFilters() {
  const buttons = document.querySelectorAll("#view-proposals [data-filter]");
  buttons.forEach((btn) => {
    btn.addEventListener("click", () => {
      buttons.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");

      const filter = btn.dataset.filter;
      const cards = document.querySelectorAll("#proposals-list .proposal-card");
      cards.forEach((card) => {
        const status = Number(card.dataset.status);
        let show = true;
        if (filter === "active") show = status === 0;
        else if (filter === "accepted") show = status === 1;
        else if (filter === "rejected") show = status === 2;
        card.parentElement.classList.toggle("d-none", !show);
      });
    });
  });
}

function setupWalletButtons() {
  const btnMetamask = document.getElementById("connect-metamask");
  btnMetamask.addEventListener("click", connectMetamask);
}

document.addEventListener("DOMContentLoaded", async () => {
  setupNavigation();
  setupFilters();
  setupWalletButtons();

  setActiveView("dashboard");

  await loadParameters();
  await loadProposals();
});

