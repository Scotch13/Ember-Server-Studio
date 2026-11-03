import struct
import zlib
from pathlib import Path
root = Path(__file__).resolve().parents[1] / 'assets'
root.mkdir(exist_ok=True)
letter = [(79,56),(185,56),(175,87),(112,87),(104,113),(161,113),(152,143),(94,143),(85,172),(152,172),(142,203),(41,203)]
spark = [(195,42),(215,52),(207,72),(187,63)]
def inside(x, y, polygon):
    result = False
    j = len(polygon) - 1
    for i, (xi, yi) in enumerate(polygon):
        xj, yj = polygon[j]
        if (yi > y) != (yj > y) and x < (xj-xi)*(y-yi)/(yj-yi)+xi:
            result = not result
        j = i
    return result
def chunk(kind, data):
    return struct.pack('>I', len(data)) + kind + data + struct.pack('>I', zlib.crc32(kind+data) & 0xffffffff)
raw = bytearray()
for y in range(256):
    raw.append(0)
    for x in range(256):
        cx = max(67, min(189, x))
        cy = max(67, min(189, y))
        alpha = 255 if (x-cx)**2+(y-cy)**2 < 57**2 else 0
        f = (x+y)/510
        color = (int(255-f*90),int(110-f*85),int(115-f*56),alpha)
        if inside(x,y,letter): color = (255,255,255,255)
        if inside(x,y,spark): color = (255,223,227,255)
        raw.extend(color)
png = b'\x89PNG\r\n\x1a\n' + chunk(b'IHDR',struct.pack('>IIBBBBB',256,256,8,6,0,0,0)) + chunk(b'IDAT',zlib.compress(raw)) + chunk(b'IEND',b'')
(root/'ember.png').write_bytes(png)
(root/'ember.ico').write_bytes(struct.pack('<HHH',0,1,1)+struct.pack('<BBBBHHII',0,0,0,0,1,32,len(png),22)+png)
