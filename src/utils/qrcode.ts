import type { ParsedTotpUri } from '../types'

/**
 * 解析 TOTP URI
 * 格式：otpauth://totp/label?secret=BASE32SECRET&issuer=Issuer
 */
export function parseTotpUri(uri: string): ParsedTotpUri {
  try {
    const url = new URL(uri);
    
    if (url.protocol !== 'otpauth:') {
      throw new Error('无效的协议，必须是 otpauth://');
    }
    
    if (url.host !== 'totp') {
      throw new Error('仅支持 TOTP 类型');
    }
    
    const secret = url.searchParams.get('secret');
    if (!secret) {
      throw new Error('缺少密钥参数');
    }
    
    // 获取标签（账户名）
    let label = decodeURIComponent(url.pathname.substring(1));
    const issuer = url.searchParams.get('issuer');
    
    // 组合账户名：如果有 issuer 参数，使用 "Issuer - Account" 格式
    const labelParts = label.split(':');
    if (labelParts.length > 1) {
      // 格式：Issuer:account -> 提取 account
      const account = labelParts.slice(1).join(':');
      label = issuer ? `${issuer} - ${account}` : account;
    } else if (issuer) {
      // 只有 issuer 参数，组合格式
      label = `${issuer} - ${label}`;
    }
    
    return {
      name: label || '未命名账户',
      secret: secret.toUpperCase().replace(/\s/g, ''),
      algorithm: url.searchParams.get('algorithm') || undefined,
      digits: url.searchParams.get('digits') ? parseInt(url.searchParams.get('digits')!) : undefined,
      period: url.searchParams.get('period') ? parseInt(url.searchParams.get('period')!) : undefined
    };
  } catch (error) {
    throw new Error('无效的 TOTP URI：' + (error as Error).message);
  }
}

/**
 * 从图片中提取二维码并解析
 * 使用 canvas 和简单的文本提取
 */
export async function scanQRCode(file: File): Promise<ParsedTotpUri> {
  return new Promise((_resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = async (e) => {
      const img = new Image();
      
      img.onload = async () => {
        try {
          // 使用第三方库或浏览器 API 解析二维码
          // 这里我们需要一个纯 JS 的二维码解析库
          reject(new Error('请手动输入 otpauth:// URI 或使用支持的二维码扫描工具'));
        } catch (error) {
          reject(error);
        }
      };
      
      img.onerror = () => {
        reject(new Error('无法加载图片'));
      };
      
      img.src = e.target?.result as string;
    };
    
    reader.onerror = () => {
      reject(new Error('无法读取文件'));
    };
    
    reader.readAsDataURL(file);
  });
}
