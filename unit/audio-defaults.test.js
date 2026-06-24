const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.join(__dirname, "..");
const read = (p) => fs.readFileSync(path.join(root, p), "utf8");

test("os 3 mp3 padrão existem no bundle", () => {
  ["audio/panico-na-tv.mp3", "audio/byd.mp3", "audio/mestre-alborghetti.mp3"].forEach((f) => {
    assert.ok(fs.existsSync(path.join(root, f)), `faltando: ${f}`);
  });
});

test("db.js mapeia os slots de tento perdido para os áudios embutidos", () => {
  const db = read("js/db.js");
  // Cada built-in declarado com seu arquivo.
  assert.match(db, /builtin_panico[^]*?audio\/panico-na-tv\.mp3/);
  assert.match(db, /builtin_byd[^]*?audio\/byd\.mp3/);
  assert.match(db, /builtin_mestre[^]*?audio\/mestre-alborghetti\.mp3/);
  // Mapeamento default dos slots: 1=Pânico, 2=BYD, 3=Mestre.
  assert.match(db, /perdido1:\s*"builtin_panico"/);
  assert.match(db, /perdido2:\s*"builtin_byd"/);
  assert.match(db, /perdido3:\s*"builtin_mestre"/);
});

test("audio.js sabe tocar embutidos pelo caminho (src)", () => {
  assert.match(read("js/audio.js"), /audio\.src/);
});

test("app.js semeia os defaults em configs antigas uma única vez", () => {
  const app = read("js/app.js");
  assert.match(app, /ensureAudioDefaults/);
  assert.match(app, /audioDefaultsV1/);
});

test("service worker cacheia os mp3 padrão para uso offline", () => {
  const sw = read("sw.js");
  ["audio/panico-na-tv.mp3", "audio/byd.mp3", "audio/mestre-alborghetti.mp3"].forEach((f) => {
    assert.ok(sw.includes(f), `sw.js não cacheia ${f}`);
  });
});
