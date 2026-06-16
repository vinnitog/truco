const test = require("node:test");
const assert = require("node:assert/strict");
const Truco = require("../js/truco.js");

test("createMatch usa nomes padrão e zera placar", () => {
  const m = Truco.createMatch();
  assert.equal(m.teams.nos, "Nós");
  assert.equal(m.teams.eles, "Eles");
  assert.deepEqual(m.scores, { nos: 0, eles: 0 });
  assert.equal(m.winner, null);
  assert.equal(m.events.length, 0);
});

test("createMatch aceita nomes customizados e ignora vazios", () => {
  const m = Truco.createMatch({ nosName: "Dupla A", elesName: "   " });
  assert.equal(m.teams.nos, "Dupla A");
  assert.equal(m.teams.eles, "Eles");
});

test("addPoints soma e registra evento", () => {
  const m = Truco.createMatch();
  Truco.addPoints(m, "nos", 3);
  assert.equal(m.scores.nos, 3);
  assert.equal(m.events.length, 1);
  assert.equal(m.events[0].amount, 3);
  assert.equal(m.events[0].hidden, false);
});

test("addPoints marca pegadinha como hidden", () => {
  const m = Truco.createMatch();
  Truco.addPoints(m, "nos", 1, { hidden: true, source: "prank-zona" });
  assert.equal(m.events[0].hidden, true);
  assert.equal(m.events[0].source, "prank-zona");
});

test("placar nunca fica negativo", () => {
  const m = Truco.createMatch();
  Truco.addPoints(m, "eles", -5);
  assert.equal(m.scores.eles, 0);
  // nenhum evento aplicado porque amount efetivo foi 0
  assert.equal(m.events.length, 0);
});

test("atingir 12 define vencedor e trava novos pontos", () => {
  const m = Truco.createMatch();
  Truco.addPoints(m, "nos", 12);
  assert.equal(m.winner, "nos");
  assert.ok(m.finishedAt);
  Truco.addPoints(m, "eles", 6);
  assert.equal(m.scores.eles, 0, "não pontua após o fim");
});

test("clamp no teto de 12", () => {
  const m = Truco.createMatch();
  Truco.addPoints(m, "nos", 9);
  Truco.addPoints(m, "nos", 9);
  assert.equal(m.scores.nos, 12);
  assert.equal(m.winner, "nos");
});

test("undo reverte último evento", () => {
  const m = Truco.createMatch();
  Truco.addPoints(m, "nos", 3);
  Truco.addPoints(m, "eles", 1);
  Truco.undo(m);
  assert.equal(m.scores.eles, 0);
  assert.equal(m.scores.nos, 3);
  assert.equal(m.events.length, 1);
});

test("undo desfaz a vitória se o placar cair abaixo de 12", () => {
  const m = Truco.createMatch();
  Truco.addPoints(m, "nos", 12);
  assert.equal(m.winner, "nos");
  Truco.undo(m);
  assert.equal(m.winner, null);
  assert.equal(m.finishedAt, null);
  assert.equal(m.scores.nos, 0);
});

test("undo em partida vazia é seguro", () => {
  const m = Truco.createMatch();
  Truco.undo(m);
  assert.equal(m.scores.nos, 0);
});

test("handOfEleven detecta mão de onze", () => {
  const m = Truco.createMatch();
  Truco.addPoints(m, "nos", 9);
  Truco.addPoints(m, "nos", 2);
  assert.equal(m.scores.nos, 11);
  assert.equal(Truco.handOfEleven(m), "nos");
});

test("addPoints rejeita time inválido", () => {
  const m = Truco.createMatch();
  assert.throws(() => Truco.addPoints(m, "outro", 1), /Time inválido/);
});

test("buildRanking agrega vitórias e ordena", () => {
  const matches = [
    { teams: { nos: "A", eles: "B" }, winner: "nos" },
    { teams: { nos: "A", eles: "C" }, winner: "nos" },
    { teams: { nos: "B", eles: "C" }, winner: "eles" },
    { teams: { nos: "D", eles: "A" }, winner: null },
  ];
  const ranking = Truco.buildRanking(matches);
  assert.equal(ranking[0].name, "A");
  assert.equal(ranking[0].wins, 2);
  assert.equal(ranking[0].played, 2);
  const c = ranking.find((r) => r.name === "C");
  assert.equal(c.wins, 1);
  assert.equal(c.losses, 1);
  assert.equal(c.played, 2);
});

test("buildRanking ignora partidas sem vencedor", () => {
  const ranking = Truco.buildRanking([{ teams: { nos: "A", eles: "B" }, winner: null }]);
  assert.equal(ranking.length, 0);
});
