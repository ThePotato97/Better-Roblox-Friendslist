export default class OpenPorts {
    private index: number = 0;
    private ports: Record<number, any> = {};
  
    constructor() {}
  
    public getPorts(): Record<number, any> {
      let result: Record<number, any> = {};
      for (let id in this.ports) {
        result[id] = this.ports[id];
      }
      return result;
    }
  
    public getPortsArray(): any[] {
      let result: any[] = [];
      for (let id in this.ports) {
        result.push(this.ports[id]);
      }
      return result;
    }
  
    public get(id: number): any {
      return this.ports[id];
    }
  
    public add(port: any): number {
      let id = this.index;
  
      this.ports[id] = port;
      port.onDisconnect.addListener(() => {
        this.remove(id);
      });
  
      this.index++;
      return id;
    }
  
    public remove(id: number): void {
      delete this.ports[id];
    }
  
    public messageAll(message: any): void {
      for (let id in this.ports) {
        this.ports[id].postMessage(message);
      }
    }
  }