
export class OrchestrateDO {
  constructor(state) {
    this.state = state;
  }
  async handle() {
    const data = await this.state.storage.get("flow");
    return new Response(JSON.stringify(data || {}), { status: 200 });
  }
}
