// cues.js - every event of the film, hung on a WORD of the voice (kit/timeline/words.js). Used by film.js (picture)
// and by tools/mix.py through node (sound), so picture and sound always agree. Re-voicing = new words.json, nothing else.
(function (g) {
  g.makeCues = function (WORDS) {
    const Wd = g.Words(WORDS.words), S = (i) => WORDS.sentences[i].t, E = (i) => WORDS.sentences[i].end;
    const at = (w, s, n) => Wd.at(w, s, n), end = (w, s, n) => Wd.end(w, s, n);
    const C = {
      DUR: WORDS.dur, S, E, at, end,
      // workshop (present)
      poke0: at('Meet', 0) - 0.05, poke0b: at('Dave', 0) + 0.15, fingerTap: at('feels', 1), fingerTap2: at('finger', 1) + 0.1,
      dream: at('pokes', 2) - 0.25, dreamPoke: at('back', 2),
      // 1965
      rw0: at('Problem', 3) - 0.1, rw1: end('sixty-five', 3) + 0.35,
      poke65: at('Screens', 4), poke65b: at('nothing', 4),
      engIn: S(5) - 0.2, engStop: at('radar', 5), engPoint: at('engineer', 5) + 0.1,
      field: at('Cover', 6), fieldFull: at('electricity', 6),
      xray: S(7), salt: at('salty', 7),
      touch65: S(8), steal: at('steals', 8), charge: at('charge', 8),
      notice: at('notices', 9), theft: at('theft', 9), yourTouch: at('touch', 9),
      scary: at('scary', 10), runOff: at('scary', 10) + 0.2,
      ff1a: E(10) + 0.05, ff1b: S(11) + 0.55,
      // 1977 resistive
      sheets: at('plastic', 11), gap: at('gap', 11),
      press: at('Press', 12), contact: at('touch', 12), circuit: at('circuit', 12), closes: at('closes', 12),
      wind: at('presses', 13), hit: end('hammer', 13) + 0.12, notHard: S(14), sideEye: at('Dave', 14),
      wp1a: S(15) - 0.42, wp1b: S(15) + 0.2,
      // 1983 infrared
      beams: at('grid', 15), beams2: at('light', 15),
      block: at('Block', 16), knows: at('knows', 16),
      flyIn: S(17) - 0.2, flyLand: at('lands', 17), del: at('lands', 17) + 0.45,
      fired: at('fired', 18),
      wp2a: S(19) - 0.42, wp2b: S(19) + 0.2,
      // 1996 stylus
      tap96: at('win', 19), pen: at('pen', 19), lost: at('loses', 20), four: at('four', 20), catPen: at('minutes', 20) + 0.25,
      wp3a: at('Then', 21) - 0.2, wp3b: end('seven', 21) + 0.2,
      // 2007 multi-touch
      steal07: at('stealing', 21), wires: at('grid', 22), thin: at('thin', 22), see: at('see', 22),
      ten: at('ten', 23), pinch: at('once', 23),
      winter: at('winter', 24), glove: at('Gloves', 25), nothing: at('Nothing', 25),
      wp4a: S(26) - 0.42, wp4b: S(26) + 0.2,
      // 2009 grease
      fries: S(26), smear: at('face', 26), grease1: at('grease', 26),
      coat: at('coat', 27), slide: at('slides', 27),
      wp5a: S(28) - 0.42, wp5b: S(28) + 0.2,
      // today
      stack: S(28), merge: at('built', 28), oled: at('OLED', 29), ownLight: at('own', 29),
      fold: at('fold', 30), wrongWay: end('fold', 30) + 0.12, snap: end('fold', 30) + 0.42, otherWay: S(31),
      final: S(32), buzz: at('pokes', 32) - 0.1, pokeBack: at('back', 32), scream: at('back', 32) + 0.15,
    };
    return C;
  };
})(typeof window !== 'undefined' ? window : globalThis);
