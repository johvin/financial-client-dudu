import React, { useMemo } from 'react';
import { WorkBook, utils } from 'xlsx';
// import './index.css';

// fixed column 实现（sticky）
// https://stackoverflow.com/questions/1312236/how-do-i-create-an-html-table-with-a-fixed-frozen-left-column-and-a-scrollable-b
// https://dev.to/nicolaserny/table-with-a-fixed-first-column-2c5b

export interface SimpleTableProps {
  wb: WorkBook;
  curSheet: string;
}

export const SimpleTable: React.FC<SimpleTableProps> = ({ wb, curSheet }) => {
  const curSheetHtml = useMemo(() => {
    if (curSheet && wb) {
      const sheetObj = wb.Sheets[curSheet];
      if (sheetObj) {
        return utils.sheet_to_html(sheetObj);
      }
    }

    return '';
  }, [curSheet, wb]);

  return (
    <div
      className='content-preview-simple'
      dangerouslySetInnerHTML={{ __html: curSheetHtml }}
    ></div>
  );
};
