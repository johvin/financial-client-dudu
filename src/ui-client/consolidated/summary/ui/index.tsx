import React, { useCallback, useMemo, useState } from 'react';
import { Button, Space, Steps } from 'antd';
import './index.css';
import { ExcelPicker } from '../../../excel-picker';
import { ExcelExport } from '../../../excel-export';
import { operateStepItems } from '../steps';
import { type WorkBook } from 'xlsx';
import { ProcessIndicator } from '../process-indicator';
import { ProcessStatus } from '../process-data';


export const Summary: React.FC = () => {
  const [curOperateStepIdx, setOperateStepIdx] = useState(0);
  const [processStatus, setProcessStatus] = useState<ProcessStatus>(ProcessStatus.Init);
  const [selectFiles, setFiles] = useState<File[]>([]);
  const [wb, setWB] = useState<WorkBook>(null);

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
          <ProcessIndicator toProcessFiles={selectFiles} onStart={() => {
              setProcessStatus(ProcessStatus.Doing);
            }} onComplete={(status, wb) => {
              setProcessStatus(status);
              setWB(wb);
            }}
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