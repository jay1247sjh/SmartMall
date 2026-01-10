"""
提示词加载器

从 YAML 文件加载和管理提示词配置
"""

from typing import Dict, Any, Optional
from pathlib import Path
import yaml
import logging

logger = logging.getLogger(__name__)

# 提示词目录
PROMPTS_DIR = Path(__file__).parent.parent / "prompts"


class PromptLoader:
    """提示词加载器"""
    
    _cache: Dict[str, Dict[str, Any]] = {}
    
    @classmethod
    def load(cls, name: str) -> Dict[str, Any]:
        """
        加载提示词配置
        
        Args:
            name: 提示词名称（不含 .yaml 后缀）
            
        Returns:
            提示词配置字典
        """
        if name in cls._cache:
            return cls._cache[name]
        
        file_path = PROMPTS_DIR / f"{name}.yaml"
        
        if not file_path.exists():
            logger.error(f"Prompt file not found: {file_path}")
            raise FileNotFoundError(f"Prompt file not found: {name}.yaml")
        
        with open(file_path, "r", encoding="utf-8") as f:
            config = yaml.safe_load(f)
        
        cls._cache[name] = config
        logger.info(f"Loaded prompt: {name} (v{config.get('version', '1.0')})")
        
        return config
    
    @classmethod
    def get_system_prompt(cls, name: str) -> str:
        """获取系统提示词"""
        config = cls.load(name)
        return config.get("system_prompt", "")
    
    @classmethod
    def get_user_prompt_template(cls, name: str) -> str:
        """获取用户提示词模板"""
        config = cls.load(name)
        return config.get("user_prompt_template", "")
    
    @classmethod
    def get_parameters(cls, name: str) -> Dict[str, Any]:
        """获取参数配置"""
        config = cls.load(name)
        return config.get("parameters", {})
    
    @classmethod
    def format_user_prompt(cls, name: str, **kwargs) -> str:
        """
        格式化用户提示词
        
        Args:
            name: 提示词名称
            **kwargs: 模板变量
            
        Returns:
            格式化后的提示词
        """
        template = cls.get_user_prompt_template(name)
        try:
            return template.format(**kwargs)
        except KeyError as e:
            logger.warning(f"Missing template variable: {e}")
            return template
    
    @classmethod
    def get_safety_config(cls) -> Dict[str, Any]:
        """获取安全配置"""
        return cls.load("safety")
    
    @classmethod
    def get_blocked_patterns(cls) -> list:
        """获取拦截模式列表"""
        config = cls.get_safety_config()
        injection = config.get("injection_patterns", {})
        return injection.get("high_risk", []) + injection.get("medium_risk", [])
    
    @classmethod
    def get_safe_response(cls, category: str = "default") -> str:
        """获取安全回复"""
        config = cls.get_safety_config()
        responses = config.get("safe_responses", {})
        return responses.get(category, responses.get("default", "抱歉，我无法处理这个请求。"))
    
    @classmethod
    def reload(cls, name: Optional[str] = None) -> None:
        """
        重新加载提示词
        
        Args:
            name: 指定名称则只重载该提示词，否则清空缓存
        """
        if name:
            cls._cache.pop(name, None)
            cls.load(name)
        else:
            cls._cache.clear()
            logger.info("Prompt cache cleared")


# 便捷函数
def load_prompt(name: str) -> Dict[str, Any]:
    """加载提示词配置"""
    return PromptLoader.load(name)


def get_system_prompt(name: str) -> str:
    """获取系统提示词"""
    return PromptLoader.get_system_prompt(name)


def format_prompt(name: str, **kwargs) -> str:
    """格式化用户提示词"""
    return PromptLoader.format_user_prompt(name, **kwargs)
