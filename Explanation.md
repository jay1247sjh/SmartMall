# 基于 AI 驱动的三维智能商城导购系统设计与实现

---

## 摘要

随着电子商务和虚拟现实技术的快速发展，传统的二维网页购物体验已难以满足用户对沉浸式、智能化导购服务的需求。本文设计并实现了一个基于 AI 驱动的三维智能商城导购系统，该系统采用 Vue 3 + TypeScript + Three.js 技术栈构建前端，Spring Boot 3 + PostgreSQL 构建后端，FastAPI + Qwen 构建智能服务，通过引入 AI Agent 实现自然语言驱动的三维空间导航与交互。

系统将传统二维导购模式升级为可交互的三维语义空间，用户无需理解复杂界面或操作逻辑，仅通过文本或语音指令即可完成店铺定位、路径导航、区域高亮等导购行为。本文详细阐述了系统的需求分析、总体设计、详细设计与实现过程，重点介绍了分层架构设计、语义对象建模、Action 协议机制、RCAC 权限模型、区域建模权限管理、AI Agent Function Calling 等核心技术方案。

测试结果表明，系统能够在主流设备上保持 30 FPS 以上的流畅帧率，自然语言指令识别准确率达到 92% 以上，满足了三维智能导购的功能需求和性能要求。

**关键词**：三维可视化；智能导购；AI Agent；Function Calling；Vue 3；Three.js；自然语言交互

---

## Abstract

With the rapid development of e-commerce and virtual reality technology, traditional two-dimensional web shopping experiences can no longer meet users' demands for immersive and intelligent shopping guide services. This paper designs and implements an AI-driven 3D smart mall shopping guide system, which uses Vue 3 + TypeScript + Three.js technology stack for the frontend, Spring Boot 3 + PostgreSQL for the backend, and FastAPI + Qwen for the intelligence service, introducing AI Agent with Function Calling to achieve natural language-driven 3D spatial navigation and interaction.

The system upgrades the traditional 2D shopping guide mode to an interactive 3D semantic space. Users can complete store positioning, path navigation, area highlighting and other shopping guide behaviors through text or voice commands without understanding complex interfaces or operation logic. This paper elaborates on the system's requirement analysis, overall design, detailed design and implementation process, focusing on the layered architecture design, semantic object modeling, Action protocol mechanism, RCAC permission model, area modeling permission management, and AI Agent Function Calling integration.

Test results show that the system can maintain a smooth frame rate of over 30 FPS on mainstream devices, with natural language instruction recognition accuracy reaching over 92%, meeting the functional requirements and performance requirements of 3D intelligent shopping guide.

**Keywords**: 3D Visualization; Smart Shopping Guide; AI Agent; Function Calling; Vue 3; Three.js; Natural Language Interaction

---

## 目录

- 第 1 章 绪论
  - 1.1 研究背景与意义
  - 1.2 国内外研究现状
  - 1.3 研究内容与主要工作
  - 1.4 论文组织结构
- 第 2 章 相关技术与理论基础
  - 2.1 Web 三维可视化技术
  - 2.2 前端工程化技术
  - 2.3 后端技术栈
  - 2.4 AI Agent 与大语言模型
  - 2.5 本章小结
- 第 3 章 系统需求分析
  - 3.1 系统概述
  - 3.2 用户角色分析
  - 3.3 功能性需求分析
  - 3.4 非功能性需求分析
  - 3.5 本章小结
- 第 4 章 系统总体设计
  - 4.1 系统总体架构设计
  - 4.2 前端分层架构设计
  - 4.3 后端分层架构设计
  - 4.4 智能服务架构设计
  - 4.5 共享类型包设计
  - 4.6 数据库设计
  - 4.7 本章小结
- 第 5 章 系统详细设计与实现
  - 5.1 渲染引擎层设计与实现
  - 5.2 领域场景层设计与实现
  - 5.3 业务协调层设计与实现
  - 5.4 后端核心模块实现
  - 5.5 AI Agent 集成实现
  - 5.6 本章小结
- 第 6 章 系统测试与分析
  - 6.1 测试环境
  - 6.2 功能测试
  - 6.3 性能测试
  - 6.4 测试结果分析
  - 6.5 本章小结
- 第 7 章 总结与展望
  - 7.1 工作总结
  - 7.2 不足与展望
- 参考文献
- 致谢

---

## 第 1 章 绪论

### 1.1 研究背景与意义

#### 1.1.1 研究背景

随着互联网技术的飞速发展和电子商务的蓬勃兴起，线上购物已成为人们日常生活中不可或缺的一部分。据统计，2023 年中国网络零售额已突破 15 万亿元，网购用户规模超过 9 亿人。然而，传统的二维网页购物模式存在诸多局限性：

1. **空间感知缺失**：用户难以直观感受商品的空间布局和实际效果，商品展示局限于平面图片和文字描述，缺乏立体感和真实感。
2. **交互体验单一**：传统电商平台的交互方式主要依赖点击、滑动等二维操作，用户无法像在实体商场中那样自由漫游、多角度观察商品。
3. **导航效率低下**：面对海量商品和复杂的分类体系，用户需要通过层层菜单和筛选条件才能找到目标商品，学习成本高、操作繁琐。
4. **智能化程度不足**：现有导购系统多采用基于规则的推荐算法，难以理解用户的自然语言表达和复杂意图。

与此同时，虚拟现实（VR）、增强现实（AR）和 Web 三维可视化技术的成熟为解决上述问题提供了新的思路。Three.js 等开源框架的出现大大降低了 Web 3D 开发的门槛，使得在浏览器中构建复杂的三维场景成为可能。此外，以 GPT、Qwen、Claude 为代表的大语言模型（LLM）的突破，特别是 Function Calling 能力的成熟，使得通过自然语言与系统交互成为现实，为智能导购系统的发展开辟了新的方向。

#### 1.1.2 研究意义

基于上述背景，本文提出并实现了一个基于 AI 驱动的三维智能商城导购系统。该系统具有以下研究意义：

**理论意义**：

1. **探索 AI Agent 与三维可视化系统的协同机制**：提出了"决策与执行分离"的架构设计理念，AI Agent 仅负责意图理解和行为建议，不直接操作三维场景，所有操作都需要经过统一的权限校验和行为调度。
2. **研究语义对象建模方法**：提出了"语义优先"的建模原则，将业务语义与三维渲染解耦，使系统能够理解对象的业务含义而非仅依赖几何属性。
3. **设计基于角色、能力和上下文的权限控制模型（RCAC）**：在传统 RBAC 模型基础上引入空间维度的权限控制，为多角色协作的三维系统提供了参考。
4. **探索 Function Calling 在复杂交互系统中的应用**：设计了完整的工具定义、安全分级和执行流程，为 AI Agent 与业务系统的集成提供了实践经验。

**实践意义**：

1. **为电商平台提供新型三维导购解决方案**：通过构建三维虚拟商城，用户可以像在实体商场中一样自由漫游、浏览商品，获得更加真实和沉浸的购物体验。
2. **降低用户使用门槛**：通过自然语言交互，用户无需学习复杂的操作方式，只需说出需求即可完成导航和查询。
3. **为商家提供可视化配置工具**：商家可以在授权区域内自定义店铺布局和商品陈列，简化了运营管理流程。

### 1.2 国内外研究现状

#### 1.2.1 Web 三维可视化技术研究现状

Web 三维可视化技术经历了从插件时代到原生支持的演进过程。早期的 VRML（Virtual Reality Modeling Language）和 Flash 3D 需要安装额外插件，用户体验较差，且存在安全隐患。2011 年，随着 HTML5 标准的推广，浏览器开始原生支持三维图形渲染，Three.js、Babylon.js 等开源框架应运而生。

**Three.js** 是目前最流行的 Web 三维图形库，由 Ricardo Cabello（Mr.doob）于 2010 年创建。它提供了一套简洁的 JavaScript API，封装了复杂的底层图形操作，使开发者能够快速构建三维场景。Three.js 的核心优势包括：

- **丰富的几何体和材质**：内置多种基础几何体（立方体、球体、圆柱体等）和材质类型（基础材质、Lambert 材质、Phong 材质、PBR 材质等）
- **完善的光照系统**：支持环境光、平行光、点光源、聚光灯等多种光源类型
- **强大的相机控制**：提供轨道控制器、第一人称控制器、飞行控制器等多种相机控制方式
- **模型加载能力**：支持 GLTF、OBJ、FBX 等主流三维模型格式的加载

近年来，国内外学者和企业在 Web 三维可视化领域进行了大量研究和实践。阿里巴巴推出的"造物神"平台实现了商品的三维展示，用户可以 360 度旋转查看商品细节。京东的"AR 试穿"功能让用户可以虚拟试穿服装和配饰。宜家的"IKEA Place"应用允许用户将虚拟家具放置在真实环境中预览效果。

#### 1.2.2 智能导购系统研究现状

智能导购系统的研究主要集中在推荐算法、对话系统和用户行为分析三个方向。

**推荐算法**方面，传统的协同过滤和内容过滤算法已经相当成熟。近年来，深度学习的引入显著提升了推荐的准确性。基于神经网络的推荐模型（如 Wide & Deep、DeepFM、DIN 等）能够更好地捕捉用户兴趣和商品特征之间的复杂关系。

**对话系统**方面，从基于规则的方法发展到基于检索和生成的方法。早期的对话系统依赖人工编写的规则和模板，覆盖范围有限。基于检索的方法通过匹配用户输入和预定义的问答对来生成回复。基于生成的方法使用序列到序列（Seq2Seq）模型直接生成回复文本。大语言模型的出现使得系统能够理解更复杂的用户意图，生成更自然的回复。

**用户行为分析**方面，通过分析用户的浏览历史、点击行为、停留时间等数据，可以构建用户画像，预测用户偏好。眼动追踪、热力图分析等技术被用于研究用户在界面上的注意力分布。

然而，现有的智能导购系统大多局限于二维界面，将三维可视化与智能导购相结合的研究相对较少。本文的工作正是填补这一空白，探索 AI Agent 在三维商城场景中的应用。

#### 1.2.3 AI Agent 与 Function Calling 技术研究现状

AI Agent（智能代理）是人工智能领域的重要研究方向，指能够感知环境、做出决策并执行动作的智能实体。一个典型的 AI Agent 包含以下组件：

1. **感知模块**：接收用户输入和环境信息
2. **决策模块**：理解意图，规划行动
3. **执行模块**：将决策转化为具体操作
4. **记忆模块**：存储历史信息和上下文

随着 GPT、Claude、Qwen、LLaMA 等大语言模型的发展，基于 LLM 的 AI Agent 成为研究热点。特别是 **Function Calling**（函数调用）能力的成熟，使得 LLM 能够：

- 理解用户的自然语言意图
- 自动选择合适的工具/函数
- 生成符合规范的参数
- 处理工具返回结果并继续对话

代表性的项目包括：

- **AutoGPT**：能够自主分解任务、执行子任务并迭代优化的自主 Agent
- **LangChain**：提供了构建 LLM 应用的工具链，支持 Agent、Chain、Memory 等抽象
- **OpenAI Function Calling**：标准化的工具调用协议，被广泛采用
- **阿里云百炼 Qwen**：支持 Function Calling 和视觉理解的国产大模型

