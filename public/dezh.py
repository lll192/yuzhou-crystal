
import re, sys

# 对每个文件的替换规则：(old_substring, new_substring)
# 仅替换 HTML/JS 中展示给用户看的中文，不动后端

rules_admin = [
    # option 标签中文 -> 英文名
    ('<option value="trophies">水晶奖杯</option>', '<option value="trophies">Crystal Awards & Trophies</option>'),
    ('<option value="office">办公用品</option>', '<option value="office">Office & Desk Supplies</option>'),
    ('<option value="watch-stones">水晶表钻</option>', '<option value="watch-stones">Crystal Watch Stones</option>'),
    ('<option value="tableware">水晶餐具</option>', '<option value="tableware">Crystal Tableware</option>'),
    ('<option value="lighting">灯饰配件</option>', '<option value="lighting">Lighting Accessories</option>'),
    ('<option value="vases">水晶花瓶</option>', '<option value="vases">Crystal Vases</option>'),
    ('<option value="wine-stoppers">酒瓶塞</option>', '<option value="wine-stoppers">Wine Stoppers</option>'),
    ('<option value="wood-medals">木奖牌</option>', '<option value="wood-medals">Wooden Medals</option>'),
    ('<option value="inner-carving">水晶内雕</option>', '<option value="inner-carving">Crystal Inner Carving</option>'),
    ('<option value="jewelry-boxes">首饰盒</option>', '<option value="jewelry-boxes">Jewelry Boxes</option>'),
    ('<option value="perfume">水晶香水瓶</option>', '<option value="perfume">Crystal Perfume Bottles</option>'),
    ('<option value="figurines">小动物花</option>', '<option value="figurines">Animal & Flower Figurines</option>'),
    ('<option value="smoking">水晶烟具</option>', '<option value="smoking">Crystal Smoking Sets</option>'),
    ('<option value="candles">水晶烛台</option>', '<option value="candles">Crystal Candle Holders</option>'),
    ('<option value="ornaments">装饰品</option>', '<option value="ornaments">Ornaments & Paperweights</option>'),
    ('<option value="bracelets">水晶手链</option>', '<option value="bracelets">Crystal Bracelets</option>'),
    ('<option value="paperweights">水晶镇纸</option>', '<option value="paperweights">Crystal Paperweights</option>'),
    ('<option value="frames">水晶相框</option>', '<option value="frames">Crystal Photo Frames</option>'),
    ('<option value="medals">水晶奖牌</option>', '<option value="medals">Crystal Medals</option>'),
    ('<option value="glass-medals">玻璃奖牌</option>', '<option value="glass-medals">Glass Medals</option>'),
    ('<option value="lamps">水晶台灯</option>', '<option value="lamps">Crystal Table Lamps</option>'),
]

with open('public/admin.html','r',encoding='utf-8') as f:
    t = f.read()
for old,new in rules_admin:
    t = t.replace(old,new)
