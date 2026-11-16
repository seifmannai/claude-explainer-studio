// kit/timeline/words.js - hang every event on a WORD of the voice, never on hard-coded seconds (always-alive-3d rule).
//   const W = Words(wordsJson);  W.at('snap', 12)  -> start time (s) of "snap" in sentence 12 (sentence = script line index)
//   W.end('snap', 12), W.at('the', 15, 1) = 2nd "the" of sentence 15. Throws if the word is missing, so a script edit
//   can never silently move an event.
(function (g) {
  const clean = (x) => String(x).toLowerCase().replace(/[^a-z0-9'-]/g, '');
  g.Words = function (list) {
    const find = (word, s, n = 0) => { let k = 0; for (const w of list) if ((s == null || w.s === s) && clean(w.w) === clean(word) && k++ === n) return w;
      throw new Error(`word "${word}" (#${n}) not found in sentence ${s}`); };
    return { at: (w, s, n) => find(w, s, n).t, end: (w, s, n) => find(w, s, n).end ?? find(w, s, n).t + 0.3,
      sentence: (s) => list.filter((w) => w.s === s), list };
  };
})(typeof window !== 'undefined' ? window : globalThis);
