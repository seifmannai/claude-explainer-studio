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
      rush: at('Rush', 2), baby: at('Screaming', 2), brakes: at('Screeching', 2),
      taps: at('taps', 3), button: at('button', 3), whole: at('whole', 4), gone: at('disappears', 4),
      dive0: S(5) - 0.05, dive1: S(6) + 0.35,                       // push into the ear cup, cut to 3D
      // 3D: the exploded headphone
      explode: S(6) + 0.2, mic: at('microphone', 6), outside: at('outside', 6), listens: at('listens', 6),
      air: at('air', 7), waves: at('waves', 7),
      chip: at('chip', 8), copies: at('copies', 8), flips: at('flips', 8), upside: at('upside', 8),
      speaker: at('speaker', 9), plays: at('plays', 9), ear: at('ear', 9),
      hill: at('hill', 10), valley: at('valley', 10), cancel: at('cancel', 10),
      noisePlus: S(11), anti: at('anti-noise', 11), silence: at('silence', 11),
      mic2: at('second', 12), inside: at('inside', 12), checks: at('checks', 12), fixes: at('fixes', 12), thousands: at('thousands', 12),
      steady: at('steady', 13), engines: at('engines', 13),
      high: at('High', 14), tooFast: at('fast', 14),
      cushions: S(15) + 0.1, cushionWord: at('cushions', 15), block: at('block', 15),
      back0: S(16) - 0.12, back1: S(16) + 0.25,                     // out of the ear cup, back to the train
      nothing: at('nothing', 16), stop: at('stop', 17), notEven: S(17),
      loopA: Math.min(WORDS.dur - 0.45, end('stop', 17) + 0.55),
    };
  };
})(typeof window !== 'undefined' ? window : globalThis);