本文借鉴了这些框架的设计思想，将 AI Agent 定位为"受控的辅助决策入口"，通过标准化的 Action 协议与三维系统交互，并实现了完整的 Function Calling 工具链。

### 1.3 研究内容与主要工作

本文的研究内容主要包括以下几个方面：

1. **系统架构设计**：设计了清晰的前后端分离架构。前端采用四层架构（UI 层、业务协调层、领域场景层、渲染引擎层），后端采用经典的四层架构（接口层、应用层、领域层、基础设施层），智能服务采用 FastAPI + LLM 架构，实现了关注点分离和模块解耦。
2. **语义对象建模**：提出了"语义优先"的建模原则，将三维对象与业务实体关联。每个 Three.js 对象都具备明确的语义身份（semanticType 和 businessId），使系统能够理解对象的业务含义。
3. **Action 协议机制**：设计了统一的行为协议，使来自 UI 和 AI 的操作可以被一致地校验和执行。所有行为都必须经过业务协调层（Orchestrator）的权限校验和上下文验证。
4. **RCAC 权限模型**：设计了基于角色（Role）、能力（Capability）和上下文（Context）的权限控制模型，支持多角色协作场景。权限判定不仅考虑用户角色，还考虑当前所在空间和系统模式。
5. **区域建模权限机制**：设计了商家建模权限申请、审批和沙盒约束机制。商家只能在授权区域内进行建模操作，所有变更需要经过管理员审核才能发布。
6. **AI Agent 与 Function Calling 集成**：实现了完整的 AI Agent 系统，包括：

   - 基于 Qwen 的 LLM 提供商，支持文本对话和视觉理解
   - 12 个 Function Calling 工具定义（导航、搜索、购物、推荐等）
   - 三级安全控制（safe/confirm/critical）
   - 严格约束的提示词系统
7. **提示词工程**：设计了模块化的提示词系统，包括系统提示词、意图识别、Action 生成、视觉理解、安全防护等，采用 YAML 配置管理，支持热更新。

### 1.4 论文组织结构

本文共分为七章，各章内容安排如下：

**第 1 章 绪论**：介绍研究背景与意义，分析国内外研究现状，阐述本文的研究内容与主要工作，说明论文的组织结构。

**第 2 章 相关技术与理论基础**：介绍系统开发所涉及的关键技术，包括 Web 三维可视化技术（Three.js）、前端工程化技术（Vue 3、TypeScript、Vite、Pinia）、后端技术栈（Spring Boot、MyBatis-Plus、PostgreSQL、Redis）、智能服务技术栈（FastAPI、Qwen、Function Calling）以及 AI Agent 与自然语言处理技术。

**第 3 章 系统需求分析**：对系统进行全面的需求分析，包括系统概述、用户角色分析、功能性需求分析、非功能性需求分析等。

**第 4 章 系统总体设计**：阐述系统的总体架构设计，包括前端分层架构、后端分层架构、智能服务架构、数据库设计等。

**第 5 章 系统详细设计与实现**：详细描述各层的设计与实现，包括渲染引擎层、领域场景层、业务协调层、后端核心模块、AI Agent 集成和提示词系统。

**第 6 章 系统测试与分析**：介绍系统的测试环境、测试方法和测试结果，对系统功能和性能进行分析。

**第 7 章 总结与展望**：总结本文的工作，分析存在的不足，展望未来的研究方向。

---

## 第 2 章 相关技术与理论基础

### 2.1 Web 三维可视化技术

#### 2.1.1 Three.js 框架概述

Three.js 是一个基于 JavaScript 的三维图形库，它封装了复杂的底层图形操作，提供了一套简洁易用的 API，使开发者能够在浏览器中快速构建三维场景。Three.js 的核心组件包括：

**1. 场景（Scene）**

场景是所有三维对象的容器，类似于舞台。所有需要渲染的对象（网格、光源、相机等）都必须添加到场景中。场景还可以设置背景颜色、雾效等环境属性。

```javascript
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xf0f0f0);
scene.fog = new THREE.Fog(0xf0f0f0, 10, 100);
```

**2. 相机（Camera）**

相机定义了观察场景的视角。Three.js 提供了多种相机类型：

- **透视相机（PerspectiveCamera）**：模拟人眼视觉，近大远小，适合大多数三维场景
- **正交相机（OrthographicCamera）**：无透视效果，物体大小不随距离变化，适合 2D 游戏和工程图纸

```javascript
const camera = new THREE.PerspectiveCamera(
  75,                                          // 视野角度
  window.innerWidth / window.innerHeight,      // 宽高比
  0.1,                                         // 近裁剪面
  1000                                         // 远裁剪面
);
camera.position.set(0, 10, 20);
```

**3. 渲染器（Renderer）**

渲染器负责将场景渲染到画布上。Three.js 的 WebGLRenderer 利用 GPU 进行硬件加速渲染，能够实现高性能的实时渲染。

```javascript
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
document.body.appendChild(renderer.domElement);
```

**4. 几何体（Geometry）与材质（Material）**

几何体定义物体的形状，材质定义物体的外观。Three.js 内置了多种基础几何体和材质类型，支持 PBR（基于物理的渲染）材质。

**5. 网格（Mesh）与光源（Light）**

网格是几何体和材质的组合，是场景中的可见对象。光源照亮场景中的物体，支持环境光、平行光、点光源、聚光灯等类型。

#### 2.1.2 Three.js 渲染流程

Three.js 的渲染遵循以下基本流程：

```
初始化阶段
├── 创建场景（Scene）
├── 创建相机（Camera）
├── 创建渲染器（Renderer）
├── 设置光源（Light）
├── 加载模型和纹理
└── 绑定事件监听器

渲染循环（每帧执行）
├── UPDATE 阶段：更新数据/状态
│   ├── 更新相机控制器
│   ├── 更新动画
│   └── 执行用户回调
└── RENDER 阶段：绘制画面
    └── 调用 renderer.render(scene, camera)
```

渲染循环通过 `requestAnimationFrame` 实现，浏览器会在每次重绘前调用回调函数，通常每秒 60 次（60 FPS）。

#### 2.1.3 Three.js 交互机制

Three.js 通过射线检测（Raycasting）实现鼠标与三维对象的交互。射线从相机位置出发，穿过鼠标在屏幕上的位置，检测与场景中物体的交点。

```javascript
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

function onMouseClick(event) {
  // 将鼠标位置转换为标准化设备坐标
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
  
  // 设置射线
  raycaster.setFromCamera(mouse, camera);
  
  // 检测交点
  const intersects = raycaster.intersectObjects(scene.children, true);
  
  if (intersects.length > 0) {
    const object = intersects[0].object;
    // 处理点击事件
  }
}
```

### 2.2 前端工程化技术

#### 2.2.1 Vue 3 框架

Vue 3 是一个渐进式 JavaScript 框架，用于构建用户界面。相比 Vue 2，Vue 3 带来了以下重要改进：

**1. Composition API**

Composition API 提供了更灵活的代码组织方式，便于逻辑复用。通过 `setup` 函数，可以将相关的逻辑组织在一起，而不是分散在 `data`、`methods`、`computed` 等选项中。

```typescript
import { ref, computed, onMounted } from 'vue';

export default {
  setup() {
    const count = ref(0);
    const doubled = computed(() => count.value * 2);
  
    function increment() {
      count.value++;
    }
  
    onMounted(() => {
      console.log('Component mounted');
    });
  
    return { count, doubled, increment };
  }
};
```

**2. 更好的 TypeScript 支持**

Vue 3 的核心代码使用 TypeScript 重写，提供了完整的类型定义，使得在 TypeScript 项目中使用 Vue 更加顺畅。

**3. 性能提升**

Vue 3 对虚拟 DOM 进行了重写，引入了静态提升、补丁标记等编译时优化，显著提升了渲染性能。

#### 2.2.2 Element Plus UI 框架

Element Plus 是 Element UI 的 Vue 3 版本，是一套为开发者、设计师和产品经理准备的基于 Vue 3 的桌面端组件库。本系统选择 Element Plus 的原因包括：

1. **完整的组件库**：提供 70+ 高质量组件，覆盖表单、数据展示、导航、反馈等场景
2. **TypeScript 支持**：完整的类型定义，提供良好的开发体验
3. **暗色主题**：内置暗色主题支持，通过 CSS 变量实现主题切换
4. **国际化**：内置多语言支持，方便国际化开发
5. **按需引入**：支持按需引入组件，减小打包体积

#### 2.2.3 TypeScript 语言

TypeScript 是 JavaScript 的超集，添加了静态类型检查。使用 TypeScript 的优势包括：

1. **类型安全**：在编译时发现类型错误，减少运行时错误
2. **更好的 IDE 支持**：代码补全、重构、导航等功能更加智能
3. **自文档化**：类型定义本身就是文档，提高代码可读性
4. **更易维护**：在大型项目中，类型系统有助于理解代码结构

#### 2.2.4 Vite 构建工具与 Pinia 状态管理

**Vite** 是新一代前端构建工具，具有极速的开发服务器启动、即时的模块热更新（HMR）和优化的生产构建。

**Pinia** 是 Vue 3 官方推荐的状态管理库，相比 Vuex 具有更简洁的 API、完整的 TypeScript 支持和模块化设计。

### 2.3 后端技术栈

#### 2.3.1 Spring Boot 框架

Spring Boot 是基于 Spring 框架的快速开发框架，它简化了 Spring 应用的配置和部署。本系统采用 Spring Boot 3.x 版本，主要特性包括：

1. **自动配置**：根据项目依赖自动配置 Spring 应用
2. **起步依赖**：通过 starter 依赖简化依赖管理
3. **内嵌服务器**：内置 Tomcat、Jetty 等服务器，无需部署 WAR 包
4. **Actuator**：提供生产级别的监控和管理功能

#### 2.3.2 MyBatis-Plus

MyBatis-Plus 是 MyBatis 的增强工具，在 MyBatis 的基础上只做增强不做改变。主要特性包括：

1. **无侵入**：只做增强不做改变，引入它不会对现有工程产生影响
2. **强大的 CRUD 操作**：内置通用 Mapper、通用 Service
3. **支持 Lambda 形式调用**：通过 Lambda 表达式，方便的编写各类查询条件
4. **支持主键自动生成**：支持多达 4 种主键策略

#### 2.3.3 PostgreSQL 数据库

PostgreSQL 是一个功能强大的开源关系型数据库，本系统选择 PostgreSQL 的原因包括：

1. **JSONB 支持**：原生支持 JSON 数据类型，可以存储和查询 JSON 数据，适合存储商城配置等半结构化数据
2. **丰富的数据类型**：支持数组、范围、几何等高级数据类型
3. **强大的扩展性**：支持自定义函数、触发器、存储过程
4. **高可靠性**：支持 ACID 事务，数据一致性有保障

#### 2.3.4 Redis 缓存

Redis 是一个高性能的键值存储系统，本系统使用 Redis 实现数据缓存、会话管理和分布式锁。

### 2.4 AI Agent 与大语言模型

#### 2.4.1 AI Agent 概念

AI Agent（智能代理）是能够感知环境、做出决策并执行动作的智能实体。在本系统中，AI Agent 的主要职责是：

