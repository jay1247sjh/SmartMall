<!--
  DomainTestView.vue - 领域层测试页面 (P3 Checkpoint)

  功能：
  - 测试语义对象注册与查询
  - 测试高亮行为（悬停/选中）
  - 测试导航行为（店铺/区域/楼层）
  - 测试数据加载与验证
  - 测试领域事件系统
  - 测试场景查询行为

  访问路径：/domain-test
-->

<template>
  <div class="domain-test-view">
    <!-- 3D 场景容器 -->
    <div
      ref="sceneContainer"
      class="scene-container"
      @click="handleClick"
      @mousemove="handleMouseMove"
    ></div>

    <!-- 控制面板 -->
    <div class="control-panel">
      <h3>🏬 P3 领域层检查点</h3>

      <!-- 检查点状态 -->
      <div class="section checkpoint-status">
        <h4>✅ 检查点状态</h4>
        <div class="checkpoint-item" :class="{ passed: checkpoints.semanticRegistry }">
          <span class="icon">{{ checkpoints.semanticRegistry ? '✓' : '○' }}</span>
          <span>语义对象注册</span>
        </div>
        <div class="checkpoint-item" :class="{ passed: checkpoints.navigation }">
          <span class="icon">{{ checkpoints.navigation ? '✓' : '○' }}</span>
          <span>导航功能</span>
        </div>
        <div class="checkpoint-item" :class="{ passed: checkpoints.highlight }">
          <span class="icon">{{ checkpoints.highlight ? '✓' : '○' }}</span>
          <span>高亮功能</span>
        </div>
        <div class="checkpoint-item" :class="{ passed: checkpoints.dataLoader }">
          <span class="icon">{{ checkpoints.dataLoader ? '✓' : '○' }}</span>
          <span>数据加载</span>
        </div>
        <div class="checkpoint-item" :class="{ passed: checkpoints.eventBus }">
          <span class="icon">{{ checkpoints.eventBus ? '✓' : '○' }}</span>
          <span>事件系统</span>
        </div>
      </div>

      <!-- 楼层导航 -->
      <div class="section">
        <h4>🏢 楼层导航</h4>
        <div class="button-group">
          <button
            v-for="floor in floors"
            :key="floor.id"
            :class="{ active: currentFloor === floor.id }"
            @click="navigateToFloor(floor.id)"
          >
            {{ floor.name }}
          </button>
        </div>
      </div>

      <!-- 店铺导航 -->
      <div class="section">
        <h4>🏪 店铺导航</h4>
        <div class="button-group vertical">
          <button
            v-for="store in stores"
            :key="store.id"
            @click="navigateToStore(store.id)"
          >
            {{ store.name }}
          </button>
        </div>
      </div>

      <!-- 状态信息 -->
      <div class="section">
        <h4>📊 状态信息</h4>
        <div class="info-item">
          <span>选中店铺：</span>
          <span class="value">{{ selectedStore || '无' }}</span>
        </div>
        <div class="info-item">
          <span>悬停店铺：</span>
          <span class="value">{{ hoveredStore || '无' }}</span>
        </div>
        <div class="info-item">
          <span>导航状态：</span>
          <span class="value">{{ isNavigating ? '导航中...' : '空闲' }}</span>
        </div>
        <div class="info-item">
          <span>语义对象数：</span>
          <span class="value">{{ semanticObjectCount }}</span>
        </div>
      </div>

      <!-- 操作按钮 -->
      <div class="section">
        <h4>🔧 操作</h4>
        <button class="action-btn" @click="clearSelection">清除选中</button>
        <button class="action-btn" @click="resetCamera">重置视角</button>
        <button class="action-btn test" @click="runAllTests">运行全部测试</button>
      </div>
    </div>

    <!-- 事件日志面板 -->
    <div class="event-log-panel">
      <h4>📝 事件日志</h4>
      <div class="event-log">
        <div
          v-for="(log, index) in eventLogs"
          :key="index"
          class="log-item"
          :class="log.type"
        >
          <span class="time">{{ log.time }}</span>
          <span class="event">{{ log.event }}</span>
          <span class="data">{{ log.data }}</span>
        </div>
        <div v-if="eventLogs.length === 0" class="empty">暂无事件</div>
      </div>
      <button class="clear-log-btn" @click="clearEventLogs">清空日志</button>
    </div>

    <!-- 提示信息 -->
    <div class="tips">
      点击店铺选中 | 悬停显示高亮 | 使用面板导航 | 查看事件日志验证功能
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import * as THREE from 'three'
import { ThreeEngine } from '../engine'
import { HighlightEffect } from '../engine/effects/HighlightEffect'
import { MeshRegistry, SemanticObjectRegistry } from '../domain/registry'
import { SemanticObjectFactory } from '../domain/factory'
import { HighlightBehavior, NavigationBehavior } from '../domain/behaviors'
import { DomainEventBus, DomainEventHandler } from '../domain/events'
import { MallDataLoader, MallDataValidator } from '../domain/loader'
import { SceneEventEmitter } from '../engine/interaction/SceneEventEmitter'
import type { OrbitController } from '../engine/camera/OrbitController'


