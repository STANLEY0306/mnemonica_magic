(() => {
  const order = window.MNEMONICA_ORDER;
  const ranks = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];
  const suits = ["C", "H", "S", "D"];
  const symbols = { C: "♣", H: "♥", S: "♠", D: "♦" };
  const suitNames = { C: "梅花", H: "紅心", S: "黑桃", D: "方塊" };
  const expected = new Set(ranks.flatMap((rank) => suits.map((suit) => `${rank}${suit}`)));
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
  const randomItem = (items) => items[Math.floor(Math.random() * items.length)];
  const shuffled = (items) => [...items].sort(() => Math.random() - 0.5);

  function makeFace(card) {
    const info = cardInfo(card);
    const face = document.createElement("span");
    face.className = `face ${info.suit === "H" || info.suit === "D" ? "suit-red" : "suit-black"}`;
    face.textContent = `${info.rank}${info.symbol}`;
    return face;
  }

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
  const inScope = (position) => selectedScope === "all"
    || (position > Number(selectedScope) * 13 && position <= (Number(selectedScope) + 1) * 13);

  function updateMemoryBoard() {
    for (const tile of memoryBoard.querySelectorAll(".memory-card")) {
      const position = Number(tile.dataset.position);
      const active = inScope(position);
      const isRevealed = revealed.has(position);
      const info = cardInfo(order[position - 1]);
      tile.disabled = !active;
      tile.classList.toggle("card--inactive", !active);
      tile.classList.toggle("card--covered", active && !isRevealed);
      tile.querySelector(".cover-mark").hidden = !active || isRevealed;
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
    if (name !== "game" && game.running) {
      game.running = false;
      window.clearInterval(game.timer);
      window.clearTimeout(game.nextTimer);
      gameSetup.hidden = false;
      gameStage.hidden = true;
    }
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
    const result = document.createElement("span");
    result.append(document.createTextNode("這張牌在 "));
    const position = document.createElement("span");
    position.className = "result-position";
    position.textContent = `位置 ${cardPosition.get(card)}`;
    result.append(position);
    const cardFace = document.createElement("span");
    cardFace.className = "card result-card";
    cardFace.append(makeFace(card));
    cardLookupResult.replaceChildren(cardFace, result);
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

  const positionPicker = document.getElementById("position-picker");
  for (let position = 1; position <= 52; position += 1) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "position-button";
    button.textContent = String(position);
    button.setAttribute("aria-pressed", "false");
    button.addEventListener("click", () => {
      for (const choice of positionPicker.children) {
        const active = choice === button;
        choice.classList.toggle("is-selected", active);
        choice.setAttribute("aria-pressed", String(active));
      }
      const card = order[position - 1];
      const result = document.createElement("span");
      result.append(document.createTextNode(`位置 ${position} 是這張牌`));
      const cardFace = document.createElement("span");
      cardFace.className = "card result-card";
      cardFace.setAttribute("aria-label", `${cardInfo(card).rank}${cardInfo(card).symbol}`);
      cardFace.append(makeFace(card));
      positionLookupResult.replaceChildren(cardFace, result);
    });
    positionPicker.append(button);
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

  const gameSetup = document.getElementById("game-setup");
  const gameStage = document.getElementById("game-stage");
  const gameModeButtons = [...document.querySelectorAll("[data-game-mode]")];
  const digitPicker = document.getElementById("digit-picker");
  const digitPickerWrap = document.getElementById("digit-picker-wrap");
  const startGameButton = document.getElementById("start-game");
  const gameQuestion = document.querySelector(".game-question");
  const gamePrompt = document.getElementById("game-prompt");
  const questionVisual = document.getElementById("question-visual");
  const answerChoices = document.getElementById("answer-choices");
  const gameFeedback = document.getElementById("game-feedback");
  const gameTime = document.getElementById("game-time");
  const gameScore = document.getElementById("game-score");
  const gameFinished = document.getElementById("game-finished");
  const gameFinalScore = document.getElementById("game-final-score");
  const modeNames = {
    "position-card": "位置認牌",
    "card-position": "牌找位置",
    "last-digit": "尾數接龍",
    "missing-card": "五張缺牌"
  };
  const game = { mode: "position-card", digit: null, score: 0, time: 10, running: false, timer: null, nextTimer: null, tailPositions: [], tailIndex: 0, currentAnswer: "", missingGroup: [] };

  for (let digit = 0; digit <= 9; digit += 1) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "digit-button";
    button.textContent = String(digit);
    button.setAttribute("aria-pressed", "false");
    button.addEventListener("click", () => {
      game.digit = digit;
      for (const choice of digitPicker.children) {
        const selected = choice === button;
        choice.classList.toggle("is-selected", selected);
        choice.setAttribute("aria-pressed", String(selected));
      }
      startGameButton.disabled = false;
    });
    digitPicker.append(button);
  }
  for (const button of gameModeButtons) {
    button.addEventListener("click", () => {
      game.mode = button.dataset.gameMode;
      for (const choice of gameModeButtons) {
        const selected = choice === button;
        choice.classList.toggle("is-selected", selected);
        choice.setAttribute("aria-pressed", String(selected));
      }
      const digitMode = game.mode === "last-digit";
      digitPickerWrap.hidden = !digitMode;
      startGameButton.disabled = digitMode && game.digit === null;
    });
  }

  function addGameCardChoice(card) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "answer-card";
    button.dataset.answer = card;
    button.setAttribute("aria-label", `${cardInfo(card).rank}${cardInfo(card).symbol}`);
    button.append(makeFace(card));
    answerChoices.append(button);
  }
  function addGamePositionChoice(position) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "answer-position";
    button.dataset.answer = String(position);
    button.textContent = String(position);
    button.setAttribute("aria-label", `位置 ${position}`);
    answerChoices.append(button);
  }
  function showQuestionCard(card) {
    const tile = document.createElement("div");
    tile.className = "card question-card";
    tile.append(makeFace(card));
    questionVisual.append(tile);
  }
  function showQuestionPosition(position) {
    const tile = document.createElement("span");
    tile.className = "question-position";
    tile.textContent = String(position);
    questionVisual.append(tile);
  }
  function makeCardChoices(correctCard) {
    const others = shuffled(order.filter((card) => card !== correctCard)).slice(0, 3);
    for (const card of shuffled([correctCard, ...others])) addGameCardChoice(card);
  }
  function makePositionChoices(correctPosition) {
    const others = shuffled(Array.from({ length: 52 }, (_, index) => index + 1).filter((position) => position !== correctPosition)).slice(0, 3);
    for (const position of shuffled([correctPosition, ...others])) addGamePositionChoice(position);
  }
  function renderMissingGroup() {
    const starts = Array.from({ length: 10 }, (_, index) => index * 5 + 1);
    const start = randomItem(starts);
    game.missingGroup = Array.from({ length: 5 }, (_, index) => start + index);
    const missingIndex = Math.floor(Math.random() * game.missingGroup.length);
    const correctCard = order[game.missingGroup[missingIndex] - 1];
    game.currentAnswer = correctCard;
    for (let index = 0; index < game.missingGroup.length; index += 1) {
      const position = game.missingGroup[index];
      const slot = document.createElement("div");
      if (index === missingIndex) {
        slot.className = "sequence-slot is-missing";
        slot.innerHTML = `<span class="position">${position}</span><strong>？</strong>`;
      } else {
        slot.className = "sequence-slot";
        const number = document.createElement("span");
        number.className = "position";
        number.textContent = String(position);
        slot.append(number, makeFace(order[position - 1]));
      }
      questionVisual.append(slot);
    }
    makeCardChoices(correctCard);
  }
  function renderGameQuestion() {
    if (!game.running) return;
    answerChoices.replaceChildren();
    questionVisual.replaceChildren();
    gameQuestion.hidden = false;
    gameFinished.hidden = true;
    gameFeedback.className = "game-feedback";
    gameFeedback.textContent = "";

    if (game.mode === "position-card") {
      const position = Math.floor(Math.random() * 52) + 1;
      game.currentAnswer = order[position - 1];
      gamePrompt.textContent = "這個位置是哪一張牌？";
      showQuestionPosition(position);
      makeCardChoices(game.currentAnswer);
    } else if (game.mode === "card-position") {
      const position = Math.floor(Math.random() * 52) + 1;
      const card = order[position - 1];
      game.currentAnswer = String(position);
      gamePrompt.textContent = "這張牌在第幾個位置？";
      showQuestionCard(card);
      makePositionChoices(position);
    } else if (game.mode === "last-digit") {
      if (game.tailIndex >= game.tailPositions.length) game.tailIndex = 0;
      const position = game.tailPositions[game.tailIndex];
      game.currentAnswer = order[position - 1];
      gamePrompt.textContent = `尾數 ${game.digit}｜第 ${game.tailIndex + 1} / ${game.tailPositions.length} 張`;
      showQuestionPosition(position);
      makeCardChoices(game.currentAnswer);
    } else {
      gamePrompt.textContent = "哪一張牌被遮住了？";
      renderMissingGroup();
    }
  }
  function finishGame() {
    game.running = false;
    window.clearInterval(game.timer);
    window.clearTimeout(game.nextTimer);
    game.time = 0;
    gameTime.textContent = "0";
    gameQuestion.hidden = true;
    gameFinished.hidden = false;
    gameFinalScore.textContent = `你在 10 秒內答對 ${game.score} 題。`;
  }
  function nextGameQuestion() {
    if (game.mode === "last-digit") game.tailIndex += 1;
    renderGameQuestion();
  }
  function startGame() {
    if (game.mode === "last-digit" && game.digit === null) return;
    window.clearInterval(game.timer);
    window.clearTimeout(game.nextTimer);
    game.score = 0;
    game.time = 10;
    game.running = true;
    game.tailIndex = 0;
    game.tailPositions = game.mode === "last-digit"
      ? Array.from({ length: 52 }, (_, index) => index + 1).filter((position) => position % 10 === game.digit)
      : [];
    gameScore.textContent = "0";
    gameTime.textContent = "10";
    gameFeedback.className = "game-feedback";
    gameFeedback.textContent = "先想答案，再選擇牌面或位置。";
    gameSetup.hidden = true;
    gameStage.hidden = false;
    gameFinished.hidden = true;
    renderGameQuestion();
    game.timer = window.setInterval(() => {
      game.time -= 1;
      gameTime.textContent = String(game.time);
      if (game.time <= 0) finishGame();
    }, 1000);
  }
  startGameButton.addEventListener("click", startGame);
  document.getElementById("play-again").addEventListener("click", startGame);
  answerChoices.addEventListener("click", (event) => {
    const choice = event.target.closest("[data-answer]");
    if (!choice || !game.running || choice.disabled) return;
    for (const answer of answerChoices.querySelectorAll("button")) answer.disabled = true;
    const correct = choice.dataset.answer === game.currentAnswer;
    if (correct) {
      game.score += 1;
      gameScore.textContent = String(game.score);
      gameFeedback.className = "game-feedback is-correct";
      gameFeedback.textContent = "答對了！";
    } else {
      const answerText = game.currentAnswer.length <= 3 && cardPosition.has(game.currentAnswer)
        ? `${cardInfo(game.currentAnswer).rank}${cardInfo(game.currentAnswer).symbol}`
        : `位置 ${game.currentAnswer}`;
      gameFeedback.className = "game-feedback is-wrong";
      gameFeedback.textContent = `正確答案：${answerText}`;
    }
    game.nextTimer = window.setTimeout(nextGameQuestion, correct ? 260 : 700);
  });

  const enterFullscreen = document.getElementById("enter-fullscreen");
  const exitFullscreen = document.getElementById("exit-fullscreen");
  const touchZone = document.getElementById("fullscreen-touch-zone");
  const sequenceNote = document.getElementById("orientation-note");
  const portraitNote = document.getElementById("portrait-orientation-note");
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
    if (!fullscreenSupported || !["sequence", "portrait"].includes(document.body.dataset.page)) return;
    const startedPortrait = window.matchMedia("(orientation: portrait)").matches;
    sequenceNote.textContent = "正在嘗試切換為橫向…";
    portraitNote.textContent = "正在嘗試切換為橫向…";
    try {
      await document.documentElement.requestFullscreen();
      if (startedPortrait) {
        try {
          if (!screen.orientation || typeof screen.orientation.lock !== "function") throw new Error("orientation lock unavailable");
          await screen.orientation.lock("landscape");
        } catch {
          const message = "此瀏覽器無法自動轉向，請手動將手機橫放";
          sequenceNote.textContent = message;
          portraitNote.textContent = message;
        }
      }
    } catch {
      enterFullscreen.textContent = "無法進入全螢幕";
      window.setTimeout(() => { enterFullscreen.textContent = "全螢幕"; }, 1800);
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
    if (event.pointerType !== "mouse") revealExitControl();
  });
  document.addEventListener("pointermove", (event) => {
    if (!document.fullscreenElement || event.pointerType === "touch") return;
    if (event.clientY <= 50 && event.clientX >= window.innerWidth - 90) revealExitControl();
  });
  document.addEventListener("fullscreenchange", () => {
    const active = Boolean(document.fullscreenElement);
    document.body.classList.toggle("is-fullscreen", active);
    exitFullscreen.hidden = true;
    if (active) {
      game.running = false;
      window.clearInterval(game.timer);
      window.clearTimeout(game.nextTimer);
    } else {
      try { screen.orientation?.unlock?.(); } catch { /* Browser may not support orientation unlock. */ }
    }
  });
})();
