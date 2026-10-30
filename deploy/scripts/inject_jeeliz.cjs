const fs = require('fs');
const path = require('path');

const baseDir = path.join(__dirname, '..', 'public', 'jeelizFaceFilter', 'demos', 'threejs');
const outputJsonPath = path.join(__dirname, '..', 'src', 'utils', 'jeelizFilters.json');

const filters = [];

const injectScript = `
    <!-- KICOE BOOTH BRIDGE SCRIPT -->
    <style>
      body {
        margin: 0 !important;
        padding: 0 !important;
        overflow: hidden !important;
        background: black !important;
        background-image: none !important;
      }
      canvas {
        position: absolute !important;
        top: 50% !important;
        left: 50% !important;
        width: 100vmax !important;
        height: 100vmax !important;
        transform: translate(-50%, -50%) rotateY(180deg) !important;
        margin: 0 !important;
        max-width: none !important;
        max-height: none !important;
      }
      a[href*="github.com"], #github-corner, .github-corner {
        display: none !important;
      }
    </style>
    <script>
      window.addEventListener('message', function(e) {
        if (e.data === 'CAPTURE') {
          var canvas = document.getElementById('jeeFaceFilterCanvas');
          if (!canvas) canvas = document.getElementsByTagName('canvas')[0];
          if (canvas) {
            var dataUrl = canvas.toDataURL('image/jpeg', 0.9);
            window.parent.postMessage({ type: 'CAPTURED_PHOTO', dataUrl: dataUrl }, '*');
          }
        }
      });
    </script>
`;

function processDirectory(dir) {
  if (!fs.existsSync(dir)) {
    console.log("Directory not found:", dir);
    return;
  }
  const items = fs.readdirSync(dir);
  
  items.forEach(item => {
    const itemPath = path.join(dir, item);
    const stat = fs.statSync(itemPath);
    
    if (stat.isDirectory()) {
      const indexPath = path.join(itemPath, 'index.html');
      if (fs.existsSync(indexPath)) {
        console.log("Processing " + item + "...");
        let html = fs.readFileSync(indexPath, 'utf8');
        
        if (html.includes('</head>')) {
          // Remove old injection if exists
          html = html.replace(/<!-- KICOE BOOTH BRIDGE SCRIPT -->[\s\S]*?<\/script>\n/, '');
          
          html = html.replace('</head>', injectScript + '\n  </head>');
          fs.writeFileSync(indexPath, html, 'utf8');
        }
        
        if (html.includes('KICOE BOOTH BRIDGE SCRIPT')) {
          filters.push({ id: "jeeliz_" + item, name: item.replace(/_/g, ' '), path: "/jeelizFaceFilter/demos/threejs/" + item + "/index.html" });
        }
      }
    }
  });
}

processDirectory(baseDir);

fs.writeFileSync(outputJsonPath, JSON.stringify(filters, null, 2));
console.log("Processed " + filters.length + " filters and wrote to src/utils/jeelizFilters.json");
