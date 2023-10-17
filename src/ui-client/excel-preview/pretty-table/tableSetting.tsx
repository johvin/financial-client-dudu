import React, { useEffect, useLayoutEffect, useState } from 'react';
import { Collapse, Divider, Drawer, FloatButton, Space, Switch } from 'antd';
import { SettingOutlined } from '@ant-design/icons';
import { TableColumnPicker } from './columnPicker';

export interface TableSettingProps {
  tableName: string;
  /** 表格列名数组 */
  tableColNames: string[];
  /** 默认固定的表格列名数组 */
  defaultSelectedCols?: string[];
  /** 表格固定列变化时触发 */
  onSelectedCols?: (selectedCols: string[]) => void;
  /** 分页状态变化触发 */
  onChangePagination?: (enable: boolean) => void;
  /** 是否保留两位小数 */
  onDecimalFomat?: (reserveTwoDecimals: boolean) => void;
}

export const TableSetting: React.FC<TableSettingProps> = (props) => {
  const {
    tableName,
    tableColNames,
    defaultSelectedCols = [],
    onSelectedCols,
    onChangePagination,
    onDecimalFomat,
  } = props;
  const [showTableSetting, setShowStatus] = useState(false);
  const [fixFirstCol, setFirstColStatus] = useState(true);
  const [selectedFixCols, setFixCols] = useState<string[]>([]);
  // 两位小数
  const [decimalFormat, setDecimalFormat] = useState(true);
  const [enablePagination, setPagination] = useState(true);

  // 表名变化，重新设置
  useLayoutEffect(() => {
    if (fixFirstCol) {
      const firstCol = tableColNames[0] ?? '';
      if (firstCol.length > 0 && !defaultSelectedCols.includes(firstCol)) {
        return setFixCols([firstCol].concat(defaultSelectedCols));
      }
    }

    return setFixCols(defaultSelectedCols);
  }, [tableName]);

  useEffect(() => {
    onSelectedCols?.(selectedFixCols);
  }, [selectedFixCols]);

  useEffect(() => {
    onChangePagination?.(enablePagination);
  }, [enablePagination]);

  useEffect(() => {
    onDecimalFomat?.(decimalFormat);
  }, [decimalFormat]);


  return (
    <>
      <FloatButton
        icon={<SettingOutlined />}
        type='primary'
        tooltip='自定义表格显示效果'
        style={{ bottom: 100, right: 40 }}
        onClick={() => {
          setShowStatus(true);
        }}
      />
      <Drawer
        title='表格显示设置'
        placement='right'
        width={500}
        onClose={() => {
          setShowStatus(false);
        }}
        open={showTableSetting}
        destroyOnClose
      >
        <Collapse
          items={[
            {
              key: 'fixed-cols',
              label: '自定义表格的固定列',
              children: (
                <>
                  <p>待持久化</p>
                  <Space size={8}>{'固定第一列：'}<Switch checked={fixFirstCol} onChange={setFirstColStatus} /></Space>
                  <Divider>以下是“{tableName}”表格的列</Divider>
                  <TableColumnPicker
                    key={tableName}
                    defaultSelectedCols={selectedFixCols}
                    cols={tableColNames}
                    onChange={onSelectedCols}
                  />
                </>
              ),
            },
            {
              key: 'numberFormat',
              label: '内容格式',
              children: (
                <Space size={8}>{'数字小数格式：'}<Switch checkedChildren="保留两位" unCheckedChildren="完整显示" checked={decimalFormat} onChange={setDecimalFormat} /></Space> 
              ),
            },
            {
              key: 'pagination',
              label: '表格分页',
              children: (
                <Space size={8}>{'分页状态：'}<Switch checked={enablePagination} onChange={setPagination} /></Space> 
              ),
            },
            {
              key: 'sort',
              label: '数据排序',
              children: '待实现',
            },
          ]}
        />
      </Drawer>
    </>
  );
};
