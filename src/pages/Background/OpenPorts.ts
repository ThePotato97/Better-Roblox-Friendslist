export default class OpenPorts {
  private index = 0;
  private ports: Record<number, any> = {};

  constructor() {}

  public getPorts(): Record<number, any> {
    const result: Record<number, any> = {};
    for (const id in this.ports) {
      result[id] = this.ports[id];
    }
    return result;
  }

  public getPortsArray(): any[] {
    const result: any[] = [];
    for (const id in this.ports) {
      result.push(this.ports[id]);
    }
    return result;
  }

  public get(id: number): any {
    return this.ports[id];
  }

  public add(port: any): number {
    const id = this.index;

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
    for (const id in this.ports) {
      this.ports[id].postMessage(message);
    }
  }
}

