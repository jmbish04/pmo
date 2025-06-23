
export class Orchestrate {
  constructor(env) {
    this.env = env;
  }
  async handleRequest(request, ctx) {
    return new Response('Orchestration active', { status: 200 });
  }
}
