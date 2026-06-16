/**
 * Núcleo do Marcador de Truco Paulista.
 * Lógica pura (sem DOM, sem storage) para ser testável com `node --test`
 * e reutilizável no browser via window.Truco.
 */
(function (root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory();
  } else {
    root.Truco = factory();
  }
})(typeof self !== "undefined" ? self : this, function () {
  const GAME_TARGET = 12;
  const HALF_TARGET = 6; // metade dos 12 tentos — usado no "tento perdido 2"
  const HAND_OF_ELEVEN = 11;
  const TEAMS = ["nos", "eles"];
  // Valores de mão no truco paulista: simples, truco, retruco/seis, nove, doze.
  const HAND_VALUES = [1, 3, 6, 9, 12];

  function clampScore(value) {
    if (value < 0) return 0;
    if (value > GAME_TARGET) return GAME_TARGET;
    return value;
  }

  function otherTeam(team) {
    return team === "nos" ? "eles" : "nos";
  }

  function isTeam(team) {
    return TEAMS.indexOf(team) !== -1;
  }

  function createMatch(options) {
    const opts = options || {};
    return {
      id: opts.id || "m_" + Date.now() + "_" + Math.random().toString(36).slice(2, 7),
      teams: {
        nos: (opts.nosName || "Nós").trim() || "Nós",
        eles: (opts.elesName || "Eles").trim() || "Eles",
      },
      scores: { nos: 0, eles: 0 },
      events: [],
      winner: null,
      startedAt: opts.startedAt || Date.now(),
      finishedAt: null,
    };
  }

  /**
   * Aplica pontos a um time. Mantém o estado consistente (clamp 0..12,
   * define vencedor ao atingir 12) e registra o evento para permitir undo.
   * `opts.hidden` marca pontos de pegadinha (não disparam áudio/efeito).
   */
  function addPoints(match, team, amount, opts) {
    if (!isTeam(team)) throw new Error("Time inválido: " + team);
    if (match.winner) return match;

    const options = opts || {};
    const previous = match.scores[team];
    const next = clampScore(previous + amount);
    const applied = next - previous;
    if (applied === 0) return match;

    match.scores[team] = next;
    match.events.push({
      team: team,
      amount: applied,
      hidden: !!options.hidden,
      source: options.source || "manual",
      at: Date.now(),
    });

    if (next >= GAME_TARGET) {
      match.winner = team;
      match.finishedAt = Date.now();
    }
    return match;
  }

  /** Desfaz o último evento de pontuação. */
  function undo(match) {
    const last = match.events.pop();
    if (!last) return match;
    match.scores[last.team] = clampScore(match.scores[last.team] - last.amount);
    if (match.winner && match.scores[match.winner] < GAME_TARGET) {
      match.winner = null;
      match.finishedAt = null;
    }
    return match;
  }

  function isFinished(match) {
    return match.winner !== null;
  }

  /** Verdadeiro quando o placar cruzou (ou alcançou) a metade nesta jogada. */
  function crossedHalf(prevScore, nextScore) {
    return prevScore < HALF_TARGET && nextScore >= HALF_TARGET;
  }

  /** Indica se algum time está em "mão de onze" (11 pontos e jogo não acabou). */
  function handOfEleven(match) {
    if (isFinished(match)) return null;
    if (match.scores.nos === HAND_OF_ELEVEN) return "nos";
    if (match.scores.eles === HAND_OF_ELEVEN) return "eles";
    return null;
  }

  /**
   * Agrega vitórias por nome de dupla a partir de partidas finalizadas.
   * Retorna lista ordenada por vitórias (desc), depois aproveitamento, depois nome.
   */
  function buildRanking(matches) {
    const tally = {};
    function ensure(name) {
      if (!tally[name]) tally[name] = { name: name, wins: 0, losses: 0, played: 0 };
      return tally[name];
    }
    (matches || []).forEach(function (m) {
      if (!m || !m.winner) return;
      const winnerName = m.teams[m.winner];
      const loserName = m.teams[otherTeam(m.winner)];
      const w = ensure(winnerName);
      const l = ensure(loserName);
      w.wins += 1;
      w.played += 1;
      l.losses += 1;
      l.played += 1;
    });
    return Object.keys(tally)
      .map(function (k) {
        const row = tally[k];
        row.winRate = row.played ? row.wins / row.played : 0;
        return row;
      })
      .sort(function (a, b) {
        return b.wins - a.wins || b.winRate - a.winRate || a.name.localeCompare(b.name);
      });
  }

  return {
    GAME_TARGET: GAME_TARGET,
    HALF_TARGET: HALF_TARGET,
    HAND_OF_ELEVEN: HAND_OF_ELEVEN,
    HAND_VALUES: HAND_VALUES,
    TEAMS: TEAMS,
    clampScore: clampScore,
    otherTeam: otherTeam,
    createMatch: createMatch,
    addPoints: addPoints,
    undo: undo,
    isFinished: isFinished,
    crossedHalf: crossedHalf,
    handOfEleven: handOfEleven,
    buildRanking: buildRanking,
  };
});
