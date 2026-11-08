#!/bin/bash
# finish.sh "Title": one linear gain to -14 LUFS + -1 dBFS limiter, H.264 CRF 17 + AAC, freeze/black/loudness QA, qa sheet
set -e
TITLE="$1"; SLUG=$(echo "$TITLE" | tr ' ' '_' | tr -cd 'A-Za-z0-9_'); mkdir -p out
I=$(ffmpeg -hide_banner -i audio/mix.wav -af ebur128 -f null - 2>&1 | grep -E "^\s+I:" | tail -1 | awk '{print $2}')
G=$(python3 -c "print(round(-14 - ($I), 2))"); echo "mix integrated $I LUFS -> gain $G dB"
ffmpeg -v error -y -i audio/mix.wav -af "volume=${G}dB,alimiter=limit=0.85:attack=5:release=60:level=false" -ar 48000 -c:a pcm_s24le audio/final.wav
ffmpeg -v error -y -framerate 30 -i frames/f%04d.jpg -i audio/final.wav -map 0:v -map 1:a -c:v libx264 -preset veryfast -crf 17 -pix_fmt yuv420p \
  -c:a aac -b:a 192k -movflags +faststart -shortest -metadata title="$TITLE" "out/$SLUG.mp4"
echo "--- QA"; ffprobe -v error -show_entries stream=codec_name,width,height,r_frame_rate,nb_frames:format=duration -of compact "out/$SLUG.mp4"
ffmpeg -hide_banner -i "out/$SLUG.mp4" -vf "freezedetect=n=-60dB:d=0.4,blackdetect=d=0.05:pix_th=0.06" -af ebur128=peak=true -f null - 2>&1 | grep -E "freeze_(start|duration)|black_start|^\s+(I|LRA|Peak):" || true
ffmpeg -v error -y -i "out/$SLUG.mp4" -vf "fps=1/2,scale=216:384,tile=9x3" -frames:v 1 out/qa_sheet.jpg
echo "out/$SLUG.mp4"
