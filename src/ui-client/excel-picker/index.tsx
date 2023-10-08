import React, { useCallback, useState } from 'react';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore RcFile
import type { UploadProps, RcFile } from 'antd';
import { Button, Space, Upload } from 'antd';
import { FileAddTwoTone } from '@ant-design/icons';
import { debounce } from 'lodash-es';
import './index.css';

export { RcFile };
export interface ExcelPickerProps {
  defaultFiles?: RcFile[];
  hintText?: string;
  onConfirm?: (list: RcFile[]) => void;
}

export const ExcelPicker: React.FC<ExcelPickerProps> = (props) => {
  const [selectFiles, setFiles] = useState<RcFile[]>(props.defaultFiles ?? []);

  const autoConfirm = useCallback(debounce((selectFiles: RcFile[]) => {
    props.onConfirm?.(selectFiles);
  }, 100), []);

  const handleBeforeUpload: UploadProps['beforeUpload'] = useCallback((file) => {
    setFiles(files => {
      const newFiles = [...files, file];
      autoConfirm(newFiles);
      return newFiles;
    });

    if (/.xlsx?$/.test(file.name)) {
      // prevent upload
      return false;
    }

    // filter
    return Upload.LIST_IGNORE;
  }, []);

  const handleRemove: UploadProps['onRemove'] = useCallback((file) => {
    setFiles(files => {
      const newFiles = files.filter(f => f.name !== file.name);
      autoConfirm(newFiles);
      return newFiles;
    });
  }, []);

  const onEmpty = useCallback(() => {
    setFiles([]);
    autoConfirm([]);
  }, []);

  return (
    <div className='excel-picker'>
      <Upload
        directory
        beforeUpload={handleBeforeUpload}
        fileList={selectFiles}
        onRemove={handleRemove}
        style={{ border: '1px dashed #000' }}
      >
        <Button type='primary'><FileAddTwoTone /> 选择 excel 所在目录</Button>
        <div className='upload-helper'>
          <p>{props.hintText ?? ''}</p>
          <p>{selectFiles.length > 0 && `已选择 ${selectFiles.length} 个文件`}</p>
        </div>
      </Upload>
      {selectFiles.length > 0 && (
        <Button onClick={onEmpty}>清空所选</Button>
      )}
    </div>
  );
};