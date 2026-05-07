from PIL import Image
import sys

def print_ascii(file):
    im = Image.open(file).convert('L')
    im = im.resize((60, 30))
    chars = "@%#*+=-:. "
    
    for y in range(im.height):
        line = ""
        for x in range(im.width):
            val = im.getpixel((x, y))
            idx = int((val / 255.0) * (len(chars) - 1))
            line += chars[idx]
        print(line)

print_ascii('public/images/browse-collections.png')
