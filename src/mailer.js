'use strict';

/**
 * Optional email notifications via nodemailer.
 *
 * Email is NOT required for the platform to work: if SMTP_* env vars are not
 * set, notify() becomes a no-op and submissions are still stored + visible in
 * the admin dashboard. This keeps the default deploy zero-config.
 */

let transporter = null;
let configured = false;

function init() {
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    try {
      const nodemailer = require('nodemailer');
      transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '465', 10),
        secure: (process.env.SMTP_SECURE || 'true') === 'true',
        auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
      });
      configured = true;
      console.log('[mailer] 已配置 SMTP ->', process.env.SMTP_HOST);
    } catch (e) {
      console.warn('[mailer] 未安装 nodemailer，跳过邮件发送：', e.message);
    }
  } else {
    console.log('[mailer] 未配置 SMTP，已停用邮件通知（询单仍会正常保存）。');
  }
}
init();

function fmtLines(obj) {
  return Object.entries(obj)
    .map(([k, v]) => `${k}: ${v == null || v === '' ? '-' : v}`)
    .join('\n');
}

/**
 * Send a notification to the internal team about a new submission.
 * @param {{type:string,id:number,record:object}} arg
 */
async function notify({ type, id, record }) {
  if (!configured || !transporter) return false;
  const to = type === 'custom'
    ? (process.env.DESIGN_NOTIFY_EMAIL || process.env.NOTIFY_EMAIL || 'design@yuzhoucrystal.com')
    : (process.env.SALES_NOTIFY_EMAIL || process.env.NOTIFY_EMAIL || 'helen@crystalwto.com');

  const contact = fmtLines({
    姓名: record.name, 公司: record.company, 邮箱: record.email, 国家: record.country,
  });

  let detail;
  if (type === 'product') {
    const items = (record.data && record.data.items || []).map(i => `- ${i.name} × ${i.qty}`).join('\n');
    detail = `询价产品：\n${items}\n\n留言：\n${record.data && record.data.message || '-'}`;
  } else {
    detail = fmtLines({
      产品类型: record.data && record.data.ptype,
      期望尺寸: record.data && record.data.size,
      材质: record.data && record.data.material,
      目标数量: record.data && record.data.qty,
      定制内容: record.data && record.data.customization,
      交付期限: record.data && record.data.deadline,
      详细需求: record.data && record.data.brief,
    });
    const refLine = (record.image ? `已上传（文件名：${record.image}）` : '无');
    detail += `\n\n参考图：${refLine}`;
  }

  const subject = (type === 'custom' ? '新的定制需求' : '新的产品询价') +
    ` #${id} — ${record.company || record.name || '未知客户'}`;
  const text = `收到一条新的${type === 'custom' ? '定制需求' : '产品询价'}（编号 #${id}）。\n\n${contact}\n\n${detail}\n\n---\n在后台查看：${process.env.PUBLIC_URL || ''}/admin`;

  try {
    await transporter.sendMail({ from: process.env.SMTP_FROM || process.env.SMTP_USER, to, subject, text });
    return true;
  } catch (e) {
    console.warn('[mailer] send failed:', e.message);
    return false;
  }
}

module.exports = { notify, isConfigured: () => configured };
