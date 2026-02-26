(function () {
  const AUTH_API_BASE = window.AUTH_API_BASE || 'http://localhost:4001';
  const CHESS_API_BASE = window.CHESS_API_BASE || 'http://localhost:4010';
  const TOKEN_KEY = 'portfolio_auth_token';

  const PIECES = {
    white: { king: '♔', queen: '♕', rook: '♖', bishop: '♗', knight: '♘', pawn: '♙' },
    black: { king: '♚', queen: '♛', rook: '♜', bishop: '♝', knight: '♞', pawn: '♟' },
  };

  const INITIAL_BOARD = [
    [
      { color: 'black', type: 'rook' },
      { color: 'black', type: 'knight' },
      { color: 'black', type: 'bishop' },
      { color: 'black', type: 'queen' },
      { color: 'black', type: 'king' },
      { color: 'black', type: 'bishop' },
      { color: 'black', type: 'knight' },
      { color: 'black', type: 'rook' },
    ],
    Array(8).fill({ color: 'black', type: 'pawn' }),
    Array(8).fill(null),
    Array(8).fill(null),
    Array(8).fill(null),
    Array(8).fill(null),
    Array(8).fill({ color: 'white', type: 'pawn' }),
    [
      { color: 'white', type: 'rook' },
      { color: 'white', type: 'knight' },
      { color: 'white', type: 'bishop' },
      { color: 'white', type: 'queen' },
      { color: 'white', type: 'king' },
      { color: 'white', type: 'bishop' },
      { color: 'white', type: 'knight' },
      { color: 'white', type: 'rook' },
    ],
  ];

  const boardEl = document.getElementById('chessboard');
  const statusEl = document.getElementById('status-text');
  const selectionEl = document.getElementById('selection-text');
  const moveLogEl = document.getElementById('move-log');
  const resetBtn = document.getElementById('reset-game');

  const onlineStatusEl = document.getElementById('online-status');
  const roomInputEl = document.getElementById('online-room-input');
  const createRoomBtn = document.getElementById('create-room');
  const joinRoomBtn = document.getElementById('join-room');
  const copyRoomBtn = document.getElementById('copy-room');
  const leaveRoomBtn = document.getElementById('leave-room');

  let board = createInitialBoard();
  let turn = 'white';
  let selected = null;
  let legalMoves = [];
  let moveEntries = [];

  const online = {
    enabled: false,
    roomId: '',
    color: '',
    version: 0,
    pollTimer: null,
  };

  function cloneBoard(source) {
    return source.map((row) => row.map((piece) => (piece ? { ...piece } : null)));
  }

  function createInitialBoard() {
    return cloneBoard(INITIAL_BOARD);
  }

  function getToken() {
    try {
      return localStorage.getItem(TOKEN_KEY) || '';
    } catch {
      return '';
    }
  }

  async function verifyLogin() {
    const token = getToken();
    if (!token) return false;

    try {
      const response = await fetch(`${AUTH_API_BASE}/auth/me`, {
        method: 'GET',
        headers: { Authorization: `Bearer ${token}` },
        credentials: 'include',
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  async function chessApi(path, options = {}) {
    const token = getToken();
    const headers = { ...(options.headers || {}) };
    if (options.body) headers['Content-Type'] = 'application/json';
    if (token) headers.Authorization = `Bearer ${token}`;

    try {
      const response = await fetch(`${CHESS_API_BASE}${path}`, {
        ...options,
        headers,
        credentials: 'omit',
      });

      let payload = null;
      try {
        payload = await response.json();
      } catch {
        payload = null;
      }

      return { response, payload };
    } catch {
      return {
        response: { ok: false, status: 0 },
        payload: {
          error:
            'Cannot reach chess server. Start it with: node server/chess-server.js',
        },
      };
    }
  }

  function syncPieceScale() {
    const boardWidth = boardEl.clientWidth;
    if (!boardWidth) return;
    const cellSize = boardWidth / 8;
    boardEl.style.setProperty('--piece-size', `${cellSize * 0.72}px`);
  }

  function isInside(row, col) {
    return row >= 0 && row < 8 && col >= 0 && col < 8;
  }

  function pieceAt(row, col) {
    if (!isInside(row, col)) return null;
    return board[row][col];
  }

  function algebraic(row, col) {
    return `${'abcdefgh'[col]}${8 - row}`;
  }

  function addMove(r, c, moves, ownColor) {
    if (!isInside(r, c)) return false;
    const target = pieceAt(r, c);
    if (!target) {
      moves.push({ row: r, col: c });
      return true;
    }
    if (target.color !== ownColor) moves.push({ row: r, col: c });
    return false;
  }

  function addSlidingMoves(row, col, deltas, color, moves) {
    deltas.forEach(([dr, dc]) => {
      let r = row + dr;
      let c = col + dc;
      while (isInside(r, c)) {
        const shouldContinue = addMove(r, c, moves, color);
        if (!shouldContinue) break;
        r += dr;
        c += dc;
      }
    });
  }

  function getLegalMoves(row, col) {
    const piece = pieceAt(row, col);
    if (!piece) return [];

    const moves = [];

    if (piece.type === 'pawn') {
      const dir = piece.color === 'white' ? -1 : 1;
      const startRow = piece.color === 'white' ? 6 : 1;

      if (!pieceAt(row + dir, col)) {
        moves.push({ row: row + dir, col });
        if (row === startRow && !pieceAt(row + dir * 2, col)) {
          moves.push({ row: row + dir * 2, col });
        }
      }

      [-1, 1].forEach((dc) => {
        const target = pieceAt(row + dir, col + dc);
        if (target && target.color !== piece.color) moves.push({ row: row + dir, col: col + dc });
      });

      return moves.filter((m) => isInside(m.row, m.col));
    }

    if (piece.type === 'rook') {
      addSlidingMoves(row, col, [[1, 0], [-1, 0], [0, 1], [0, -1]], piece.color, moves);
      return moves;
    }

    if (piece.type === 'bishop') {
      addSlidingMoves(row, col, [[1, 1], [1, -1], [-1, 1], [-1, -1]], piece.color, moves);
      return moves;
    }

    if (piece.type === 'queen') {
      addSlidingMoves(
        row,
        col,
        [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]],
        piece.color,
        moves
      );
      return moves;
    }

    if (piece.type === 'knight') {
      [[2, 1], [2, -1], [-2, 1], [-2, -1], [1, 2], [1, -2], [-1, 2], [-1, -2]].forEach(
        ([dr, dc]) => addMove(row + dr, col + dc, moves, piece.color)
      );
      return moves;
    }

    if (piece.type === 'king') {
      [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]].forEach(
        ([dr, dc]) => addMove(row + dr, col + dc, moves, piece.color)
      );
      return moves;
    }

    return moves;
  }

  function isLegalTarget(row, col) {
    return legalMoves.some((m) => m.row === row && m.col === col);
  }

  function clearSelection() {
    selected = null;
    legalMoves = [];
    selectionEl.textContent = 'Select a piece';
  }

  function canInteract() {
    return !online.enabled || turn === online.color;
  }

  function setOnlineStatus(message, isError) {
    if (!onlineStatusEl) return;
    onlineStatusEl.textContent = message;
    onlineStatusEl.style.color = isError ? '#b00020' : '';
  }

  function renderMoveLog() {
    moveLogEl.innerHTML = '';
    moveEntries.forEach((entry) => {
      const li = document.createElement('li');
      li.textContent = entry;
      moveLogEl.appendChild(li);
    });
    moveLogEl.scrollTop = moveLogEl.scrollHeight;
  }

  function logMove(piece, from, to, capture) {
    const icon = PIECES[piece.color][piece.type];
    moveEntries.push(`${icon} ${from}${capture ? ' x ' : ' -> '}${to}`);
    renderMoveLog();
  }

  function promoteIfNeeded(piece, row) {
    if (piece.type !== 'pawn') return;
    if ((piece.color === 'white' && row === 0) || (piece.color === 'black' && row === 7)) {
      piece.type = 'queen';
    }
  }

  function serializeState() {
    return {
      board: cloneBoard(board),
      turn,
      moveLog: [...moveEntries],
    };
  }

  function applyState(state) {
    board = cloneBoard(state.board);
    turn = state.turn;
    moveEntries = Array.isArray(state.moveLog) ? [...state.moveLog] : [];
    clearSelection();
    statusEl.textContent = `${turn[0].toUpperCase()}${turn.slice(1)} to move`;
    renderMoveLog();
    render();
  }

  async function pushMoveToServer(movedBy) {
    if (!online.enabled) return true;

    const { response, payload } = await chessApi('/api/chess/move', {
      method: 'POST',
      body: JSON.stringify({
        roomId: online.roomId,
        movedBy,
        state: serializeState(),
        version: online.version,
      }),
    });

    if (!response.ok) {
      setOnlineStatus(payload?.error || 'Move sync failed', true);
      return false;
    }

    online.version = payload?.version || online.version;
    return true;
  }

  async function fetchRoomState() {
    if (!online.enabled || !online.roomId) return;

    const { response, payload } = await chessApi(
      `/api/chess/state?roomId=${encodeURIComponent(online.roomId)}`,
      { method: 'GET' }
    );

    if (!response.ok || !payload?.state) return;

    const serverVersion = payload.version || 0;
    if (serverVersion !== online.version) {
      online.version = serverVersion;
      applyState(payload.state);
    }
  }

  function startPolling() {
    if (online.pollTimer) clearInterval(online.pollTimer);
    online.pollTimer = setInterval(fetchRoomState, 1200);
  }

  function stopPolling() {
    if (!online.pollTimer) return;
    clearInterval(online.pollTimer);
    online.pollTimer = null;
  }

  async function createRoom() {
    const loggedIn = await verifyLogin();
    if (!loggedIn) {
      setOnlineStatus('Login first from main app.', true);
      return;
    }

    const { response, payload } = await chessApi('/api/chess/create', {
      method: 'POST',
      body: JSON.stringify({ state: serializeState() }),
    });

    if (!response.ok) {
      setOnlineStatus(payload?.error || 'Could not create room', true);
      return;
    }

    online.enabled = true;
    online.roomId = payload.roomId;
    online.color = payload.color;
    online.version = payload.version || 0;
    roomInputEl.value = payload.roomId;
    setOnlineStatus(`Online room ${payload.roomId} (${online.color})`);

    if (payload.state) applyState(payload.state);
    startPolling();
  }

  async function joinRoom() {
    const roomId = (roomInputEl.value || '').trim().toUpperCase();
    if (!roomId) {
      setOnlineStatus('Enter a room code.', true);
      return;
    }

    const loggedIn = await verifyLogin();
    if (!loggedIn) {
      setOnlineStatus('Login first from main app.', true);
      return;
    }

    const { response, payload } = await chessApi('/api/chess/join', {
      method: 'POST',
      body: JSON.stringify({ roomId }),
    });

    if (!response.ok) {
      setOnlineStatus(payload?.error || 'Could not join room', true);
      return;
    }

    online.enabled = true;
    online.roomId = payload.roomId;
    online.color = payload.color;
    online.version = payload.version || 0;
    setOnlineStatus(`Joined ${payload.roomId} as ${online.color}`);

    if (payload.state) applyState(payload.state);
    startPolling();
  }

  function leaveRoom() {
    stopPolling();
    online.enabled = false;
    online.roomId = '';
    online.color = '';
    online.version = 0;
    setOnlineStatus('Offline mode');
    render();
  }

  async function copyRoomCode() {
    if (!online.roomId) return;
    try {
      await navigator.clipboard.writeText(online.roomId);
      setOnlineStatus(`Room code copied: ${online.roomId}`);
    } catch {
      setOnlineStatus('Could not copy room code.', true);
    }
  }

  async function resetOnlineOrLocal() {
    if (!online.enabled) {
      board = createInitialBoard();
      turn = 'white';
      moveEntries = [];
      clearSelection();
      statusEl.textContent = 'White to move';
      renderMoveLog();
      render();
      return;
    }

    const { response, payload } = await chessApi('/api/chess/reset', {
      method: 'POST',
      body: JSON.stringify({ roomId: online.roomId }),
    });

    if (!response.ok || !payload?.state) {
      setOnlineStatus(payload?.error || 'Could not reset game', true);
      return;
    }

    online.version = payload.version || online.version;
    applyState(payload.state);
  }

  async function onSquareClick(row, col) {
    if (!canInteract()) {
      selectionEl.textContent = `Waiting for ${turn} move`;
      render();
      return;
    }

    const clickedPiece = pieceAt(row, col);

    if (!selected) {
      if (!clickedPiece || clickedPiece.color !== turn) return;
      selected = { row, col };
      legalMoves = getLegalMoves(row, col);
      selectionEl.textContent = `${clickedPiece.color} ${clickedPiece.type} selected`;
      render();
      return;
    }

    if (selected.row === row && selected.col === col) {
      clearSelection();
      render();
      return;
    }

    if (isLegalTarget(row, col)) {
      const movedBy = turn;
      const movingPiece = pieceAt(selected.row, selected.col);
      const targetPiece = pieceAt(row, col);

      board[row][col] = movingPiece;
      board[selected.row][selected.col] = null;
      promoteIfNeeded(movingPiece, row);
      logMove(
        movingPiece,
        algebraic(selected.row, selected.col),
        algebraic(row, col),
        Boolean(targetPiece)
      );

      turn = turn === 'white' ? 'black' : 'white';
      statusEl.textContent = `${turn[0].toUpperCase()}${turn.slice(1)} to move`;
      clearSelection();
      render();

      const synced = await pushMoveToServer(movedBy);
      if (!synced) await fetchRoomState();
      return;
    }

    if (clickedPiece && clickedPiece.color === turn) {
      selected = { row, col };
      legalMoves = getLegalMoves(row, col);
      selectionEl.textContent = `${clickedPiece.color} ${clickedPiece.type} selected`;
      render();
      return;
    }

    clearSelection();
    render();
  }

  function render() {
    syncPieceScale();
    boardEl.classList.toggle('locked', !canInteract());
    boardEl.innerHTML = '';

    for (let row = 0; row < 8; row += 1) {
      for (let col = 0; col < 8; col += 1) {
        const square = document.createElement('button');
        square.type = 'button';
        square.className = `square ${(row + col) % 2 === 0 ? 'light' : 'dark'}`;
        square.setAttribute('aria-label', `Square ${algebraic(row, col)}`);

        const piece = pieceAt(row, col);
        if (piece) {
          square.textContent = PIECES[piece.color][piece.type];
          square.classList.add('occupied');
        }

        if (selected && selected.row === row && selected.col === col) square.classList.add('selected');
        if (isLegalTarget(row, col)) square.classList.add('legal');

        square.addEventListener('click', () => {
          onSquareClick(row, col);
        });

        boardEl.appendChild(square);
      }
    }
  }

  createRoomBtn?.addEventListener('click', createRoom);
  joinRoomBtn?.addEventListener('click', joinRoom);
  leaveRoomBtn?.addEventListener('click', leaveRoom);
  copyRoomBtn?.addEventListener('click', copyRoomCode);
  resetBtn?.addEventListener('click', resetOnlineOrLocal);
  window.addEventListener('resize', syncPieceScale);

  renderMoveLog();
  render();
})();
