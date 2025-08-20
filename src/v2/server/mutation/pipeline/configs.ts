import type { PipelineConfig, OperationType } from './types'

// Default pipeline configurations for each operation type
export const PIPELINE_CONFIGS: Record<OperationType, PipelineConfig> = {
  insert: {
    parse: true,
    restrictions: true,
    relations: true,
    beforeHooks: true,
    execute: true,
    afterHooks: true,
  },
  patch: {
    parse: true,
    restrictions: true,
    relations: true,
    beforeHooks: true,
    execute: true,
    afterHooks: true,
  },
  replace: {
    parse: true,
    restrictions: true,
    relations: true,
    beforeHooks: true,
    execute: true,
    afterHooks: true,
  },
  delete: {
    parse: false,
    restrictions: false,
    relations: true,
    beforeHooks: true,
    execute: true,
    afterHooks: true,
  },
}

export function getDefaultConfig(operation: OperationType): PipelineConfig {
  return { ...PIPELINE_CONFIGS[operation] }
}