// 模拟店铺数据
interface MockStore {
  id: string
  name: string
  floorId: string
  areaId: string
  position: { x: number; y: number; z: number }
  color: number
}

// 模拟楼层数据
interface MockFloor {
  id: string
  name: string
  level: number
  y: number
}

// 模拟区域数据
interface MockArea {
  id: string
  name: string
  floorId: string
}

// 事件日志
interface EventLog {
  time: string
  event: string
  data: string
  type: 'info' | 'success' | 'warning'
}

// 检查点状态
interface CheckpointStatus {
  semanticRegistry: boolean
  navigation: boolean
  highlight: boolean
  dataLoader: boolean
  eventBus: boolean
}

export default defineComponent({
  name: 'DomainTestView',

  data() {
    return {
      // 引擎和管理器
      engine: null as ThreeEngine | null,
      semanticRegistry: null as SemanticObjectRegistry | null,
      meshRegistry: null as MeshRegistry | null,
      factory: null as SemanticObjectFactory | null,
      highlightBehavior: null as HighlightBehavior | null,
      navigationBehavior: null as NavigationBehavior | null,
      highlightEffect: null as HighlightEffect | null,
      domainEventBus: null as DomainEventBus | null,
      domainEventHandler: null as DomainEventHandler | null,
      sceneEventEmitter: null as SceneEventEmitter | null,

      // 状态
      currentFloor: 'floor_1',
      selectedStore: '',
      hoveredStore: '',
      isNavigating: false,
      semanticObjectCount: 0,

      // 检查点状态
      checkpoints: {
        semanticRegistry: false,
        navigation: false,
        highlight: false,
        dataLoader: false,
        eventBus: false,
      } as CheckpointStatus,

      // 事件日志
      eventLogs: [] as EventLog[],

      // 模拟数据
      floors: [
        { id: 'floor_1', name: '1F', level: 1, y: 0 },
        { id: 'floor_2', name: '2F', level: 2, y: 8 },
        { id: 'floor_3', name: '3F', level: 3, y: 16 },
      ] as MockFloor[],

      areas: [
        { id: 'area_1a', name: '餐饮区', floorId: 'floor_1' },
        { id: 'area_1b', name: '服装区', floorId: 'floor_1' },
        { id: 'area_2a', name: '数码区', floorId: 'floor_2' },
        { id: 'area_3a', name: '家居区', floorId: 'floor_3' },
      ] as MockArea[],

      stores: [
        { id: 'store_starbucks', name: '☕ 星巴克', floorId: 'floor_1', areaId: 'area_1a', position: { x: -8, y: 0, z: -5 }, color: 0x00704a },
        { id: 'store_nike', name: '👟 Nike', floorId: 'floor_1', areaId: 'area_1b', position: { x: 8, y: 0, z: -5 }, color: 0x111111 },
        { id: 'store_apple', name: '🍎 Apple', floorId: 'floor_2', areaId: 'area_2a', position: { x: 0, y: 8, z: 0 }, color: 0xa3aaae },
        { id: 'store_uniqlo', name: '👕 优衣库', floorId: 'floor_2', areaId: 'area_2a', position: { x: -8, y: 8, z: 5 }, color: 0xff0000 },
        { id: 'store_muji', name: '🏠 无印良品', floorId: 'floor_3', areaId: 'area_3a', position: { x: 5, y: 16, z: -3 }, color: 0xb5a642 },
      ] as MockStore[],

      // Mesh 映射（用于点击检测）
      meshToSemanticId: {} as Record<string, string>,
      // 业务 ID 到语义对象 ID 的映射
      businessIdToSemanticId: {} as Record<string, string>,
    }
  },

  methods: {
    /**
     * 添加事件日志
     */
    addEventLog(event: string, data: string, type: EventLog['type'] = 'info') {
      const now = new Date()
      const time = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`
      this.eventLogs.unshift({ time, event, data, type })
      // 保留最近 50 条日志
      if (this.eventLogs.length > 50) {
        this.eventLogs.pop()
      }
    },

    /**
     * 清空事件日志
     */
    clearEventLogs() {
      this.eventLogs = []
    },

    /**
     * 初始化场景
     */
    initScene() {
      const container = this.$refs.sceneContainer as HTMLElement
      if (!container) return

      // 1. 创建引擎
      this.engine = new ThreeEngine(container, {
        backgroundColor: 0xf5f5f5,
      })

      // 2. 创建注册表和工厂
      this.semanticRegistry = new SemanticObjectRegistry()
      this.meshRegistry = new MeshRegistry()
      this.factory = new SemanticObjectFactory(this.semanticRegistry)

      // 3. 创建高亮效果
      this.highlightEffect = new HighlightEffect()

      // 4. 创建行为
      this.highlightBehavior = new HighlightBehavior(
        this.meshRegistry,
        this.highlightEffect
      )

      // 获取 OrbitController（需要从引擎获取）
      const camera = this.engine.getCamera()
      const cameraController = {
        getCamera: () => camera,
      } as OrbitController

      this.navigationBehavior = new NavigationBehavior(
        this.meshRegistry,
        cameraController
      )

      // 5. 创建领域事件系统
      this.domainEventBus = new DomainEventBus()
      this.sceneEventEmitter = new SceneEventEmitter(
        this.engine.getRaycasterManager(),
        this.engine.getScene()
      )
      this.domainEventHandler = new DomainEventHandler(
        this.sceneEventEmitter,
        this.meshRegistry,
        this.semanticRegistry,
        this.domainEventBus
      )

      // 6. 订阅领域事件
      this.setupEventSubscriptions()

      // 7. 创建场景内容
      this.createFloors()
      this.createStores()

      // 8. 添加地板网格
      this.engine.addGridHelper(30, 30)

      // 9. 启动渲染
      this.engine.start()

      // 10. 更新语义对象计数
      this.updateSemanticObjectCount()

      // 11. 验证语义对象注册
      this.verifySemanticRegistry()

      this.addEventLog('系统初始化', '领域层测试环境已就绪', 'success')
    },

    /**
     * 设置事件订阅
     */
    setupEventSubscriptions() {
      if (!this.domainEventBus) return

      // 订阅店铺选中事件
      this.domainEventBus.on('store.selected', (data) => {
        this.addEventLog('store.selected', `店铺: ${data.storeName || data.storeId}`, 'success')
        this.checkpoints.eventBus = true
      })

      // 订阅店铺聚焦事件
      this.domainEventBus.on('store.focused', (data) => {
        this.addEventLog('store.focused', `店铺: ${data.storeName || data.storeId}`, 'info')
      })

      // 订阅店铺失焦事件
      this.domainEventBus.on('store.unfocused', (data) => {
        this.addEventLog('store.unfocused', `店铺: ${data.storeId}`, 'info')
      })

      // 订阅背景点击事件
      this.domainEventBus.on('scene.backgroundClick', () => {
        this.addEventLog('scene.backgroundClick', '点击了背景', 'info')
      })
    },

    /**
     * 验证语义对象注册
     */
    verifySemanticRegistry() {
      if (!this.semanticRegistry) return

      const count = this.semanticRegistry.size
      if (count > 0) {
        this.checkpoints.semanticRegistry = true
        this.addEventLog('语义注册验证', `已注册 ${count} 个语义对象`, 'success')
      }
    },

    /**
     * 更新语义对象计数
     */
    updateSemanticObjectCount() {
      this.semanticObjectCount = this.semanticRegistry?.size ?? 0
    },

    /**
     * 创建楼层平面
     */
    createFloors() {
      if (!this.engine || !this.semanticRegistry || !this.meshRegistry) return

      const scene = this.engine.getScene()

      this.floors.forEach((floor: MockFloor) => {
        // 创建楼层平面
        const geometry = new THREE.PlaneGeometry(25, 20)
        const material = new THREE.MeshStandardMaterial({
          color: 0xeeeeee,
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0.8,
        })
        const plane = new THREE.Mesh(geometry, material)
        plane.rotation.x = -Math.PI / 2
        plane.position.y = floor.y
        plane.receiveShadow = true

        scene.add(plane)

        // 注册到 MeshRegistry
        this.meshRegistry?.bind(floor.id, plane)
      })
    },

    /**
     * 创建店铺方块
     */
    createStores() {
      if (!this.engine || !this.semanticRegistry || !this.meshRegistry || !this.factory) return

      const scene = this.engine.getScene()

      this.stores.forEach((store: MockStore) => {
        // 创建店铺方块
        const geometry = new THREE.BoxGeometry(4, 3, 4)
        const material = new THREE.MeshStandardMaterial({
          color: store.color,
        })
        const mesh = new THREE.Mesh(geometry, material)
        mesh.position.set(
          store.position.x,
          store.position.y + 1.5,
          store.position.z
        )
        mesh.castShadow = true
        mesh.receiveShadow = true

        scene.add(mesh)

        // 使用工厂创建语义对象
        const semanticObject = this.factory!.createFromStore({
          id: store.id,
          name: store.name,
          merchantId: 'merchant_001',
          areaId: store.areaId,
          transform: {
            position: { x: store.position.x, y: store.position.y + 1.5, z: store.position.z },
            rotation: { x: 0, y: 0, z: 0 },
            scale: { x: 4, y: 3, z: 4 }, // 与 BoxGeometry 尺寸一致
          },
        })

        // 注册到 MeshRegistry
        this.meshRegistry?.bind(semanticObject.id, mesh)

        // 保存映射关系：mesh.uuid -> semanticId, businessId -> semanticId
        this.meshToSemanticId[mesh.uuid] = semanticObject.id
        this.businessIdToSemanticId[store.id] = semanticObject.id
      })
    },

    /**
     * 处理点击事件
     */
    handleClick(event: MouseEvent) {
      if (!this.engine) return

      const raycaster = this.engine.getRaycasterManager()
      const container = this.engine.getContainer()
      raycaster.updateMouse(event, container)

      const intersects = raycaster.intersect()

      if (intersects.length > 0) {
        const hit = intersects[0].object
        const semanticId = this.meshToSemanticId[hit.uuid]

        if (semanticId) {
          this.selectStore(semanticId)
        }
      }
    },

    /**
     * 处理鼠标移动（悬停高亮）
     */
    handleMouseMove(event: MouseEvent) {
      if (!this.engine || !this.highlightBehavior || !this.semanticRegistry) return

      const raycaster = this.engine.getRaycasterManager()
      const container = this.engine.getContainer()
      raycaster.updateMouse(event, container)

      const intersects = raycaster.intersect()

      if (intersects.length > 0) {
        const hit = intersects[0].object
        const semanticId = this.meshToSemanticId[hit.uuid]

        if (semanticId && semanticId !== this.hoveredStore) {
          this.highlightBehavior.clearHighlight()
          const result = this.highlightBehavior.highlightStore(semanticId)
          if (result) {
            this.checkpoints.highlight = true
          }
          // 从语义对象获取店铺名称
          const semanticObj = this.semanticRegistry.getById(semanticId)
          this.hoveredStore = (semanticObj?.metadata?.name as string) || semanticId
        }
      } else {
        if (this.hoveredStore) {
          this.highlightBehavior.clearHighlight()
          this.hoveredStore = ''
        }
      }
    },

    /**
     * 选中店铺（使用语义对象 ID）
     */
    selectStore(semanticId: string) {
      if (!this.highlightBehavior || !this.semanticRegistry) return

      this.highlightBehavior.clearSelection()
      const result = this.highlightBehavior.selectStore(semanticId)
      if (result) {
        this.checkpoints.highlight = true
      }
      // 从语义对象获取店铺名称
      const semanticObj = this.semanticRegistry.getById(semanticId)
      this.selectedStore = (semanticObj?.metadata?.name as string) || semanticId
      this.addEventLog('选中店铺', `${this.selectedStore}`, 'success')
    },

    /**
     * 导航到店铺（接收业务 ID，转换为语义对象 ID）
     */
    navigateToStore(businessId: string) {
      if (!this.navigationBehavior || !this.engine) return

      // 将业务 ID 转换为语义对象 ID
      const semanticId = this.businessIdToSemanticId[businessId]
      if (!semanticId) {
        this.addEventLog('导航失败', `找不到店铺: ${businessId}`, 'warning')
        return
      }

      this.isNavigating = true
      const engine = this.engine
      const result = this.navigationBehavior.navigateToStore(semanticId, {
        onUpdate: () => engine.requestRender(),
      })

      if (result.success) {
        this.checkpoints.navigation = true
        const store = this.stores.find((s: MockStore) => s.id === businessId)
        this.addEventLog('导航到店铺', `${store?.name}`, 'success')
      }

      setTimeout(() => {
        this.isNavigating = false
      }, 1000)
    },

    /**
     * 导航到楼层
     */
    navigateToFloor(floorId: string) {
      if (!this.navigationBehavior || !this.engine) return

      this.currentFloor = floorId
      this.isNavigating = true
      const engine = this.engine
      const result = this.navigationBehavior.navigateToFloor(floorId, {
        onUpdate: () => engine.requestRender(),
      })

      if (result.success) {
        this.checkpoints.navigation = true
        const floor = this.floors.find((f: MockFloor) => f.id === floorId)
        this.addEventLog('导航到楼层', `${floor?.name}`, 'success')
      }

      setTimeout(() => {
        this.isNavigating = false
      }, 1500)
    },

    /**
     * 清除选中
     */
    clearSelection() {
      this.highlightBehavior?.clearSelection()
      this.selectedStore = ''
      this.addEventLog('清除选中', '已清除', 'info')
    },

    /**
     * 重置视角
     */
    resetCamera() {
      if (!this.engine) return
      const camera = this.engine.getCamera()
      camera.position.set(20, 25, 30)
      camera.lookAt(0, 8, 0)
      this.addEventLog('重置视角', '相机已重置', 'info')
    },

    /**
     * 运行全部测试
     */
    async runAllTests() {
      this.addEventLog('开始测试', '运行全部检查点测试...', 'info')

      // 测试 1: 语义对象注册
      await this.testSemanticRegistry()

      // 测试 2: 数据加载器
      await this.testDataLoader()

      // 测试 3: 导航功能
      await this.testNavigation()

      // 测试 4: 高亮功能
      await this.testHighlight()

      // 测试 5: 事件系统
      await this.testEventBus()

      // 汇总结果
      const passed = Object.values(this.checkpoints).filter(Boolean).length
      const total = Object.keys(this.checkpoints).length
      this.addEventLog('测试完成', `通过 ${passed}/${total} 项检查`, passed === total ? 'success' : 'warning')
    },

    /**
     * 测试语义对象注册
     */
    async testSemanticRegistry() {
      if (!this.semanticRegistry) return

      const count = this.semanticRegistry.size
      if (count >= this.stores.length) {
        this.checkpoints.semanticRegistry = true
        this.addEventLog('✓ 语义注册', `${count} 个对象已注册`, 'success')
      } else {
        this.addEventLog('✗ 语义注册', `期望 ${this.stores.length}，实际 ${count}`, 'warning')
      }
    },

    /**
     * 测试数据加载器
     */
    async testDataLoader() {
      const validator = new MallDataValidator()
      const loader = new MallDataLoader(validator)

      // 测试有效数据
      const validMallData = {
        id: 'mall_test',
        name: '测试商城',
        floors: [
          {
            id: 'floor_1',
            name: '1F',
            level: 1,
            mallId: 'mall_test',
            areas: [
              {
                id: 'area_1',
                name: '测试区域',
                floorId: 'floor_1',
                stores: [
                  {
                    id: 'store_1',
                    name: '测试店铺',
                    merchantId: 'merchant_1',
                    areaId: 'area_1',
                  },
                ],
              },
            ],
          },
        ],
      }

      const result = await loader.loadFromConfig(validMallData)
      if (result.success) {
        this.checkpoints.dataLoader = true
        this.addEventLog('✓ 数据加载', `加载耗时 ${result.data?.loadTime.toFixed(2)}ms`, 'success')
      } else {
        this.addEventLog('✗ 数据加载', result.error?.message || '未知错误', 'warning')
      }

      // 测试无效数据验证
      const invalidData = { id: '', name: '' }
      const invalidResult = await loader.loadFromConfig(invalidData)
      if (!invalidResult.success) {
        this.addEventLog('✓ 数据验证', '正确拒绝无效数据', 'success')
      }
    },

    /**
     * 测试导航功能
     */
    async testNavigation() {
      if (!this.navigationBehavior || !this.engine) return

      // 获取第一个店铺的语义对象 ID
      const semanticId = this.businessIdToSemanticId['store_starbucks']
      if (!semanticId) {
        this.addEventLog('✗ 导航功能', '找不到测试店铺', 'warning')
        return
      }

      const engine = this.engine
      const result = this.navigationBehavior.navigateToStore(semanticId, {
        onUpdate: () => engine.requestRender(),
      })

      if (result.success) {
        this.checkpoints.navigation = true
        this.addEventLog('✓ 导航功能', '店铺导航正常', 'success')
      } else {
        this.addEventLog('✗ 导航功能', result.error?.message || '导航失败', 'warning')
      }
    },

    /**
     * 测试高亮功能
     */
    async testHighlight() {
      if (!this.highlightBehavior) return

      // 获取店铺的语义对象 ID
      const semanticId = this.businessIdToSemanticId['store_nike']
      if (!semanticId) {
        this.addEventLog('✗ 高亮功能', '找不到测试店铺', 'warning')
        return
      }

      const result = this.highlightBehavior.highlightStore(semanticId)
      if (result) {
        this.checkpoints.highlight = true
        this.addEventLog('✓ 高亮功能', '店铺高亮正常', 'success')

        // 清除高亮
        setTimeout(() => {
          this.highlightBehavior?.clearHighlight()
        }, 500)
      } else {
        this.addEventLog('✗ 高亮功能', '高亮失败', 'warning')
      }
    },

    /**
     * 测试事件系统
     */
    async testEventBus() {
      if (!this.domainEventBus) return

      let eventReceived = false

      // 订阅测试事件
      const unsubscribe = this.domainEventBus.on('store.selected', () => {
        eventReceived = true
      })

      // 发送测试事件
      this.domainEventBus.emit('store.selected', {
        storeId: 'test_store',
        storeName: '测试店铺',
        semanticId: 'test_semantic_id',
      })

      // 检查是否收到事件
      if (eventReceived) {
        this.checkpoints.eventBus = true
        this.addEventLog('✓ 事件系统', '事件发布订阅正常', 'success')
      } else {
        this.addEventLog('✗ 事件系统', '事件未收到', 'warning')
      }

      // 取消订阅
      unsubscribe()
    },
  },

  mounted() {
    this.initScene()
  },

  unmounted() {
    this.domainEventHandler?.dispose()
    this.highlightBehavior?.dispose()
    this.navigationBehavior?.dispose()
    this.highlightEffect?.dispose()
    this.engine?.dispose()
  },
})
</script>


<style lang="scss" scoped>
.domain-test-view {
  width: 100vw;
  height: 100vh;
  position: relative;
  overflow: hidden;

  .scene-container {
    width: 100%;
    height: 100%;
    cursor: pointer;
  }

  .control-panel {
    position: absolute;
    top: 20px;
    right: 20px;
    width: 240px;
    max-height: calc(100vh - 100px);
    overflow-y: auto;
    background: rgba(255, 255, 255, 0.95);
    border-radius: 12px;
    padding: 16px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);

    h3 {
      margin: 0 0 16px 0;
      font-size: 16px;
      color: #333;
    }

    .section {
      margin-bottom: 16px;

      h4 {
        margin: 0 0 8px 0;
        font-size: 13px;
        color: #666;
        font-weight: 500;
      }
    }

    .checkpoint-status {
      .checkpoint-item {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 6px 8px;
        margin-bottom: 4px;
        border-radius: 6px;
        background: #f5f5f5;
        font-size: 13px;
        color: #666;
        transition: all 0.2s;

        .icon {
          width: 16px;
          height: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          background: #ddd;
          color: #999;
          font-size: 10px;
        }

        &.passed {
          background: #e8f5e9;
          color: #2e7d32;

          .icon {
            background: #4caf50;
            color: white;
          }
        }
      }
    }

    .button-group {
      display: flex;
      gap: 8px;

      &.vertical {
        flex-direction: column;
      }

      button {
        flex: 1;
        padding: 8px 12px;
        border: 1px solid #ddd;
        border-radius: 6px;
        background: #fff;
        cursor: pointer;
        font-size: 13px;
        transition: all 0.2s;

        &:hover {
          background: #f0f0f0;
          border-color: #ccc;
        }

        &.active {
          background: #4a90d9;
          color: white;
          border-color: #4a90d9;
        }
      }
    }

    .info-item {
      display: flex;
      justify-content: space-between;
      padding: 6px 0;
      font-size: 13px;
      border-bottom: 1px solid #eee;

      .value {
        color: #4a90d9;
        font-weight: 500;
      }
    }

    .action-btn {
      width: 100%;
      padding: 10px;
      margin-top: 8px;
      border: none;
      border-radius: 6px;
      background: #4a90d9;
      color: white;
      cursor: pointer;
      font-size: 14px;

      &:hover {
        background: #3a7bc8;
      }

      &:first-child {
        margin-top: 0;
      }

      &.test {
        background: #43a047;

        &:hover {
          background: #388e3c;
        }
      }
    }
  }

  .event-log-panel {
    position: absolute;
    bottom: 60px;
    left: 20px;
    width: 360px;
    max-height: 240px;
    background: rgba(255, 255, 255, 0.95);
    border-radius: 12px;
    padding: 12px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);

    h4 {
      margin: 0 0 8px 0;
      font-size: 13px;
      color: #666;
    }

    .event-log {
      max-height: 160px;
      overflow-y: auto;
      font-family: 'Monaco', 'Menlo', monospace;
      font-size: 11px;

      .log-item {
        display: flex;
        gap: 8px;
        padding: 4px 6px;
        margin-bottom: 2px;
        border-radius: 4px;
        background: #f5f5f5;

        .time {
          color: #999;
          flex-shrink: 0;
        }

        .event {
          color: #333;
          font-weight: 500;
          flex-shrink: 0;
        }

        .data {
          color: #666;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        &.success {
          background: #e8f5e9;
          .event { color: #2e7d32; }
        }

        &.warning {
          background: #fff3e0;
          .event { color: #ef6c00; }
        }
      }

      .empty {
        color: #999;
        text-align: center;
        padding: 20px;
      }
    }

    .clear-log-btn {
      width: 100%;
      margin-top: 8px;
      padding: 6px;
      border: 1px solid #ddd;
      border-radius: 4px;
      background: #fff;
      cursor: pointer;
      font-size: 12px;

      &:hover {
        background: #f5f5f5;
      }
    }
  }

  .tips {
    position: absolute;
    bottom: 20px;
    left: 50%;
    transform: translateX(-50%);
    padding: 10px 20px;
    background: rgba(0, 0, 0, 0.6);
    color: white;
    font-size: 14px;
    border-radius: 20px;
  }
}
</style>
