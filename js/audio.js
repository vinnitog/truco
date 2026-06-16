/**
 * Gerencia áudios customizados tocados quando o time "Nós" pontua.
 * Os arquivos ficam em IndexedDB (blobs); aqui só montamos object URLs
 * e tocamos conforme o valor da mão (1/3/6/9/12 ou default).
 */
window.TrucoAudio = (function () {
  const urlCache = {}; // id -> objectURL
  let current = null;

  function resolveUrl(id) {
    if (!id) return Promise.resolve(null);
    if (urlCache[id]) return Promise.resolve(urlCache[id]);
    return TrucoDB.getAudio(id).then(function (audio) {
      if (!audio || !audio.blob) return null;
      const url = URL.createObjectURL(audio.blob);
      urlCache[id] = url;
      return url;
    });
  }

  /**
   * Escolhe o áudio para o valor/evento. Pontos do "Nós" caem no default
   * quando não mapeados; os "tento perdido" (derrota) NÃO usam default,
   * para não tocar som de comemoração quando o Eles pontua.
   */
  function pickId(config, amount) {
    const map = config.audioMap || {};
    const key = String(amount);
    if (key.indexOf("perdido") === 0) return map[key] || null;
    return map[key] || map.default || null;
  }

  function play(config, amount) {
    if (!config.sound) return Promise.resolve(false);
    const id = pickId(config, amount);
    return resolveUrl(id).then(function (url) {
      if (!url) return false;
      stop();
      current = new Audio(url);
      current.play().catch(function () {
        /* autoplay pode ser bloqueado até primeira interação */
      });
      return true;
    });
  }

  function stop() {
    if (current) {
      current.pause();
      current.currentTime = 0;
      current = null;
    }
  }

  /** Limpa um object URL ao remover o áudio. */
  function invalidate(id) {
    if (urlCache[id]) {
      URL.revokeObjectURL(urlCache[id]);
      delete urlCache[id];
    }
  }

  return { play: play, stop: stop, pickId: pickId, invalidate: invalidate };
})();
