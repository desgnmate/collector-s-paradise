from PIL import Image

im = Image.open('public/images/browse-collections.png')
# crop 120 pixels from all sides
im_cropped = im.crop((120, 120, im.width - 120, im.height - 120))
im_cropped.save('public/images/browse-collections.png')
print("Cropped successfully")
