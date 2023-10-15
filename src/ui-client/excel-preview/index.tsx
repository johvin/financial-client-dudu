import React, { useState } from 'react';
import { Empty, Radio, Tabs } from 'antd';
import { WorkBook } from 'xlsx';
import './index.css';
import { SimpleTable } from './simple-table';
import { PrettyTable } from './pretty-table';

type TableMode = 'simple' | 'pretty';

// todo: local persistent
const defaultMode: TableMode = 'pretty';

export interface ExcelPreviewProps {
  wb?: WorkBook;
  tableMode?: TableMode;
}

/** todo: 可以把 drawer 拿进来，做成 preview Mode */
export const ExcelPreview: React.FC<ExcelPreviewProps> = ({
  wb,
  tableMode,
}) => {
  const [curSheet, setCurSheet] = useState(wb?.SheetNames[0] ?? '');
  // todo: 增加 mode 设置，可能在 table setting，或者 drawer 上
  const [mode, setMode] = useState<TableMode>(tableMode ?? defaultMode);

  return (
    <div className={`excel-preview-container ${mode}`}>
      {!wb && <Empty />}
      {wb && (
        <Radio.Group
          value={mode}
          onChange={(e) => {
            setMode(e.target.value);
          }}
          style={{ alignSelf: 'flex-end' }}
        >
          <Radio.Button value='simple'>简洁表格</Radio.Button>
          <Radio.Button value='pretty'>美化表格</Radio.Button>
        </Radio.Group>
      )}
      {wb && (
        <Tabs
          defaultActiveKey={curSheet}
          type='card'
          size='small'
          onTabClick={setCurSheet}
          items={wb.SheetNames.map((name) => {
            return {
              label: name,
              key: name,
              children:
                name === curSheet &&
                (mode === 'simple' ? (
                  <SimpleTable
                    wb={wb}
                    curSheet={curSheet}
                  />
                ) : (
                  <PrettyTable
                    wb={wb}
                    curSheet={curSheet}
                  />
                )),
            };
          })}
        />
      )}
    </div>
  );
};
