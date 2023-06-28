import { FastifyPluginAsyncJsonSchemaToTs } from '@fastify/type-provider-json-schema-to-ts';
import { idParamSchema } from '../../utils/reusedSchemas';
import { createProfileBodySchema, changeProfileBodySchema } from './schema';
import type { ProfileEntity } from '../../utils/DB/entities/DBProfiles';
import { FromSchema } from 'json-schema-to-ts';
type IdParamSchema = FromSchema<typeof idParamSchema>;
type ChangeProfileBodySchema = FromSchema<typeof changeProfileBodySchema>;
type CreateProfileBodySchema = FromSchema<typeof createProfileBodySchema>;

const plugin: FastifyPluginAsyncJsonSchemaToTs = async (
  fastify
): Promise<void> => {
  fastify.get('/', async function (request, reply): Promise<
    ProfileEntity[]
  > {
    return fastify.db.profiles.findMany();
  });

  fastify.get<{ Params: IdParamSchema;}>(
    '/:id',
    {
      schema: {
        params: idParamSchema,
      },
    },
    async function (request, reply): Promise<ProfileEntity> {
      const profile = await fastify.db.profiles.findOne({ key: 'id', equals: request.params.id });
      if (!profile) {
        throw fastify.httpErrors.notFound('Profile not found');
      }
      return profile;
    }
  );

  fastify.post<{ Body: CreateProfileBodySchema}>(
    '/',
    {
      schema: {
        body: createProfileBodySchema,
      },
    },
    async function (request, reply): Promise<ProfileEntity> {
      if (await fastify.db.profiles.findOne({ key: 'userId', equals: request.body.userId })) {
        throw fastify.httpErrors.badRequest('User Profile already exists');
      }
      if (!(await fastify.db.memberTypes.findOne({ key: 'id', equals: request.body.memberTypeId }))) {
        throw fastify.httpErrors.badRequest('Member Type does not exists');
      }
      return fastify.db.profiles.create(request.body);
    }
  );

  fastify.delete<{ Params: IdParamSchema;}>(
    '/:id',
    {
      schema: {
        params: idParamSchema,
      },
    },
    async function (request, reply): Promise<ProfileEntity> {
      try {
        return await fastify.db.profiles.delete(request.params.id);
      } catch (error) {
        throw fastify.httpErrors.badRequest(error as string);
      }
    }
  );

  fastify.patch<{ Body: ChangeProfileBodySchema; Params: IdParamSchema;}>(
    '/:id',
    {
      schema: {
        body: changeProfileBodySchema,
        params: idParamSchema,
      },
    },
    async function (request, reply): Promise<ProfileEntity> {
      try {
        return await fastify.db.profiles.change(request.params.id, request.body);
      } catch (error) {
        throw fastify.httpErrors.badRequest(error as string);
      }
    }
  );
};

export default plugin;
