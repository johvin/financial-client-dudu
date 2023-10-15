import React, { useEffect, useState } from 'react';
import { Space, Tag } from 'antd';

const { CheckableTag } = Tag;

export interface TableColumnPickerProps {
  defaultSelectedCols?: string[];
  /** 列名称 */
  cols: string[];
  onChange?: (selectedCols: string[]) => void;
}

export const TableColumnPicker: React.FC<TableColumnPickerProps> = (props) => {
  const { defaultSelectedCols = [], cols, onChange } = props;
  const [selectedCols, setSelectedCols] = useState<string[]>(defaultSelectedCols);

  const handleChange = (col: string, checked: boolean) => {
    const nextSelectedCols = checked
      ? [...selectedCols, col]
      : selectedCols.filter((t) => t !== col);
    setSelectedCols(nextSelectedCols);
  };

  useEffect(() => {
    onChange?.(selectedCols);
  }, [selectedCols]);

  return (
    <Space className='table-column-picker' style={{ width: '100%' }} size={[0, 8]} wrap>
      {cols.map((col) => (
        <CheckableTag
          key={col}
          style={{ border: '1px solid #d9d9d9' }}
          checked={selectedCols.includes(col)}
          onChange={(checked) => handleChange(col, checked)}
        >
          {col}
        </CheckableTag>
      ))}
    </Space>
  );
};