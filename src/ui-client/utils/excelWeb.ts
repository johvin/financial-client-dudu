import { read, utils } from 'xlsx';

export function readExcel<SheetRow = unknown>(file: File){
  return new Promise<SheetRow[][]>(res => {
    const reader = new FileReader();
  
    reader.onload = function(e){
      const data = e.target.result;
      const wb = read(data, { type: 'binary' });
      // With the header: 1 option, the function exports an array of arrays of values.
      const sheetsData = wb.SheetNames.map(name => utils.sheet_to_json<SheetRow>(wb.Sheets[name], { header: 1 }));
      res(sheetsData);
    };

    reader.readAsArrayBuffer(file);
  });
}

export function sheetsToExcel(aoas: any[][][], sheetNames: string[]) {
  const wb = utils.book_new();
  
  aoas.forEach((aoa, idx) => {
    const ws = utils.aoa_to_sheet(aoa);
    utils.book_append_sheet(wb, ws, sheetNames[idx]);
  });

  return wb;
}