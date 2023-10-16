import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Button, Space, Steps } from 'antd';
import './index.css';
import { ExcelPicker } from '../../../excel-picker';
import { ExcelExport } from '../../../excel-export';
import { ProcessTask, operateStepItems } from '../steps';
import { WorkBook } from 'xlsx';
import { ProcessStatus, ProcessIndicator, TaskProgress } from '../../../process-indicator';
import { SummaryProcessor } from '../process-data';
import { LogItemInfo } from '../../../log';
import { sleep } from '../../../utils/time';

const summaryProcessor = new SummaryProcessor();

// todo: 待改成 octopus 流程架构
export const Summary: React.FC = () => {
  const [curOperateStepIdx, setOperateStepIdx] = useState(0);
  const [selectFiles, setFiles] = useState<File[]>([]);
  const [processStatus, setProcessStatus] = useState<ProcessStatus>(ProcessStatus.Init);
  const [tasksProgress, setTasksProgress] = useState<TaskProgress<ProcessTask>[]>([]);
  const [wb, setWB] = useState<WorkBook>(null);
  const [logs, setLogs] = useState<LogItemInfo[]>([]);

  const showNextBtn = useMemo(() => {
    switch (curOperateStepIdx) {
      case 0:
        return selectFiles.length > 0;
      case 1:
        return processStatus === ProcessStatus.Done;
      case 2:
      default:
        return false;
    }
  }, [curOperateStepIdx, selectFiles, processStatus]);

  const showPrevBtn = useMemo(() => {
    switch (curOperateStepIdx) {
      case 1:
        return processStatus !== ProcessStatus.Doing;
      case 2:
        return true;
      case 0:
      default:
        return false;
    }
  }, [curOperateStepIdx, selectFiles, processStatus]);

  const handleNext = useCallback(() => {
    setOperateStepIdx(cur => cur + 1);
  }, []);

  const handlePrev = useCallback(() => {
    setOperateStepIdx(cur => cur - 1);
  }, []);

  useEffect(() => {
    summaryProcessor.setProgressSyncer(async (progressInfo) => {
      setProcessStatus(progressInfo.status);
      setTasksProgress(progressInfo.tasks);
      await sleep(100);
    });
  }, []);

  useEffect(() => {
    setProcessStatus(ProcessStatus.Init);
    setTasksProgress([]);
    setWB(null);
    setLogs([]);
  }, [selectFiles]);

  const onStartProcess = useCallback(async () => {
    summaryProcessor.reset();
    setWB(null);
    setLogs([]);
    setProcessStatus(ProcessStatus.Doing);
    const { wb, logs } = await summaryProcessor.process(selectFiles);
    setWB(wb);
    setLogs(logs);
  }, [selectFiles]);

  return (
    <div className='consolidated-summary'>
      <Steps current={curOperateStepIdx} labelPlacement='vertical' items={operateStepItems} />
      <div className="operate-area">
        {curOperateStepIdx === 0 && (
          <ExcelPicker
            defaultFiles={selectFiles}
            hintText='文件格式: <数字>_<公司名称>_<XXX>.xlsx'
            onConfirm={setFiles}
          />
        )}
        {curOperateStepIdx === 1 && (
          <ProcessIndicator
            status={processStatus}
            tasksProgress={tasksProgress}
            logs={logs}
            onStart={onStartProcess}
          />
        )}
        {curOperateStepIdx === operateStepItems.length - 1 && (
          <ExcelExport workbook={wb} downloadName='合并报表.xlsx' />
        )}
      </div>
      <Space style={{ justifyContent: 'center' }} size='large'>
        {curOperateStepIdx < operateStepItems.length - 1 && showNextBtn && (<Button type='primary' onClick={handleNext}>下一步</Button>)}
        {curOperateStepIdx > 0 && showPrevBtn && (<Button onClick={handlePrev}>上一步</Button>)}
      </Space>
    </div>
  );
};