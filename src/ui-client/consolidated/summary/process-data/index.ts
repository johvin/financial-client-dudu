import processItemsMap from './items';
import { readExcel, sheetsToExcel } from '../../../utils/excelWeb';
import { WorkBook } from 'xlsx';
import { ProcessTask } from '../steps';
import { LogItemInfo, Logger } from '../../../log';


interface DataList {
  name: string;
  list: string[][];
}

/** 处理状态 */
export const enum ProcessStatus {
  Init = 0,
  Doing = 1,
  Done = 2,
  Error = 3,
}

export interface ProgressInfo {
  status: ProcessStatus;
  /** 所有的步骤 */
  tasks: {
    name: string;
    /** 100 代表 100% */
    percent: number;
  }[];
  /** 当前步骤 */
  curTask: ProcessTask;
}

interface Progresser {
  (progressInfo: ProgressInfo): Promise<void>;
}

const logger = new Logger();

// 处理
export async function process(files: File[], progresser?: Progresser): Promise<[WorkBook, LogItemInfo[]]> {
  const progressInfo: ProgressInfo = {
    status: ProcessStatus.Init,
    tasks: [ProcessTask.Read, ProcessTask.Clean, ProcessTask.Process, ProcessTask.Write].map(name => ({
      name,
      percent: 0,
    })),
    curTask: ProcessTask.Read,
  };

  const updateProgress = async (status: ProcessStatus, curTask: ProcessTask, percent: number) => {
    progressInfo.status = status;
    const tasks = [...progressInfo.tasks];
    const task = tasks.find(t => t.name === curTask);
    if (task) {
      task.percent = percent;
    }
    progressInfo.tasks = tasks;
    progressInfo.curTask = curTask;

    if (progresser) {
      await progresser(progressInfo);
    }
  };

  await updateProgress(ProcessStatus.Init, ProcessTask.Read, 0);

  const inputFiles = files.filter(f => /^\d+_/.test(f.name)).sort((a, b) => {
    if (a.name < b.name) return -1;
    if (a.name > b.name) return 1;
    return 0;
  });

  if (inputFiles.length === 0) {
    logger.error('未找到要处理文件，请检查文件名');

    await updateProgress(ProcessStatus.Error, ProcessTask.Read, 0);

    return [undefined, logger.dumpLogs()];
  }

  const propertyList: DataList[] = [];
  const debtEquityList: DataList[] = [];
  const profitList: DataList[] = [];
  const cashFlowList: DataList[] = [];

  

  await updateProgress(ProcessStatus.Doing, ProcessTask.Read, 0);

  let n = 0;
  // 读取数据
  for await (const file of inputFiles) {
    const company = file.name.split(/_|\s/).slice(0, 2).map(t => t.trim()).join('_');
    const [balanceSheet, profitSheet, cashFlowSheet] = await readExcel<string[]>(file);

    // 前 4 行无用
    balanceSheet.splice(0, 4);
    propertyList.push({
      name: company,
      // 资产负债表数据一拆二
      list: balanceSheet.map(it => it.slice(0, 3)),
    });
    debtEquityList.push({
      name: company,
      // 资产负债表数据一拆二
      list: balanceSheet.map(it => it.slice(3, 6)),
    });
    profitSheet.splice(0, 4);
    profitList.push({
      name: company,
      list: profitSheet,
    });
    cashFlowSheet.splice(0, 4);
    cashFlowList.push({
      name: company,
      list: cashFlowSheet,
    });

    await updateProgress(ProcessStatus.Doing, ProcessTask.Read, Math.ceil((++n) / inputFiles.length * 100));
  }

  // start clean
  await updateProgress(ProcessStatus.Doing, ProcessTask.Clean, 0);
  cleanData(propertyList);
  cleanData(debtEquityList);
  await updateProgress(ProcessStatus.Doing, ProcessTask.Clean, 50);
  cleanData(profitList);
  cleanData(cashFlowList);
  await updateProgress(ProcessStatus.Doing, ProcessTask.Clean, 100);

  // start calc
  await updateProgress(ProcessStatus.Doing, ProcessTask.Process, 0);
  const propertySummary = summaryList(processItemsMap.property, propertyList);
  await updateProgress(ProcessStatus.Doing, ProcessTask.Process, 25);
  const debtEquitySummary = summaryList(processItemsMap.debtEquity, debtEquityList);
  await updateProgress(ProcessStatus.Doing, ProcessTask.Process, 50);
  const profitSummary = summaryList(processItemsMap.profit, profitList);
  await updateProgress(ProcessStatus.Doing, ProcessTask.Process, 75);
  const cashFlowSummary = summaryList(processItemsMap.cashFlow, cashFlowList);
  await updateProgress(ProcessStatus.Doing, ProcessTask.Process, 100);

  await updateProgress(ProcessStatus.Doing, ProcessTask.Write, 0);
  const wb = genSummaryWB([
    propertySummary[0],
    propertySummary[1].concat(debtEquitySummary[1]),
    propertySummary[2].concat(debtEquitySummary[2]),
  ], profitSummary, cashFlowSummary);
  await updateProgress(ProcessStatus.Doing, ProcessTask.Write, 100);

  await updateProgress(ProcessStatus.Done, ProcessTask.Write, 100);
  return [wb, logger.dumpLogs()];
}

function cleanData(sheet: DataList[]) {
  for (const c of sheet) {
    c.list.forEach(it => {
      it[0] = (it[0] ?? '').trim();
    });
    // 项目不存在的过滤掉
    c.list = c.list.filter(it => it[0].length > 0);
  }
}

function summaryList(items: string[], companyList: DataList[]): [string[], string[][], string[][]] {
  const sheetHeaders = ['项目名称'];
  const data1 = [];
  const data2 = [];

  companyList.forEach(c => {
    sheetHeaders.push(c.name);
  });

  // 项目名称匹配不到的公司列表
  const misMatchList = new Map();

  for (const item of items) {
    const row1 = [item];
    const row2 = [item];

    const matchItemName = item.trimStart();
    if (matchItemName.length === 0) {
      continue;
    }

    for (const c of companyList) {
      const info = c.list.find(it => it[0] === matchItemName);

      if (!info) {
        if (misMatchList.has(matchItemName)) {
          misMatchList.get(matchItemName).push(c.name);
        } else {
          misMatchList.set(matchItemName, [ c.name ]);
        }
      }

      row1.push(info?.[1]);
      row2.push(info?.[2]);
    }
    data1.push(row1);
    data2.push(row2);
  }

  for(const [mName, list] of misMatchList) {
    logger.warn(`匹配不到 [${mName}] 的公司列表：`);
    for(const l of list) {
      logger.warn(`  ${l}`);
    }
  }

  return [sheetHeaders, data1, data2];
}

// 生成合并报表
function genSummaryWB(...summarys: [string[], string[][], string[][]][]) {
  const sheetNames = [
    '资产负债表-期末', '资产负债表-年初',
    '利润表-当期', '利润表-累计',
    '现金流量表-当期', '现金流量表-累计',
  ];

  const sheetsData: string[][][] = [];

  summarys.forEach(s => {
    const [header, list1, list2] = s;
    const data1 = [header].concat(list1);
    const data2 = [header].concat(list2);

    sheetsData.push(data1);
    sheetsData.push(data2);
  });

  return sheetsToExcel(sheetsData, sheetNames);
}
