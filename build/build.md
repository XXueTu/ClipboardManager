# 安装 create-dmg 工具
brew install create-dmg

hdiutil create -volname "Sid" -srcfolder "Sid.app" -ov -format UDZO "Sid.dmg"

# 创建 DMG 文件
create-dmg \
  --volname "Sid" \
  --background "path/to/background.png" \
  --window-pos 200 120 \
  --window-size 800 400 \
  --icon-size 100 \
  --icon "Sid.app" 200 190 \
  --hide-extension "Sid.app" \
  --app-drop-link 600 185 \
  "Sid.dmg" \
  "Sid.app"