import React, { useMemo, useState } from 'react';
import { Empty, Table, type TableProps, Tabs } from 'antd';
import { WorkBook, utils } from 'xlsx';
import './index.css';
import { TableSetting } from './tableSetting';

const calcColWidth = (s: string) => {
  const nameLen = s.length;
  return nameLen < 10 ? 200 : 400;
};

export interface PrettyExcelPreviewProps {
  wb?: WorkBook;
}

export const PrettyExcelPreview: React.FC<PrettyExcelPreviewProps> = ({ wb }) => {
  const [curSheet, setCurSheet] = useState(wb?.SheetNames[0] ?? '');
  const [enablePagination, setPagination] = useState(true);
  const [fixedCols, setFixedCols] = useState<Record<string, string[]>>({});
  const [reserveTwoDecimals, setDecimalFormat] = useState(true);

  const aoa = useMemo(() => {
    if (wb && curSheet) {
      const sheet = wb.Sheets[curSheet];

      if (sheet) {
        return utils.sheet_to_json<string[]>(sheet, { header: 1 });
      }
    }

    return null;
  }, [wb, curSheet]);

  const columns = useMemo((): TableProps<string[]>['columns'] => {
    if (!aoa || aoa.length < 1) {
      return [];
    }

    return aoa[0].map((title, idx) => ({
      title,
      dataIndex: idx,
      key: idx,
      width: calcColWidth(title),
      ellipsis: { showTitle: true },
      // responsive: ['md'],
      fixed: fixedCols[curSheet]?.includes(title),
    }));
  }, [aoa, fixedCols, curSheet]);

  const tableWidth = useMemo(() => {
    return columns.reduce((a, b) => {
      a += b.width as number;
      return a;
    }, 0);
  }, [columns]);

  const dataSource = useMemo((): TableProps<string[]>['dataSource'] => {
    if (!aoa || aoa.length < 2) {
      return [];
    } 

    return aoa.slice(1).map((row, idx) => {
      const r = {
        key: idx + 1,
        ...row,
      };

      if (reserveTwoDecimals) {
        row.forEach((val, idx) => {
          if (typeof val === 'number') {
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            r[idx] = Math.round(val * 100) / 100;
          }
        });
      }

      return r;
    });
  }, [aoa, reserveTwoDecimals]);

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
              <>
                <Table
                  key={curSheet}
                  tableLayout='fixed'
                  bordered
                  columns={columns}
                  dataSource={dataSource}
                  pagination={enablePagination ? { pageSize: 20 } : false}
                  scroll={{ x: true, y: 400 }}
                />
                <TableSetting
                  tableName={curSheet}
                  tableColNames={columns.map(c => c.title as string)}
                  defaultSelectedCols={fixedCols[curSheet]}
                  onSelectedCols={(selectedCols) => {
                    setFixedCols(curCols => {
                      const nextCols = {
                        ...curCols,
                      };
                      nextCols[curSheet] = selectedCols;
                      return nextCols;
                    });
                  }}
                  onChangePagination={setPagination}
                  onDecimalFomat={setDecimalFormat}
                />
              </>
            ),
          };
        })}
      />)}
    </div>
  );
};
