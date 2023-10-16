import { Logger } from '../log';

/** 处理状态 */
export const enum ProcessStatus {
  Init = 0,
  Doing = 1,
  Done = 2,
  Error = 3,
}

export interface TaskProgress<Task extends string> {
  name: Task;
  /** 100 代表 100% */
  percent: number;
}

/** 处理进度信息 */
export interface ProgressInfo<Task extends string> {
  status: ProcessStatus;
  /** 所有的步骤 */
  tasks: TaskProgress<Task>[];
  /** 当前步骤 */
  curTask?: Task;
}

export interface Progressor<T extends string> {
  (progressInfo: ProgressInfo<T>): Promise<void>;
}

/**
 * 定义 work processor 的接口，需要被继承才能使用
 * @link 语法 https://www.cnblogs.com/baoshu/p/13620315.html#head17
 */
export abstract class WorkProcessor<T extends string = string> {
  protected readonly name;
  protected logger: Logger;
  protected progressInfo: ProgressInfo<T>;
  protected progressSyncer: Progressor<T>;

  constructor(name: string) {
    this.name = name;
  }

  public setLogger(logger: Logger) {
    this.logger = logger;
  }

  public setProgressSyncer(syncer: Progressor<T>) {
    this.progressSyncer = syncer;
  }

  public resetTasks(tasks: T[]) {
    this.progressInfo = {
      status: ProcessStatus.Init,
      tasks: tasks.map(t => ({
        name: t,
        percent: 0,
      })),
      curTask: undefined,
    };
  }

  protected updateProgress(status: ProcessStatus, curTask: T, percent: number) {
    const pi = this.progressInfo;
    pi.status = status;
    const tasks = [...pi.tasks];
    const task = tasks.find(t => t.name === curTask);
    if (task) {
      task.percent = percent;
    }
    pi.tasks = tasks;
    pi.curTask = curTask;
  }

  protected async syncProgress() {
    if (this.progressSyncer && this.progressInfo) {
      await this.progressSyncer(this.progressInfo);
    }
  }

  public abstract process(...args: any[]): Promise<any>;
}
