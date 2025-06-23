
export class OrchestrateCron {
  constructor(env) {
    this.env = env;
  }
  async run(event) {
    console.log("Running scheduled sync at", event.scheduledTime);
  }
}
