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

## 部署联机服务器（一次性，约 10 分钟）
1. 浏览器打开（把用户名和仓库名换成你的）：
   `https://deploy.workers.cloudflare.com/?url=https://github.com/你的用户名/你的仓库名/tree/main/worker`
2. 注册 / 登录 Cloudflare（免费），按提示连接 GitHub，点 **Deploy**。
   Cloudflare 会在你的 GitHub 里复制一个新仓库并自动部署。
3. 部署完成后会得到一个地址，形如 `guandan-relay.xxxx.workers.dev`。
4. 打开游戏 → 选「线上：创建房间」→ 服务器一栏填这个地址 → 创建房间 → 复制链接发给朋友。

备用方法（按钮不好用时，在 Mac 终端里）：
```
cd worker
npx wrangler login
npx wrangler deploy
```
（需要先装 Node.js：https://nodejs.org）

## 国内玩家
`workers.dev` 在国内常被屏蔽：国内玩家开 VPN（建议全局模式）即可。以后想免 VPN，可以给 Worker 绑定自己的域名，游戏里把服务器地址换成新域名就行。