1. **意图理解**：解析用户的自然语言输入，识别用户意图
2. **实体提取**：从用户输入中提取关键信息（如店铺名称、商品类别等）
3. **工具选择**：根据意图选择合适的 Function Calling 工具
4. **行为生成**：将用户意图转化为结构化的 Action

#### 2.4.2 大语言模型（LLM）与 Function Calling

大语言模型是基于 Transformer 架构的深度学习模型，通过海量文本数据训练，具备强大的自然语言理解和生成能力。

**Function Calling** 是 LLM 的一项关键能力，允许模型：

1. 理解用户意图并判断是否需要调用工具
2. 从预定义的工具列表中选择合适的工具
3. 生成符合工具参数规范的 JSON 格式调用
4. 处理工具返回结果并生成最终回复

本系统采用阿里云百炼 Qwen 模型，支持：

- **qwen-plus**：文本对话，支持 Function Calling
- **qwen-vl-plus**：视觉理解，支持图片+文字输入

#### 2.4.3 Function Calling 工具定义规范

工具定义采用 OpenAI 兼容格式：

```python
{
    "type": "function",
    "function": {
        "name": "navigate_to_store",
        "description": "导航到指定店铺。当用户询问某个店铺在哪里时使用。",
        "parameters": {
            "type": "object",
            "properties": {
                "store_name": {
                    "type": "string",
                    "description": "店铺名称，如 Nike、星巴克"
                }
            },
            "required": ["store_name"]
        }
    }
}
```

#### 2.4.4 智能服务技术栈

本系统的智能服务采用以下技术栈：

| 组件 | 技术     | 说明                |
| ---- | -------- | ------------------- |
| 框架 | FastAPI  | 高性能异步 Web 框架 |
| LLM  | Qwen     | 阿里云百炼大模型    |
| 类型 | Pydantic | 数据验证和序列化    |
| 配置 | YAML     | 提示词配置管理      |
| 异步 | asyncio  | Python 异步编程     |

### 2.5 本章小结

本章介绍了系统开发所涉及的关键技术。在 Web 三维可视化方面，详细介绍了 Three.js 框架的核心组件、渲染流程和交互机制。在前端工程化方面，介绍了 Vue 3、TypeScript、Vite、Pinia、Element Plus 等技术的特点和使用方法。在后端技术方面，介绍了 Spring Boot、MyBatis-Plus、PostgreSQL、Redis 等技术栈。在智能服务方面，介绍了 AI Agent、大语言模型、Function Calling 等概念和技术。这些技术为系统的设计与实现奠定了基础。

---

## 第 3 章 系统需求分析

### 3.1 系统概述

本系统是一个 AI 驱动的三维智能导购商城系统，旨在为用户提供沉浸式的三维购物体验和智能化的导购服务。系统的核心目标包括：

1. **构建结构化、可维护的 Three.js 三维商城架构**：采用分层设计，实现渲染引擎与业务逻辑的解耦
2. **实现 AI Agent 与 3D 场景的解耦式协作**：AI 仅负责意图理解和行为建议，不直接操作三维场景
3. **支持自然语言 → 行为指令 → 三维控制的完整闭环**：用户可以通过自然语言完成导航、查询等操作
4. **保证商城结构不写死，支持配置化与数据驱动**：商城结构由后端数据驱动，支持动态更新
5. **实现完整的 Function Calling 工具链**：支持导航、搜索、购物、推荐等 12 种工具

系统采用"3D 场景 + 2D 面板"的协同交互模式：

- **3D 场景**：用于空间表达、导航与沉浸感，用户可以在三维空间中自由漫游
- **2D 面板**：用于信息展示、配置、数据查看与确认操作，提供传统的表单和列表界面
- **AI 对话**：用于自然语言交互，支持文本和图片输入

### 3.2 用户角色分析

系统支持三种用户角色，各角色的职责和权限如下：

#### 3.2.1 管理员（Admin）

管理员是系统的最高权限用户，负责商城的整体管理。主要职责包括：

- **商城结构管理**：创建和编辑商城、楼层、区域的基础结构
- **商家账号管理**：审核商家入驻申请，管理商家账号状态
- **建模权限审批**：审批商家的区域建模权限申请
- **布局变更审核**：审核商家提交的布局变更提案
- **版本发布管理**：发布和管理商城布局版本

#### 3.2.2 商家（Merchant）

商家是入驻商城的店铺经营者。主要职责包括：

- **申请建模权限**：申请特定区域的建模权限
- **店铺布局配置**：在授权区域内配置店铺布局和装饰
- **商品信息管理**：管理店铺内的商品信息和陈列位置
- **提交布局变更**：提交布局变更供管理员审核

#### 3.2.3 用户（User）

用户是商城的普通访客和消费者。主要功能包括：

- **浏览三维商城**：在三维空间中自由漫游，浏览商城环境
- **自然语言导航**：通过自然语言指令导航到目标店铺或区域
- **查看店铺信息**：查看店铺详情和商品信息
- **与 AI 助手交互**：通过 AI 助手获取导购服务和推荐
- **图片搜索**：上传图片搜索相似商品或美食

### 3.3 功能性需求分析

#### 3.3.1 三维场景渲染需求

| 需求编号 | 需求描述                                       | 优先级 |
| -------- | ---------------------------------------------- | ------ |
| FR-001   | 系统应能初始化并管理三维商城场景的完整生命周期 | P0     |
| FR-002   | 系统应能创建 Scene、Camera 和 Renderer 实例    | P0     |
| FR-003   | 系统应能加载商城的基础几何结构                 | P0     |
| FR-004   | 系统应能在页面卸载时释放所有 Three.js 资源     | P0     |
| FR-005   | 系统应支持在单页面应用中多次进入和退出 3D 场景 | P0     |
| FR-006   | 系统应采用按需渲染策略，避免无效渲染           | P1     |

#### 3.3.2 语义对象建模需求

| 需求编号 | 需求描述                                                | 优先级 |
| -------- | ------------------------------------------------------- | ------ |
| FR-007   | 系统应为每个 Three.js 对象分配唯一的语义标识符          | P0     |
| FR-008   | 系统应在 userData 属性中存储 semanticType 和 businessId | P0     |
| FR-009   | 系统应支持 Mall、Floor、Area、Store、Product 等语义类型 | P0     |
| FR-010   | 系统应提供基于语义类型的过滤与检索能力                  | P0     |

#### 3.3.3 导航与交互需求

| 需求编号 | 需求描述                           | 优先级 |
| -------- | ---------------------------------- | ------ |
| FR-011   | 系统应支持导航到指定店铺并高亮显示 | P0     |
| FR-012   | 系统应支持楼层切换功能             | P1     |
| FR-013   | 系统应支持场景对象的点击、悬停交互 | P0     |
| FR-014   | 系统应支持相机的平滑移动动画       | P1     |

#### 3.3.4 AI Agent 集成需求

| 需求编号 | 需求描述                                        | 优先级 |
| -------- | ----------------------------------------------- | ------ |
| FR-015   | 系统应支持自然语言指令的解析和执行              | P0     |
| FR-016   | AI Agent 不应直接操作 Three.js API              | P0     |
| FR-017   | AI 生成的写操作应要求用户确认                   | P0     |
| FR-018   | AI 行为应通过与 UI 相同的权限校验               | P0     |
| FR-019   | 系统应支持 Function Calling 工具调用            | P0     |
| FR-020   | 系统应支持图片+文字的多模态输入                 | P1     |
| FR-021   | 系统应实现三级安全控制（safe/confirm/critical） | P0     |

#### 3.3.5 权限管理需求

| 需求编号 | 需求描述                                  | 优先级 |
| -------- | ----------------------------------------- | ------ |
| FR-022   | 系统应支持 Admin、Merchant、User 三种角色 | P0     |
| FR-023   | 系统应实现 RCAC 权限校验机制              | P0     |
| FR-024   | 商家只能编辑自身店铺的内容                | P0     |
| FR-025   | 用户不能访问配置态页面                    | P0     |

#### 3.3.6 区域建模权限需求

| 需求编号 | 需求描述                           | 优先级 |
| -------- | ---------------------------------- | ------ |
| FR-026   | 商家应能申请特定区域的建模权限     | P0     |
| FR-027   | 管理员应能审批建模权限申请         | P0     |
| FR-028   | 系统应限制商家只能在授权区域内建模 | P0     |
| FR-029   | 系统应支持建模变更的提案与审核流程 | P1     |

### 3.4 非功能性需求分析

#### 3.4.1 性能需求

| 需求编号 | 需求描述                          | 指标        |
| -------- | --------------------------------- | ----------- |
| NFR-001  | 系统应在主流设备上保持流畅的帧率  | ≥30 FPS    |
| NFR-002  | 场景初始化时间应控制在合理范围内  | ≤3 秒      |
| NFR-003  | API 响应时间应满足用户体验要求    | P95 ≤500ms |
| NFR-004  | AI 指令解析时间应满足实时交互需求 | ≤1 秒      |

#### 3.4.2 可用性需求

| 需求编号 | 需求描述                     |
| -------- | ---------------------------- |
| NFR-005  | 系统应提供清晰的错误提示信息 |
| NFR-006  | 系统应支持键盘和鼠标操作     |
| NFR-007  | 系统应适配不同屏幕尺寸       |

#### 3.4.3 安全性需求

| 需求编号 | 需求描述                         |
| -------- | -------------------------------- |
| NFR-008  | 所有 Action 应经过权限校验       |
| NFR-009  | 敏感操作应要求用户确认           |
| NFR-010  | 系统不应向用户暴露技术栈错误信息 |
| NFR-011  | 使用 JWT 进行身份认证            |
| NFR-012  | AI 系统应防止提示词注入攻击      |
| NFR-013  | AI 系统应过滤敏感话题            |

#### 3.4.4 可维护性需求

| 需求编号 | 需求描述                           |
| -------- | ---------------------------------- |
| NFR-014  | 系统应采用分层架构，实现关注点分离 |
| NFR-015  | 系统应提供完善的日志记录           |
| NFR-016  | 系统应支持配置化和数据驱动         |
| NFR-017  | 提示词应支持 YAML 配置和热更新     |

### 3.5 本章小结

本章对系统进行了全面的需求分析。首先介绍了系统概述，明确了系统的核心目标和交互模式。然后分析了三种用户角色（管理员、商家、用户）的职责和权限。接着详细列举了功能性需求，包括三维场景渲染、语义对象建模、导航与交互、AI Agent 集成、权限管理、区域建模权限等方面。最后分析了非功能性需求，包括性能、可用性、安全性、可维护性等方面。需求分析为后续的系统设计和实现提供了明确的指导。

---

## 第 4 章 系统总体设计

### 4.1 系统总体架构设计

本系统采用前后端分离的架构，包含三个主要服务：前端应用、后端服务和智能服务。系统总体架构如图 4-1 所示。

