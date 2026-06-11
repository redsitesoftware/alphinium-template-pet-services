const fs = require('fs');
const path = require('path');

const htmlPath = path.join(__dirname, 'dist', 'index.html');
let html = fs.readFileSync(htmlPath, 'utf8');

const widget = `    <!-- ChatInstance AI Widget -->
    <script>
      window.CHAT_CONFIG = {
        user_id: "ci_21fa36fe34d8a20ab382864b3f03e5c8",
        agent_name: "Pawfect AI",
        theme: { primary_color: "#0F766E", button_position: "bottom-right" }
      };
    </script>
    <script src="https://api.chatinstance.com/widget/popup-chat.js" defer></script>
`;

if (html.includes('popup-chat.js')) {
  console.log('ChatInstance already present, skipping.');
  process.exit(0);
}

html = html.replace('</body>', widget + '</body>');
fs.writeFileSync(htmlPath, html);
console.log('ChatInstance widget injected into dist/index.html');
