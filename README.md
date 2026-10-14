# dsh-aris-glass

给 **DeepSeek Harness (DSH)** 的 Web 界面加一层**液态玻璃**：助手消息、左侧栏、标题栏菜单都带上毛玻璃底色，观感与用户气泡一致。

纯客户端插件，**只注入样式表**，不改动官方代码，不注册任何宿主服务。所有选择器都锚在**稳定的语义结构**上（`data-slot` / `data-windows-menu`），不用构建期哈希类名。

> 主要是为了让「壁纸模式下界面太素」或者「助手消息没有底板、字和壁纸糊在一起」的情况好看一点。

---

## 效果

| 位置 | 处理 |
| --- | --- |
| **助手消息正文** | 整块加毛玻璃底板 + 圆角 + 阴影（气泡内部的段落/标题/引用/列表取消各自的玻璃，避免叠糊；`pre` 代码块保留自己的底色） |
| **左侧栏** | 会话列表 + 插件/任务看板等面板行 + 品牌行 + 底部，整列改毛玻璃（原先是平的不透明填充） |
| **标题栏菜单** | 桌面端「应用 / 编辑」两个菜单按钮各成一块玻璃药丸（不是一整条石板） |

用户自己的消息气泡**不受影响**（它在 `[class*="userStack"]` 下，被显式排除）。

## 可调变量

写在任意能覆盖到页面的地方即可（例如皮肤/主题的自定义 CSS，或浏览器 DevTools）：

```css
:root {
  --aris-glass-alpha: .55;   /* 浅色主题底板不透明度，深色主题默认 .62 */
  --aris-glass-blur: 14px;   /* 毛玻璃模糊半径 */
}
```

调浓一点就把 alpha 往上加（`.72` 左右已经很实），想要更透就往下减。

## 安装

### 方式一：本地目录安装（推荐，profile 是 `desktop` 时唯一方式）

> `desktop` 是 Electron 应用**独占**的 profile，命令行 `dsh plugin --profile desktop …` 会被直接拒绝（"managed exclusively by the Electron application"）。所以走手工/脚本这条路。

1. 把本目录放到任意位置（例如 `~/.dsh/profiles/desktop/vendor/dsh-aris-glass`）。
2. 在该 profile 的 `package.json` 里加一条依赖，并登记 bundle：

   ```jsonc
   {
     "dependencies": {
       "dsh-aris-glass": "link:C:/Users/<你>/.dsh/profiles/desktop/vendor/dsh-aris-glass"
     },
     "dsh": {
       "profile": {
         "bundles": [
           // …既有条目…
           "dsh-aris-glass"
         ]
       }
     }
   }
   ```

3. 在 profile 目录跑一次 `pnpm install`（建出 `node_modules/dsh-aris-glass` 链接；Windows 上 junction 也行）。
4. **完全退出 DSH 再重开**（bundle 只在启动时组合，关窗口不算）。

### 方式二：从 GitHub 装（其它 profile / CLI 宿主）

```bash
dsh plugin --profile <profile> add github:xuelin632/dsh-aris-glass
```

`desktop` profile 不支持这条命令，原因见上。

> **依赖**：无。bundle 补丁只有一条 `insert`（挂自己），不会禁用或改写任何既有插件。

## 它是怎么实现的

- **助手消息**：`[data-slot="main.conversation"] [class*="markdown"]:not(:is([class*="userStack"] *))` —— 只命中助手的正文块，用户气泡里的 markdown 被 `:not(:is(...))` 排除。
- **左侧栏**：`div:has(> [data-slot="sidebar"])`。那个 slot 出口本身是 `display: contents`（不产生盒子），所以玻璃只能画在**父列**上。同一列上把 `--dsw-specific-sidebar-fill` 置为 `transparent`，列和壳里的每一层就一起透明，只剩 `::before` 那层板。
- **为什么用 `::before` 画玻璃**：非 `none` 的 `backdrop-filter` 会让元素成为其 `position: fixed` 后代的包含块——左侧栏的折叠按钮/新建会话按钮在 Windows 标题栏介入后是 fixed 的，板直接画在列上会把它们顶偏。伪元素没有后代，永远不会捕获它们。
- **标题栏菜单**：宿主是 `div[data-windows-menu]`，内容在**开放的 shadow root**（`preload-menu.js`）里，页面 CSS 够不到里面的按钮——所以那段样式是**从脚本写进 shadow root** 的，宿主本身保持透明。用一个长期存活的 `MutationObserver`（只观察 `body` 的 `childList`，不递归）在菜单宿主出现时补上。
- **与壁纸插件共存**：若检测到 `body[data-we-left-sidebar]`（壁纸插件的「左侧液态玻璃」开关打开），本插件的左侧栏底板会**主动让位**，避免两层色调叠加。
- **降级**：不支持 `backdrop-filter` 的浏览器、以及 `prefers-reduced-transparency: reduce`，都退回主题不透明底色。

## 卸载

- 从 profile 的 `dsh.profile.bundles` 里删掉 `dsh-aris-glass`（并可选删除 `dependencies` 那条与目录），重启即可；
- 或者保留文件、只在插件管理器里禁用。

## 兼容性

- 面向 DSH `0.2.0-rc` 一代的 Web 界面（`data-slot` / `data-windows-menu` 这套结构）。
- 不依赖任何 CSS 模块哈希类名，官方升级改了哈希也不会失效；但若官方改掉 `data-slot="sidebar"` / `data-slot="main.conversation"` 这类语义锚点，需要同步调整。
- 只用标准 CSS（`backdrop-filter`、`:has()`、`color-mix` 的替代表达），无 JS 依赖。

## 许可

MIT
