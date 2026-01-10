"""
Function Calling 工具定义

定义智能商城导购系统的所有可调用函数
"""

from typing import List, Dict, Any

# 工具定义
MALL_TOOLS: List[Dict[str, Any]] = [
    # ============ 导航类 ============
    {
        "type": "function",
        "function": {
            "name": "navigate_to_store",
            "description": "导航到指定店铺，在 3D 场景中高亮显示路径。当用户询问某个店铺在哪里、怎么去某个店铺时使用。",
            "parameters": {
                "type": "object",
                "properties": {
                    "store_name": {
                        "type": "string",
                        "description": "店铺名称，如 Nike、星巴克、优衣库"
                    },
                    "highlight": {
                        "type": "boolean",
                        "description": "是否高亮显示店铺",
                        "default": True
                    }
                },
                "required": ["store_name"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "navigate_to_area",
            "description": "导航到指定区域，如美食区、服装区、电影院等。当用户询问某个区域在哪里时使用。",
            "parameters": {
                "type": "object",
                "properties": {
                    "area_name": {
                        "type": "string",
                        "description": "区域名称，如美食区、服装区、儿童区"
                    },
                    "show_stores": {
                        "type": "boolean",
                        "description": "是否显示区域内的店铺列表",
                        "default": True
                    }
                },
                "required": ["area_name"]
            }
        }
    },
    
    # ============ 搜索类 ============
    {
        "type": "function",
        "function": {
            "name": "search_products",
            "description": "搜索商品，支持关键词、价格范围、品牌、分类筛选。当用户想找某类商品时使用。",
            "parameters": {
                "type": "object",
                "properties": {
                    "keyword": {
                        "type": "string",
                        "description": "搜索关键词，如运动鞋、连衣裙、手机"
                    },
                    "min_price": {
                        "type": "number",
                        "description": "最低价格"
                    },
                    "max_price": {
                        "type": "number",
                        "description": "最高价格"
                    },
                    "brand": {
                        "type": "string",
                        "description": "品牌名称"
                    },
                    "category": {
                        "type": "string",
                        "description": "商品分类"
                    }
                },
                "required": ["keyword"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "search_stores",
            "description": "搜索店铺，支持关键词和分类筛选。当用户想找某类店铺时使用。",
            "parameters": {
                "type": "object",
                "properties": {
                    "keyword": {
                        "type": "string",
                        "description": "搜索关键词"
                    },
                    "category": {
                        "type": "string",
                        "description": "店铺分类，如餐饮、服装、数码"
                    }
                },
                "required": ["keyword"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "search_by_image",
            "description": "根据图片搜索相似商品或美食。当用户上传图片并询问类似商品时使用。",
            "parameters": {
                "type": "object",
                "properties": {
                    "image_description": {
                        "type": "string",
                        "description": "图片内容描述（由视觉模型生成）"
                    },
                    "search_type": {
                        "type": "string",
                        "enum": ["product", "food", "store"],
                        "description": "搜索类型：商品、美食、店铺"
                    }
                },
                "required": ["image_description", "search_type"]
            }
        }
    },

    # ============ 商品详情类 ============
    {
        "type": "function",
        "function": {
            "name": "get_product_detail",
            "description": "获取商品详情，包括价格、库存、规格、评价等。当用户想了解某个商品的详细信息时使用。",
            "parameters": {
                "type": "object",
                "properties": {
                    "product_id": {
                        "type": "string",
                        "description": "商品 ID"
                    }
                },
                "required": ["product_id"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "get_store_info",
            "description": "获取店铺信息，包括营业时间、联系方式、优惠活动等。",
            "parameters": {
                "type": "object",
                "properties": {
                    "store_id": {
                        "type": "string",
                        "description": "店铺 ID"
                    },
                    "info_type": {
                        "type": "string",
                        "enum": ["basic", "promotions", "reviews"],
                        "description": "信息类型：基本信息、优惠活动、用户评价",
                        "default": "basic"
                    }
                },
                "required": ["store_id"]
            }
        }
    },
    
    # ============ 购物类 ============
    {
        "type": "function",
        "function": {
            "name": "add_to_cart",
            "description": "添加商品到购物车。当用户明确表示要购买某商品时使用。",
            "parameters": {
                "type": "object",
                "properties": {
                    "product_id": {
                        "type": "string",
                        "description": "商品 ID"
                    },
                    "quantity": {
                        "type": "integer",
                        "description": "数量",
                        "default": 1
                    },
                    "sku_id": {
                        "type": "string",
                        "description": "规格 ID（如尺码、颜色）"
                    }
                },
                "required": ["product_id"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "get_cart",
            "description": "获取购物车内容。当用户询问购物车有什么时使用。",
            "parameters": {
                "type": "object",
                "properties": {}
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "create_order",
            "description": "创建订单。此操作需要用户确认支付。当用户明确表示要下单、结算时使用。",
            "parameters": {
                "type": "object",
                "properties": {
                    "cart_id": {
                        "type": "string",
                        "description": "购物车 ID"
                    },
                    "address_id": {
                        "type": "string",
                        "description": "收货地址 ID"
                    }
                },
                "required": ["cart_id"]
            }
        }
    },
    
    # ============ 推荐类 ============
    {
        "type": "function",
        "function": {
            "name": "recommend_products",
            "description": "推荐商品。根据用户偏好、历史记录或当前上下文推荐商品。",
            "parameters": {
                "type": "object",
                "properties": {
                    "category": {
                        "type": "string",
                        "description": "商品分类"
                    },
                    "style": {
                        "type": "string",
                        "description": "风格偏好，如休闲、正式、运动"
                    },
                    "price_range": {
                        "type": "string",
                        "description": "价格范围，如低价、中等、高端"
                    }
                }
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "recommend_restaurants",
            "description": "推荐餐厅。根据用户口味偏好推荐商城内的餐厅。",
            "parameters": {
                "type": "object",
                "properties": {
                    "cuisine": {
                        "type": "string",
                        "description": "菜系，如中餐、西餐、日料、韩餐"
                    },
                    "style": {
                        "type": "string",
                        "description": "风格，如图片中的菜品风格描述"
                    },
                    "price_level": {
                        "type": "string",
                        "enum": ["budget", "moderate", "premium"],
                        "description": "价格档次"
                    }
                }
            }
        }
    }
]

# 操作安全级别
OPERATION_LEVELS = {
    # 安全操作（直接执行）
    "navigate_to_store": "safe",
    "navigate_to_area": "safe",
    "search_products": "safe",
    "search_stores": "safe",
    "search_by_image": "safe",
    "get_product_detail": "safe",
    "get_store_info": "safe",
    "get_cart": "safe",
    "recommend_products": "safe",
    "recommend_restaurants": "safe",
    
    # 需确认操作
    "add_to_cart": "confirm",
    
    # 关键操作（需强确认）
    "create_order": "critical",
}


def get_tools_for_context(has_image: bool = False) -> List[Dict[str, Any]]:
    """
    根据上下文获取可用工具
    
    Args:
        has_image: 是否包含图片输入
    """
    tools = MALL_TOOLS.copy()
    
    # 如果没有图片，移除图片搜索工具
    if not has_image:
        tools = [t for t in tools if t["function"]["name"] != "search_by_image"]
    
    return tools
