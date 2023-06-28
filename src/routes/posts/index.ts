import { FastifyPluginAsyncJsonSchemaToTs } from '@fastify/type-provider-json-schema-to-ts';
import { idParamSchema } from '../../utils/reusedSchemas';
import { createPostBodySchema, changePostBodySchema } from './schema';
import type { PostEntity } from '../../utils/DB/entities/DBPosts';
import { FromSchema } from 'json-schema-to-ts';
type IdParamSchema = FromSchema<typeof idParamSchema>;
type ChangePostBodySchema = FromSchema<typeof changePostBodySchema>;
type CreatePostBodySchema = FromSchema<typeof createPostBodySchema>;

const plugin: FastifyPluginAsyncJsonSchemaToTs = async (
  fastify
): Promise<void> => {
  fastify.get('/', async function (request, reply): Promise<PostEntity[]> {
    return fastify.db.posts.findMany();
  });

  fastify.get<{ Params: IdParamSchema }>(
    '/:id',
    {
      schema: {
        params: idParamSchema,
      },
    },
    async function (request, reply): Promise<PostEntity> {
      const post = await fastify.db.posts.findOne({ key: 'id', equals: request.params.id });
      if (!post) {
        throw fastify.httpErrors.notFound('Post not found');
      }
      return post;
    }
  );

  fastify.post<{ Body: CreatePostBodySchema}>(
    '/',
    {
      schema: {
        body: createPostBodySchema,
      },
    },
    async function (request, reply): Promise<PostEntity> {
      const user = await fastify.db.users.findOne({ key: 'id', equals: request.body.userId });
      if (!user)
        throw fastify.httpErrors.badRequest('User not found');
      return fastify.db.posts.create(request.body)
    }
  );

  fastify.delete <{ Params: IdParamSchema }>(
    '/:id',
    {
      schema: {
        params: idParamSchema,
      },
    },
    async function (request, reply): Promise<PostEntity> {
      try {
        return await fastify.db.posts.delete(request.params.id);
      } catch (error) {
        throw fastify.httpErrors.badRequest(error as string);
      }  
    }
  );

  fastify.patch<{Params: IdParamSchema; Body: ChangePostBodySchema}> (
    '/:id',
    {
      schema: {
        body: changePostBodySchema,
        params: idParamSchema,
      },
    },
    async function (request, reply): Promise<PostEntity> {
      try {
        return await fastify.db.posts.change(request.params.id, request.body);
      } catch (error) {
        throw fastify.httpErrors.badRequest(error as string);
      }        
    }
  );
};

export default plugin;
