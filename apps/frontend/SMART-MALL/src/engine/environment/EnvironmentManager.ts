/**
 * ============================================================================
 * EnvironmentManager - HDR 环境贴图管理器
 * ============================================================================
 *
 * 【职责】
 * 管理 HDR 环境贴图的加载、应用和释放。
 * 通过 PMREMGenerator 将等距柱状投影 HDR 转换为立方体环境贴图，
 * 用于 PBR 材质的环境反射和场景背景。
 *
 * 【设计原则】
 * - 纯引擎层：不引用任何业务概念
 * - 容错设计：加载失败回退到纯色背景，不抛异常
 * - 资源管理：dispose 释放所有 GPU 资源
 */

import * as THREE from 'three'
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js'

export class EnvironmentManager {
  private pmremGenerator: THREE.PMREMGenerator
  private envMap: THREE.Texture | null = null
  private rawHdrTexture: THREE.Texture | null = null

  constructor(renderer: THREE.WebGLRenderer) {
    this.pmremGenerator = new THREE.PMREMGenerator(renderer)
    this.pmremGenerator.compileEquirectangularShader()
  }

  /**
   * 加载 HDR 环境贴图
   * @param url HDR 文件路径
   * @returns 处理后的环境贴图纹理，加载失败返回 null
   */
  public async loadHDR(url: string): Promise<THREE.Texture | null> {
    const loader = new RGBELoader()

    try {
      const hdrTexture = await loader.loadAsync(url)
      this.rawHdrTexture = hdrTexture

      const envMap = this.pmremGenerator.fromEquirectangular(hdrTexture).texture
      this.envMap = envMap

      // 原始 HDR 纹理已转换，可以释放
      hdrTexture.dispose()
      this.rawHdrTexture = null

      return envMap
    } catch (error) {
      console.warn(`[EnvironmentManager] Failed to load HDR environment map: ${url}`, error)
      return null
    }
  }

  /**
   * 将环境贴图应用到场景
   * @param scene 目标场景
   * @param asBackground 是否同时设置为场景背景，默认 true
   */
  public applyToScene(scene: THREE.Scene, asBackground: boolean = true): void {
    if (!this.envMap) {
      console.warn('[EnvironmentManager] No environment map loaded. Scene will keep current background.')
      return
    }

    scene.environment = this.envMap

    if (asBackground) {
      scene.background = this.envMap
    }
  }

  /**
   * 程序化生成环境贴图（不依赖外部 HDR 文件）
   *
   * 创建临时场景，添加带渐变材质的球体模拟天空穹顶，
   * 使用 PMREMGenerator.fromScene() 生成预过滤立方体环境贴图。
   *
   * @param options 可选参数
   * @param options.topColor 天空顶部颜色，默认 0x222244
   * @param options.bottomColor 地面颜色，默认 0x111122
   * @param options.intensity 环境光强度，默认 1.0
   * @returns 生成的环境贴图纹理，失败返回 null
   */
  public generateProceduralEnvMap(options?: {
    topColor?: number
    bottomColor?: number
    intensity?: number
  }): THREE.Texture | null {
    const topColor = options?.topColor ?? 0x222244
    const bottomColor = options?.bottomColor ?? 0x111122
    const intensity = options?.intensity ?? 1.0

    try {
      // 1. 创建临时场景
      const tempScene = new THREE.Scene()

      // 2. 添加带渐变材质的球体模拟天空穹顶
      const skyGeo = new THREE.SphereGeometry(50, 32, 32)
      const skyMat = new THREE.ShaderMaterial({
        uniforms: {
          topColor: { value: new THREE.Color(topColor) },
          bottomColor: { value: new THREE.Color(bottomColor) },
          intensity: { value: intensity },
        },
        vertexShader: `
          varying vec3 vWorldPosition;
          void main() {
            vec4 worldPosition = modelMatrix * vec4(position, 1.0);
            vWorldPosition = worldPosition.xyz;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: `
          uniform vec3 topColor;
          uniform vec3 bottomColor;
          uniform float intensity;
          varying vec3 vWorldPosition;
          void main() {
            float h = normalize(vWorldPosition).y;
            float t = h * 0.5 + 0.5;
            vec3 color = mix(bottomColor, topColor, t) * intensity;
            gl_FragColor = vec4(color, 1.0);
          }
        `,
        side: THREE.BackSide,
      })
      const skyMesh = new THREE.Mesh(skyGeo, skyMat)
      tempScene.add(skyMesh)

      // 3. 使用 PMREMGenerator.fromScene() 生成预过滤立方体环境贴图
      const envMap = this.pmremGenerator.fromScene(tempScene).texture

      // 4. 释放临时场景资源
      skyGeo.dispose()
      skyMat.dispose()
      tempScene.remove(skyMesh)

      this.envMap = envMap
      return envMap
    } catch (error) {
      console.warn('[EnvironmentManager] Failed to generate procedural environment map:', error)
      return null
    }
  }

  /**
   * 获取当前环境贴图
   */
  public getEnvironmentMap(): THREE.Texture | null {
    return this.envMap
  }

  /**
   * 释放所有纹理资源
   */
  public dispose(): void {
    try {
      this.envMap?.dispose()
    } catch (e) {
      console.warn('[EnvironmentManager] Error disposing environment map:', e)
    }
    this.envMap = null

    try {
      this.rawHdrTexture?.dispose()
    } catch (e) {
      console.warn('[EnvironmentManager] Error disposing raw HDR texture:', e)
    }
    this.rawHdrTexture = null

    try {
      this.pmremGenerator.dispose()
    } catch (e) {
      console.warn('[EnvironmentManager] Error disposing PMREMGenerator:', e)
    }
  }
}
