(() => {
  const order = window.MNEMONICA_ORDER;
  const expected = new Set();
  const ranks = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];
  const suits = ["C", "H", "S", "D"];
  const symbols = { C: "♣", H: "♥", S: "♠", D: "♦" };
  const suitNames = { C: "梅花", H: "紅心", S: "黑桃", D: "方塊" };
  for (const rank of ranks) for (const suit of suits) expected.add(`${rank}${suit}`);

  const valid = Array.isArray(order)
    && order.length === 52
    && new Set(order).size === 52
    && order.every((card) => expected.has(card))
    && [...expected].every((card) => order.includes(card));

  if (!valid) {
    const error = document.createElement("div");
    error.className = "error-message";
    error.setAttribute("role", "alert");
    error.textContent = "牌序資料錯誤：必須包含完整且不重複的 52 張牌。";
    document.body.append(error);
    return;
  }

  const cardPosition = new Map(order.map((card, index) => [card, index + 1]));
  const cardInfo = (card) => ({ rank: card.slice(0, -1), suit: card.slice(-1), symbol: symbols[card.slice(-1)] });
  const makeFace = (card) => {
    const info = cardInfo(card);
    const face = document.createElement("span");
    face.className = `face ${info.suit === "H" || info.suit === "D" ? "suit-red" : "suit-black"}`;
    face.textContent = `${info.rank}${info.symbol}`;
    return face;
  };

  function makeCard(position, { button = false, memory = false } = {}) {
    const card = order[position - 1];
    const info = cardInfo(card);
    const tile = document.createElement(button ? "button" : "div");
    if (button) tile.type = "button";
    tile.className = `card${memory ? " memory-card" : ""}`;
    tile.dataset.position = String(position);
    tile.setAttribute("aria-label", `位置 ${position}：${info.rank}${info.symbol}，${suitNames[info.suit]}`);

    const number = document.createElement("span");
    number.className = "position";
    number.textContent = String(position);
    tile.append(number, makeFace(card));

    if (memory) {
      const mark = document.createElement("span");
      mark.className = "cover-mark";
      mark.textContent = "？";
      mark.hidden = true;
      tile.append(mark);
    }
    return tile;
  }

  function renderSequenceBoard() {
    const board = document.getElementById("sequence-board");
    for (let group = 0; group < 4; group += 1) {
      const row = document.createElement("section");
      row.className = "card-row";
      row.setAttribute("aria-label", `位置 ${group * 13 + 1} 到 ${group * 13 + 13}`);
      const label = document.createElement("div");
      label.className = "row-label";
      label.textContent = `${group * 13 + 1}–${group * 13 + 13}`;
      row.append(label);
      for (let column = 0; column < 13; column += 1) row.append(makeCard(group * 13 + column + 1));
      board.append(row);
    }
  }

  function renderSimpleBoard(id) {
    const board = document.getElementById(id);
    for (let position = 1; position <= 52; position += 1) board.append(makeCard(position));
  }

  renderSequenceBoard();
  renderSimpleBoard("portrait-board");

  const memoryBoard = document.getElementById("memory-board");
  const revealed = new Set();
  let selectedScope = "all";
  for (let position = 1; position <= 52; position += 1) memoryBoard.append(makeCard(position, { button: true, memory: true }));

  function inScope(position) {
    if (selectedScope === "all") return true;
    const group = Number(selectedScope);
    return position > group * 13 && position <= (group + 1) * 13;
  }

  function updateMemoryBoard() {
    for (const tile of memoryBoard.querySelectorAll(".memory-card")) {
      const position = Number(tile.dataset.position);
      const active = inScope(position);
      const isRevealed = revealed.has(position);
      tile.disabled = !active;
      tile.classList.toggle("card--inactive", !active);
      tile.classList.toggle("card--covered", active && !isRevealed);
      tile.querySelector(".cover-mark").hidden = !active || isRevealed;
      const info = cardInfo(order[position - 1]);
      tile.setAttribute("aria-label", active && !isRevealed
        ? `位置 ${position}，牌面已遮住，點擊揭示`
        : `位置 ${position}：${info.rank}${info.symbol}${active ? "，點擊重新遮住" : "，目前不在練習範圍"}`);
    }
  }
  updateMemoryBoard();

  memoryBoard.addEventListener("click", (event) => {
    const tile = event.target.closest(".memory-card");
    if (!tile || tile.disabled) return;
    const position = Number(tile.dataset.position);
    if (revealed.has(position)) revealed.delete(position);
    else revealed.add(position);
    updateMemoryBoard();
  });

  for (const button of document.querySelectorAll("[data-scope]")) {
    button.addEventListener("click", () => {
      selectedScope = button.dataset.scope;
      revealed.clear();
      for (const choice of document.querySelectorAll("[data-scope]")) {
        const selected = choice === button;
        choice.classList.toggle("is-active", selected);
        choice.setAttribute("aria-pressed", String(selected));
      }
      updateMemoryBoard();
    });
  }
  document.getElementById("hide-again").addEventListener("click", () => {
    if (selectedScope === "all") revealed.clear();
    else {
      const group = Number(selectedScope);
      for (let position = group * 13 + 1; position <= (group + 1) * 13; position += 1) revealed.delete(position);
    }
    updateMemoryBoard();
  });

  const navButtons = [...document.querySelectorAll("[data-page-target]")];
  const pages = [...document.querySelectorAll(".page[data-page]")];
  function showPage(name) {
    if (document.fullscreenElement) return;
    document.body.dataset.page = name;
    for (const page of pages) {
      const active = page.dataset.page === name;
      page.hidden = !active;
      page.classList.toggle("is-active", active);
    }
    for (const button of navButtons) {
      const active = button.dataset.pageTarget === name;
      button.classList.toggle("is-active", active);
      if (active) button.setAttribute("aria-current", "page");
      else button.removeAttribute("aria-current");
    }
  }
  for (const button of navButtons) button.addEventListener("click", () => showPage(button.dataset.pageTarget));

  const rankPicker = document.getElementById("rank-picker");
  const suitPicker = document.getElementById("suit-picker");
  const cardLookupResult = document.getElementById("card-lookup-result");
  const positionLookupResult = document.getElementById("position-lookup-result");
  const cardPanel = document.getElementById("lookup-card-panel");
  const positionPanel = document.getElementById("lookup-position-panel");
  const lookupTabs = [...document.querySelectorAll("[data-lookup-mode]")];
  let selectedRank = null;
  let selectedSuit = null;

  function showCardLookupResult() {
    if (!selectedRank || !selectedSuit) {
      cardLookupResult.textContent = "選擇點數與花色後，這裡會顯示位置。";
      return;
    }
    const card = `${selectedRank}${selectedSuit}`;
    const position = cardPosition.get(card);
    cardLookupResult.replaceChildren();
    const cardFace = document.createElement("span");
    cardFace.className = "card result-card";
    cardFace.append(makeFace(card));
    const result = document.createElement("span");
    result.innerHTML = `這張牌在 <span class="result-position">位置 ${position}</span>`;
    cardLookupResult.append(cardFace, result);
  }

  for (const rank of ranks) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "picker-button rank-button";
    button.textContent = rank;
    button.setAttribute("aria-pressed", "false");
    button.addEventListener("click", () => {
      selectedRank = rank;
      for (const choice of rankPicker.children) {
        const active = choice === button;
        choice.classList.toggle("is-selected", active);
        choice.setAttribute("aria-pressed", String(active));
      }
      showCardLookupResult();
    });
    rankPicker.append(button);
  }

  for (const suit of suits) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `picker-button suit-button ${suit === "H" || suit === "D" ? "suit-red" : "suit-black"}`;
    button.textContent = symbols[suit];
    button.setAttribute("aria-label", suitNames[suit]);
    button.setAttribute("aria-pressed", "false");
    button.addEventListener("click", () => {
      selectedSuit = suit;
      for (const choice of suitPicker.children) {
        const active = choice === button;
        choice.classList.toggle("is-selected", active);
        choice.setAttribute("aria-pressed", String(active));
      }
      showCardLookupResult();
    });
    suitPicker.append(button);
  }

  for (const position of Array.from({ length: 52 }, (_, index) => index + 1)) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "position-button";
    button.textContent = String(position);
    button.setAttribute("aria-pressed", "false");
    button.addEventListener("click", () => {
      for (const choice of document.querySelectorAll(".position-button")) {
        const active = choice === button;
        choice.classList.toggle("is-selected", active);
        choice.setAttribute("aria-pressed", String(active));
      }
      const card = order[position - 1];
      const info = cardInfo(card);
      const cardFace = document.createElement("span");
      cardFace.className = "card result-card";
      cardFace.setAttribute("aria-label", `${info.rank}${info.symbol}`);
      cardFace.append(makeFace(card));
      const result = document.createElement("span");
      result.innerHTML = `位置 <strong>${position}</strong> 是這張牌`;
      positionLookupResult.replaceChildren(cardFace, result);
    });
    document.getElementById("position-picker").append(button);
  }

  for (const button of lookupTabs) {
    button.addEventListener("click", () => {
      const cardMode = button.dataset.lookupMode === "card";
      cardPanel.hidden = !cardMode;
      positionPanel.hidden = cardMode;
      for (const tab of lookupTabs) {
        const active = tab === button;
        tab.classList.toggle("is-active", active);
        tab.setAttribute("aria-pressed", String(active));
      }
    });
  }

  const enterFullscreen = document.getElementById("enter-fullscreen");
  const exitFullscreen = document.getElementById("exit-fullscreen");
  const touchZone = document.getElementById("fullscreen-touch-zone");
  const fullscreenSupported = typeof document.documentElement.requestFullscreen === "function";
  if (!fullscreenSupported) enterFullscreen.hidden = true;

  let hideExitTimer;
  function revealExitControl() {
    if (!document.fullscreenElement) return;
    exitFullscreen.hidden = false;
    window.clearTimeout(hideExitTimer);
    hideExitTimer = window.setTimeout(() => {
      if (!exitFullscreen.matches(":focus")) exitFullscreen.hidden = true;
    }, 2600);
  }
  enterFullscreen.addEventListener("click", async () => {
    showPage("sequence");
    if (!fullscreenSupported) return;
    try {
      await document.documentElement.requestFullscreen();
    } catch {
      enterFullscreen.textContent = "無法進入全螢幕";
      window.setTimeout(() => { enterFullscreen.textContent = "進入全螢幕"; }, 1800);
    }
  });
  exitFullscreen.addEventListener("click", async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
    } catch {
      exitFullscreen.hidden = true;
    }
  });
  touchZone.addEventListener("pointerdown", (event) => {
    if (event.pointerType === "touch") revealExitControl();
  });
  document.addEventListener("pointermove", (event) => {
    if (!document.fullscreenElement || event.pointerType === "touch") return;
    if (event.clientY <= 50 && event.clientX >= window.innerWidth - 90) revealExitControl();
  });
  document.addEventListener("fullscreenchange", () => {
    const active = Boolean(document.fullscreenElement);
    document.body.classList.toggle("is-fullscreen", active);
    exitFullscreen.hidden = true;
    if (active) showPage("sequence");
  });
})();
