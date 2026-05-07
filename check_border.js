const Jimp = require('jimp');

async function check(file) {
  const image = await Jimp.read(file);
  const width = image.bitmap.width;
  const height = image.bitmap.height;
  
  let left = width, right = 0, top = height, bottom = 0;
  
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const color = image.getPixelColor(x, y);
      const rgba = Jimp.intToRGBA(color);
      // Check if it's NOT white
      if (rgba.r < 250 || rgba.g < 250 || rgba.b < 250 || rgba.a < 255) {
        if (x < left) left = x;
        if (x > right) right = x;
        if (y < top) top = y;
        if (y > bottom) bottom = y;
      }
    }
  }
  
  console.log(`${file}: Non-white bounds -> left: ${left}, right: ${right}, top: ${top}, bottom: ${bottom}, width: ${right - left + 1}, height: ${bottom - top + 1}`);
}

async function run() {
  await check('public/images/meet-fans.png');
  await check('public/images/event-experience.png');
  await check('public/images/culture-fun.png');
  await check('public/images/browse-collections.png');
}

run();
