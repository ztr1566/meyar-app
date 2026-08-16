import { getHealth } from '../services/health.service.js';

export function healthController(_request, reply) {
  return reply.send(getHealth());
}
