// src/utils/taskQueue.ts
export class TaskQueue {
  private running = 0;
  private q: Array<() => void> = [];
  constructor(private readonly limit = 4) {}
  add<T>(task: () => Promise<T>): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const run = async () => {
        this.running++;
        try { resolve(await task()); }
        catch (e) { reject(e); }
        finally {
          this.running--;
          const next = this.q.shift();
          if (next) next();
        }
      };
      if (this.running < this.limit) run();
      else this.q.push(run);
    });
  }
}



