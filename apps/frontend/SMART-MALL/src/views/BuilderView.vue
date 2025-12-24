<!--
  BuilderView.vue - 建模器页面

  功能：
  - 显示 3D 场景，用于管理员建模
  - 点击地面可以创建方块（代表店铺/区域）
  - 支持鼠标拖拽旋转视角、滚轮缩放

  后续扩展：
  - 工具栏（选择、创建、删除）
  - 属性面板（编辑选中对象）
  - 楼层管理
  - 数据导出
-->

<template>
  <div class="builder-view">
    <!-- 3D 场景容器，点击时触发 handleCanvasClick -->
    <div
      ref="sceneContainer"
      class="scene-container"
      @click="handleCanvasClick"
    ></div>

    <!-- 调试信息（开发时显示，后续可删除） -->
    <div class="debug-info">
      点击地面创建方块 | 鼠标拖拽旋转视角 | 滚轮缩放
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { ThreeEngine } from '@/engine'

/**
 * 建模器页面组件
 *
 * 这是管理员用来创建和编辑商城 3D 场景的页面。
 * 管理员可以在这里放置店铺、划分区域、设置楼层等。
 */
export default defineComponent({
  name: 'BuilderView',

  /**
   * 组件数据
   */
  data() {
    return {
      // Three.js 引擎实例，负责 3D 渲染
      engine: null as ThreeEngine | null
    }
  },

  methods: {
    /**
     * 处理画布点击事件 - 点击地面创建方块
     *
     * 这是建模器的核心交互：用户点击 3D 场景中的地面，
     * 系统在点击位置创建一个方块（代表店铺/区域）
     *
     * 流程：
     * 1. 获取鼠标在屏幕上的位置
     * 2. 将屏幕坐标转换为 3D 空间的射线
     * 3. 计算射线与地面（Y=0）的交点
     * 4. 在交点位置创建方块
     *
     * @param event - 鼠标点击事件
     */
    handleCanvasClick(event: MouseEvent) {
      // 如果引擎未初始化，直接返回
      if (!this.engine) return

      // 获取射线检测管理器（用于计算点击位置）
      const raycaster = this.engine.getRaycasterManager()

      // 获取渲染容器（用于计算鼠标相对位置）
      const container = this.engine.getContainer()

      // 将屏幕坐标转换为标准化设备坐标（-1 到 1）
      raycaster.updateMouse(event, container)

      // 计算射线与地面（Y=0 平面）的交点
      const groundPoint = raycaster.getGroundPoint()

      // 如果点击到了地面（有交点），在该位置创建方块
      if (groundPoint) {
        this.engine.addBox(groundPoint)
      }
    }
  },

  /**
   * 组件挂载后执行
   *
   * 在这里初始化 Three.js 引擎，因为需要等 DOM 元素准备好
   */
  mounted() {
    // 获取场景容器 DOM 元素
    const container = this.$refs.sceneContainer as HTMLElement

    if (container) {
      // 创建 Three.js 引擎，传入容器元素
      this.engine = new ThreeEngine(container)

      // 添加地板网格（帮助判断位置和大小）
      this.engine.addGridHelper()

      // 启动渲染循环
      this.engine.start()
    }
  },

  /**
   * 组件卸载前执行
   *
   * 重要：必须调用 dispose() 释放资源，否则会内存泄漏
   */
  unmounted() {
    // 销毁引擎，释放所有 Three.js 资源
    this.engine?.dispose()
    this.engine = null
  }
})
</script>

<style lang="scss" scoped>
/* 建模器页面容器 */
.builder-view {
  width: 100vw;      /* 占满视口宽度 */
  height: 100vh;     /* 占满视口高度 */
  position: relative;
  overflow: hidden;  /* 隐藏溢出内容 */

  /* 3D 场景容器 */
  .scene-container {
    width: 100%;
    height: 100%;
    cursor: crosshair; /* 十字光标，表示可以放置物体 */
  }

  /* 调试信息（左上角提示） */
  .debug-info {
    position: absolute;
    top: 20px;
    left: 20px;
    padding: 10px 15px;
    background: rgba(0, 0, 0, 0.6);
    color: white;
    font-size: 14px;
    border-radius: 4px;
    pointer-events: none; /* 不阻挡鼠标事件 */
  }
}
</style>
