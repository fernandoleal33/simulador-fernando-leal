"""Generate installable PNG icons using Python standard library only."""
import struct
import zlib
from pathlib import Path

def chunk(tag, data):
    payload = tag + data
    return struct.pack(">I", len(data)) + payload + struct.pack(">I", zlib.crc32(payload) & 0xffffffff)

def icon(size, filename):
    rows = []
    for y in range(size):
        row = bytearray([0])
        for x in range(size):
            nx, ny = x / size, y / size
            color = (15, 23, 42)
            if .16 <= nx <= .84 and .16 <= ny <= .84:
                color = (6, 78, 59)
            if (.28 <= nx <= .72 and any(abs(ny - yy) < .023 for yy in (.37, .50, .63))):
                color = (255, 255, 255)
            if (nx-.67)**2+(ny-.64)**2 < .055**2:
                color = (244, 197, 66)
            row.extend((*color, 255))
        rows.append(bytes(row))
    raw = b"".join(rows)
    png = b"\x89PNG\r\n\x1a\n" + chunk(b"IHDR", struct.pack(">IIBBBBB", size, size, 8, 6, 0, 0, 0)) + chunk(b"IDAT", zlib.compress(raw, 9)) + chunk(b"IEND", b"")
    Path(filename).write_bytes(png)

for size in (192, 512, 180):
    icon(size, f"icon-{size}.png")