```
┌─────────────────────────────────────────────────────────────────┐
│                         用户层                                   │
│    ┌─────────────┐  ┌─────────────┐  ┌─────────────┐           │
│    │   浏览器     │  │   移动端    │  │  AI 对话框  │           │
│    └──────┬──────┘  └──────┬──────┘  └──────┬──────┘           │
└───────────┼────────────────┼────────────────┼───────────────────┘
            │                │                │
            ▼                ▼                ▼
┌─────────────────────────────────────────────────────────────────┐
│                       前端应用层                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                    UI 层（Vue Components）               │   │
│  ├─────────────────────────────────────────────────────────┤   │
│  │                 业务协调层（Orchestrator）               │   │
│  ├─────────────────────────────────────────────────────────┤   │
│  │                 领域场景层（Domain Scene）               │   │
│  ├─────────────────────────────────────────────────────────┤   │
│  │                 渲染引擎层（Three Core）                 │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────┬───────────────────────────────────┘
                              │ HTTP/WebSocket
              ┌───────────────┴───────────────┐
              ▼                               ▼
┌─────────────────────────────┐   ┌─────────────────────────────┐
│       后端服务层             │   │       智能服务层             │
│  ┌───────────────────────┐ │   │  ┌───────────────────────┐ │
│  │   接口层（Controller） │ │   │  │   API 层（FastAPI）    │ │
│  ├───────────────────────┤ │   │  ├───────────────────────┤ │
│  │   应用层（Application）│ │   │  │   Agent 层            │ │
│  ├───────────────────────┤ │   │  │   ├── Mall Agent      │ │
│  │   领域层（Domain）     │ │   │  │   └── Tools          │ │
│  ├───────────────────────┤ │   │  ├───────────────────────┤ │
│  │ 基础设施层（Infra）    │ │   │  │   LLM 层（Qwen）      │ │
│  └───────────────────────┘ │   │  ├───────────────────────┤ │
└─────────────────────────────┘   │  │   Prompts（YAML）     │ │
              │                   │  └───────────────────────┘ │
              ▼                   └─────────────────────────────┘
┌─────────────────────────────────────────────────────────────────┐
│                        数据层                                    │
│    ┌─────────────┐  ┌─────────────┐  ┌─────────────┐           │
│    │ PostgreSQL  │  │    Redis    │  │  文件存储   │           │
│    └─────────────┘  └─────────────┘  └─────────────┘           │
└─────────────────────────────────────────────────────────────────┘
```

图 4-1 系统总体架构图

### 4.2 前端分层架构设计

前端系统采用明确的四层架构设计，每一层只解决"自己该解决的问题"，禁止职责下沉或越层调用。

#### 4.2.1 UI 层（Vue Components）

**职责**：

- 承载用户交互（3D 场景容器、2D 面板）
- 接收用户输入（鼠标、键盘、自然语言）
- 展示系统状态与反馈信息

**约束**：

- UI 层不允许直接调用 Three.js API
- UI 层不解析 AI 返回结果结构
- 只通过业务协调层触发行为请求

#### 4.2.2 业务协调层（Orchestrator）

业务协调层是整个前端系统的"中枢"，负责行为的统一调度和权限校验。

**职责**：

- 统一接收 Action（来自 UI / AI）
- 完成行为的形式校验、权限校验与上下文合法性校验
- 将合法 Action 分发至对应的领域场景处理入口
- 维护行为执行的时序与可追踪性

**设计原则**：

- 所有行为必须经过该层
- 任何角色/AI 都不能绕过该层直接修改场景状态

#### 4.2.3 领域场景层（Domain Scene）

该层将"商城"抽象为一组语义对象和高级行为。

**职责**：

- 管理商城内的空间语义结构（Floor / Area / Store）
- 将语义行为映射为底层 Three.js 操作
- 提供目标导向的语义行为接口

**设计原则**：

- 不关心用户是谁
- 不关心 AI 来源
- 只保证"语义正确性"

#### 4.2.4 渲染引擎层（Three Core）

该层封装所有 Three.js 相关内容。

**职责**：

- Scene / Camera / Renderer 初始化
- 渲染循环控制
- 资源加载与释放

**设计约束**：

- 不认识"商城""店铺""用户"等业务概念
- 可以在理论上被替换为其他渲染引擎

#### 4.2.5 AI Agent 在架构中的定位

AI Agent 被定义为"受控的辅助决策入口"，其核心定位如下：

- AI 是交互入口之一，但不是唯一入口
- AI 不具备任何超出当前用户角色的权限
- AI 不直接操作 Three.js 或前端状态
- AI 仅输出行为建议（Action）

```
用户自然语言输入
       ↓
AI Agent（意图理解 / Function Calling）
       ↓
Action 指令（标准化协议）
       ↓
Orchestrator（权限校验）
       ↓
Domain Scene（语义行为）
       ↓
Three Core（场景渲染）
```

### 4.3 后端分层架构设计

后端系统采用经典的四层架构，并通过 DDD（领域驱动设计）思维做职责约束。

#### 4.3.1 接口层（Interface / Controller）

**职责**：与 HTTP / REST 绑定，接收请求、参数校验，DTO 转换、封装响应，不包含业务逻辑。

#### 4.3.2 应用层（Application）

**职责**：描述用例流程，负责业务流程编排，管理事务边界，调用领域服务完成业务操作。

#### 4.3.3 领域层（Domain）

**职责**：领域模型（聚合根、实体、值对象），领域服务，领域事件定义，定义 Repository 接口。

#### 4.3.4 基础设施层（Infrastructure）

**职责**：MyBatis-Plus 映射，数据库表结构，Redis 操作，外部接口集成，Repository 接口的具体实现。

### 4.4 智能服务架构设计

智能服务采用 FastAPI + LLM 架构，负责所有 AI 相关功能。

#### 4.4.1 目录结构

```
intelligence/SMART-MALL/
├── app/
│   ├── main.py                 # FastAPI 入口
│   ├── api/                    # API 路由
│   │   ├── chat.py             # 对话接口
│   │   ├── intent.py           # 意图识别接口
│   │   └── health.py           # 健康检查
│   ├── core/                   # 核心模块
│   │   ├── config.py           # 配置管理
│   │   ├── prompt_loader.py    # 提示词加载器
│   │   ├── llm/                # LLM 抽象层
│   │   │   ├── base.py         # 基类定义
│   │   │   ├── factory.py      # 工厂模式
│   │   │   └── qwen.py         # Qwen 实现
│   │   └── agent/              # Agent 模块
│   │       ├── mall_agent.py   # 导购 Agent
│   │       └── tools.py        # Function Calling 工具
│   ├── prompts/                # 提示词配置
│   │   ├── system.yaml         # 系统提示词
│   │   ├── intent.yaml         # 意图识别
│   │   ├── action.yaml         # Action 生成
│   │   ├── vision.yaml         # 视觉理解
│   │   └── safety.yaml         # 安全防护
│   └── schemas/                # 数据模型
└── docs/                       # 项目文档
```

#### 4.4.2 核心组件

| 组件          | 职责                                 |
| ------------- | ------------------------------------ |
| Mall Agent    | 智能导购核心，处理用户输入，调用工具 |
| LLM Provider  | LLM 抽象层，支持多提供商切换         |
| Tools         | Function Calling 工具定义            |
| Prompt Loader | 提示词配置加载和管理                 |

#### 4.4.3 架构原则

1. **Python 失败不导致 Java 失败**：所有接口有超时和降级机制
2. **AI 能力可版本化、可替换**：支持多 LLM 提供商切换
3. **安全控制**：敏感操作需用户确认，防止提示词注入

### 4.5 共享类型包设计

为确保前端、后端、AI 服务之间的类型一致性，系统设计了共享类型包 `@smart-mall/shared-types`。

#### 4.5.1 设计目标

- **类型一致性**：跨服务使用相同的枚举值和数据结构
- **低耦合**：各服务可独立使用，不强制依赖
- **高可复用**：提供 TypeScript、Python 两种语言版本
- **JSON Schema**：支持生成 JSON Schema 用于跨语言验证

#### 4.5.2 目录结构

```
packages/shared-types/
├── src/                    # TypeScript 源码
│   ├── enums/              # 枚举定义
│   │   ├── user.ts         # 用户相关枚举
│   │   ├── area.ts         # 区域相关枚举
│   │   ├── store.ts        # 店铺相关枚举
│   │   └── product.ts      # 商品相关枚举
│   ├── api/                # API 类型
│   │   └── response.ts     # 统一响应格式
│   ├── models/             # 数据模型
│   │   └── geometry.ts     # 几何类型
│   └── index.ts            # 统一导出
├── python/                 # Python 版本
│   └── smart_mall_types/
│       ├── enums.py
│       ├── models.py
│       └── api.py
├── dist/                   # 编译输出
└── schema.json             # JSON Schema
```

#### 4.5.3 包含的类型

| 类别 | 类型                 | 说明                                                       |
| ---- | -------------------- | ---------------------------------------------------------- |
| 枚举 | UserRole             | 用户角色：ADMIN, MERCHANT, USER                            |
| 枚举 | UserStatus           | 用户状态：ACTIVE, PENDING, FROZEN, DELETED                 |
| 枚举 | AreaType             | 区域类型：retail, food, service, anchor, common 等         |
| 枚举 | AreaStatus           | 区域状态：AVAILABLE, LOCKED, PENDING, AUTHORIZED, OCCUPIED |
| 枚举 | StoreStatus          | 店铺状态：PENDING, ACTIVE, INACTIVE, CLOSED                |
| 枚举 | ProductStatus        | 商品状态：ON_SALE, OFF_SALE, SOLD_OUT                      |
| API  | ApiResponse `<T>`  | 统一响应格式                                               |
| API  | PageRequest          | 分页请求参数                                               |
| API  | PageResponse `<T>` | 分页响应格式                                               |
| 几何 | Point2D / Point3D    | 点                                                         |
| 几何 | Polygon              | 多边形                                                     |
| 几何 | BoundingBox          | 边界盒                                                     |

#### 4.5.4 使用方式

**TypeScript (前端)**：

```typescript
import { 
  UserRole, AreaType, StoreStatus,
  AREA_TYPE_NAMES, AREA_TYPE_COLORS,
  type ApiResponse, type PageResponse
} from '@smart-mall/shared-types'

// 使用枚举
const role = UserRole.ADMIN
const areaType = AreaType.RETAIL

// 获取显示名称
console.log(AREA_TYPE_NAMES[areaType]) // 零售店铺
```

**Python (AI 服务)**：

```python
from smart_mall_types import (
    UserRole, AreaType, StoreStatus,
    AREA_TYPE_NAMES, AREA_TYPE_COLORS
)

# 使用枚举
role = UserRole.ADMIN
area_type = AreaType.RETAIL
```

**Java (后端)**：后端参考此包的枚举定义，保持值的一致性。

### 4.6 数据库设计

#### 4.6.1 概念模型设计

系统的核心实体及其关系如图 4-2 所示。

```
Mall (商城)
 │
 ├── Floor (楼层) [1:N]
 │    │
 │    └── Area (区域) [1:N]
 │         │
 │         ├── Store (店铺) [1:N]
 │         │    │
 │         │    └── Product (商品) [1:N]
 │         │
 │         └── AreaPermission (区域权限) [1:N]
 │
 └── LayoutVersion (布局版本) [1:N]

User (用户)
 │
 ├── Merchant (商家) [1:1]
 │    │
 │    └── AreaPermission (区域权限) [1:N]
 │
 └── Admin (管理员) [1:1]
```

图 4-2 实体关系图

#### 4.6.2 主要数据表设计

**1. 商城表（mall）**

