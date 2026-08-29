# 21 张分类产品图清单

代码已改成读取 `cat-{id}.jpg` 作为分类卡片图片。如果某张图片缺失，会自动回退到原来的 SVG 占位图。

## 图片规格

- **比例**：4:5（竖版）
- **推荐尺寸**：800 × 1000 px（retina 2x）
- **格式**：JPG
- **存放位置**：`/home/admin/yuzhou-inquiry/public/`

## 文件名清单

| 序号 | 文件名 | 对应分类 |
|----|----|----|
| 1 | `cat-trophies.jpg` | Crystal Awards & Trophies |
| 2 | `cat-office.jpg` | Office & Desk Supplies |
| 3 | `cat-watch-stones.jpg` | Crystal Watch Stones |
| 4 | `cat-tableware.jpg` | Crystal Tableware |
| 5 | `cat-lighting.jpg` | Lighting Accessories |
| 6 | `cat-vases.jpg` | Crystal Vases |
| 7 | `cat-wine-stoppers.jpg` | Wine Stoppers |
| 8 | `cat-wood-medals.jpg` | Wooden Medals |
| 9 | `cat-inner-carving.jpg` | Crystal Inner Carving |
| 10 | `cat-jewelry-boxes.jpg` | Jewelry Boxes |
| 11 | `cat-perfume.jpg` | Crystal Perfume Bottles |
| 12 | `cat-figurines.jpg` | Animal & Flower Figurines |
| 13 | `cat-smoking.jpg` | Crystal Smoking Sets |
| 14 | `cat-candles.jpg` | Crystal Candle Holders |
| 15 | `cat-ornaments.jpg` | Ornaments & Paperweights |
| 16 | `cat-bracelets.jpg` | Crystal Bracelets |
| 17 | `cat-paperweights.jpg` | Crystal Paperweights |
| 18 | `cat-frames.jpg` | Crystal Photo Frames |
| 19 | `cat-medals.jpg` | Crystal Medals |
| 20 | `cat-glass-medals.jpg` | Glass Medals |
| 21 | `cat-lamps.jpg` | Crystal Table Lamps |

## 部署步骤

1. 把这 21 张图上传到 `/home/admin/yuzhou-inquiry/public/`
2. 把新的 `index.html` 和 `yuzhoucrystal.html` 上传到 `/home/admin/yuzhou-inquiry/public/`
3. 执行：

```bash
cd /home/admin/yuzhou-inquiry && sudo docker compose up -d --build
```

## 提示

- 如果暂时缺某张图，可以不上传，该分类会保留原来的彩色 SVG。
- 图片不要带黑边、水印或粗边框，保持产品主体居中、背景干净即可。
