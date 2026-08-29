"""
端到端权威验证：用一张真实有效的 PNG，走完整链路
  前端 multipart 提交  ->  后端 multer 保存  ->  后台带鉴权 fetch+blob 显示
并清理测试数据。
"""
import sys, os, time, json, glob
from PIL import Image, ImageDraw
from playwright.sync_api import sync_playwright

BASE = "http://localhost:3000"
TOKEN = "yzAdmin2026Demo"

# 1) 生成一张真实有效的 PNG
os.makedirs("/tmp", exist_ok=True)
png_path = "/tmp/real_test.png"
img = Image.new("RGB", (120, 90), (220, 30, 60))
d = ImageDraw.Draw(img)
d.text((10, 38), "REAL IMG", fill=(255, 255, 255))
img.save(png_path, "PNG")
orig = open(png_path, "rb").read()
print(f"[1] 生成有效PNG: {len(orig)} 字节, 头={orig[:8]}")

# 2) 通过真实前端接口提交（multipart，字段与前端一致）
import requests
with open(png_path, "rb") as f:
    files = {"image": ("ref.png", f, "image/png")}
    data = {
        "name": "验证员", "company": "E2E测试公司",
        "email": "verify@example.com", "country": "CN",
        "brief": "请确认后端能显示并保存这张参考图。",
        "ptype": "水晶奖杯", "size": "10cm", "qty": "500",
    }
    r = requests.post(BASE + "/api/custom-requests", data=data, files=files, timeout=20)
resp = r.json()
print(f"[2] 提交响应: ok={resp.get('ok')} id={resp.get('id')} imageUrl={resp.get('imageUrl')}")
assert resp.get("ok"), f"提交失败: {resp}"
new_id = resp["id"]
saved_name = resp["imageUrl"].split("/")[-1]
saved_path = os.path.join("/workspace/uploads", saved_name)

# 3) 校验后端保存的文件是有效 PNG 且与上传一致
saved = open(saved_path, "rb").read()
from PIL import Image as I2
im = I2.open(saved_path); im.load()
print(f"[3] 保存文件: {len(saved)} 字节, 尺寸={im.size}, 格式={im.format}, 与上传一致={saved==orig}")
assert saved == orig, "保存的字节与上传不一致！"

# 4) 后台登录 -> 打开该记录 -> 等待图片真实加载
log = []
with sync_playwright() as p:
    b = p.chromium.launch(args=["--no-sandbox"])
    pg = b.new_page()
    pg.goto(BASE + "/admin", wait_until="networkidle", timeout=30000)
    pg.fill("#token-input", TOKEN)
    pg.click("#login-btn")
    pg.wait_for_selector("#logout-btn", timeout=15000)
    pg.wait_for_selector("#rows tr", timeout=15000)
    rows = pg.query_selector_all("#rows tr")
    target = None
    for r in rows:
        td = r.query_selector("td")
        if td and td.inner_text().strip() == str(new_id):
            target = r; break
    assert target, f"列表里找不到 id={new_id}"
    target.click()
    pg.wait_for_selector("#overlay.open", timeout=10000)
    pg.wait_for_selector("#m-img", timeout=10000)
    loaded = False
    try:
        pg.wait_for_function(
            "document.getElementById('m-img') && document.getElementById('m-img').naturalWidth > 0",
            timeout=15000)
        loaded = True
    except Exception as e:
        log.append("img wait failed: " + str(e))
    time.sleep(0.5)
    info = pg.evaluate("""() => {
        const im=document.getElementById('m-img');
        return {naturalWidth: im?im.naturalWidth:-1, complete: im?im.complete:false,
                srcStart: im&&im.src?im.src.slice(0,20):'', alt: im?im.alt:''};
    }""")
    log.append("RESULT " + json.dumps(info, ensure_ascii=False))
    try:
        pg.screenshot(path="/workspace/test_e2e_detail.png")
    except Exception as e:
        log.append("screenshot failed: " + str(e))
    b.close()

print("\n".join(log))
print(f"[4] 后台图片显示 naturalWidth={info['naturalWidth']} -> {'成功' if info['naturalWidth']>0 else '失败'}")

# 5) 清理测试数据（删记录 + 删文件）
import sqlite3
con = sqlite3.connect("/workspace/data/inquiries.db")
con.execute("DELETE FROM submissions WHERE id=?", (new_id,))
con.commit(); con.close()
if os.path.exists(saved_path): os.remove(saved_path)
print(f"[5] 已清理测试记录 id={new_id} 与文件 {saved_name}")

ok = info["naturalWidth"] > 0
print("\nFINAL_OK=" + str(ok))
sys.exit(0 if ok else 2)
