/**
 * PostProcessingPipeline - 后处理管线
 *
 * 使用 EffectComposer 管理渲染通道链：
 * RenderPass → SSAOPass → UnrealBloomPass → ShaderPass(FXAA)
 *
 * 每个通道可独立启用/禁用，支持尺寸同步和资源释放。
 */

import type { Camera, Scene, WebGLRenderer } from 'three'
import { Vector2 } from 'three'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
import { SSAOPass } from 'three/examples/jsm/postprocessing/SSAOPass.js'
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js'
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js'
import { FXAAShader } from 'three/examples/jsm/shaders/FXAAShader.js'

export interface PostProcessingOptions {
  ssaoEnabled?: boolean
  ssaoRadius?: number
  ssaoIntensity?: number
  bloomEnabled?: boolean
  bloomThreshold?: number
  bloomStrength?: number
  bloomRadius?: number
  fxaaEnabled?: boolean
}

type PassName = 'ssao' | 'bloom' | 'fxaa'

const DEFAULT_OPTIONS: Required<PostProcessingOptions> = {
  ssaoEnabled: true,
  ssaoRadius: 8,
  ssaoIntensity: 1,
  bloomEnabled: true,
  bloomThreshold: 0.8,
  bloomStrength: 0.3,
  bloomRadius: 0.3,
  fxaaEnabled: true,
}

export class PostProcessingPipeline {
  private composer: EffectComposer
  private renderPass: RenderPass
  private ssaoPass: SSAOPass
  private bloomPass: UnrealBloomPass
  private fxaaPass: ShaderPass

  constructor(
    renderer: WebGLRenderer,
    scene: Scene,
    camera: Camera,
    options?: PostProcessingOptions,
  ) {
    const opts = { ...DEFAULT_OPTIONS, ...options }
    const pixelRatio = renderer.getPixelRatio()
    const size = renderer.getSize(new Vector2())
    const width = size.x
    const height = size.y

    // EffectComposer
    this.composer = new EffectComposer(renderer)
    this.composer.setPixelRatio(pixelRatio)
    this.composer.setSize(width, height)

    // 1. RenderPass — 基础渲染通道
    this.renderPass = new RenderPass(scene, camera)
    this.composer.addPass(this.renderPass)

    // 2. SSAOPass — 屏幕空间环境光遮蔽
    this.ssaoPass = new SSAOPass(scene, camera, width, height)
    this.ssaoPass.kernelRadius = opts.ssaoRadius
    this.ssaoPass.minDistance = 0.005
    this.ssaoPass.maxDistance = 0.1
    this.ssaoPass.enabled = opts.ssaoEnabled
    this.composer.addPass(this.ssaoPass)

    // 3. UnrealBloomPass — 泛光
    this.bloomPass = new UnrealBloomPass(
      new Vector2(width, height),
      opts.bloomStrength,
      opts.bloomRadius,
      opts.bloomThreshold,
    )
    this.bloomPass.enabled = opts.bloomEnabled
    this.composer.addPass(this.bloomPass)

    // 4. ShaderPass(FXAA) — 抗锯齿
    this.fxaaPass = new ShaderPass(FXAAShader)
    this.fxaaPass.uniforms['resolution']!.value.set(
      1 / (width * pixelRatio),
      1 / (height * pixelRatio),
    )
    this.fxaaPass.enabled = opts.fxaaEnabled
    this.composer.addPass(this.fxaaPass)
  }

  /**
   * 启用/禁用指定通道
   */
  public setPassEnabled(passName: PassName, enabled: boolean): void {
    const pass = this.getPass(passName)
    pass.enabled = enabled
  }

  /**
   * 查询指定通道是否启用
   */
  public isPassEnabled(passName: PassName): boolean {
    const pass = this.getPass(passName)
    return pass.enabled
  }

  /**
   * 执行后处理渲染
   */
  public render(): void {
    this.composer.render()
  }

  /**
   * 同步更新所有通道分辨率
   */
  public setSize(width: number, height: number): void {
    this.composer.setSize(width, height)

    const pixelRatio = this.composer.renderer.getPixelRatio()

    // 更新 FXAA 分辨率 uniform
    this.fxaaPass.uniforms['resolution']!.value.set(
      1 / (width * pixelRatio),
      1 / (height * pixelRatio),
    )

    // 更新 SSAOPass 尺寸
    this.ssaoPass.width = width
    this.ssaoPass.height = height
  }

  /**
   * 释放所有后处理通道的 GPU 资源
   */
  public dispose(): void {
    const resources = [
      { name: 'RenderPass', resource: this.renderPass },
      { name: 'SSAOPass', resource: this.ssaoPass },
      { name: 'UnrealBloomPass', resource: this.bloomPass },
      { name: 'FXAAPass', resource: this.fxaaPass },
      { name: 'EffectComposer', resource: this.composer },
    ]

    for (const { name, resource } of resources) {
      try {
        if (typeof resource.dispose === 'function') {
          resource.dispose()
        }
      }
      catch (error) {
        console.warn(`[PostProcessingPipeline] Failed to dispose ${name}:`, error)
      }
    }
  }

  /**
   * 获取内部 EffectComposer（用于测试或高级用途）
   */
  public getComposer(): EffectComposer {
    return this.composer
  }

  private getPass(passName: PassName) {
    switch (passName) {
      case 'ssao':
        return this.ssaoPass
      case 'bloom':
        return this.bloomPass
      case 'fxaa':
        return this.fxaaPass
    }
  }
}
