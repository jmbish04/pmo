
import { Orchestrate } from './orchestrator';
import { OrchestrateQueue } from './queue';
import { OrchestrateCron } from './cron';
import { OrchestrateDO } from './durable';

export default {
  async fetch(request, env, ctx) {
    const orchestrate = new Orchestrate(env);
    return orchestrate.handleRequest(request, ctx);
  },
  async queue(batch, env, ctx) {
    const q = new OrchestrateQueue(env);
    return q.process(batch);
  },
  async scheduled(event, env, ctx) {
    const c = new OrchestrateCron(env);
    return c.run(event);
  },
  async durableObjectStorage(durableObject) {
    const doHandler = new OrchestrateDO(durableObject);
    return doHandler.handle();
  }
}
