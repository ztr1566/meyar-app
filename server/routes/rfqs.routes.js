import { validate } from '../validation.js';
import { idParamsSchema, listQuerySchema } from '../schemas/common.js';
import { rfqCreateSchema, rfqUpdateSchema } from '../schemas/rfq.js';
import {
  createRfqController,
  deleteRfqController,
  getRfqController,
  listRfqsController,
  updateRfqController
} from '../controllers/rfq.controller.js';

export async function rfqRoutes(app, { authenticate }) {
  app.get('/', {
    preHandler: validate({ query: listQuerySchema })
  }, listRfqsController);
  app.get('/:id', {
    preHandler: validate({ params: idParamsSchema })
  }, getRfqController);
  app.post('/', {
    preHandler: [validate({ body: rfqCreateSchema }), authenticate]
  }, createRfqController);
  app.patch('/:id', {
    preHandler: [validate({ params: idParamsSchema, body: rfqUpdateSchema }), authenticate]
  }, updateRfqController);
  app.delete('/:id', {
    preHandler: [validate({ params: idParamsSchema }), authenticate]
  }, deleteRfqController);
}
