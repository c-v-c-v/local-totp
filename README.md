# 本地 TOTP 验证器

纯前端、完全离线的 TOTP（Google Authenticator 兼容）验证器应用。

## 功能特性

✅ **完全离线运行** - 无需网络连接，所有计算在本地完成  
✅ **多密钥管理** - 支持添加、编辑、删除多个 TOTP 密钥  
✅ **实时验证码** - 自动生成并刷新 6 位验证码（30 秒周期）  
✅ **倒计时同步** - 所有卡片倒计时完全同步  
✅ **一键复制** - 点击卡片即可复制验证码到剪贴板  
✅ **URI 导入** - 支持从 otpauth:// URI 快速导入  
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

## 测试用例

项目包含完整的测试覆盖：

- ✅ TOTP 算法正确性测试
- ✅ Base32 编码验证测试
- ✅ Repository 数据操作测试
- ✅ URI 解析测试
- ✅ 辅助函数测试

### 测试密钥示例

**测试账户 1**
- 名称: `Google Test`
- 密钥: `JBSWY3DPEHPK3PXP`
- URI: `otpauth://totp/Google:test@example.com?secret=JBSWY3DPEHPK3PXP&issuer=Google`
  - 解析后名称为: `Google - test@example.com`

**测试账户 2**
- 名称: `GitHub Test`
- 密钥: `HXDMVJECJJWSRB3HWIZR4IFUGFTMXBOZ`
- URI: `otpauth://totp/GitHub:user?secret=HXDMVJECJJWSRB3HWIZR4IFUGFTMXBOZ&issuer=GitHub`
  - 解析后名称为: `GitHub - user`

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

## 安全性说明

⚠️ **重要**：
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
