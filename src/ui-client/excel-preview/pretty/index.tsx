import React, { useMemo, useState } from 'react';
import { Empty, Table, type TableProps, Tabs, Collapse, FloatButton, Drawer } from 'antd';
import { SettingOutlined } from '@ant-design/icons';
import { WorkBook, utils } from 'xlsx';
import './index.css';
import { TableColumnPicker } from './columnPicker';

const calcColWidth = (s: string) => {
  const nameLen = `${s}`.split('').reduce((a, b) => a += b.codePointAt(0) > 255 ? 2 : 1, 0);
  let showLen = Math.ceil(nameLen / 2);
  showLen = showLen < 6 ? 6 : showLen;
  const fontSize = 14;
  const paddingLen = 4;
  return (showLen + paddingLen) * fontSize;
};

export interface PrettyExcelPreviewProps {
  wb?: WorkBook;
}

export const PrettyExcelPreview: React.FC<PrettyExcelPreviewProps> = ({ wb }) => {
  const [curSheet, setCurSheet] = useState(wb?.SheetNames[0] ?? '');
  const [fixedCols, setFixedCols] = useState<Record<string, string[]>>({});
  const [showTableColPicker, setPickerStatus] = useState(false);

  const curSheetInfo = useMemo((): Required<Pick<TableProps<string[]>, 'dataSource' | 'columns'>> => {
    if (curSheet && wb) {
      const aoa = utils.sheet_to_json<string[]>(wb.Sheets[curSheet], { header: 1 });

      if (aoa.length > 0) {
        return {
          dataSource: aoa.slice(1).map((row, idx) => ({
            key: idx + 1,
            ...row,
          })),
          columns: aoa[0].map((title, idx) => ({
            title,
            dataIndex: idx,
            key: idx,
            // 留一列自适应宽度，但 sheet 切换时效果依然不理想
            // width: idx < aoa[0].length - 1 ? calcColWidth(title) : undefined,
            responsive: ['md'],
            fixed: fixedCols[curSheet]?.includes(title),
          })),
        };
      }
    }

    return {
      dataSource: [],
      columns: [],
    };
  }, [curSheet, wb, fixedCols]);

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
                  bordered
                  columns={curSheetInfo.columns}
                  dataSource={curSheetInfo.dataSource}
                  pagination={{ pageSize: 20 }}
                  scroll={{ x: true, y: 400 }}
                />
                <FloatButton
                  icon={<SettingOutlined />}
                  type='primary'
                  tooltip='自定义表格显示效果'
                  style={{ right: 60, bottom: 120 }}
                  onClick={() => {
                    setPickerStatus(true);
                  }}
                />
                <Drawer
                  title='表格显示设置'
                  placement="right"
                  width={500}
                  onClose={() => {
                    setPickerStatus(false);
                  }}
                  open={showTableColPicker}
                  destroyOnClose
                >
                  
                  <Collapse
                    key={curSheet}
                    items={[{
                      key: 'sort',
                      label: '数据排序',
                      children: '待实现',
                    }, {
                      key: 'fixed-cols',
                      label: '自定义表格的固定列',
                      children: (
                        <TableColumnPicker
                          defaultSelectedCols={fixedCols[curSheet] ?? []}
                          cols={curSheetInfo.columns.map(c => c.title as string)}
                          onChange={(selectedCols) => {
                            setFixedCols(curCols => {
                              const nextCols = {
                                ...curCols,
                              };
                              nextCols[curSheet] = selectedCols;
                              return nextCols;
                            });
                          }}
                        />
                      ),
                    }, {
                      key: 'pagination',
                      label: '是否分页',
                      children: '待实现',
                    }]}
                  />
                </Drawer>
              </>
            ),
          };
        })}
      />)}
    </div>
  );
};