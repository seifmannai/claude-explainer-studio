// cues.js - every event of "How noise-cancelling headphones erase sound", hung on WORDS of the voice.
// Used by the picture (film.js, metro.js, hp3d.js) and the sound mix (tools/mix.py through node). Re-voice = new words.json.
(function (g) {
  g.makeCues = function (WORDS) {
    const Wd = g.Words(WORDS.words), S = (i) => WORDS.sentences[i].t, E = (i) => WORDS.sentences[i].end;
    const at = (w, s, n) => Wd.at(w, s, n), end = (w, s, n) => Wd.end(w, s, n);
    return {
      DUR: WORDS.dur, S, E, at, end,
      // 2D metro: the hook
      kill: at('kill', 0), more: at('more', 1), moreNoise: at('noise', 1),
      rush: 0.15, baby: Math.max(0.3, at('kill', 0) - 0.1), brakes: at('making', 1) - 0.1,       // the chaos is short: ~2 s (user note #1)
      taps: at('One', 2), button: at('tap', 2), whole: at('whole', 3), gone: at('disappears', 3),
      dive0: S(4) - 0.05, dive1: S(5) + 0.35,                       // push into the ear cup, cut to 3D
      // 3D: the exploded headphone
      explode: S(5) + 0.2, mic: at('microphone', 5), outside: at('outside', 5), listens: at('listens', 5),
      air: at('air', 6), waves: at('waves', 6),
      chip: at('chip', 7), copies: at('copies', 7), flips: at('flips', 7), upside: at('upside', 7),
      speaker: at('speaker', 8), plays: at('plays', 8), ear: at('ear', 8),
      hill: at('hill', 9), valley: at('valley', 9), cancel: at('cancel', 9),
      noisePlus: S(10), anti: at('anti-noise', 10), silence: at('silence', 10),
      mic2: at('second', 11), inside: at('inside', 11), checks: at('checks', 11), fixes: at('fixes', 11), thousands: at('thousands', 11),
      steady: at('steady', 12), engines: at('engines', 12),
      high: at('High', 13), tooFast: at('fast', 13),
      cushions: S(14) + 0.1, cushionWord: at('cushions', 14), block: at('block', 14),
      back0: S(15) - 0.12, back1: S(15) + 0.25,                     // out of the ear cup, back to the train
      nothing: at('nothing', 15), stop: at('stop', 16), notEven: S(16),
      loopA: Math.min(WORDS.dur - 0.45, end('stop', 16) + 0.55),
    };
  };
})(typeof window !== 'undefined' ? window : globalThis);
