"""
示例数据

包含：
- 店铺数据（15 家店铺）
- 商品数据（60 个商品）
- 位置数据（区域、设施）

所有数据包含 3D 坐标，与前端 Mall3DView 对应
"""

from typing import List
from app.core.rag.schemas import StoreDocument, ProductDocument, LocationDocument, Position


# ============ 店铺数据 ============
# 商城布局：3层，每层分 A/B/C 三个区域
# 坐标系：x(-200~200), y(0~30), z(-200~200)

SEED_STORES: List[StoreDocument] = [
    # 1楼 - 服装区
    StoreDocument(
        id="store_nike_001",
        name="Nike 专卖店",
        category="运动",
        description="全球知名运动品牌，提供运动鞋、运动服装及配件",
        floor=1,
        area="A区",
        position=Position(x=-100.0, y=0.0, z=50.0),
        tags=["运动", "鞋类", "服装", "Nike", "耐克"]
    ),
    StoreDocument(
        id="store_adidas_001",
        name="Adidas 旗舰店",
        category="运动",
        description="德国运动品牌，三叶草系列、运动装备",
        floor=1,
        area="A区",
        position=Position(x=-50.0, y=0.0, z=50.0),
        tags=["运动", "鞋类", "服装", "Adidas", "阿迪达斯"]
    ),
    StoreDocument(
        id="store_uniqlo_001",
        name="优衣库",
        category="服装",
        description="日本快时尚品牌，基础款服装、UT系列",
        floor=1,
        area="B区",
        position=Position(x=0.0, y=0.0, z=50.0),
        tags=["服装", "快时尚", "优衣库", "UNIQLO"]
    ),
    StoreDocument(
        id="store_zara_001",
        name="ZARA",
        category="服装",
        description="西班牙快时尚品牌，时尚女装、男装",
        floor=1,
        area="B区",
        position=Position(x=50.0, y=0.0, z=50.0),
        tags=["服装", "快时尚", "ZARA", "女装", "男装"]
    ),
    StoreDocument(
        id="store_hm_001",
        name="H&M",
        category="服装",
        description="瑞典快时尚品牌，平价时尚服装",
        floor=1,
        area="C区",
        position=Position(x=100.0, y=0.0, z=50.0),
        tags=["服装", "快时尚", "H&M"]
    ),
    
    # 2楼 - 数码/美妆区
    StoreDocument(
        id="store_apple_001",
        name="Apple Store",
        category="数码",
        description="苹果官方零售店，iPhone、Mac、iPad 等产品",
        floor=2,
        area="A区",
        position=Position(x=-100.0, y=10.0, z=50.0),
        tags=["数码", "手机", "电脑", "Apple", "苹果"]
    ),
    StoreDocument(
        id="store_huawei_001",
        name="华为体验店",
        category="数码",
        description="华为官方体验店，手机、平板、智能穿戴",
        floor=2,
        area="A区",
        position=Position(x=-50.0, y=10.0, z=50.0),
        tags=["数码", "手机", "华为", "Huawei"]
    ),
    StoreDocument(
        id="store_sephora_001",
        name="丝芙兰",
        category="美妆",
        description="全球知名美妆零售商，护肤品、彩妆、香水",
        floor=2,
        area="B区",
        position=Position(x=0.0, y=10.0, z=50.0),
        tags=["美妆", "护肤", "彩妆", "香水", "丝芙兰"]
    ),
    StoreDocument(
        id="store_watsons_001",
        name="屈臣氏",
        category="美妆",
        description="个人护理用品零售店，护肤、洗护、保健品",
        floor=2,
        area="B区",
        position=Position(x=50.0, y=10.0, z=50.0),
        tags=["美妆", "护肤", "个护", "屈臣氏"]
    ),
    
    # 3楼 - 餐饮区
    StoreDocument(
        id="store_starbucks_001",
        name="星巴克",
        category="餐饮",
        description="全球知名咖啡连锁，咖啡、茶饮、轻食",
        floor=3,
        area="A区",
        position=Position(x=-100.0, y=20.0, z=50.0),
        tags=["餐饮", "咖啡", "饮品", "星巴克", "Starbucks"]
    ),
    StoreDocument(
        id="store_haidilao_001",
        name="海底捞",
        category="餐饮",
        description="知名火锅连锁，服务一流，川味火锅",
        floor=3,
        area="A区",
        position=Position(x=-50.0, y=20.0, z=50.0),
        tags=["餐饮", "火锅", "川菜", "海底捞"]
    ),
    StoreDocument(
        id="store_kfc_001",
        name="肯德基",
        category="餐饮",
        description="美式快餐，炸鸡、汉堡、薯条",
        floor=3,
        area="B区",
        position=Position(x=0.0, y=20.0, z=50.0),
        tags=["餐饮", "快餐", "炸鸡", "肯德基", "KFC"]
    ),
    StoreDocument(
        id="store_mcd_001",
        name="麦当劳",
        category="餐饮",
        description="全球快餐连锁，汉堡、薯条、麦辣鸡腿堡",
        floor=3,
        area="B区",
        position=Position(x=50.0, y=20.0, z=50.0),
        tags=["餐饮", "快餐", "汉堡", "麦当劳", "McDonald's"]
    ),
    StoreDocument(
        id="store_xicha_001",
        name="喜茶",
        category="餐饮",
        description="新式茶饮品牌，芝士奶盖茶、水果茶",
        floor=3,
        area="C区",
        position=Position(x=100.0, y=20.0, z=50.0),
        tags=["餐饮", "奶茶", "茶饮", "喜茶"]
    ),
    StoreDocument(
        id="store_nayuki_001",
        name="奈雪的茶",
        category="餐饮",
        description="新式茶饮品牌，鲜果茶、软欧包",
        floor=3,
        area="C区",
        position=Position(x=150.0, y=20.0, z=50.0),
        tags=["餐饮", "奶茶", "茶饮", "面包", "奈雪"]
    ),
]


