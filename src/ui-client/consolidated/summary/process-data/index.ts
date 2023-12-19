import { ProcessStatus, WorkProcessor } from '../../../process-indicator';
import processItemsMap from './items';
import { readExcel, sheetsToExcel } from '../../../utils/excelWeb';
import { ProcessTask } from '../steps';
import { LogItemInfo, Logger } from '../../../log';
import { WorkBook } from 'xlsx';

interface DataList {
  name: string;
  list: string[][];
}

const processorName = 'consolidated:summary';
const summaryTasks = [
  ProcessTask.Read,
  ProcessTask.Clean,
  ProcessTask.Process,
  ProcessTask.Write,
];


export interface ProcessResult {
  wb?: WorkBook;
  logs: LogItemInfo[];
}

export class SummaryProcessor extends WorkProcessor<ProcessTask> {
  constructor() {
    super(processorName);
    this.setLogger(new Logger());
    this.reset();
  }

  reset() {
    this.resetTasks(summaryTasks);
  }

  private summaryList(
    items: string[],
    companyList: DataList[]
  ): [string[], string[][], string[][]] {
    const sheetHeaders = ['项目名称'];
    const data1 = [];
    const data2 = [];
  
    companyList.forEach((c) => {
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
        const info = c.list.find((it) => it[0] === matchItemName);
  
        if (!info) {
          if (misMatchList.has(matchItemName)) {
            misMatchList.get(matchItemName).push(c.name);
          } else {
            misMatchList.set(matchItemName, [c.name]);
          }
        }
  
        row1.push(info?.[1]);
        row2.push(info?.[2]);
      }
      data1.push(row1);
      data2.push(row2);
    }
  
    for (const [mName, list] of misMatchList) {
      this.logger.warn(`匹配不到 [${mName}] 的公司列表：`);
      for (const l of list) {
        this.logger.warn(`  ${l}`);
      }
    }
  
    return [sheetHeaders, data1, data2];
  }
  
  private async progressUpdateAndSync(status: ProcessStatus, curTask: ProcessTask, percent: number) {
    this.updateProgress(status, curTask, percent);
    await this.syncProgress();
  }

  public async process(files: File[]): Promise<ProcessResult> {
    await this.progressUpdateAndSync(ProcessStatus.Init, ProcessTask.Read, 0);

    const inputFiles = files
      .filter((f) => /^\d+_/.test(f.name))
      .sort((a, b) => {
        if (a.name < b.name) return -1;
        if (a.name > b.name) return 1;
        return 0;
      });

    if (inputFiles.length === 0) {
      this.logger.error('未找到要处理文件，请检查文件名');
      await this.progressUpdateAndSync(ProcessStatus.Error, ProcessTask.Read, 0);

      return {
        logs: this.logger.dumpLogs(),
      };
    }

    const propertyList: DataList[] = [];
    const debtEquityList: DataList[] = [];
    const profitList: DataList[] = [];
    const cashFlowList: DataList[] = [];

    await this.progressUpdateAndSync(ProcessStatus.Doing, ProcessTask.Read, 0);

    let n = 0;
    // 读取数据
    for await (const file of inputFiles) {
      try {
        const company = file.name
          .split(/_|\s/)
          .slice(0, 2)
          .map((t) => t.trim())
          .join('_');
        const sheets = await readExcel<
          string[]
        >(file);

        if (sheets.length < 3) {
          throw new Error('表 sheet 数不足 3个');
        }

        const [balanceSheet, profitSheet, cashFlowSheet] = sheets;

        // 前 4 行无用
        balanceSheet.splice(0, 4);
        propertyList.push({
          name: company,
          // 资产负债表数据一拆二
          list: balanceSheet.map((it) => it.slice(0, 3)),
        });
        debtEquityList.push({
          name: company,
          // 资产负债表数据一拆二
          list: balanceSheet.map((it) => it.slice(3, 6)),
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
      } catch (e) {
        this.logger.error(`处理文件“${file.name}”时报错`);
        this.logger.log(`错误内容：${JSON.stringify(e.stack)}`);
      }

      await this.progressUpdateAndSync(
        ProcessStatus.Doing,
        ProcessTask.Read,
        Math.ceil((++n / inputFiles.length) * 100)
      );
    }

    // start clean
    await this.progressUpdateAndSync(ProcessStatus.Doing, ProcessTask.Clean, 0);
    cleanData(propertyList);
    cleanData(debtEquityList);
    await this.progressUpdateAndSync(ProcessStatus.Doing, ProcessTask.Clean, 50);
    cleanData(profitList);
    cleanData(cashFlowList);
    await this.progressUpdateAndSync(ProcessStatus.Doing, ProcessTask.Clean, 100);

    // start calc
    await this.progressUpdateAndSync(ProcessStatus.Doing, ProcessTask.Process, 0);
    const propertySummary = this.summaryList(processItemsMap.property, propertyList);
    await this.progressUpdateAndSync(ProcessStatus.Doing, ProcessTask.Process, 25);
    const debtEquitySummary = this.summaryList(
      processItemsMap.debtEquity,
      debtEquityList
    );
    await this.progressUpdateAndSync(ProcessStatus.Doing, ProcessTask.Process, 50);
    const profitSummary = this.summaryList(processItemsMap.profit, profitList);
    await this.progressUpdateAndSync(ProcessStatus.Doing, ProcessTask.Process, 75);
    const cashFlowSummary = this.summaryList(processItemsMap.cashFlow, cashFlowList);
    await this.progressUpdateAndSync(ProcessStatus.Doing, ProcessTask.Process, 100);

    await this.progressUpdateAndSync(ProcessStatus.Doing, ProcessTask.Write, 0);
    const wb = genSummaryWB(
      [
        propertySummary[0],
        propertySummary[1].concat(debtEquitySummary[1]),
        propertySummary[2].concat(debtEquitySummary[2]),
      ],
      profitSummary,
      cashFlowSummary
    );
    await this.progressUpdateAndSync(ProcessStatus.Doing, ProcessTask.Write, 100);

    await this.progressUpdateAndSync(ProcessStatus.Done, ProcessTask.Write, 100);

    return {
      wb,
      logs: this.logger.dumpLogs(),
    };
  }
}

function cleanData(sheet: DataList[]) {
  for (const c of sheet) {
    c.list.forEach((it) => {
      it[0] = String(it[0] ?? '').trim();
    });
    // 项目不存在的过滤掉
    c.list = c.list.filter((it) => it[0].length > 0);
  }
}

// 生成合并报表
function genSummaryWB(...summarys: [string[], string[][], string[][]][]) {
  const sheetNames = [
    '资产负债表-期末',
    '资产负债表-年初',
    '利润表-当期',
    '利润表-累计',
    '现金流量表-当期',
    '现金流量表-累计',
  ];

  const sheetsData: string[][][] = [];

  summarys.forEach((s) => {
    const [header, list1, list2] = s;
    const data1 = [header].concat(list1);
    const data2 = [header].concat(list2);

    sheetsData.push(data1);
    sheetsData.push(data2);
  });

  return sheetsToExcel(sheetsData, sheetNames);
}