type ConnectionOptions = {
  id: string;
  onStale: () => void;
};

export default class Connection {
  constructor(private options: ConnectionOptions) {}

  public async execute(q: string) {
    return `{ "data": { "userId": 1 } }`;
  }

  public get id() {
    return this.options.id;
  }
}