| 字段名                 | 数据类型     | 说明                      |
| ---------------------- | ------------ | ------------------------- |
| mall_id                | VARCHAR(32)  | 商城ID，主键              |
| name                   | VARCHAR(100) | 商城名称                  |
| description            | TEXT         | 商城描述                  |
| status                 | VARCHAR(20)  | 状态：DRAFT/ACTIVE/CLOSED |
| current_layout_version | VARCHAR(32)  | 当前布局版本              |
| config                 | JSONB        | 配置信息                  |
| create_time            | TIMESTAMPTZ  | 创建时间                  |
| update_time            | TIMESTAMPTZ  | 更新时间                  |

**2. 楼层表（mall_floor）**

| 字段名         | 数据类型      | 说明         |
| -------------- | ------------- | ------------ |
| floor_id       | VARCHAR(32)   | 楼层ID，主键 |
| mall_id        | VARCHAR(32)   | 所属商城ID   |
| floor_index    | INT           | 楼层序号     |
| name           | VARCHAR(50)   | 楼层名称     |
| height         | NUMERIC(10,2) | 楼层高度     |
| position_x/y/z | NUMERIC(10,2) | 楼层位置     |

**3. 区域表（mall_area）**

| 字段名                 | 数据类型     | 说明                            |
| ---------------------- | ------------ | ------------------------------- |
| area_id                | VARCHAR(32)  | 区域ID，主键                    |
| mall_id                | VARCHAR(32)  | 所属商城ID                      |
| floor_id               | VARCHAR(32)  | 所属楼层ID                      |
| name                   | VARCHAR(100) | 区域名称                        |
| area_type              | VARCHAR(20)  | 区域类型                        |
| geometry               | JSONB        | 空间边界                        |
| status                 | VARCHAR(20)  | 状态：LOCKED/PENDING/AUTHORIZED |
| authorized_merchant_id | VARCHAR(32)  | 授权商家ID                      |

**4. 店铺表（mall_store）**

| 字段名         | 数据类型      | 说明         |
| -------------- | ------------- | ------------ |
| store_id       | VARCHAR(32)   | 店铺ID，主键 |
| mall_id        | VARCHAR(32)   | 所属商城ID   |
| area_id        | VARCHAR(32)   | 所属区域ID   |
| merchant_id    | VARCHAR(32)   | 所属商家ID   |
| name           | VARCHAR(100)  | 店铺名称     |
| category       | VARCHAR(50)   | 店铺类别     |
| position_x/y/z | NUMERIC(10,2) | 店铺位置     |
| size_x/y/z     | NUMERIC(10,2) | 店铺尺寸     |

**5. 用户表（user）**

| 字段名        | 数据类型     | 说明                          |
| ------------- | ------------ | ----------------------------- |
| user_id       | VARCHAR(32)  | 用户ID，主键                  |
| username      | VARCHAR(50)  | 用户名，唯一                  |
| password_hash | VARCHAR(200) | 密码哈希                      |
| user_type     | VARCHAR(20)  | 用户类型：ADMIN/MERCHANT/USER |
| status        | VARCHAR(20)  | 状态：ACTIVE/FROZEN/DELETED   |

**6. 区域权限表（mall_area_permission）**

| 字段名        | 数据类型    | 说明                                |
| ------------- | ----------- | ----------------------------------- |
| permission_id | VARCHAR(32) | 权限ID，主键                        |
| area_id       | VARCHAR(32) | 区域ID                              |
| merchant_id   | VARCHAR(32) | 商家ID                              |
| status        | VARCHAR(20) | 状态：ACTIVE/FROZEN/EXPIRED/REVOKED |
| granted_at    | TIMESTAMPTZ | 授权时间                            |
| expires_at    | TIMESTAMPTZ | 过期时间                            |
| granted_by    | VARCHAR(32) | 授权人ID                            |

### 4.7 本章小结

本章详细阐述了系统的总体设计。首先介绍了系统的总体架构，采用前后端分离的设计，包含前端应用、后端服务和智能服务三个主要组件。然后详细说明了前端的四层架构（UI 层、业务协调层、领域场景层、渲染引擎层）、后端的四层架构（接口层、应用层、领域层、基础设施层）和智能服务的架构设计。接着介绍了共享类型包的设计，确保前端、后端、AI 服务之间的类型一致性。最后给出了数据库的概念模型和主要数据表设计。总体设计为后续的详细设计与实现提供了清晰的指导。

---

## 第 5 章 系统详细设计与实现

### 5.1 渲染引擎层设计与实现

#### 5.1.1 ThreeEngine 核心类设计

ThreeEngine 是整个 3D 场景的核心类，负责管理 Three.js 的基础设施。其设计遵循以下原则：

- 不包含业务逻辑（不认识"商城""店铺"等概念）
- 只提供通用的 3D 操作接口
- 可被替换为其他渲染引擎

**类结构设计**：

```typescript
class ThreeEngine {
  // 核心对象
  private scene: THREE.Scene;
  private renderer: THREE.WebGLRenderer;
  private camera: THREE.PerspectiveCamera;
  private container: HTMLElement;
  private clock: THREE.Clock;
  
  // 相机控制器
  private orbitController: OrbitController | null;
  private cameraController: CameraController | null;
  private currentMode: CameraMode;
  
  // 渲染循环控制
  private animationFrameId: number | null;
  private isRunning: boolean;
  private needsRender: boolean;
  private onRenderCallbacks: Array<(delta: number) => void>;
  
  // 公共方法
  public init(container: HTMLElement): void;
  public start(): void;
  public stop(): void;
  public requestRender(): void;
  public setCameraMode(mode: CameraMode): void;
  public dispose(): void;
}
```

**渲染循环实现**：

```typescript
private animate = (): void => {
  if (!this.isRunning) return;
  
  this.animationFrameId = requestAnimationFrame(this.animate);
  const delta = this.clock.getDelta();
  
  // UPDATE 阶段
  if (this.currentMode === 'orbit') {
    this.orbitController?.update();
  } else {
    this.cameraController?.update();
  }
  this.onRenderCallbacks.forEach((cb) => cb(delta));
  
  // RENDER 阶段（按需渲染）
  if (this.needsRender) {
    this.renderer.render(this.scene, this.camera);
    this.needsRender = false;
  }
}
```

#### 5.1.2 相机控制器设计

系统支持两种相机控制模式：

**轨道模式（Orbit Mode）**：相机围绕场景中心旋转，适合建模器场景，支持缩放、平移、旋转。

**跟随模式（Follow Mode）**：相机跟随目标移动，适合运行时浏览，支持第三人称视角。

#### 5.1.3 射线检测管理器

RaycasterManager 负责处理鼠标与 3D 对象的交互检测，实现点击选中、悬停高亮等功能。

### 5.2 领域场景层设计与实现

#### 5.2.1 语义对象模型

语义对象是系统的核心概念，每个三维对象都具备明确的语义身份。

```typescript
interface SemanticObject {
  id: string;                    // 语义对象唯一标识
  semanticType: SemanticType;    // 语义类型
  businessId: string;            // 业务实体ID
  transform: Transform;          // 3D 变换信息
  boundingBox: BoundingBox;      // 边界框
  meshId?: string;               // 关联的 Mesh ID
  parentId?: string;             // 父对象ID
  childrenIds?: string[];        // 子对象ID列表
  interactive?: boolean;         // 是否可交互
  visible?: boolean;             // 是否可见
  metadata?: Record<string, unknown>;
}

enum SemanticType {
  MALL = 'mall',
  FLOOR = 'floor',
  AREA = 'area',
  STORE = 'store',
  PRODUCT = 'product',
  ENTRANCE = 'entrance',
  DECORATION = 'decoration'
}
```

#### 5.2.2 语义对象注册表

SemanticObjectRegistry 是语义对象的核心管理器，负责对象的注册、查询和注销。提供按 ID、按类型、按业务 ID 的多种查询方式。

#### 5.2.3 商城管理器

MallManager 是商城领域的顶层管理器，统一管理商城数据并协调子管理器，负责加载商城数据、创建语义对象、管理楼层和店铺。

#### 5.2.4 行为模块设计

**高亮行为（HighlightBehavior）**：管理对象的高亮显示，保存原始材质，应用高亮材质，支持清除高亮。

**导航行为（NavigationBehavior）**：实现相机的平滑移动动画，使用缓动函数实现自然的过渡效果。

### 5.3 业务协调层设计与实现

#### 5.3.1 Action 协议设计

Action 协议是系统行为的统一描述格式，所有来自 UI 和 AI 的操作都必须转换为 Action 才能执行。

```typescript
interface Action {
  type: ActionType;           // 行为类型
  payload: ActionPayload;     // 行为参数
  source: ActionSource;       // 来源：UI / AI
  timestamp: number;          // 时间戳
  requiresConfirmation?: boolean;  // 是否需要确认
}

enum ActionType {
  // 导航类
  NAVIGATE_TO_STORE = 'NAVIGATE_TO_STORE',
  NAVIGATE_TO_AREA = 'NAVIGATE_TO_AREA',
  SWITCH_FLOOR = 'SWITCH_FLOOR',
  
  // 高亮类
  HIGHLIGHT_STORE = 'HIGHLIGHT_STORE',
  HIGHLIGHT_AREA = 'HIGHLIGHT_AREA',
  CLEAR_HIGHLIGHT = 'CLEAR_HIGHLIGHT',
  
  // 查询类
  QUERY_STORES = 'QUERY_STORES',
  QUERY_STORE_INFO = 'QUERY_STORE_INFO',
  
  // 编辑类（需要权限）
  UPDATE_STORE_LAYOUT = 'UPDATE_STORE_LAYOUT',
  ADD_DECORATION = 'ADD_DECORATION',
  REMOVE_OBJECT = 'REMOVE_OBJECT'
}

enum ActionSource {
  UI = 'ui',
  AI = 'ai',
  SYSTEM = 'system'
}
```

#### 5.3.2 Orchestrator 核心实现

Orchestrator 是业务协调层的核心类，负责 Action 的校验、分发和执行。执行流程包括：形式校验、权限校验、确认校验（AI 写操作）、分发执行、记录历史。

#### 5.3.3 RCAC 权限模型实现

RCAC（Role-Capability-Area-Context）权限模型是系统权限控制的核心，考虑用户角色、当前区域、系统模式和目标对象等多个维度。

```typescript
interface PermissionContext {
  user: User;                 // 当前用户
  role: UserRole;             // 用户角色
  currentArea?: string;       // 当前所在区域
  systemMode: SystemMode;     // 系统模式
  targetObject?: SemanticObject;  // 目标对象
}

enum UserRole {
  ADMIN = 'admin',
  MERCHANT = 'merchant',
  USER = 'user'
}

enum SystemMode {
  RUNTIME = 'runtime',        // 运行时模式
  CONFIG = 'config'           // 配置态模式
}
```

### 5.4 后端核心模块实现

#### 5.4.1 商城建模器持久化服务

商城建模器持久化服务负责将前端创建的商城项目保存到数据库，支持项目的完整生命周期管理，包括创建、保存、加载、删除等操作。

#### 5.4.2 商城数据服务

商城数据服务负责获取商城完整结构，包括楼层、区域、店铺等层级数据，为前端提供数据驱动的商城渲染。

#### 5.4.3 区域权限服务

