import {
  createComment,
  deleteComment,
  getComment,
  listComments,
  updateComment
} from '../services/comment.service.js';

export async function listCommentsController(request, reply) {
  const { recipeId } = request.validated.params;
  return reply.send(await listComments(recipeId, request.validated.query));
}

export async function createCommentController(request, reply) {
  const { recipeId } = request.validated.params;
  const comment = await createComment(request.user.id, recipeId, request.validated.body);
  return reply.code(201).send(comment);
}

export async function getCommentController(request, reply) {
  return reply.send(await getComment(request.validated.params.id));
}

export async function updateCommentController(request, reply) {
  const { id } = request.validated.params;
  return reply.send(await updateComment(id, request.user.id, request.validated.body));
}

export async function deleteCommentController(request, reply) {
  const { id } = request.validated.params;
  await deleteComment(id, request.user.id);
  return reply.code(204).send();
}
