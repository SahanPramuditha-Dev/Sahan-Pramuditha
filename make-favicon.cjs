const fs = require('fs');
const img = fs.readFileSync('public/profile.jpg');
const b64 = img.toString('base64');
const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
<defs>
  <clipPath id="c">
    <circle cx="50" cy="50" r="50"/>
  </clipPath>
</defs>
<image width="100" height="100" preserveAspectRatio="xMidYMid slice" href="data:image/jpeg;base64,${b64}" clip-path="url(#c)"/>
</svg>`;
fs.writeFileSync('public/profile-favicon.svg', svg);
console.log("Done");
