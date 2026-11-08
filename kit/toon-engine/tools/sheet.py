import sys, glob, os
from PIL import Image, ImageDraw
d, out = sys.argv[1], sys.argv[2]
fs = sorted(glob.glob(os.path.join(d, 'f*.jpg')))
cols = int(sys.argv[3]) if len(sys.argv) > 3 else 6
tw, th = 270, 480
rows = (len(fs) + cols - 1) // cols
S = Image.new('RGB', (cols * tw, rows * (th + 24)), (20, 20, 24)); D = ImageDraw.Draw(S)
for i, f in enumerate(fs):
    im = Image.open(f).resize((tw, th), Image.LANCZOS); x, y = (i % cols) * tw, (i // cols) * (th + 24)
    S.paste(im, (x, y + 24)); D.text((x + 6, y + 5), os.path.basename(f)[1:5], fill=(255, 255, 255))
S.save(out, quality=88); print(out, S.size)
