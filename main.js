(() => {
  const order = window.MNEMONICA_ORDER;
  const board = document.getElementById("board");
  const expected = new Set();
  for (const rank of ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"]) {
    for (const suit of ["C", "H", "S", "D"]) expected.add(`${rank}${suit}`);
  }

  const valid = Array.isArray(order)
    && order.length === 52
    && new Set(order).size === 52
    && order.every((card) => expected.has(card))
    && expected.size === order.length
    && [...expected].every((card) => order.includes(card));

  if (!valid) {
    const error = document.createElement("div");
    error.className = "error-message";
    error.setAttribute("role", "alert");
    error.textContent = "牌序資料錯誤：必須包含完整且不重複的 52 張牌。";
    document.body.append(error);
    return;
  }

  const symbols = { C: "♣", H: "♥", S: "♠", D: "♦" };
  for (let rowIndex = 0; rowIndex < 4; rowIndex += 1) {
    const row = document.createElement("section");
    row.className = "card-row";
    row.setAttribute("aria-label", `位置 ${rowIndex * 13 + 1} 到 ${rowIndex * 13 + 13}`);
    const label = document.createElement("div");
    label.className = "row-label";
    label.textContent = `${rowIndex * 13 + 1}–${rowIndex * 13 + 13}`;
    row.append(label);

    for (let column = 0; column < 13; column += 1) {
      const position = rowIndex * 13 + column + 1;
      const card = order[position - 1];
      const rank = card.slice(0, -1);
      const suit = card.slice(-1);
      const tile = document.createElement("div");
      tile.className = "card";
      tile.setAttribute("aria-label", `位置 ${position}：${rank}${symbols[suit]}`);

      const number = document.createElement("span");
      number.className = "position";
      number.textContent = String(position);
      const face = document.createElement("span");
      face.className = "face";
      face.textContent = `${rank}${symbols[suit]}`;
      face.classList.add(suit === "H" || suit === "D" ? "suit-red" : "suit-black");
      tile.append(number, face);
      row.append(tile);
    }
    board.append(row);
  }

  const button = document.getElementById("fullscreen");
  const fullscreenSupported = typeof document.documentElement.requestFullscreen === "function";
  if (!fullscreenSupported) button.hidden = true;
  button.addEventListener("click", async () => {
    try {
      await document.documentElement.requestFullscreen();
    } catch {
      // Fullscreen can be denied by the browser or platform.
    }
  });
  document.addEventListener("fullscreenchange", () => {
    button.hidden = Boolean(document.fullscreenElement) || !fullscreenSupported;
  });
})();
