/* Marcador de Truco Paulista — wiring de UI, áudio, pegadinhas e persistência. */
(function () {
  const CURRENT_KEY = "truco.current.v1";

  let config = TrucoDB.getConfig();
  let match = loadCurrentMatch();
  let selectedValue = 1;

  const $ = function (sel) {
    return document.querySelector(sel);
  };
  const $$ = function (sel) {
    return Array.prototype.slice.call(document.querySelectorAll(sel));
  };

  // ---------- Persistência da partida em andamento ----------
  function loadCurrentMatch() {
    try {
      const raw = localStorage.getItem(CURRENT_KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) {
      /* ignore */
    }
    return Truco.createMatch({ nosName: config.nosName, elesName: config.elesName });
  }

  function persistCurrent() {
    localStorage.setItem(CURRENT_KEY, JSON.stringify(match));
  }

  // ---------- Pontuação ----------
  function score(team, amount, opts) {
    if (Truco.isFinished(match)) return;
    const wasScoreless = Truco.isScoreless(match);
    const prevEles = match.scores.eles;
    const before = match.scores[team];
    Truco.addPoints(match, team, amount, opts);
    const applied = match.scores[team] - before;

    const options = opts || {};
    if (applied > 0 && !options.hidden) {
      if (team === "nos") {
        TrucoAudio.play(config, applied);
      } else if (!Truco.isFinished(match)) {
        // Áudios de "tento perdido" quando Eles pontua (derrota tratada no fim).
        if (Truco.crossedHalf(prevEles, match.scores.eles)) {
          TrucoAudio.play(config, "perdido2"); // Eles chegou/passou a metade
        } else if (wasScoreless) {
          TrucoAudio.play(config, "perdido1"); // Eles pontuou primeiro
        }
      }
    }
    persistCurrent();
    renderScoreboard();
    if (Truco.isFinished(match)) onMatchEnd();
  }

  function correct(team) {
    if (Truco.isFinished(match)) return;
    Truco.addPoints(match, team, -1);
    persistCurrent();
    renderScoreboard();
  }

  function undo() {
    Truco.undo(match);
    persistCurrent();
    renderScoreboard();
    $("#winner-overlay").classList.remove("show");
  }

  function newMatch() {
    config = TrucoDB.getConfig();
    match = Truco.createMatch({ nosName: config.nosName, elesName: config.elesName });
    persistCurrent();
    renderScoreboard();
    $("#winner-overlay").classList.remove("show");
  }

  function onMatchEnd() {
    TrucoDB.saveMatch(match).then(renderRanking);
    const name = match.teams[match.winner];
    $("#winner-name").textContent = name;
    $("#winner-overlay").classList.add("show");
    // Vitória do Nós: o áudio do ponto já tocou em score().
    // Derrota para o Eles: toca o "tento perdido 3".
    if (match.winner === "eles") TrucoAudio.play(config, "perdido3");
  }

  // ---------- Render: placar ----------
  function renderScoreboard() {
    $("#name-nos").textContent = match.teams.nos;
    $("#name-eles").textContent = match.teams.eles;
    $("#score-nos").textContent = match.scores.nos;
    $("#score-eles").textContent = match.scores.eles;

    const heat = Truco.handOfEleven(match);
    $("#panel-nos").classList.toggle("hand-eleven", heat === "nos");
    $("#panel-eles").classList.toggle("hand-eleven", heat === "eles");
    $("#hand-of-eleven").classList.toggle("show", !!heat);
    if (heat) $("#hand-of-eleven").textContent = "Mão de Onze — " + match.teams[heat] + "!";

    $$(".value-chip").forEach(function (chip) {
      chip.classList.toggle("active", Number(chip.dataset.value) === selectedValue);
    });
  }

  // ---------- Render: ranking + histórico ----------
  function fmtDate(ts) {
    if (!ts) return "";
    const d = new Date(ts);
    return d.toLocaleDateString("pt-BR") + " " + d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  }

  function renderRanking() {
    return TrucoDB.getMatches().then(function (matches) {
      const ranking = Truco.buildRanking(matches);
      const rankEl = $("#ranking-list");
      if (!ranking.length) {
        rankEl.innerHTML = '<li class="empty">Nenhuma partida finalizada ainda.</li>';
      } else {
        rankEl.innerHTML = ranking
          .map(function (r, i) {
            const pct = Math.round(r.winRate * 100);
            return (
              '<li><span class="pos">' +
              (i + 1) +
              "</span>" +
              '<span class="rk-name">' +
              escapeHtml(r.name) +
              "</span>" +
              '<span class="rk-stats">' +
              r.wins +
              "V · " +
              r.losses +
              "D · " +
              pct +
              "%</span></li>"
            );
          })
          .join("");
      }

      const histEl = $("#history-list");
      if (!matches.length) {
        histEl.innerHTML = '<li class="empty">Sem histórico.</li>';
      } else {
        histEl.innerHTML = matches
          .slice(0, 50)
          .map(function (m) {
            const winNos = m.winner === "nos";
            return (
              '<li><span class="h-teams">' +
              escapeHtml(m.teams.nos) +
              " <b>" +
              m.scores.nos +
              "</b> × <b>" +
              m.scores.eles +
              "</b> " +
              escapeHtml(m.teams.eles) +
              "</span>" +
              '<span class="h-win ' +
              (winNos ? "nos" : "eles") +
              '">🏆 ' +
              escapeHtml(m.teams[m.winner] || "—") +
              "</span>" +
              '<span class="h-date">' +
              fmtDate(m.finishedAt) +
              "</span></li>"
            );
          })
          .join("");
      }
    });
  }

  function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  // ---------- Config / áudios ----------
  function renderConfig() {
    $("#cfg-nos").value = config.nosName;
    $("#cfg-eles").value = config.elesName;
    $("#cfg-sound").checked = config.sound;
    $("#cfg-prank-zona").checked = config.pranks.zona;
    $("#cfg-prank-long").checked = config.pranks.long;
    $("#cfg-prank-code").checked = config.pranks.code;
    renderAudioList();
  }

  function renderAudioList() {
    return TrucoDB.getAudios().then(function (audios) {
      const byId = {};
      audios.forEach(function (a) {
        byId[a.id] = a;
      });
      const slots = ["default", "1", "3", "6", "9", "12", "perdido1", "perdido2", "perdido3"];
      const labels = {
        default: "Padrão",
        "1": "1 ponto",
        "3": "Truco (3)",
        "6": "Retruco (6)",
        "9": "Nove",
        "12": "Doze",
        perdido1: "Tento perdido 1",
        perdido2: "Tento perdido 2",
        perdido3: "Tento perdido 3",
      };
      $("#audio-slots").innerHTML = slots
        .map(function (slot) {
          const current = config.audioMap[slot];
          const options =
            '<option value="">— nenhum —</option>' +
            audios
              .map(function (a) {
                return '<option value="' + a.id + '"' + (a.id === current ? " selected" : "") + ">" + escapeHtml(a.name) + "</option>";
              })
              .join("");
          return (
            '<div class="audio-slot"><label>' +
            labels[slot] +
            '</label><select data-slot="' +
            slot +
            '">' +
            options +
            "</select>" +
            '<button class="mini" data-preview="' +
            slot +
            '" type="button">▶</button></div>'
          );
        })
        .join("");

      $("#audio-library").innerHTML = audios.length
        ? audios
            .map(function (a) {
              return (
                '<li><span>' +
                escapeHtml(a.name) +
                '</span><button class="mini danger" data-del-audio="' +
                a.id +
                '" type="button">🗑</button></li>'
              );
            })
            .join("")
        : '<li class="empty">Nenhum áudio importado.</li>';
    });
  }

  function importAudioFiles(files) {
    const tasks = Array.prototype.map.call(files, function (file) {
      const audio = {
        id: "a_" + Date.now() + "_" + Math.random().toString(36).slice(2, 7),
        name: file.name.replace(/\.[^.]+$/, ""),
        type: file.type,
        blob: file,
      };
      return TrucoDB.saveAudio(audio);
    });
    return Promise.all(tasks).then(renderAudioList);
  }

  function saveConfigFromForm() {
    config.nosName = $("#cfg-nos").value.trim() || "Nós";
    config.elesName = $("#cfg-eles").value.trim() || "Eles";
    config.sound = $("#cfg-sound").checked;
    config.pranks.zona = $("#cfg-prank-zona").checked;
    config.pranks.long = $("#cfg-prank-long").checked;
    config.pranks.code = $("#cfg-prank-code").checked;
    TrucoDB.saveConfig(config);
  }

  // ---------- Navegação ----------
  function showScreen(name) {
    $$(".screen").forEach(function (s) {
      s.classList.toggle("active", s.id === "screen-" + name);
    });
    $$(".tab").forEach(function (t) {
      t.classList.toggle("active", t.dataset.screen === name);
    });
    if (name === "ranking") renderRanking();
    if (name === "config") renderConfig();
  }

  // ---------- Eventos ----------
  function bind() {
    $("#btn-plus-nos").addEventListener("click", function () {
      score("nos", selectedValue);
    });
    $("#btn-plus-eles").addEventListener("click", function () {
      score("eles", selectedValue);
    });
    $("#btn-minus-nos").addEventListener("click", function () {
      correct("nos");
    });
    $("#btn-minus-eles").addEventListener("click", function () {
      correct("eles");
    });
    $("#btn-undo").addEventListener("click", undo);
    $("#btn-new").addEventListener("click", newMatch);
    $("#btn-new-overlay").addEventListener("click", newMatch);

    $$(".value-chip").forEach(function (chip) {
      chip.addEventListener("click", function () {
        selectedValue = Number(chip.dataset.value);
        renderScoreboard();
      });
    });

    $$(".tab").forEach(function (tab) {
      tab.addEventListener("click", function () {
        showScreen(tab.dataset.screen);
      });
    });

    // Config form
    ["#cfg-nos", "#cfg-eles"].forEach(function (sel) {
      $(sel).addEventListener("change", function () {
        saveConfigFromForm();
        renderScoreboard();
      });
    });
    ["#cfg-sound", "#cfg-prank-zona", "#cfg-prank-long", "#cfg-prank-code"].forEach(function (sel) {
      $(sel).addEventListener("change", saveConfigFromForm);
    });

    $("#audio-input").addEventListener("change", function (e) {
      if (e.target.files && e.target.files.length) importAudioFiles(e.target.files);
      e.target.value = "";
    });

    $("#audio-slots").addEventListener("change", function (e) {
      const slot = e.target.dataset.slot;
      if (slot) {
        config.audioMap[slot] = e.target.value || null;
        TrucoDB.saveConfig(config);
      }
    });
    $("#audio-slots").addEventListener("click", function (e) {
      const slot = e.target.dataset.preview;
      // pickId faz String(slot); passar a chave crua serve para números e perdidoN.
      if (slot) TrucoAudio.play(Object.assign({}, config, { sound: true }), slot);
    });
    $("#audio-library").addEventListener("click", function (e) {
      const id = e.target.dataset.delAudio;
      if (!id) return;
      Object.keys(config.audioMap).forEach(function (k) {
        if (config.audioMap[k] === id) config.audioMap[k] = null;
      });
      TrucoDB.saveConfig(config);
      TrucoAudio.invalidate(id);
      TrucoDB.deleteAudio(id).then(renderAudioList);
    });

    $("#btn-clear-history").addEventListener("click", function () {
      if (confirm("Apagar todo o histórico e ranking?")) {
        TrucoDB.clearMatches().then(renderRanking);
      }
    });

    // Pegadinhas
    TrucoPranks.init(
      { zone: $("#prank-zone"), long: $("#name-nos"), code: $("#brand") },
      function () {
        return config.pranks;
      },
      function (source) {
        score("nos", 1, { hidden: true, source: source });
      }
    );
  }

  function init() {
    bind();
    renderScoreboard();
    renderRanking();
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("sw.js").catch(function () {});
    }
  }

  document.addEventListener("DOMContentLoaded", init);
})();
