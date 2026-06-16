/**
 * Pegadinhas: somam +1 ao time "Nós" de forma discreta (sem áudio,
 * sem animação chamativa). Três gatilhos secretos, cada um ligável/desligável:
 *   - zona  : toque numa zona invisível no canto da tela
 *   - long  : toque longo (>= 650ms) no nome do time "Nós"
 *   - code  : sequência de 3 toques rápidos no logo/título
 *
 * init() recebe os elementos-alvo, a config e um callback onPrank(source).
 */
window.TrucoPranks = (function () {
  const LONG_PRESS_MS = 650;
  const CODE_TAPS = 3;
  const CODE_WINDOW_MS = 1500;
  const MOVE_TOLERANCE = 12; // px — cancela long-press se o dedo arrastar

  function attachZone(el, enabled, onPrank) {
    el.addEventListener(
      "pointerup",
      function (e) {
        if (!enabled()) return;
        e.stopPropagation();
        onPrank("prank-zona");
      },
      { passive: true }
    );
  }

  function attachLongPress(el, enabled, onPrank) {
    let timer = null;
    let startX = 0;
    let startY = 0;

    function clear() {
      if (timer) {
        clearTimeout(timer);
        timer = null;
      }
    }

    el.addEventListener("pointerdown", function (e) {
      if (!enabled()) return;
      startX = e.clientX;
      startY = e.clientY;
      clear();
      timer = setTimeout(function () {
        timer = null;
        onPrank("prank-long");
      }, LONG_PRESS_MS);
    });
    el.addEventListener("pointermove", function (e) {
      if (!timer) return;
      if (Math.abs(e.clientX - startX) > MOVE_TOLERANCE || Math.abs(e.clientY - startY) > MOVE_TOLERANCE) {
        clear();
      }
    });
    ["pointerup", "pointercancel", "pointerleave"].forEach(function (evt) {
      el.addEventListener(evt, clear);
    });
  }

  function attachCode(el, enabled, onPrank) {
    let taps = 0;
    let firstAt = 0;

    el.addEventListener("pointerup", function () {
      if (!enabled()) return;
      const now = Date.now();
      if (taps === 0 || now - firstAt > CODE_WINDOW_MS) {
        taps = 1;
        firstAt = now;
        return;
      }
      taps += 1;
      if (taps >= CODE_TAPS) {
        taps = 0;
        firstAt = 0;
        onPrank("prank-code");
      }
    });
  }

  function init(elements, getPranksConfig, onPrank) {
    if (elements.zone) {
      attachZone(elements.zone, function () {
        return getPranksConfig().zona;
      }, onPrank);
    }
    if (elements.long) {
      attachLongPress(elements.long, function () {
        return getPranksConfig().long;
      }, onPrank);
    }
    if (elements.code) {
      attachCode(elements.code, function () {
        return getPranksConfig().code;
      }, onPrank);
    }
  }

  return { init: init, LONG_PRESS_MS: LONG_PRESS_MS, CODE_TAPS: CODE_TAPS };
})();
