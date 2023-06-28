import { FastifyPluginAsyncJsonSchemaToTs } from '@fastify/type-provider-json-schema-to-ts';
import { idParamSchema } from '../../utils/reusedSchemas';
import { changeMemberTypeBodySchema } from './schema';
import type { MemberTypeEntity } from '../../utils/DB/entities/DBMemberTypes';
import { FromSchema } from 'json-schema-to-ts';
type IdParamSchema = FromSchema<typeof idParamSchema>;
type ChangeMemberTypeBodySchema = FromSchema<typeof changeMemberTypeBodySchema>;

const plugin: FastifyPluginAsyncJsonSchemaToTs = async (
  fastify
): Promise<void> => {
  fastify.get('/', async function (request, reply): Promise<
    MemberTypeEntity[]
  > {
    return await fastify.db.memberTypes.findMany();
  });

  fastify.get<{ Params: IdParamSchema; }>(
    '/:id',
    {
      schema: {
        params: idParamSchema,
      },
    },
    async function (request, reply): Promise<MemberTypeEntity> {
      const memberType = await fastify.db.memberTypes.findOne({
        key: "id",
        equals: request.params.id,
      });

      if (!memberType) {
        throw reply.notFound("Profile not found!");
      }

      return memberType;
    }
  );

  fastify.patch<{ Params: IdParamSchema; Body: ChangeMemberTypeBodySchema }>(
    '/:id',
    {
      schema: {
        body: changeMemberTypeBodySchema,
        params: idParamSchema,
      },
    },
    async function (request, reply): Promise<MemberTypeEntity> {
      try {
        const memberType = await fastify.db.memberTypes.change(
          request.params.id,
          request.body
        );

        return memberType;
      } catch {
        throw reply.badRequest("Wrong member type id!");
      }

    }
  );
};

export default plugin;
