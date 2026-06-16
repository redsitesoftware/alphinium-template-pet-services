FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install --legacy-peer-deps
COPY . .
RUN npx expo export --platform web --output-dir dist && cp web/auth-popup.html dist/auth-popup.html
RUN awk '/^<\/body>/{print "    <!-- ChatInstance AI Widget -->"; print "    <script>"; print "      window.CHAT_CONFIG = {"; print "        user_id: \"ci_21fa36fe34d8a20ab382864b3f03e5c8\","; print "        agent_name: \"Pawfect AI\","; print "        theme: { primary_color: \"#0F766E\", button_position: \"bottom-right\" }"; print "      };"; print "    </script>"; print "    <script src=\"https://api.chatinstance.com/widget/popup-chat.js\" defer></script>"} {print}' dist/index.html > dist/index.html.tmp && mv dist/index.html.tmp dist/index.html && echo "Widget injected"

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
