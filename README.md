# 离线掼蛋

单机 + 线上联机的掼蛋网页游戏。单机完全不用网络；线上模式通过你自己的 Cloudflare 免费中转服务器联机。

## 文件
- `index.html` 游戏本体（规则、电脑 AI、界面、联机都在这一个文件里）
- `sw.js`、`manifest.webmanifest`、图标：离线缓存和“添加到主屏幕”用
- `worker/` 联机中转服务器（部署到 Cloudflare，只转发消息，牌局在房主设备上运行）

## 在 iPhone / iPad / Mac 上离线玩
1. 有网时用 Safari 打开本仓库的 GitHub Pages 地址。
2. iPhone/iPad：分享 →「添加到主屏幕」；Mac：文件 →「添加到程序坞」。
3. 从图标打开一次，之后飞行模式也能玩单机。

## 联机服务器（Cloudflare）
仓库根目录的 `wrangler.toml` 告诉 Cloudflare：同一个地址既提供游戏网页，也运行 `worker/` 里的联机中转。
- Cloudflare 后台把这个仓库连接到名为 `guandan` 的 Worker 后，每次往仓库上传新文件都会自动重新部署。
- 检查是否正常：浏览器打开 `https://你的地址/relay`，应显示 `guandan relay ok`。
- 游戏里「设置 → 联机服务器 → 测试」也能检查。

## 国内玩家
`workers.dev` 在国内常被屏蔽：国内玩家开 VPN（建议全局模式）即可。以后想免 VPN，可以给 Worker 绑定自己的域名。
