import {
  GraphQLID,
  GraphQLList,
  GraphQLObjectType,
  GraphQLSchema,
  GraphQLString,
} from 'graphql';
import { MemberTypeEntity } from '../../utils/DB/entities/DBMemberTypes';
import { PostEntity } from '../../utils/DB/entities/DBPosts';
import { ProfileEntity } from '../../utils/DB/entities/DBProfiles';
import { UserEntity } from '../../utils/DB/entities/DBUsers';
import {
  UserType,
  ProfileType,
  PostType,
  MemberType,
  NewPostType,
  UpdatePostType,
  NewProfileType,
  UpdateUserInputType,
  UpdateProfileType,
  UpdateMemberType,
  SubscribeUserType,
  CreateUserInputType,
} from './models';
import DataLoader = require('dataloader');



const query = new GraphQLObjectType({
  name: 'query',
  fields: {
    user: {
      type: UserType,
      args: { id: { type: GraphQLID } },
      async resolve(_, { id }, context): Promise<UserEntity> {
        return await context.db.users.findOne({
          key: 'id',
          equals: id,
        });
      },
    },
    profile: {
      type: ProfileType,
      args: { id: { type: GraphQLID } },
      async resolve(_, { id }, context): Promise<ProfileEntity> {
        return await context.db.profiles.findOne({
          key: 'id',
          equals: id,
        });
      },
    },
    post: {
      type: PostType,
      args: { id: { type: GraphQLID } },
      async resolve(_, { id }, context): Promise<PostEntity> {
        return await context.db.posts.findOne({
          key: 'id',
          equals: id,
        });
      },
    },
    memberTypes: {
      type: new GraphQLList(MemberType),
      async resolve(_, __, context): Promise<MemberTypeEntity[]> {
        return await context.db.memberTypes.findMany();
      },
    },
    users: {
      type: new GraphQLList(UserType),
      async resolve(_, __, context): Promise<UserEntity[]> {
        return await context.db.users.findMany();
      },
    },
    profiles: {
      type: new GraphQLList(ProfileType),
      async resolve(_, __, context): Promise<ProfileEntity[]> {
        return await context.db.profiles.findMany();
      },
    },

    posts: {
      type: new GraphQLList(PostType),
      async resolve(_, __, context): Promise<PostEntity[]> {
        return await context.db.posts.findMany();
      },
    },

    memberType: {
      type: MemberType,
      args: { id: { type: GraphQLString } },
      async resolve(_, { id }, context): Promise<MemberTypeEntity> {
        const memberType = await context.db.memberTypes.findOne({
          key: 'id',
          equals: id,
        });
        return await memberType;
      },
    },
  },
});

const mutation = new GraphQLObjectType({
  name: 'mutation',
  fields: {
    createUser: {
      type: UserType,
      args: { input: { type: CreateUserInputType } },
      async resolve(
        _,
        { input }: Record<'input', UserEntity>,
        context
      ): Promise<UserEntity> {
        return await context.db.users.create(input);
      },
    },
    createPost: {
      type: PostType,
      args: { input: { type: NewPostType } },
      async resolve(
        _,
        { input }: Record<'input', PostEntity>,
        context
      ): Promise<PostEntity> {
        return await context.db.posts.create(input);
      },
    },
    updatePost: {
      type: PostType,
      args: { input: { type: UpdatePostType } },
      async resolve(
        _,
        { input }: Record<'input', PostEntity>,
        context
      ): Promise<PostEntity> {
        const { id, ...rest } = input;

        return await context.db.posts.change(id, rest);
      },
    },
    createProfile: {
      type: ProfileType,
      args: { input: { type: NewProfileType } },
      async resolve(
        _,
        { input }: Record<'input', ProfileEntity>,
        context
      ): Promise<ProfileEntity> {
        return await context.db.profiles.create(input);
      },
    },
    updateUser: {
      type: UserType,
      args: { input: { type: UpdateUserInputType } },
      async resolve(
        _,
        { input }: Record<'input', UserEntity>,
        context
      ): Promise<UserEntity> {
        const { id, ...rest } = input;

        return await context.db.users.change(id, rest);
      },
    },
    updateProfile: {
      type: ProfileType,
      args: { input: { type: UpdateProfileType } },
      async resolve(
        _,
        { input }: Record<'input', ProfileEntity>,
        context
      ): Promise<ProfileEntity> {
        const { id, ...rest } = input;

        return context.db.profiles.change(id, rest);
      },
    },
    updateMemberType: {
      type: MemberType,
      args: { input: { type: UpdateMemberType } },
      async resolve(
        _,
        { input }: Record<'input', MemberTypeEntity>,
        context
      ): Promise<MemberTypeEntity> {
        const { id, ...rest } = input;

        return context.db.memberTypes.change(id, rest);
      },
    },
    subscribeUser: {
      type: UserType,
      args: { input: { type: SubscribeUserType } },
      async resolve(
        _,
        { input }: Record<'input', Pick<PostEntity, 'id' | 'userId'>>,
        context
      ): Promise<UserEntity> {
        const { id, userId } = input;

        const subscriber = await context.db.users.findOne({
          key: 'id',
          equals: id,
        });

        const user = await context.db.users.findOne({
          key: 'id',
          equals: userId,
        });

        if (subscriber.subscribedToUserIds.includes(subscriber.id)) {
          return subscriber;
        } else {
          await context.db.users.change(user.id, {
            subscribedToUserIds: [...user.subscribedToUserIds, subscriber.id],
          });

          return context.db.users.change(subscriber.id, {
            subscribedToUserIds: [...subscriber.subscribedToUserIds, user.id],
          });
        }
      },
    },
    unSubscribeUser: {
      type: UserType,
      args: { input: { type: SubscribeUserType } },
      async resolve(
        _,
        { input }: Record<'input', Pick<PostEntity, 'id' | 'userId'>>,
        context
      ): Promise<UserEntity> {
        const { id, userId } = input;

        const subscriber = await context.db.users.findOne({
          key: 'id',
          equals: id,
        });

        const user = await context.db.users.findOne({
          key: 'id',
          equals: userId,
        });

        if (user.subscribedToUserIds.includes(subscriber.id)) {
          await context.db.users.change(user.id, {
            subscribedToUserIds: user.subscribedToUserIds.filter(
              (id: string) => id !== subscriber.id
            ),
          });

          return context.db.users.change(subscriber.id, {
            subscribedToUserIds: subscriber.subscribedToUserIds.filter(
              (id: string) => id !== user.id
            ),
          });
        } else {
          return subscriber;
        }
      },
    },
  },
});

export const graphqlSchema = new GraphQLSchema({
  query,
  mutation,
});
