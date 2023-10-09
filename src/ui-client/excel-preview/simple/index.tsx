import React, { useMemo, useState } from 'react';
import { Empty, Tabs } from 'antd';
import { WorkBook, utils } from 'xlsx';
import './index.css';

export interface SimpleExcelPreviewProps {
  wb?: WorkBook;
}

export const SimpleExcelPreview: React.FC<SimpleExcelPreviewProps> = ({ wb }) => {
  const [curSheet, setCurSheet] = useState(wb?.SheetNames[0] ?? '');
  const curSheetHtml = useMemo(() => {
    if (curSheet && wb) {
      return utils.sheet_to_html(wb.Sheets[curSheet]);
    }

    return '';
  }, [curSheet, wb]);

  return (
    <div className='excel-preview-container'>
      {!wb && <Empty />}
      {wb && (<Tabs
        defaultActiveKey={curSheet}
        type="card"
        size='small'
        onTabClick={setCurSheet}
        items={wb.SheetNames.map((name) => {
          return {
            label: name,
            key: name,
            children: name === curSheet && (
              <div className="content-preview-simple" dangerouslySetInnerHTML={{ __html: curSheetHtml }}></div>
            ),
          };
        })}
      />)}
    </div>
  );
};