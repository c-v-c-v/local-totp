# 本地 TOTP 验证器

纯前端、完全离线的 TOTP（Google Authenticator 兼容）验证器应用。

## 在线演示

🚀 **在线体验**: https://c-v-c-v.github.io/local-totp/

## 功能特性

✅ **完全离线运行** - 无需网络连接，所有计算在本地完成  
✅ **多密钥管理** - 支持添加、编辑、删除多个 TOTP 密钥  
✅ **实时验证码** - 自动生成并刷新 6 位验证码（30 秒周期）  
✅ **倒计时同步** - 所有卡片倒计时完全同步  
✅ **一键复制** - 点击卡片即可复制验证码到剪贴板  
✅ **URI 导入** - 支持从 otpauth:// URI 快速导入  
✅ **备份与恢复** - 支持加密/非加密导出，智能导入与冲突处理  
✅ **本地存储** - 数据保存在 LocalStorage，刷新不丢失  
✅ **响应式设计** - 自适应 PC、平板、移动端  

## 技术栈

- **框架**: Vue 3 + Composition API + TypeScript
- **构建工具**: Vite 5
- **测试框架**: Vitest
- **类型检查**: vue-tsc
- **算法**: HMAC-SHA1 (Web Crypto API)
- **存储**: LocalStorage (可扩展)

## 快速开始

### 安装依赖

```bash
npm install
```

### 开发模式

```bash
npm run dev
```

访问 http://localhost:3000

### 运行测试

```bash
# 运行所有测试
npm test

# 运行测试并生成报告
npm run test:run

# 测试 UI 界面
npm run test:ui

# TypeScript 类型检查
npm run type-check
```

### 生产构建

```bash
npm run build
```

### 部署

项目配置了 GitHub Actions 自动部署：

- 推送到 `main` 分支自动触发构建和部署
- 自动运行测试，测试通过后部署到 GitHub Pages
- 部署地址: https://c-v-c-v.github.io/local-totp/

手动部署：

```bash
npm run build
# 将 dist 目录部署到任意静态托管服务
```

## 使用说明

### 添加密钥

1. 点击列表中的"➕ 添加密钥"卡片
2. 选择输入方式：
   - **手动输入**：输入账户名称和 Base32 密钥
   - **URI 导入**：粘贴 `otpauth://totp/...` URI 并点击"解析"

### 复制验证码

直接点击任意卡片即可复制当前验证码，会显示"已复制"提示。

### 编辑/删除

点击卡片右上角的 ✏️ 编辑或 🗑️ 删除按钮。

### 导出备份

1. 点击顶部"📤 导出"按钮
2. 选择是否加密（推荐加密）：
   - **加密导出**：使用 AES-GCM 256 位加密，需设置强密码
   - **未加密导出**：直接导出 JSON，文件包含明文密钥
3. 点击"导出"自动下载备份文件

**安全提示**：
- 加密使用 PBKDF2 密钥派生（100,000 次迭代）
- 密码强度指示：弱/中/强
- 未加密文件包含明文密钥，请妥善保管

### 导入备份

1. 点击顶部"📥 导入"按钮
2. 选择备份 JSON 文件
3. 如果文件加密，输入密码并点击"预览"
4. 查看导入预览（包含密钥数量和重复项）
5. 选择冲突处理策略：
   - **跳过重复项**：保留现有密钥，跳过导入文件中的重复项
   - **覆盖现有**：用导入文件的密钥覆盖现有同名密钥
   - **保留两者**：将导入的密钥重命名为"名称 (导入)"
6. 点击"导入"完成

**导入特性**：
- 自动检测文件是否加密
- 密码错误可重试，不会关闭对话框
- 显示详细的导入统计（新增/跳过数量）

## 测试覆盖

项目包含 **110 个测试用例**，覆盖所有核心功能：

- ✅ **工具函数** - TOTP 算法、URI 解析、加密/解密、辅助函数
- ✅ **数据层** - LocalStorage CRUD 操作
- ✅ **组合式函数** - TOTP 生成、倒计时同步
- ✅ **UI 组件** - 所有组件的交互和表单验证

**运行测试**：
```bash
npm test          # 交互式测试
npm run test:run  # 运行所有测试
npm run test:ui   # 测试 UI 界面
```

## 项目结构

```
local-totp/
├── src/
│   ├── components/          # UI 组件
│   │   ├── TokenItem.vue   # Token 卡片
│   │   ├── TokenList.vue   # Token 列表
│   │   ├── TokenForm.vue   # 添加/编辑表单
│   │   └── ProgressBar.vue # 进度条
│   ├── composables/         # 组合式函数
│   │   ├── useTOTP.ts      # TOTP 逻辑
│   │   └── useCountdown.ts # 倒计时逻辑
│   ├── repository/          # Repository 层
│   │   ├── ITokenRepository.ts        # 抽象基类
│   │   ├── LocalStorageRepository.ts  # LocalStorage 实现
│   │   └── index.ts                   # 导出 Repository 实例
│   ├── utils/               # 工具函数
│   │   ├── totp.ts         # TOTP 算法实现
│   │   ├── helpers.ts      # 辅助函数
│   │   └── qrcode.ts       # URI 解析
│   ├── types/               # TypeScript 类型定义
│   │   └── index.ts        # 所有类型接口
│   └── App.vue             # 根组件
└── tests/                   # 测试文件（与源码同目录）
```

## Repository 层设计

项目采用 Repository 模式，便于未来扩展存储方式：

```typescript
// 当前使用 LocalStorage
export const tokenRepository = new LocalStorageRepository();

// 未来可切换为：
// export const tokenRepository = new IndexedDBRepository();
// export const tokenRepository = new APIRepository('https://api.example.com');
```


**存储安全**：
- 本地数据存储在浏览器 LocalStorage，**未加密**
- 仅适用于个人设备或可信环境

**备份安全**：
- ✅ 支持 AES-GCM 256 位加密导出
- ✅ PBKDF2 密钥派生（100,000 次迭代）
- ✅ 随机 salt 和 IV 确保安全性
- ⚠️ 未加密导出包含明文密钥，请妥善保管

**最佳实践**：
- 始终使用加密导出功能
- 使用强密码（推荐 12+ 字符，包含大小写字母、数字、符号）
- 备份文件存储在安全位置
- 不要通过不安全渠道传输备份文件
- 数据存储在浏览器 LocalStorage，**未加密**
- 仅适用于个人设备或可信环境
- 建议未来版本使用 Web Crypto API 加密存储

## 浏览器兼容性

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+

需要支持：
- ES Modules
- Web Crypto API
- Clipboard API
- LocalStorage

## License

MIT

## 贡献

欢迎提交 Issue 和 Pull Request！
