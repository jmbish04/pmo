
export class OrchestrateQueue {
  constructor(env) {
    this.env = env;
  }
  async process(batch) {
    for (const message of batch.messages) {
      console.log("Processing task:", message.body);
    }
  }
}
