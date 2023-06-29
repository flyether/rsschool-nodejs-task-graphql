import { graphql } from "graphql";
import { FastifyPluginAsyncJsonSchemaToTs } from '@fastify/type-provider-json-schema-to-ts';
import { graphqlBodySchema } from './schema';
import { graphqlSchema } from "./schema-res";

const plugin: FastifyPluginAsyncJsonSchemaToTs = async (
  fastify
): Promise<void> => {
  fastify.post(
    '/',
    {
      schema: {
        body: graphqlBodySchema,
      },
    },
    async function (request, reply) {
      const { query, variables } = request.body;

      if (query) {
        const result = await graphql({
          schema: graphqlSchema,
          source: query,
          variableValues: variables,
          contextValue: fastify,
        });

        return reply.send(result);
      }
    }
  );
};

export default plugin;
