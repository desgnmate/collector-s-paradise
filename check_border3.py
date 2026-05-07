from PIL import Image
import sys

def scan_for_border(file):
    im = Image.open(file)
    pixels = im.load()
    print(f"File: {file}")
    for y in [0, 10, 50, 100, 200, 500]:
        print(f" y={y}: ", end="")
        for x in [0, 10, 50, 100]:
            print(f"x={x}:{pixels[x,y]} ", end="")
        print("")
        
scan_for_border('public/images/browse-collections.png')
