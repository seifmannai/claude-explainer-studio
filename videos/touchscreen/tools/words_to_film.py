# words_to_film.py - turn the PC's WhisperX word list ([{w,t,end,f,s}], s = script line) into the film's words.json
# ({words, sentences, dur}) + words-data.js + voice/words.json (VideoHub transcript).
#   python words_to_film.py <pc_words.json> <voice.wav> <script.txt> <film_dir>
import json, sys, os, wave
src, wav, script, film = sys.argv[1:5]
W = json.load(open(src, encoding='utf-8'))
with wave.open(wav) as f: dur = f.getnframes() / f.getframerate()
lines = [l.split('|')[0] for l in open(script, encoding='utf-8') if l.strip() and not l.startswith('#')]
words = [{'w': w['w'], 't': round(w['t'], 3), 'end': round(w.get('end', w['t'] + 0.3), 3), 's': w['s']} for w in W]
sents = []
for i, text in enumerate(lines):
    ws = [w for w in words if w['s'] == i]
    sents.append({'s': i, 'text': text, 't': ws[0]['t'], 'end': ws[-1]['end']})
out = {'words': words, 'sentences': sents, 'dur': round(dur + 0.6, 3), 'source': 'user voice (Chatterbox clone), WhisperX words'}
json.dump(out, open(os.path.join(film, 'words.json'), 'w'), indent=0)
open(os.path.join(film, 'words-data.js'), 'w').write('// generated from words.json. Re-voice: replace words.json and re-run tools/words_to_film.py\nwindow.WORDS = ' + json.dumps(out) + ';\n')
os.makedirs(os.path.join(film, 'voice'), exist_ok=True)
json.dump([[w['t'], w['end'], w['w']] for w in words], open(os.path.join(film, 'voice', 'words.json'), 'w'))
print('words', len(words), 'sentences', len(sents), 'dur', out['dur'])