# ============ 商品数据 ============

SEED_PRODUCTS: List[ProductDocument] = [
    # Nike 商品
    ProductDocument(
        id="prod_nike_001",
        name="Nike Air Max 270",
        brand="Nike",
        category="运动鞋",
        description="经典气垫跑鞋，舒适缓震，适合日常穿着和轻度运动",
        price=899.0,
        store_id="store_nike_001",
        store_name="Nike 专卖店",
        tags=["跑鞋", "气垫", "休闲"]
    ),
    ProductDocument(
        id="prod_nike_002",
        name="Nike Air Force 1",
        brand="Nike",
        category="运动鞋",
        description="经典板鞋，百搭款式，街头潮流必备",
        price=799.0,
        store_id="store_nike_001",
        store_name="Nike 专卖店",
        tags=["板鞋", "休闲", "潮流"]
    ),
    ProductDocument(
        id="prod_nike_003",
        name="Nike Dri-FIT 运动T恤",
        brand="Nike",
        category="运动服",
        description="速干面料，透气舒适，适合运动训练",
        price=299.0,
        store_id="store_nike_001",
        store_name="Nike 专卖店",
        tags=["T恤", "速干", "运动"]
    ),
    ProductDocument(
        id="prod_nike_004",
        name="Nike Pro 紧身裤",
        brand="Nike",
        category="运动服",
        description="专业运动紧身裤，支撑性好，适合健身训练",
        price=399.0,
        store_id="store_nike_001",
        store_name="Nike 专卖店",
        tags=["紧身裤", "健身", "训练"]
    ),
    
    # Adidas 商品
    ProductDocument(
        id="prod_adidas_001",
        name="Adidas Ultraboost 22",
        brand="Adidas",
        category="运动鞋",
        description="顶级跑鞋，Boost 中底，极致缓震回弹",
        price=1299.0,
        store_id="store_adidas_001",
        store_name="Adidas 旗舰店",
        tags=["跑鞋", "Boost", "专业"]
    ),
    ProductDocument(
        id="prod_adidas_002",
        name="Adidas Stan Smith",
        brand="Adidas",
        category="运动鞋",
        description="经典小白鞋，简约百搭，永不过时",
        price=699.0,
        store_id="store_adidas_001",
        store_name="Adidas 旗舰店",
        tags=["板鞋", "小白鞋", "经典"]
    ),
    ProductDocument(
        id="prod_adidas_003",
        name="Adidas 三叶草卫衣",
        brand="Adidas",
        category="运动服",
        description="经典三叶草Logo，休闲百搭，潮流必备",
        price=599.0,
        store_id="store_adidas_001",
        store_name="Adidas 旗舰店",
        tags=["卫衣", "三叶草", "潮流"]
    ),
    
    # 优衣库商品
    ProductDocument(
        id="prod_uniqlo_001",
        name="优衣库 AIRism 内衣",
        brand="优衣库",
        category="内衣",
        description="AIRism 科技面料，透气凉爽，夏季必备",
        price=79.0,
        store_id="store_uniqlo_001",
        store_name="优衣库",
        tags=["内衣", "透气", "夏季"]
    ),
    ProductDocument(
        id="prod_uniqlo_002",
        name="优衣库 HEATTECH 保暖内衣",
        brand="优衣库",
        category="内衣",
        description="HEATTECH 发热科技，轻薄保暖，冬季必备",
        price=99.0,
        store_id="store_uniqlo_001",
        store_name="优衣库",
        tags=["内衣", "保暖", "冬季"]
    ),
    ProductDocument(
        id="prod_uniqlo_003",
        name="优衣库 UT 联名T恤",
        brand="优衣库",
        category="T恤",
        description="UT 系列联名款，多种IP可选，潮流百搭",
        price=99.0,
        store_id="store_uniqlo_001",
        store_name="优衣库",
        tags=["T恤", "联名", "潮流"]
    ),
    
    # Apple 商品
    ProductDocument(
        id="prod_apple_001",
        name="iPhone 15 Pro",
        brand="Apple",
        category="手机",
        description="A17 Pro 芯片，钛金属边框，专业相机系统",
        price=8999.0,
        store_id="store_apple_001",
        store_name="Apple Store",
        tags=["手机", "iPhone", "旗舰"]
    ),
    ProductDocument(
        id="prod_apple_002",
        name="MacBook Air M3",
        brand="Apple",
        category="电脑",
        description="M3 芯片，轻薄便携，续航超长",
        price=9499.0,
        store_id="store_apple_001",
        store_name="Apple Store",
        tags=["电脑", "笔记本", "MacBook"]
    ),
    ProductDocument(
        id="prod_apple_003",
        name="AirPods Pro 2",
        brand="Apple",
        category="耳机",
        description="主动降噪，空间音频，MagSafe 充电盒",
        price=1899.0,
        store_id="store_apple_001",
        store_name="Apple Store",
        tags=["耳机", "降噪", "无线"]
    ),
    ProductDocument(
        id="prod_apple_004",
        name="Apple Watch Series 9",
        brand="Apple",
        category="智能手表",
        description="健康监测，运动追踪，双指互点手势",
        price=3299.0,
        store_id="store_apple_001",
        store_name="Apple Store",
        tags=["手表", "智能穿戴", "健康"]
    ),
    
    # 华为商品
    ProductDocument(
        id="prod_huawei_001",
        name="华为 Mate 60 Pro",
        brand="华为",
        category="手机",
        description="麒麟芯片回归，卫星通话，超强影像",
        price=6999.0,
        store_id="store_huawei_001",
        store_name="华为体验店",
        tags=["手机", "华为", "旗舰"]
    ),
    ProductDocument(
        id="prod_huawei_002",
        name="华为 MatePad Pro",
        brand="华为",
        category="平板",
        description="OLED 屏幕，M-Pencil 手写笔，生产力工具",
        price=4999.0,
        store_id="store_huawei_001",
        store_name="华为体验店",
        tags=["平板", "华为", "办公"]
    ),
    ProductDocument(
        id="prod_huawei_003",
        name="华为 FreeBuds Pro 3",
        brand="华为",
        category="耳机",
        description="智慧降噪，Hi-Res 音质，长续航",
        price=1499.0,
        store_id="store_huawei_001",
        store_name="华为体验店",
        tags=["耳机", "降噪", "无线"]
    ),
    
    # 丝芙兰商品
    ProductDocument(
        id="prod_sephora_001",
        name="兰蔻小黑瓶精华",
        brand="兰蔻",
        category="护肤",
        description="经典修护精华，改善肌肤状态，抗老必备",
        price=1080.0,
        store_id="store_sephora_001",
        store_name="丝芙兰",
        tags=["精华", "护肤", "抗老"]
    ),
    ProductDocument(
        id="prod_sephora_002",
        name="雅诗兰黛小棕瓶",
        brand="雅诗兰黛",
        category="护肤",
        description="ANR 修护精华，夜间修护，经典畅销",
        price=950.0,
        store_id="store_sephora_001",
        store_name="丝芙兰",
        tags=["精华", "护肤", "修护"]
    ),
    ProductDocument(
        id="prod_sephora_003",
        name="迪奥烈艳蓝金唇膏",
        brand="迪奥",
        category="彩妆",
        description="经典口红，显色持久，多色可选",
        price=350.0,
        store_id="store_sephora_001",
        store_name="丝芙兰",
        tags=["口红", "彩妆", "迪奥"]
    ),
    ProductDocument(
        id="prod_sephora_004",
        name="香奈儿五号香水",
        brand="香奈儿",
        category="香水",
        description="经典女香，优雅永恒，送礼首选",
        price=1350.0,
        store_id="store_sephora_001",
        store_name="丝芙兰",
        tags=["香水", "香奈儿", "经典"]
    ),
]


