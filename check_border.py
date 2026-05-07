from PIL import Image

def check(file):
    im = Image.open(file)
    bg = Image.new(im.mode, im.size, im.getpixel((0,0)))
    bbox = im.getbbox() # this gets non-zero alpha, but maybe we have white bg
    
    # Let's get actual white borders
    left = im.width
    right = 0
    top = im.height
    bottom = 0
    
    pixels = im.load()
    for y in range(im.height):
        for x in range(im.width):
            p = pixels[x, y]
            # check if not pure white
            if p[0] < 250 or p[1] < 250 or p[2] < 250:
                if x < left: left = x
                if x > right: right = x
                if y < top: top = y
                if y > bottom: bottom = y
                
    print(f"{file}: left: {left}, right: {right}, top: {top}, bottom: {bottom}")

check('public/images/meet-fans.png')
check('public/images/event-experience.png')
check('public/images/culture-fun.png')
check('public/images/browse-collections.png')
