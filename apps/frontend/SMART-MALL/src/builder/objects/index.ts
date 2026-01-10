/**
 * 3D 模型模块
 * 导出所有建筑设施的 3D 模型创建函数
 */

export { createElevatorModel } from './elevator-model'
export { createEscalatorModel } from './escalator-model'
export { createStairsModel } from './stairs-model'
export { createServiceDeskModel } from './service-desk-model'
export { createRestroomModel } from './restroom-model'
export { 
  loadCharacterModel, 
  getRandomCharacterModel,
  getAvailableCharacterModels,
  CharacterController 
} from './character-model'

// 商场基础设施
export {
  createBenchModel,
  createLampPostModel,
  createTrashBinModel,
  createPlanterModel,
  createSignPostModel,
  createFountainModel,
  createKioskModel,
  createATMModel,
  createVendingMachineModel,
  createInfoBoardModel,
  createClockModel,
  createFireExtinguisherModel,
} from './furniture-models'
