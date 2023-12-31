import React, { useCallback, useMemo, useState } from 'react';
import { Button, Divider, Progress, Space } from 'antd';
import { PoweroffOutlined } from '@ant-design/icons';
import './index.css';
import { sleep } from '../../utils/time';
import { WorkBook } from 'xlsx';
import { LogItemInfo, SimpleLog } from '../../log';
import { ProcessStatus, TaskProgress } from '../processsor';

/** 指示器渐变色 */
const twoColors = { '0%': '#108ee9', '100%': '#87d068' };

interface ProcessIndicatorProps<Task extends string> {
  status: ProcessStatus;
  tasksProgress: TaskProgress<Task>[];
  logs?: LogItemInfo[];
  onStart?: () => void;
  // onComplete?: (status: ProcessStatus, wb: WorkBook) => void;
}

export const ProcessIndicator: React.FC<ProcessIndicatorProps<string>> = ({ status, tasksProgress, logs, onStart }) => {
  // const [status, setStatus] = useState<ProcessStatus>(ProcessStatus.Init);
  // const [tasksProgress, setTasksProgress] = useState<TaskProgress<string>[]>([]);
  // const [logs, setLogs] = useState<LogItemInfo[]>([]);

  const totalPercent = useMemo(() => {
    let cur = 0, total = 0;
    tasksProgress.forEach(tp => {
      total += 100;
      cur += tp.percent;
    });

    return Math.round(cur / total * 100);
  }, [tasksProgress]);

  // const onStartProcess = useCallback(async () => {
  //   props.onStart?.();

  //   const [summaryWB, logs] = await process(props.toProcessFiles ?? [], async (progressInfo) => {
  //     setStatus(progressInfo.status);
  //     setTasksProgress(progressInfo.tasks.map(t => ({
  //       taskName: t.name,
  //       percent: t.percent,
  //     })));

  //     await sleep(100);
  //   });

  //   props.onComplete?.(summaryWB ? ProcessStatus.Done : ProcessStatus.Error, summaryWB);

  //   setResult(summaryWB);
  //   setLogs(logs);
  // }, [props.toProcessFiles]);

  // test ui
  // useEffect(() => {
  //   setStatus(ProcessStatus.Doing);
  //   setTasksProgress([{
  //     taskName: 'ceshi',
  //     percent: 80,
  //   }]);
  //   setLogs([{ type: 'info', msg: 'heiehi发我额发我份额接哦i我饿金佛我饿发'}])
  // }, []);

  return (
    <div className="process-indicator-container">
      {status !== ProcessStatus.Doing && (
        <Space className='action-bar' direction='vertical'>
          {status === ProcessStatus.Done && '已完成处理'}
          {/* {status === ProcessStatus.Init && `共 ${props.toProcessFiles.length} 个文件待处理`} */}
          <Button
            type='primary'
            icon={<PoweroffOutlined />}
            onClick={onStart}>{status === ProcessStatus.Init ? '开始处理' : '再次处理'}</Button>
        </Space>
      )}
      {status !== ProcessStatus.Init && (
        <>
          <Divider style={{ marginTop: 48 }}>
            <Progress
              className='process-total-progress'
              type='circle'
              percent={totalPercent}
              strokeColor={twoColors}
              format={() => <span style={{ fontSize: '0.8em'}}>处理进度</span>}
            />
          </Divider>
          <div className="process-indicator">
            {tasksProgress.map((task, idx) => {
              return (
                <Space className='task-indicator' key={`${idx}_${task.name}`}>
                  {task.name}
                  <Progress percent={task.percent} />
                </Space>
              );
            })}
          </div>
          {logs.length > 0 && <SimpleLog logs={logs} />}
        </>
      )}
    </div>
  );
};