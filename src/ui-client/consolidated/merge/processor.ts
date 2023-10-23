import { ProcessStatus, WorkProcessor } from '../../process-indicator';
import { readExcel, sheetsToExcel } from '../../utils/excelWeb';
import { ProcessTask } from './steps';
import { LogItemInfo, Logger } from '../../log';
import { WorkBook } from 'xlsx';

type DataRow = string[];

interface SheetDataList {
  name: string;
  list: DataRow[];
}

// 内部数据结构
interface ProcessDataItem {
  base: string;
  other: string;
  curMoneyJie: number;
  curMoneyDai: number;
  endMoneyJie: number;
  endMoneyDai: number;
}

interface ResultDataItem extends ProcessDataItem {
  diff: number;
}

const processorName = 'consolidated:merge';
const mergeTasks = [
  ProcessTask.Read,
  ProcessTask.Clean,
  ProcessTask.Process,
  ProcessTask.Write,
];


export interface ProcessResult {
  wb?: WorkBook;
  logs: LogItemInfo[];
}

/** 获取 Z 以内列的索引 */
const getColumnIndex = (col: string) => col.codePointAt(0) - 'A'.codePointAt(0);

// 应收账款 header map
const receivableHM = {
  base: getColumnIndex('A'),
  other: getColumnIndex('E'),
  curMoneyJie: getColumnIndex('H'),
  curMoneyDai: getColumnIndex('I'),
  endMoneyJie: getColumnIndex('L'),
  endMoneyDai: getColumnIndex('M'),
};

// 应付账款 header map
const payableHM = {
  base: getColumnIndex('A'),
  other: getColumnIndex('E'),
  curMoneyJie: getColumnIndex('H'),
  curMoneyDai: getColumnIndex('I'),
  endMoneyJie: getColumnIndex('L'),
  endMoneyDai: getColumnIndex('M'),
};

export class MergeProcessor extends WorkProcessor<ProcessTask> {
  constructor() {
    super(processorName);
    this.setLogger(new Logger());
    this.reset();
  }

  reset() {
    this.resetTasks(mergeTasks);
  }

  private async cleanAndMergeData(receivableList: ProcessDataItem[], payableList: ProcessDataItem[]) {
    await this.progressUpdateAndSync(ProcessStatus.Doing, ProcessTask.Clean, 0);
    // 名字清洗
    for (const it of receivableList.concat(payableList)) {
      if (/\(\d+\)$/.test(it.base)) {
        const idx = it.base.lastIndexOf('(');
        it.base = it.base.slice(0, idx);
      }
  
      if (/\(\d+\)$/.test(it.other)) {
        const idx = it.other.lastIndexOf('(');
        it.other = it.other.slice(0, idx);
      }
    }
  
    // 无效数据剔除
    const receivableMap = new Map();
    const payableMap = new Map();
  
    for (const it of payableList) {
      // 无效数据
      payableMap.set(it.base, true);
    }
    
    for (const it of receivableList) {
      receivableMap.set(it.base, true);
    }
  
    receivableList = receivableList.filter(it => it.base && it.other && payableMap.has(it.other));
    payableList = payableList.filter(it => it.base && it.other && receivableMap.has(it.other));

    await this.progressUpdateAndSync(ProcessStatus.Doing, ProcessTask.Clean, 50);
  
    // 合并相同公司数据
    const merge = (list: ProcessDataItem[]) => list.reduce((a, b) => {
      const it = a.filter(t => t.base === b.base && t.other === b.other)[0];
  
      if (it) {
        it.curMoneyJie += b.curMoneyJie;
        it.curMoneyDai += b.curMoneyDai;
        it.endMoneyJie += b.endMoneyJie;
        it.endMoneyDai += b.endMoneyDai;
      } else {
        a.push(b);
      }
      return a;
    }, []);

    const r = [merge(receivableList), merge(payableList)];
    await this.progressUpdateAndSync(ProcessStatus.Doing, ProcessTask.Clean, 100);
  
    return r;
  }
  
  private async progressUpdateAndSync(status: ProcessStatus, curTask: ProcessTask, percent: number) {
    this.updateProgress(status, curTask, percent);
    await this.syncProgress();
  }