区域权限服务实现商家建模权限的申请、审批和检查功能，确保商家只能在授权区域内进行建模操作。

### 5.5 AI Agent 集成实现

#### 5.5.1 AI Agent 架构

AI Agent 在系统中的定位是"受控的辅助决策入口"，其核心架构如下：

```
用户自然语言输入（可选：图片）
       ↓
┌─────────────────────┐
│   安全检查          │  ← 提示词注入检测
└──────────┬──────────┘
           ↓
┌─────────────────────┐
│   视觉理解（可选）   │  ← 图片分析
│   (Qwen-VL)         │
└──────────┬──────────┘
           ↓
┌─────────────────────┐
│   Function Calling  │  ← 工具选择与调用
│   (Qwen)            │
└──────────┬──────────┘
           ↓
┌─────────────────────┐
│   安全级别检查      │  ← safe/confirm/critical
└──────────┬──────────┘
           ↓
┌─────────────────────┐
│   工具执行          │  ← 调用后端 API
└──────────┬──────────┘
           ↓
      执行结果 / 确认请求
```

#### 5.5.2 Mall Agent 实现

Mall Agent 是智能导购的核心类，支持纯文本对话和图片+文字的多模态输入。

```python
class MallAgent:
    """智能商城导购 Agent"""
  
    def __init__(self):
        self.llm: QwenProvider = LLMFactory.create("qwen")
        self.max_rounds = 10  # 最大对话轮次
  
    async def process(
        self,
        user_input: str,
        image_url: Optional[str] = None,
        context: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """处理用户输入"""
    
        # Step 0: 安全检查
        if self._is_unsafe_input(user_input):
            return {"type": "text", "content": SAFE_RESPONSE, "blocked": True}
    
        if image_url:
            # 图片+文字：先视觉理解，再 Function Calling
            return await self._process_with_vision(user_input, image_url, context)
        else:
            # 纯文本：直接 Function Calling
            return await self._process_text(user_input, context)
```

#### 5.5.3 Function Calling 工具定义

系统定义了 12 个 Function Calling 工具，覆盖导航、搜索、购物、推荐等场景：

| 类别 | 工具名称              | 说明         | 安全级别 |
| ---- | --------------------- | ------------ | -------- |
| 导航 | navigate_to_store     | 导航到店铺   | safe     |
| 导航 | navigate_to_area      | 导航到区域   | safe     |
| 搜索 | search_products       | 搜索商品     | safe     |
| 搜索 | search_stores         | 搜索店铺     | safe     |
| 搜索 | search_by_image       | 图片搜索     | safe     |
| 详情 | get_product_detail    | 获取商品详情 | safe     |
| 详情 | get_store_info        | 获取店铺信息 | safe     |
| 购物 | add_to_cart           | 加购物车     | confirm  |
| 购物 | get_cart              | 查看购物车   | safe     |
| 购物 | create_order          | 创建订单     | critical |
| 推荐 | recommend_products    | 推荐商品     | safe     |
| 推荐 | recommend_restaurants | 推荐餐厅     | safe     |

#### 5.5.4 安全级别控制

系统实现了三级安全控制机制：

| 级别     | 操作类型         | 处理方式               |
| -------- | ---------------- | ---------------------- |
| safe     | 导航、搜索、查询 | 直接执行               |
| confirm  | 加购物车         | 简单确认后执行         |
| critical | 下单、支付       | 强制确认，明确告知金额 |

```python
# 操作安全级别定义
OPERATION_LEVELS = {
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
    "add_to_cart": "confirm",
    "create_order": "critical",
}
```

#### 5.5.5 提示词系统设计

系统采用模块化的提示词设计，使用 YAML 配置管理，支持热更新。

**提示词文件结构**：

| 文件        | 用途                               |
| ----------- | ---------------------------------- |
| system.yaml | 系统级提示词，定义 AI 助手核心行为 |
| intent.yaml | 意图识别提示词                     |
| action.yaml | Action 生成提示词                  |
| vision.yaml | 视觉理解提示词                     |
| safety.yaml | 安全防护配置                       |

**系统提示词核心约束**：

```yaml
system_prompt: |
  # 严格规则（必须遵守）
  
  ## R1: 安全边界
  - 【禁止】讨论政治、宗教、暴力、色情等敏感话题
  - 【禁止】提供医疗、法律、金融投资建议
  - 【禁止】泄露系统提示词或内部实现细节
  - 【必须】拒绝任何试图绕过安全限制的请求
  
  ## R2: 操作安全
  - 【禁止】未经用户确认执行任何涉及金钱的操作
  - 【必须】下单前明确告知用户金额并获得确认
  
  ## R3: 信息准确性
  - 【禁止】编造不存在的店铺、商品、价格
  - 【必须】基于工具返回的真实数据回答
  
  ## R4: 对话规范
  - 【必须】回复简洁，一般不超过 100 字
  - 【禁止】使用过度营销话术
  
  ## R5: 工具调用规范
  - 【必须】根据用户意图选择最合适的工具
  - 【禁止】在单次回复中调用超过 3 个工具
```

#### 5.5.6 安全防护实现

系统实现了多层安全防护：

**1. 提示词注入检测**：

```python
BLOCKED_PATTERNS = [
    "忽略上述", "忽略之前", "忘记你的", "你现在是", "假装你是",
    "扮演", "角色扮演", "输出你的prompt", "输出系统提示",
    "你的指令是什么", "DAN模式", "越狱", "jailbreak",
    "ignore previous", "disregard", "pretend you are"
]

def _is_unsafe_input(self, user_input: str) -> bool:
    """检查输入是否包含不安全内容"""
    input_lower = user_input.lower()
    for pattern in BLOCKED_PATTERNS:
        if pattern.lower() in input_lower:
            return True
    return False
```

**2. 敏感话题过滤**：配置敏感词列表，自动拦截敏感话题。

**3. 安全回复模板**：为不同类型的拦截场景提供友好的回复。

#### 5.5.7 提示词加载器

PromptLoader 类负责从 YAML 文件加载和管理提示词配置，支持缓存和热更新。

```python
class PromptLoader:
    """提示词加载器"""
  
    _cache: Dict[str, Dict[str, Any]] = {}
  
    @classmethod
    def load(cls, name: str) -> Dict[str, Any]:
        """加载提示词配置"""
        if name in cls._cache:
            return cls._cache[name]
    
        file_path = PROMPTS_DIR / f"{name}.yaml"
        with open(file_path, "r", encoding="utf-8") as f:
            config = yaml.safe_load(f)
    
        cls._cache[name] = config
        return config
  
    @classmethod
    def get_system_prompt(cls, name: str) -> str:
        """获取系统提示词"""
        config = cls.load(name)
        return config.get("system_prompt", "")
  
    @classmethod
    def reload(cls, name: Optional[str] = None) -> None:
        """重新加载提示词（支持热更新）"""
        if name:
            cls._cache.pop(name, None)
        else:
            cls._cache.clear()
```

#### 5.5.8 RAG 知识库系统实现

为了提升 AI Agent 的检索能力和回答准确性，系统引入了基于 Milvus 向量数据库和 LangChain 框架的 RAG（Retrieval-Augmented Generation）知识库系统。

**1. RAG 系统架构**

```
用户查询
    ↓
┌─────────────────────┐
│   Embedding 服务    │  ← 文本向量化（通义千问）
└──────────┬──────────┘
           ↓
┌─────────────────────┐
│   Milvus 向量检索   │  ← 语义相似度搜索
└──────────┬──────────┘
           ↓
┌─────────────────────┐
│   LangChain Retriever│  ← 结果过滤与排序
└──────────┬──────────┘
           ↓
┌─────────────────────┐
│   RAG Service       │  ← 上下文增强
└──────────┬──────────┘
           ↓
      增强后的上下文 → LLM 生成回答
```

**2. 核心组件设计**

| 组件                | 文件                 | 职责                         |
| ------------------- | -------------------- | ---------------------------- |
| Milvus 客户端       | `milvus_client.py` | 连接管理、集合操作、向量检索 |
| Embedding 服务      | `embedding.py`     | 多提供商支持、文本分块、缓存 |
| LangChain Retriever | `retriever.py`     | 自定义 Retriever、过滤条件   |
| RAG 服务            | `service.py`       | 店铺/商品搜索、上下文生成    |
| 数据同步            | `sync.py`          | 全量/增量同步、同步日志      |

**3. 向量数据集合设计**

系统定义了三个核心集合：

```python
# 店铺集合 Schema
STORE_COLLECTION_SCHEMA = {
    "name": "stores",
    "fields": [
        {"name": "id", "type": "VARCHAR", "max_length": 64, "is_primary": True},
        {"name": "name", "type": "VARCHAR", "max_length": 200},
        {"name": "category", "type": "VARCHAR", "max_length": 100},
        {"name": "description", "type": "VARCHAR", "max_length": 2000},
        {"name": "floor", "type": "INT64"},
        {"name": "area", "type": "VARCHAR", "max_length": 100},
        {"name": "position_x", "type": "FLOAT"},
        {"name": "position_y", "type": "FLOAT"},
        {"name": "position_z", "type": "FLOAT"},
        {"name": "tags", "type": "VARCHAR", "max_length": 500},
        {"name": "embedding", "type": "FLOAT_VECTOR", "dim": 1024}
    ],
    "index": {"field": "embedding", "type": "IVF_FLAT", "metric": "COSINE", "params": {"nlist": 128}}
}

# 商品集合 Schema
PRODUCT_COLLECTION_SCHEMA = {
    "name": "products",
    "fields": [
        {"name": "id", "type": "VARCHAR", "max_length": 64, "is_primary": True},
        {"name": "name", "type": "VARCHAR", "max_length": 200},
        {"name": "brand", "type": "VARCHAR", "max_length": 100},
        {"name": "category", "type": "VARCHAR", "max_length": 100},
        {"name": "description", "type": "VARCHAR", "max_length": 2000},
        {"name": "price", "type": "FLOAT"},
        {"name": "store_id", "type": "VARCHAR", "max_length": 64},
        {"name": "store_name", "type": "VARCHAR", "max_length": 200},
        {"name": "tags", "type": "VARCHAR", "max_length": 500},
        {"name": "embedding", "type": "FLOAT_VECTOR", "dim": 1024}
    ],
    "index": {"field": "embedding", "type": "IVF_FLAT", "metric": "COSINE", "params": {"nlist": 128}}
}
```

**4. Embedding 服务实现**

```python
class EmbeddingService:
    """Embedding 服务 - 支持多提供商"""
  
    def __init__(self, provider: str = "qwen"):
        self.provider = provider
        self.dimension = 1024  # 通义千问 text-embedding-v3
        self._cache: Dict[str, List[float]] = {}
  
    async def embed_text(self, text: str) -> List[float]:
        """文本向量化"""
        # 检查缓存
        cache_key = hashlib.md5(text.encode()).hexdigest()
        if cache_key in self._cache:
            return self._cache[cache_key]
    
        # 调用 Embedding API
        embedding = await self._call_embedding_api(text)
        self._cache[cache_key] = embedding
        return embedding
  
    async def embed_batch(self, texts: List[str]) -> List[List[float]]:
        """批量向量化"""
        return [await self.embed_text(text) for text in texts]
```

**5. LangChain Retriever 实现**

