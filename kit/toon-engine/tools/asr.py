import sherpa_onnx, soundfile as sf, json, sys
d='/home/claude/asr/sherpa-onnx-zipformer-en-2023-06-26/'
rec=sherpa_onnx.OfflineRecognizer.from_transducer(encoder=d+'encoder-epoch-99-avg-1.int8.onnx',decoder=d+'decoder-epoch-99-avg-1.onnx',joiner=d+'joiner-epoch-99-avg-1.int8.onnx',tokens=d+'tokens.txt',num_threads=2,decoding_method='greedy_search')
a,sr=sf.read(sys.argv[1],dtype='float32')
# chunk at ~ silence points to keep each under ~15 s
cuts=[0.0,11.5,22.4,33.4,44.9,len(a)/sr]
words=[]
for s,e in zip(cuts[:-1],cuts[1:]):
    st=rec.create_stream(); st.accept_waveform(sr,a[int(s*sr):int(e*sr)]); rec.decode_stream(st)
    r=st.result
    cur=None
    for tok,t in zip(r.tokens,r.timestamps):
        if tok.startswith(' ') or cur is None:
            if cur: words.append(cur)
            cur={'w':tok.strip(),'t':round(s+t,3)}
        else: cur['w']+=tok
    if cur: words.append(cur)
    print(round(s,2),r.text)
json.dump(words,open('work/words_asr.json','w'),indent=0)
print(len(words))
