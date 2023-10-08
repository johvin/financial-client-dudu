export interface LogItemInfo {
  type: 'error' | 'warning' | 'info' | 'log';
  msg: string;
}

export class Logger {
  private logs: LogItemInfo[] = [];

  private writeLog(type: LogItemInfo['type'], msg: string) {
    this.logs.push({
      type,
      msg,
    });
  }

  dumpLogs() {
    const logs = this.logs.slice();
    this.logs.length = 0;

    return logs;
  }
  
  info(msg: string) {
    this.writeLog('info', msg);
  }

    
  error(msg: string) {
    this.writeLog('error', msg);
  }

    
  warn(msg: string) {
    this.writeLog('warning', msg);
  }

    
  log(msg: string) {
    this.writeLog('log', msg);
  }
}