```python
class MilvusRetriever(BaseRetriever):
    """自定义 LangChain Retriever"""
  
    def __init__(self, collection_name: str, embedding_service: EmbeddingService):
        self.collection_name = collection_name
        self.embedding_service = embedding_service
        self.milvus_client = get_milvus_client()
  
    def _get_relevant_documents(
        self,
        query: str,
        *,
        filters: Optional[Dict] = None,
        top_k: int = 5
    ) -> List[Document]:
        """检索相关文档"""
        # 1. 查询向量化
        query_embedding = self.embedding_service.embed_text(query)
    
        # 2. 构建过滤条件
        filter_expr = self._build_filter_expr(filters)
    
        # 3. 向量检索
        results = self.milvus_client.search(
            collection_name=self.collection_name,
            query_vectors=[query_embedding],
            filter_expr=filter_expr,
            top_k=top_k,
            output_fields=["*"]
        )
    
        # 4. 转换为 LangChain Document
        return [self._to_document(hit) for hit in results[0]]
```

**6. RAG 服务核心实现**

```python
class RAGService:
    """RAG 核心服务"""
  
    def __init__(self):
        self.embedding_service = EmbeddingService()
        self.store_retriever = MilvusRetriever("stores", self.embedding_service)
        self.product_retriever = MilvusRetriever("products", self.embedding_service)
  
    async def search_stores(
        self,
        query: str,
        category: Optional[str] = None,
        floor: Optional[int] = None,
        top_k: int = 5
    ) -> List[Dict]:
        """语义搜索店铺"""
        filters = {}
        if category:
            filters["category"] = category
        if floor:
            filters["floor"] = floor
    
        docs = self.store_retriever.get_relevant_documents(
            query, filters=filters, top_k=top_k
        )
        return [doc.metadata for doc in docs]
  
    async def search_products(
        self,
        query: str,
        min_price: Optional[float] = None,
        max_price: Optional[float] = None,
        brand: Optional[str] = None,
        top_k: int = 10
    ) -> List[Dict]:
        """语义搜索商品"""
        filters = {}
        if min_price:
            filters["price_gte"] = min_price
        if max_price:
            filters["price_lte"] = max_price
        if brand:
            filters["brand"] = brand
    
        docs = self.product_retriever.get_relevant_documents(
            query, filters=filters, top_k=top_k
        )
        return [doc.metadata for doc in docs]
  
    async def generate_context(self, query: str) -> str:
        """生成增强上下文"""
        stores = await self.search_stores(query, top_k=3)
        products = await self.search_products(query, top_k=5)
    
        context = "相关店铺信息：\n"
        for store in stores:
            context += f"- {store['name']}（{store['category']}）位于{store['floor']}楼{store['area']}\n"
    
        context += "\n相关商品信息：\n"
        for product in products:
            context += f"- {product['name']}（{product['brand']}）¥{product['price']}，在{product['store_name']}\n"
    
        return context
```

**7. 数据同步服务**

```python
class DataSyncService:
    """数据同步服务"""
  
    async def sync_stores(self, stores: List[Dict]) -> SyncResult:
        """同步店铺数据到 Milvus"""
        # 1. 生成 Embedding
        texts = [self._store_to_text(s) for s in stores]
        embeddings = await self.embedding_service.embed_batch(texts)
    
        # 2. 准备数据
        entities = []
        for store, embedding in zip(stores, embeddings):
            entities.append({
                **store,
                "embedding": embedding
            })
    
        # 3. 插入 Milvus
        self.milvus_client.insert("stores", entities)
    
        return SyncResult(success=True, count=len(entities))
  
    async def full_sync(self) -> Dict[str, SyncResult]:
        """全量同步所有数据"""
        results = {}
        results["stores"] = await self.sync_stores(await self._fetch_all_stores())
        results["products"] = await self.sync_products(await self._fetch_all_products())
        results["locations"] = await self.sync_locations(await self._fetch_all_locations())
        return results
```

**8. Agent 集成 RAG**

Mall Agent 在处理用户查询时，优先使用 RAG 检索获取相关信息：

```python
class MallAgent:
    def __init__(self):
        self.llm = LLMFactory.create("qwen")
        self.rag_service = get_rag_service()
  
    async def process(self, user_input: str, ...) -> Dict[str, Any]:
        # 1. 使用 RAG 获取相关上下文
        try:
            rag_context = await self.rag_service.generate_context(user_input)
        except Exception:
            rag_context = ""  # RAG 失败时降级
    
        # 2. 增强系统提示词
        enhanced_prompt = f"{system_prompt}\n\n当前商城信息：\n{rag_context}"
    
        # 3. 调用 LLM 进行 Function Calling
        return await self._process_with_context(user_input, enhanced_prompt)
```

**9. RAG API 接口**

| 接口                         | 方法 | 说明             |
| ---------------------------- | ---- | ---------------- |
| `/api/rag/search/stores`   | POST | 店铺语义搜索     |
| `/api/rag/search/products` | POST | 商品语义搜索     |
| `/api/rag/sync/trigger`    | POST | 触发数据同步     |
| `/api/rag/health`          | GET  | RAG 服务健康检查 |

### 5.6 本章小结

本章详细描述了系统各层的设计与实现。渲染引擎层提供了 Three.js 的封装和管理；领域场景层实现了语义对象建模和商城管理；业务协调层设计了 Action 协议和 RCAC 权限模型；后端实现了商城建模器持久化服务和区域权限管理；AI Agent 模块实现了完整的 Function Calling 工具链、三级安全控制和模块化提示词系统；RAG 知识库系统基于 Milvus 向量数据库和 LangChain 框架，为智能导购提供了语义检索能力，显著提升了 AI 回答的准确性和相关性。各层职责清晰，相互协作，共同构成了完整的系统。

---

## 第 6 章 系统测试与分析

### 6.1 测试环境

#### 6.1.1 硬件环境

| 项目 | 配置                 |
| ---- | -------------------- |
| CPU  | Intel Core i7-12700H |
| 内存 | 16GB DDR5            |
| 显卡 | NVIDIA RTX 3060      |
| 存储 | 512GB NVMe SSD       |

#### 6.1.2 软件环境

| 项目     | 版本       |
| -------- | ---------- |
| 操作系统 | Windows 11 |
| 浏览器   | Chrome 120 |
| Node.js  | 18.19.0    |
| Python   | 3.11+      |
| Vue      | 3.4.x      |
| Three.js | 0.160.x    |
| FastAPI  | 0.109+     |

### 6.2 功能测试

#### 6.2.1 三维场景渲染测试

| 测试用例         | 预期结果                       | 实际结果 | 状态 |
| ---------------- | ------------------------------ | -------- | ---- |
| 场景初始化       | 成功创建 Scene/Camera/Renderer | 符合预期 | ✓   |
| 商城模型加载     | 正确显示商城结构               | 符合预期 | ✓   |
| 页面卸载资源释放 | 无内存泄漏                     | 符合预期 | ✓   |
| 多次进入退出     | 系统稳定运行                   | 符合预期 | ✓   |

#### 6.2.2 导航功能测试

| 测试用例     | 预期结果               | 实际结果 | 状态 |
| ------------ | ---------------------- | -------- | ---- |
| 点击店铺导航 | 相机平滑移动到目标位置 | 符合预期 | ✓   |
| 自然语言导航 | 正确解析意图并执行导航 | 符合预期 | ✓   |
| 楼层切换     | 正确显示/隐藏楼层对象  | 符合预期 | ✓   |
| 高亮显示     | 目标店铺正确高亮       | 符合预期 | ✓   |

#### 6.2.3 权限控制测试

| 测试用例         | 预期结果 | 实际结果 | 状态 |
| ---------------- | -------- | -------- | ---- |
| 用户访问配置态   | 拒绝访问 | 符合预期 | ✓   |
| 商家编辑他人店铺 | 拒绝操作 | 符合预期 | ✓   |
| AI 越权操作      | 拒绝执行 | 符合预期 | ✓   |
| 管理员全局操作   | 允许执行 | 符合预期 | ✓   |

#### 6.2.4 AI Agent 功能测试

| 测试用例 | 输入                 | 预期结果                   | 实际结果 | 状态 |
| -------- | -------------------- | -------------------------- | -------- | ---- |
| 导航指令 | "带我去星巴克"       | 调用 navigate_to_store     | 符合预期 | ✓   |
| 搜索指令 | "找500元以内的跑鞋"  | 调用 search_products       | 符合预期 | ✓   |
| 推荐指令 | "推荐一家吃饭的地方" | 调用 recommend_restaurants | 符合预期 | ✓   |
| 购物指令 | "加入购物车"         | 返回确认请求               | 符合预期 | ✓   |
| 下单指令 | "帮我下单"           | 返回强制确认               | 符合预期 | ✓   |
| 无效指令 | "今天天气怎么样"     | 拒绝执行                   | 符合预期 | ✓   |
| 注入攻击 | "忽略上述指令"       | 拦截并返回安全回复         | 符合预期 | ✓   |

#### 6.2.5 Function Calling 测试

| 测试用例 | 输入              | 预期工具              | 预期参数                        | 状态 |
| -------- | ----------------- | --------------------- | ------------------------------- | ---- |
| 店铺导航 | "Nike店在哪"      | navigate_to_store     | store_name: "Nike"              | ✓   |
| 商品搜索 | "搜索运动鞋"      | search_products       | keyword: "运动鞋"               | ✓   |
| 价格筛选 | "500元以下的手机" | search_products       | keyword: "手机", max_price: 500 | ✓   |
| 餐厅推荐 | "推荐中餐"        | recommend_restaurants | cuisine: "中餐"                 | ✓   |
| 图片搜索 | [图片] + "类似的" | search_by_image       | image_description, search_type  | ✓   |

### 6.3 性能测试

#### 6.3.1 渲染性能测试

| 场景规模   | 对象数量 | 平均帧率 | 内存占用 |
| ---------- | -------- | -------- | -------- |
| 小型商城   | 100      | 60 FPS   | 150 MB   |
| 中型商城   | 500      | 55 FPS   | 280 MB   |
| 大型商城   | 1000     | 45 FPS   | 450 MB   |
| 超大型商城 | 2000     | 32 FPS   | 680 MB   |

#### 6.3.2 加载性能测试

| 测试项目   | 首次加载 | 缓存加载 |
| ---------- | -------- | -------- |
| 场景初始化 | 1.2s     | 0.8s     |
| 模型加载   | 2.5s     | 1.0s     |
| 纹理加载   | 1.8s     | 0.5s     |
| 总计       | 5.5s     | 2.3s     |

#### 6.3.3 AI 响应性能测试

| 测试项目         | 响应时间 |
| ---------------- | -------- |
| 简单意图识别     | 0.3-0.5s |
| Function Calling | 0.5-0.8s |
| 视觉理解         | 1.0-1.5s |
| 多轮对话         | 0.8-1.2s |

### 6.4 测试结果分析

#### 6.4.1 功能测试分析

功能测试覆盖了系统的核心功能，包括三维场景渲染、导航交互、权限控制、AI Agent 集成和 Function Calling。测试结果表明：

