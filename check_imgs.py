
import os
import magic # if available, but let's use imghdr
import imghdr

path = r"C:\Users\kushw\.gemini\antigravity\brain\fc57b811-99c9-41eb-bc18-991523fcea64"
for f in os.listdir(path):
    if f.endswith('.png') or f.endswith('.webp'):
        fullpath = os.path.join(path, f)
        print(f"{f}: {imghdr.what(fullpath)} (Size: {os.path.getsize(fullpath)})")
