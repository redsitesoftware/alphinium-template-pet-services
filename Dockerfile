FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install --legacy-peer-deps
COPY . .
RUN npx expo export --platform web --output-dir dist
RUN sed -i 's|</body>|    <!-- ChatInstance AI Widget -->\n    <script>\n      window.CHAT_CONFIG = {\n        user_id: "ci_21fa36fe34d8a20ab382864b3f03e5c8",\n        agent_name: "Pawfect AI",\n        theme: { primary_color: "#0F766E", button_position: "bottom-right" }\n      };\n    </script>\n    <script src="https://api.chatinstance.com/widget/popup-chat.js" defer></script>\n  </body>|' dist/index.html

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