# 继续替换 admin.html 里其他中文 UI 文字
more_admin = [
    ('询单管理后台', 'Inquiry Admin'),
    ('管理员登录', 'Admin Login'),
    ('请输入账号与密码查看客户询单。', 'Please enter your credentials to view inquiries.'),
    ('placeholder="账号"', 'placeholder="Username"'),
    ('placeholder="密码"', 'placeholder="Password"'),
    ('登 录', 'Login'),
    ('询单管理后台', 'Inquiry Admin'),
    ('导出 CSV', 'Export CSV'),
    ('退出登录', 'Logout'),
    ('询单管理', 'Inquiries'),
    ('产品管理', 'Products'),
    ('询单总数', 'Total'),
    ('产品询价', 'Product RFQ'),
    ('定制需求', 'Custom Orders'),
    ('未处理（新）', 'New (Unread)'),
    ('全部类型', 'All Types'),
    ('全部状态', 'All Statuses'),
    ('新询单', 'New'),
    ('已联系', 'Contacted'),
    ('已报价', 'Quoted'),
    ('已完成', 'Completed'),
    ('已归档', 'Archived'),
    ('搜索姓名、公司或邮箱…', 'Search name, company or email...'),
    ('刷新', 'Refresh'),
    ('编号', 'ID'),
    ('提交时间', 'Submitted'),
    ('姓名', 'Name'),
    ('公司', 'Company'),
    ('邮箱', 'Email'),
    ('摘要', 'Summary'),
    ('状态', 'Status'),
    ('操作', 'Actions'),
    ('没有符合条件的询单。', 'No matching inquiries.'),
    ('全部分类', 'All Categories'),
    ('搜索产品名称…', 'Search product name...'),
    ('+ 新增产品', '+ Add Product'),
    ('图片', 'Image'),
    ('名称', 'Name'),
    ('分类', 'Category'),
    ('排序', 'Order'),
    ('还没有产品', 'No products yet'),
    ('新增产品', 'Add Product'),
    ('询单详情', 'Inquiry Detail'),
    ('更新状态', 'Update Status'),
    ('产品名称 *', 'Product Name *'),
    ('描述', 'Description'),
    ('规格参数（每行 Key: Value）', 'Specs (one Key: Value per line)'),
    ('排序（数字小在前）', 'Sort Order (smaller first)'),
    ('产品图片', 'Product Image'),
    ('删除', 'Delete'),
    ('取消', 'Cancel'),
    ('保存', 'Save'),
    ('编辑', 'Edit'),
    ('无图', 'No image'),
    ('确定删除该产品？', 'Delete this product?'),
    ('请填写产品名称。', 'Please enter a product name.'),
    ('保存失败', 'Save failed'),
    ('删除失败', 'Delete failed'),
    ('更新失败', 'Update failed'),
    ('登录失败', 'Login failed'),
    ('请输入账号和密码。', 'Please enter username and password.'),
    ('登录失败，请重试。', 'Login failed, please try again.'),
    ('未授权', 'Unauthorized'),
    ('参考图', 'Reference Image'),
    ('下载图片', 'Download Image'),
    ('图片加载失败', 'Image load failed'),
    ('留言：', 'Message:'),
    ('询价产品', 'RFQ Products'),
    ('国家', 'Country'),
    ('产品询价', 'Product RFQ'),
    ('定制需求', 'Custom Order'),
    ('确定删除这条询单吗？删除后不可恢复。', 'Delete this inquiry? This cannot be undone.'),
    ('新询单不可删除，需先处理或归档', 'New inquiries must be processed or archived first'),
    ('删除失败，请重试', 'Delete failed, please try again'),
    ('询单导出-', 'inquiries-export-'),
    # JS 变量
    ("产品', custom: '定制", "Product RFQ', custom: 'Custom Order"),
    ("新询单', contacted: '已联系', quoted: '已报价', done: '已完成', archived: '已归档",
     "New', contacted: 'Contacted', quoted: 'Quoted', done: 'Completed', archived: 'Archived"),
    # 产品类型label
    ("产品类型',size:'期望尺寸',material:'材质',qty:'目标数量',customization:'定制内容',deadline:'交付期限',brief:'详细需求",
     "Product Type',size:'Desired Size',material:'Material',qty:'Target Qty',customization:'Customization',deadline:'Deadline',brief:'Details"),
    # 类型显示
    ("定制需求' : '产品询价", "Custom Order' : 'Product RFQ"),
    # 编辑产品
    ("编辑产品' : '新增产品", "Edit Product' : 'Add Product"),
]
for old,new in more_admin:
    t = t.replace(old,new)
# 删除中文注释
t = re.sub(r'//[^\n]*[\u4e00-\u9fff][^\n]*\n', '', t)
t = re.sub(r'/\*[^*]*[\u4e00-\u9fff][^*]*\*/', '', t)
with open('public/admin.html','w',encoding='utf-8') as f:
    f.write(t)
print('admin.html done')

# index.html 和 yuzhoucrystal.html：替换 zh 字段 + 中文注释
zh_map = {
    '水晶奖杯': 'Crystal Awards & Trophies', '办公用品': 'Office & Desk Supplies',
    '水晶表钻': 'Crystal Watch Stones', '水晶餐具': 'Crystal Tableware',
    '灯饰配件': 'Lighting Accessories', '水晶花瓶': 'Crystal Vases',
    '酒瓶塞': 'Wine Stoppers', '木奖牌': 'Wooden Medals',
    '水晶内雕': 'Crystal Inner Carving', '首饰盒': 'Jewelry Boxes',
    '水晶香水瓶': 'Crystal Perfume Bottles', '小动物花': 'Animal & Flower Figurines',
    '水晶烟具': 'Crystal Smoking Sets', '水晶烛台': 'Crystal Candle Holders',
    '装饰品': 'Ornaments & Paperweights', '水晶手链': 'Crystal Bracelets',
    '水晶镇纸': 'Crystal Paperweights', '水晶相框': 'Crystal Photo Frames',
    '水晶奖牌': 'Crystal Medals', '玻璃奖牌': 'Glass Medals',
    '水晶台灯': 'Crystal Table Lamps',
}
for fn in ['public/index.html','public/yuzhoucrystal.html']:
    with open(fn,'r',encoding='utf-8') as f:
        t = f.read()
    for zh,en in zh_map.items():
        t = t.replace(f"zh: '{zh}'", f"zh: '{en}'")
    # 删中文注释
    t = re.sub(r'//[^\n]*[\u4e00-\u9fff][^\n]*\n', '', t)
    t = re.sub(r'<!--[^>]*[\u4e00-\u9fff][^>]*-->', '', t)
    with open(fn,'w',encoding='utf-8') as f:
        f.write(t)
    print(f'{fn} done')

# 最终检查
for fn in ['public/admin.html','public/index.html','public/yuzhoucrystal.html']:
    with open(fn,'r',encoding='utf-8') as f:
        c = len(re.findall(r'[\u4e00-\u9fff]', f.read()))
    print(f'{fn}: {c} Chinese chars remaining')
print('DONE')