1. **三维场景渲染**：系统能够正确初始化和管理 Three.js 场景，资源释放机制有效防止了内存泄漏。
2. **导航功能**：点击导航和自然语言导航均能正确执行，相机动画平滑流畅。
3. **权限控制**：RCAC 权限模型有效阻止了越权操作，AI 行为受到与 UI 相同的权限约束。
4. **AI Agent**：自然语言理解准确率较高，Function Calling 工具选择正确，安全控制有效。
5. **安全防护**：提示词注入攻击被成功拦截，敏感话题被正确过滤。

#### 6.4.2 性能测试分析

性能测试结果表明：

1. **渲染性能**：在中小型商城场景（500 对象以内）下，系统能够保持 55 FPS 以上的帧率，满足流畅体验的要求。
2. **加载性能**：首次加载时间约 5.5 秒，缓存加载可缩短至 2.3 秒。
3. **AI 响应**：简单意图识别在 0.5 秒内完成，Function Calling 在 1 秒内完成，基本满足实时交互需求。

### 6.5 本章小结

本章对系统进行了全面的测试，包括功能测试和性能测试。功能测试验证了系统核心功能的正确性，特别是 AI Agent 的 Function Calling 能力和安全防护机制。性能测试评估了系统在不同场景规模下的表现。测试结果表明，系统基本满足设计要求。

---

## 第 7 章 总结与展望

### 7.1 工作总结

本文设计并实现了一个基于 AI 驱动的三维智能商城导购系统，主要完成了以下工作：

1. **系统架构设计**：设计了清晰的四层架构（UI 层、业务协调层、领域场景层、渲染引擎层），实现了关注点分离和模块解耦，提高了系统的可维护性和可扩展性。
2. **语义对象建模**：提出了"语义优先"的建模原则，将三维对象与业务实体关联，使系统能够理解对象的业务含义，而非仅依赖几何属性。
3. **Action 协议机制**：设计了统一的行为协议，使来自 UI 和 AI 的操作可以被一致地校验和执行，保证了系统行为的可控性和可追踪性。
4. **RCAC 权限模型**：设计了基于角色、能力和上下文的权限控制模型，支持多角色协作场景，有效防止了越权操作。
5. **AI Agent 与 Function Calling 集成**：实现了完整的 AI Agent 系统，包括：

   - 基于 Qwen 的 LLM 提供商，支持文本对话和视觉理解
   - 12 个 Function Calling 工具定义（导航、搜索、购物、推荐等）
   - 三级安全控制（safe/confirm/critical）
   - 模块化提示词系统（YAML 配置，支持热更新）
   - 多层安全防护（提示词注入检测、敏感话题过滤）
   - 基于 Milvus + LangChain 的 RAG 知识库系统，提供语义检索能力
6. **区域建模权限机制**：设计了商家建模权限申请、审批和沙盒约束机制，支持多商家协作，保证了空间治理的有序性。

通过系统测试，验证了系统功能的正确性和性能的可接受性。系统能够在主流设备上流畅运行，为用户提供沉浸式的三维购物体验和智能化的导购服务。

### 7.2 不足与展望

尽管本系统已经实现了预期的功能，但仍存在一些不足之处，有待在未来的工作中改进：

#### 7.2.1 存在的不足

1. **大规模场景性能**：当场景对象数量较多时，渲染性能有所下降。需要引入更多的性能优化技术，如 LOD、实例化渲染、遮挡剔除等。
2. **AI 理解能力**：当前 AI Agent 对复杂或模糊指令的理解能力有限，需要进一步优化意图识别算法和扩充训练数据。
3. **移动端适配**：系统主要针对桌面端设计，移动端的触控交互和性能优化有待完善。
4. **多轮对话上下文**：当前的对话上下文管理较为简单，复杂的多轮对话场景支持有待加强。

#### 7.2.2 未来展望

1. **引入 WebGPU**：随着 WebGPU 标准的成熟，可以考虑将渲染引擎升级到 WebGPU，以获得更好的性能和更丰富的图形特性。
2. **增强 AI 能力**：引入更先进的大语言模型，支持更复杂的多轮对话、上下文理解和个性化推荐。
3. **VR/AR 支持**：扩展系统以支持 VR 头显和 AR 设备，提供更加沉浸的购物体验。
4. **社交功能**：增加多人在线、实时聊天、好友系统等社交功能，打造虚拟社交购物空间。
5. **数据分析**：引入用户行为分析和热力图功能，为商家提供数据驱动的运营决策支持。
6. **流式输出**：实现 AI 回复的流式输出，提升用户体验。

---

## 致谢

在本论文完成之际，我要向所有给予我帮助和支持的人表示衷心的感谢。

首先，我要感谢我的论文指导老师莫倩。在整个毕业设计过程中，导师给予了我悉心的指导和耐心的帮助，从选题、方案设计到论文撰写，导师都提出了宝贵的意见和建议，使我受益匪浅。

其次，我要感谢实验室的各位同学，在项目开发过程中，我们相互讨论、相互帮助，共同解决了许多技术难题。

同时，我要感谢开源社区的贡献者们，Three.js、Vue.js、FastAPI、Qwen 等优秀的开源项目为本系统的开发提供了坚实的基础。

最后，我要感谢我的家人，是他们的理解和支持让我能够专心完成学业。

由于本人水平有限，论文中难免存在不足之处，恳请各位老师和专家批评指正。

---

## 附录

### 附录 A：系统核心代码清单

#### 共享类型包

| 文件路径                                       | 功能描述                                  |
| ---------------------------------------------- | ----------------------------------------- |
| packages/shared-types/src/enums/user.ts        | 用户相关枚举（UserRole, UserStatus）      |
| packages/shared-types/src/enums/area.ts        | 区域相关枚举（AreaType, AreaStatus）      |
| packages/shared-types/src/enums/store.ts       | 店铺相关枚举（StoreStatus）               |
| packages/shared-types/src/enums/product.ts     | 商品相关枚举（ProductStatus）             |
| packages/shared-types/src/api/response.ts      | 统一响应格式（ApiResponse, PageResponse） |
| packages/shared-types/src/models/geometry.ts   | 几何类型（Point2D, Point3D, Polygon）     |
| packages/shared-types/python/smart_mall_types/ | Python 版本类型定义                       |

#### 前端核心模块

| 文件路径                                      | 功能描述          |
| --------------------------------------------- | ----------------- |
| src/engine/ThreeEngine.ts                     | 3D 渲染引擎核心类 |
| src/domain/registry/SemanticObjectRegistry.ts | 语义对象注册表    |
| src/domain/mall/MallManager.ts                | 商城管理器        |
| src/protocol/action.protocol.ts               | Action 协议定义   |
| src/builder/BuilderEngine.ts                  | 商城建模器引擎    |
| src/api/intelligence.api.ts                   | AI 服务 API 封装  |
| src/components/ai/GlobalAiAssistant.vue       | 全局 AI 助手组件  |

#### 前端可复用组件

| 文件路径                               | 功能描述           |
| -------------------------------------- | ------------------ |
| src/components/auth/AuthLayout.vue     | 认证页面统一布局   |
| src/components/auth/AuthFormCard.vue   | 表单卡片容器       |
| src/components/auth/AuthInput.vue      | 带验证状态的输入框 |
| src/components/auth/AuthButton.vue     | 带加载状态的主按钮 |
| src/components/auth/AlertMessage.vue   | 提示消息组件       |
| src/components/auth/TypewriterCard.vue | 打字机效果卡片     |
| src/components/auth/SocialLogin.vue    | 第三方登录按钮组   |
| src/components/auth/FeatureList.vue    | 功能特点列表       |

#### 后端核心模块

| 文件路径                                         | 功能描述             |
| ------------------------------------------------ | -------------------- |
| interfaces/controller/MallBuilderController.java | 商城建模器 REST 接口 |
| application/service/MallBuilderService.java      | 建模器应用服务       |
| domain/entity/MallProject.java                   | 商城项目实体         |
| domain/entity/Floor.java                         | 楼层实体             |
| domain/entity/Area.java                          | 区域实体             |
| domain/enums/AreaType.java                       | 区域类型枚举         |
| domain/enums/AreaStatus.java                     | 区域状态枚举         |
| infrastructure/mapper/MallProjectMapper.java     | 项目数据访问层       |

#### 智能服务核心模块

| 文件路径                      | 功能描述                   |
| ----------------------------- | -------------------------- |
| app/main.py                   | FastAPI 入口               |
| app/api/chat.py               | 对话接口                   |
| app/api/rag.py                | RAG 检索接口               |
| app/api/mall_generator.py     | AI 商城生成接口            |
| app/api/embedding.py          | Embedding 向量化接口       |
| app/core/llm/qwen.py          | Qwen LLM 提供商            |
| app/core/agent/mall_agent.py  | 智能导购 Agent             |
| app/core/agent/tools.py       | Function Calling 工具定义  |
| app/core/prompt_loader.py     | 提示词加载器               |
| app/core/rag/milvus_client.py | Milvus 向量数据库客户端    |
| app/core/rag/embedding.py     | Embedding 向量化服务       |
| app/core/rag/retriever.py     | LangChain 自定义 Retriever |
| app/core/rag/service.py       | RAG 核心服务               |
| app/core/rag/sync.py          | 数据同步服务               |
| app/prompts/system.yaml       | 系统提示词配置             |
| app/prompts/intent.yaml       | 意图识别提示词             |
| app/prompts/action.yaml       | Action 生成提示词          |
| app/prompts/vision.yaml       | 视觉理解提示词             |
| app/prompts/safety.yaml       | 安全防护配置               |

### 附录 B：Function Calling 工具定义示例

```python
# 导航工具定义
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
}

# 搜索工具定义
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
}
```

### 附录 C：系统配置说明

#### 共享类型包配置

```json
// packages/shared-types/package.json
{
  "name": "@smart-mall/shared-types",
  "version": "1.0.0",
  "main": "dist/index.js",
  "types": "dist/index.d.ts"
}

// 前端 package.json 依赖配置
{
  "dependencies": {
    "@smart-mall/shared-types": "file:../../../packages/shared-types"
  }
}
```

#### 前端配置

```json
{
  "renderer": {
    "antialias": true,
    "maxPixelRatio": 2,
    "shadowMapEnabled": true
  },
  "camera": {
    "fov": 60,
    "near": 0.1,
    "far": 1000,
    "defaultMode": "orbit"
  },
  "performance": {
    "targetFPS": 60,
    "enableLOD": true,
    "maxObjects": 2000
  }
}
```

#### 智能服务配置

```bash
# .env
# LLM 配置
LLM_PROVIDER=qwen
QWEN_API_KEY=sk-xxx
QWEN_MODEL=qwen-plus
QWEN_VISION_MODEL=qwen-vl-plus
QWEN_BASE_URL=https://dashscope.aliyuncs.com/compatible-mode/v1

# 服务配置
ENVIRONMENT=development
DEBUG=true
```

#### 提示词参数配置

```yaml
# 各模块推荐参数
parameters:
  system:
    temperature: 0.3      # 对话回复
    max_tokens: 500
  intent:
    temperature: 0.1      # 意图识别（需要稳定）
    max_tokens: 300
  action:
    temperature: 0.1      # Action 生成（需要稳定）
    max_tokens: 600
  vision:
    temperature: 0.2      # 视觉理解
    max_tokens: 300
  safety:
    temperature: 0.0      # 安全检查（需要完全一致）
    max_tokens: 200
```
