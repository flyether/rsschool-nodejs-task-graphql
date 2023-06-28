import { FastifyPluginAsyncJsonSchemaToTs } from '@fastify/type-provider-json-schema-to-ts';
import { idParamSchema } from '../../utils/reusedSchemas';
import {
  createUserBodySchema,
  changeUserBodySchema,
  subscribeBodySchema,
} from './schemas';
import { FromSchema } from 'json-schema-to-ts';
import type { UserEntity } from '../../utils/DB/entities/DBUsers';
type IdParamSchema = FromSchema<typeof idParamSchema>;
type СreateUserBodySchema = FromSchema<typeof createUserBodySchema>;
type SubscribeBodySchema = FromSchema<typeof subscribeBodySchema>;
type ChangeUserBodySchema = FromSchema<typeof changeUserBodySchema>;

const plugin: FastifyPluginAsyncJsonSchemaToTs = async (
  fastify
): Promise<void> => {
  fastify.get('/', async function (request, reply): Promise<UserEntity[]> {
    return await fastify.db.users.findMany();
  });

  fastify.get<{ Params: IdParamSchema }>(
    '/:id',
    {
      schema: {
        params: idParamSchema,
      },
    },
    async function (request, reply): Promise<UserEntity> {
      const user = await fastify.db.users.findOne({
        key: "id",
        equals: request.params.id,
      });

      if (!user) {
        throw reply.notFound("User not found!");
      }

      return user;
    }

  );

  fastify.post<{ Params: IdParamSchema; Body: СreateUserBodySchema }>(
    "/",
    {
      schema: {
        body: createUserBodySchema,
      },
    },
    async function (request, reply): Promise<UserEntity> {
      const { firstName, lastName, email } = request.body
      if (!firstName || !lastName || !email) {
        throw reply.badRequest(
          "Operation cannot be performed because of some fields are incorrect."
        );
      }

      if (!/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(email)) {
        throw reply.badRequest("Invalid email address!");
      }

      return await fastify.db.users.create({
        firstName,
        lastName,
        email,
      });
    }
  );

  fastify.delete(
    "/:id",
    {
      schema: {
        params: idParamSchema,
      },
    },
    async function (request, reply): Promise<UserEntity> {
      try {
       

        const user = await fastify.db.users.delete(request.params.id);

        const profile = await fastify.db.profiles.findOne({
          key: "userId",
          equals: request.params.id,
        });

        if (profile) {
          await fastify.db.profiles.delete(profile.id);
        }

        const posts = await fastify.db.posts.findMany({
          key: "userId",
          equals: request.params.id,
        });

        if (posts) {
          for (const post of posts) {
            await fastify.db.posts.delete(post.id);
          }
        }

        const subscribers = await fastify.db.users.findMany({
          key: "subscribedToUserIds",
          inArray: user.id,
        });

        for (const subscriber of subscribers) {
          if (subscriber) {
            await fastify.db.users.change(subscriber.id, {
              subscribedToUserIds: subscriber.subscribedToUserIds.filter(
                (id) => id !== user.id
              ),
            });
          }
        }

        return user;
      } catch (error) {
        throw reply.badRequest("Wrong user id!");
      }
    }
  );

 
  fastify.post<{ Params: IdParamSchema; Body: SubscribeBodySchema}>(
    '/:id/subscribeTo',
    {
      schema: {
        body: subscribeBodySchema,
        params: idParamSchema,
      },
    },
    async function (request, reply): Promise<UserEntity> {

      const { id } = request.params 
      const { userId } = request.body ;
      const subscriber = await fastify.db.users.findOne({
        key: "id",
        equals: id,
      });

      if (subscriber) {
        const user = await fastify.db.users.findOne({
          key: "id",
          equals: userId,
        });

        if (user) {
          if (subscriber.subscribedToUserIds.includes(subscriber.id)) {
            return subscriber;
          } else {
            await fastify.db.users.change(user.id, {
              subscribedToUserIds: [...user.subscribedToUserIds, subscriber.id],
            });

            return fastify.db.users.change(subscriber.id, {
              subscribedToUserIds: [...subscriber.subscribedToUserIds, user.id],
            });
          }
        } else {
          throw reply.notFound("User not found!");
        }
      } else {
        throw reply.notFound("Subscriber not found!");
      }
    }
  );

  fastify.post<{ Params: IdParamSchema; Body: SubscribeBodySchema}>(
    "/:id/unsubscribeFrom",
    {
      schema: {
        body: subscribeBodySchema,
        params: idParamSchema,
      },
    },
    async function (request, reply): Promise<UserEntity> {
 

      const { userId } = request.body 

      const subscriber = await fastify.db.users.findOne({
        key: "id",
        equals: request.params.id,
      });

      if (subscriber) {
        const user = await fastify.db.users.findOne({
          key: "id",
          equals: userId,
        });

        if (user) {
          if (user.subscribedToUserIds.includes(subscriber.id)) {
            await fastify.db.users.change(user.id, {
              subscribedToUserIds: user.subscribedToUserIds.filter(
                (id) => id !== subscriber.id
              ),
            });

            return fastify.db.users.change(subscriber.id, {
              subscribedToUserIds: subscriber.subscribedToUserIds.filter(
                (id) => id !== user.id
              ),
            });
          } else {
            throw reply.badRequest("The user is not subscribed!");
          }
        } else {
          throw reply.notFound("User not found!");
        }
      } else {
        throw reply.notFound("Subscriber not found!");
      }
    }
  );

  fastify.patch<{ Params: IdParamSchema; Body: ChangeUserBodySchema}>(
    "/:id",
    {
      schema: {
        body: changeUserBodySchema,
        params: idParamSchema,
      },
    },
    async function (request, reply): Promise<UserEntity> {
      const { id } = request.params 
  
      const body = request.body 
      const user = await fastify.db.users.findOne({
        key: "id",
        equals: id,
      });

      if (user) {
        return fastify.db.users.change(id, body);
      } else {
        throw reply.badRequest("Wrong user id!");
      }
    }
  );
};

export default plugin;