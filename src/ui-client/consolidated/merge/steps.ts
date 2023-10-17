import { StepProps } from 'antd';

/** 整体操作步骤 */
export enum OperateStep {
  Pick = '选择文件',
  Process = '数据处理',
  Done = '完成',
}

/** 处理步骤 */
export enum ProcessTask {
  /** read data from excel */
  Read = '读取文件',
  Clean = '数据清洗',
  Process = '数据计算',
  /** 生成 workbook */
  Write = '数据生成',
}

export const operateStepItems: Pick<StepProps, 'title' | 'description'>[] = [{
  title: OperateStep.Pick,
}, {
  title: OperateStep.Process,
}, {
  title: OperateStep.Done,
}];