  private async readData(receivables: File[], payables: File[]) {
    const receivableList: ProcessDataItem[] = [];
    const payableList: ProcessDataItem[] = [];

    await this.progressUpdateAndSync(ProcessStatus.Doing, ProcessTask.Read, 0);

    for await (const file of receivables) {
      const [ data ] = await readExcel<DataRow>(file);
      // 前 2 行无用
      data.splice(0, 2);
      data.forEach(it => {
        receivableList.push({
          base: (it[receivableHM.base] ?? '').trim(),
          other: (it[receivableHM.other] ?? '').trim(),
          curMoneyJie: Number(it[receivableHM.curMoneyJie] ?? 0),
          curMoneyDai: Number(it[receivableHM.curMoneyDai] ?? 0),
          endMoneyJie: Number(it[receivableHM.endMoneyJie] ?? 0),
          endMoneyDai: Number(it[receivableHM.endMoneyDai] ?? 0),
        });
      });
    }

    await this.progressUpdateAndSync(ProcessStatus.Doing, ProcessTask.Read, 50);

    for await (const file of payables) {
      const [ data ] = await readExcel<DataRow>(file);
      // 前 2 行无用
      data.splice(0, 2);
      data.forEach(it => {
        payableList.push({
          base: (it[payableHM.base] ?? '').trim(),
          other: (it[payableHM.other] ?? '').trim(),
          curMoneyJie: Number(it[payableHM.curMoneyJie] ?? 0),
          curMoneyDai: Number(it[payableHM.curMoneyDai] ?? 0),
          endMoneyJie: Number(it[payableHM.endMoneyJie] ?? 0),
          endMoneyDai: Number(it[payableHM.endMoneyDai] ?? 0),
        });
      });
    }

    await this.progressUpdateAndSync(ProcessStatus.Doing, ProcessTask.Read, 100);

    return [receivableList, payableList];
  }

  public async process(files: File[]): Promise<ProcessResult> {
    await this.progressUpdateAndSync(ProcessStatus.Init, ProcessTask.Read, 0);

    const receivables = files.filter(f => /其他应收/.test(f.name));
    const payables = files.filter(f => /其他应付/.test(f.name));
  
    if (receivables.length === 0 || payables.length === 0) {
      this.logger.error('无其他应收、付文件，请检查文件');
      await this.progressUpdateAndSync(ProcessStatus.Error, ProcessTask.Read, 0);

      return {
        logs: this.logger.dumpLogs(),
      };
    }

    let [receivableList, payableList] = await this.readData(receivables, payables);
    // start clean
    [receivableList, payableList] = await this.cleanAndMergeData(receivableList, payableList);

    const result: ResultDataItem[] = [];

    await this.progressUpdateAndSync(ProcessStatus.Doing, ProcessTask.Process, 0);

    // start calc
    for (const rit of receivableList) {
      const pit = payableList.filter(it => it.base === rit.other && it.other === rit.base)[0];
      const curMoneyJie = rit.curMoneyJie - rit.curMoneyDai;
      const curMoneyDai = pit ? pit.curMoneyDai - pit.curMoneyJie : 0;
      const endMoneyJie = rit.endMoneyJie - rit.endMoneyDai;
      const endMoneyDai = pit ? pit.endMoneyDai - pit.endMoneyJie: 0;
      result.push({
        base: rit.base,
        other: rit.other,
        curMoneyJie,
        curMoneyDai,
        endMoneyJie,
        endMoneyDai,
        diff: endMoneyJie - endMoneyDai,
      });
    }
    result.sort((a, b) => {
      if (a.base < b.base) {
        return -1;
      }

      if (a.base > b.base) {
        return 1;
      }

      if (a.other < b.other) {
        return -1;
      }

      if (a.other > b.other) {
        return 1;
      }

      return 0;
    });
    await this.progressUpdateAndSync(ProcessStatus.Doing, ProcessTask.Process, 100);

    // gen wb
    await this.progressUpdateAndSync(ProcessStatus.Doing, ProcessTask.Write, 0);
    const wb = genMergeWB(result);
    await this.progressUpdateAndSync(ProcessStatus.Doing, ProcessTask.Write, 100);

    await this.progressUpdateAndSync(ProcessStatus.Done, ProcessTask.Write, 100);

    return {
      wb,
      logs: this.logger.dumpLogs(),
    };
  }
}

// 生成合并报表
function genMergeWB(reportData: ResultDataItem[]) {
  const data = [];
  const tHeader = ['base', 'other', '本期发生(借)', '本期发生(贷)', '期末余额(借)', '期末余额(贷)', '期末差额'];

  data.push(tHeader);
  reportData.forEach(it => {
    if (it.base === '01') {
      // 不统计 01
      return;
    }
    data.push(
      [it.base, it.other, it.curMoneyJie, it.curMoneyDai, it.endMoneyJie, it.endMoneyDai, it.diff]
    );
  });

  return sheetsToExcel([ data ], ['Sheet']);
}
