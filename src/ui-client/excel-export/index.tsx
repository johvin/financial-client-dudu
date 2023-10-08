import React, { useCallback, useState } from 'react';
import { Button, Drawer, Space } from 'antd';
import { writeFileXLSX, type WorkBook } from 'xlsx';
import './index.css';
import { ExcelPreview } from '../excel-preview';

interface ExcelExportProps {
  workbook: WorkBook;
  downloadName: string;
}

export const ExcelExport: React.FC<ExcelExportProps> = (props) => {
  const [showPreview, setPreview] = useState(false);

  const handleDownload = useCallback(() => {
    if (props.workbook) {
      writeFileXLSX(props.workbook, props.downloadName, { compression: true });
    }
  }, [props.workbook, props.downloadName]);

  return (
    <div className='excel-export-container'>
      <Space size='large' style={{ marginTop: 140 }}>
        <Button type='primary' onClick={handleDownload} disabled={!props.workbook}>下载 Excel 文件</Button>
        <Button onClick={() => {
          showPreview || setPreview(true);
        }}>在线预览</Button>
      </Space>
      <Drawer
        title={`在线预览 Excel`}
        placement="right"
        maskClosable={false}
        width={'80vw'}
        onClose={() => {
          setPreview(false);
        }}
        open={showPreview}
        destroyOnClose
      >
        <ExcelPreview wb={props.workbook} />
      </Drawer>
    </div>
  );
};