# ============ 位置数据 ============

SEED_LOCATIONS: List[LocationDocument] = [
    # 楼层入口
    LocationDocument(
        id="loc_entrance_001",
        name="商城正门",
        type="入口",
        description="商城主入口，连接地铁站",
        floor=1,
        position=Position(x=0.0, y=0.0, z=-200.0)
    ),
    LocationDocument(
        id="loc_entrance_002",
        name="商城侧门",
        type="入口",
        description="商城侧门，连接停车场",
        floor=1,
        position=Position(x=-200.0, y=0.0, z=0.0)
    ),
    
    # 区域
    LocationDocument(
        id="loc_area_1a",
        name="1楼A区",
        type="区域",
        description="运动品牌区，Nike、Adidas 等运动品牌",
        floor=1,
        position=Position(x=-75.0, y=0.0, z=50.0)
    ),
    LocationDocument(
        id="loc_area_1b",
        name="1楼B区",
        type="区域",
        description="快时尚区，优衣库、ZARA 等品牌",
        floor=1,
        position=Position(x=25.0, y=0.0, z=50.0)
    ),
    LocationDocument(
        id="loc_area_2a",
        name="2楼A区",
        type="区域",
        description="数码区，Apple、华为等数码品牌",
        floor=2,
        position=Position(x=-75.0, y=10.0, z=50.0)
    ),
    LocationDocument(
        id="loc_area_2b",
        name="2楼B区",
        type="区域",
        description="美妆区，丝芙兰、屈臣氏等美妆店",
        floor=2,
        position=Position(x=25.0, y=10.0, z=50.0)
    ),
    LocationDocument(
        id="loc_area_3a",
        name="3楼美食广场",
        type="区域",
        description="美食广场，汇集各类餐饮",
        floor=3,
        position=Position(x=0.0, y=20.0, z=50.0)
    ),
    
    # 设施
    LocationDocument(
        id="loc_restroom_1",
        name="1楼洗手间",
        type="设施",
        description="位于1楼电梯旁",
        floor=1,
        position=Position(x=0.0, y=0.0, z=-50.0)
    ),
    LocationDocument(
        id="loc_restroom_2",
        name="2楼洗手间",
        type="设施",
        description="位于2楼电梯旁",
        floor=2,
        position=Position(x=0.0, y=10.0, z=-50.0)
    ),
    LocationDocument(
        id="loc_restroom_3",
        name="3楼洗手间",
        type="设施",
        description="位于3楼电梯旁",
        floor=3,
        position=Position(x=0.0, y=20.0, z=-50.0)
    ),
    LocationDocument(
        id="loc_elevator_1",
        name="中央电梯",
        type="设施",
        description="商城中央电梯，连接1-3楼",
        floor=1,
        position=Position(x=0.0, y=0.0, z=0.0)
    ),
    LocationDocument(
        id="loc_escalator_1",
        name="自动扶梯",
        type="设施",
        description="商城自动扶梯，连接各楼层",
        floor=1,
        position=Position(x=50.0, y=0.0, z=0.0)
    ),
    LocationDocument(
        id="loc_info_desk",
        name="服务台",
        type="设施",
        description="商城服务台，提供咨询、寄存等服务",
        floor=1,
        position=Position(x=0.0, y=0.0, z=-100.0)
    ),
]


async def seed_all_data():
    """
    导入所有示例数据到 Milvus
    
    使用方法：
    ```python
    from app.core.rag.seed_data import seed_all_data
    await seed_all_data()
    ```
    """
    from app.core.rag.sync import get_sync_service
    
    sync_service = get_sync_service()
    
    results = await sync_service.full_sync_all(
        stores=SEED_STORES,
        products=SEED_PRODUCTS,
        locations=SEED_LOCATIONS
    )
    
    for result in results:
        print(f"Synced {result.collection}: {result.inserted} items in {result.duration_ms:.2f}ms")
    
    return results


def get_seed_stores() -> List[StoreDocument]:
    """获取示例店铺数据"""
    return SEED_STORES.copy()


def get_seed_products() -> List[ProductDocument]:
    """获取示例商品数据"""
    return SEED_PRODUCTS.copy()


def get_seed_locations() -> List[LocationDocument]:
    """获取示例位置数据"""
    return SEED_LOCATIONS.copy()
