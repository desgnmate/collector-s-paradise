from PIL import Image

def get_border(file):
    im = Image.open(file)
    pixels = im.load()
    print(f"Top-left pixel of {file}: {pixels[0,0]}")
    
get_border('public/images/meet-fans.png')
get_border('public/images/event-experience.png')
get_border('public/images/culture-fun.png')
get_border('public/images/browse-collections.png')
