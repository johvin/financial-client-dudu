import React from 'react';
import { LogItemInfo } from './utils';
import './simple.css';

export interface LogProps {
  logs: LogItemInfo[];
  style?: React.CSSProperties;
}

export const SimpleLog: React.FC<LogProps> = ({ logs, style }) => {
  return (
    <details className="log-container" style={style}>
      <summary className='log-title'>处理日志</summary>
      {logs.length === 0 && '无日志'}
      {logs.length > 0 && (
        <section className='log-content-container'>
          {logs.map((l, idx) => (<p className={`log-content-item ${l.type}`} key={idx}>{l.msg}</p>))}
        </section>
      )}
    </details>
  );
};