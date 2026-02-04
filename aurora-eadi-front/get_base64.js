const fs = require('fs');
const path = 'C:/Users/lucas.silva/.gemini/antigravity/brain/b660ed0e-956e-41fe-b3f7-8434404d89a9/uploaded_media_1769197953472.png';
const base64 = fs.readFileSync(path, {encoding: 'base64'});
console.log(base64);
