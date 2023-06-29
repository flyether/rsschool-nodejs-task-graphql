import {
  GraphQLID,
  GraphQLList,
  GraphQLObjectType,
  GraphQLString,
  GraphQLNonNull,
  GraphQLFloat,
  GraphQLInputObjectType,
} from 'graphql';
import { UserEntity } from '../../utils/DB/entities/DBUsers';
import { ProfileEntity } from '../../utils/DB/entities/DBProfiles';
import { PostEntity } from '../../utils/DB/entities/DBPosts';
import { MemberTypeEntity } from '../../utils/DB/entities/DBMemberTypes';

export const PostType = new GraphQLObjectType({
  name: 'Post',
  fields: () => ({
    id: { type: GraphQLID },
    title: { type: new GraphQLNonNull(GraphQLString) },
    content: { type: new GraphQLNonNull(GraphQLString) },
    userId: { type: new GraphQLNonNull(GraphQLString) },
  }),
});

export const ProfileType = new GraphQLObjectType({
  name: 'Profile',
  fields: () => ({
    id: { type: GraphQLID },
    avatar: { type: GraphQLString },
    sex: { type: GraphQLString },
    birthday: { type: GraphQLFloat },
    country: { type: GraphQLString },
    street: { type: GraphQLString },
    city: { type: GraphQLString },
    memberTypeId: { type: new GraphQLNonNull(GraphQLString) },
    userId: { type: new GraphQLNonNull(GraphQLString) },
  }),
});

export const MemberType = new GraphQLObjectType({
  name: 'MemberType',
  fields: () => ({
    id: { type: GraphQLString },
    discount: { type: GraphQLFloat },
    monthPostsLimit: { type: GraphQLFloat },
  }),
});

export const UserType = new GraphQLObjectType({
  name: 'UserType',
  fields: () => ({
    id: { type: GraphQLID },
    firstName: { type: new GraphQLNonNull(GraphQLString) },
    lastName: { type: new GraphQLNonNull(GraphQLString) },
    email: { type: new GraphQLNonNull(GraphQLString) },
    profile: {
      type: ProfileType,
      async resolve(parent: UserEntity, _, context): Promise<ProfileEntity[]> {
        return await context.db.profiles.findOne({
          key: 'userId',
          equals: parent.id,
        });
      },
    },
    userSubscribedTo: {
      type: new GraphQLList(UserSubscribedToType),
      async resolve(parent: UserEntity, _, context) {
        return parent.subscribedToUserIds.map(async (user) => {
          if (user) {
            return await context.db.users.findOne({
              key: 'id',
              equals: user,
            });
          }
        });
      },
    },

    subscribedToUser: {
      type: new GraphQLList(SubscribedToType),
      async resolve(parent: UserEntity, _, context): Promise<UserEntity[]> {
        const users = await context.db.users.findMany();

        return users
          .map((user: UserEntity) => {
            if (user.subscribedToUserIds.includes(parent.id)) {
              return user;
            }

            return null;
          })
          .filter((item: UserEntity | null) => item);
      },
    },
    posts: {
      type: new GraphQLList(PostType),
      async resolve(
        parent: UserEntity,
        _,
        context
      ): Promise<PostEntity | null> {
        const posts = await context.db.posts.findMany({
          key: 'userId',
          equals: parent.id,
        });

        if (posts) {
          return posts;
        }

        return null;
      },
    },
    memberType: {
      type: MemberType,
      async resolve(
        parent: UserEntity,
        _,
        context
      ): Promise<MemberTypeEntity | null> {
        const profile = await context.db.profiles.findOne({
          key: 'userId',
          equals: parent.id,
        });
        if (profile) {
          const memberTypeId = profile.memberTypeId;
          const memberType = await context.db.memberTypes.findOne({
            key: 'id',
            equals: memberTypeId,
          });

          if (memberType) {
            return memberType;
          }
        }
        return {
          id: 'basic',
          monthPostsLimit: 0,
          discount: 0,
        };
      },
    },
  }),
});

export const UserSubscribedToType = new GraphQLObjectType({
  name: 'UserSubscribedToType',
  fields: () => ({
    id: { type: GraphQLID },
    firstName: { type: new GraphQLNonNull(GraphQLString) },
    lastName: { type: new GraphQLNonNull(GraphQLString) },
    email: { type: new GraphQLNonNull(GraphQLString) },
    profile: {
      type: ProfileType,
      async resolve(parent: UserEntity, _, context): Promise<ProfileEntity> {
        return await context.db.profiles.findOne({
          key: 'userId',
          equals: parent.id,
        });
      },
    },
    userSubscribedTo: {
      type: new GraphQLList(UserSubscribedToDeepType),
      async resolve(parent: UserEntity, _, context) {
        return parent.subscribedToUserIds.map(async (userId) => {
          return await context.db.users.findOne({
            key: 'id',
            equals: userId,
          });
        });
      },
    },
  }),
});

export const UserSubscribedToDeepType = new GraphQLObjectType({
  name: 'UserSubscribedToDeepType',
  fields: () => ({
    id: { type: GraphQLID },
    firstName: { type: new GraphQLNonNull(GraphQLString) },
    lastName: { type: new GraphQLNonNull(GraphQLString) },
    email: { type: new GraphQLNonNull(GraphQLString) },
    profile: {
      type: ProfileType,
      async resolve(parent: UserEntity, _, context): Promise<ProfileEntity> {
        return await context.db.profiles.findOne({
          key: 'userId',
          equals: parent.id,
        });
      },
    },
  }),
});

export const SubscribedToType = new GraphQLObjectType({
  name: 'SubscribedToType',
  fields: () => ({
    id: { type: GraphQLID },
    firstName: { type: new GraphQLNonNull(GraphQLString) },
    lastName: { type: new GraphQLNonNull(GraphQLString) },
    email: { type: new GraphQLNonNull(GraphQLString) },
    posts: {
      type: new GraphQLList(PostType),
      async resolve(parent: UserEntity, _, context) {
        return context.db.posts.findMany({
          key: 'userId',
          equals: parent.id,
        });
      },
    },
    subscribedToUser: {
      type: new GraphQLList(SubscribedToDeepType),
      async resolve(parent: UserEntity, _, context) {
        return parent.subscribedToUserIds.map(async (user) => {
          if (user) {
            return await context.db.users.findOne({
              key: 'id',
              equals: user,
            });
          }
        });
      },
    },
  }),
});

export const SubscribedToDeepType = new GraphQLObjectType({
  name: 'SubscribedToDeepType',
  fields: () => ({
    id: { type: GraphQLID },
    firstName: { type: new GraphQLNonNull(GraphQLString) },
    lastName: { type: new GraphQLNonNull(GraphQLString) },
    email: { type: new GraphQLNonNull(GraphQLString) },
    posts: {
      type: new GraphQLList(PostType),
      async resolve(parent: UserEntity, _, context) {
        return context.db.posts.findMany({
          key: 'userId',
          equals: parent.id,
        });
      },
    },
  }),
});

export const CreateUserInputType = new GraphQLInputObjectType({
  name: 'CreateUserInputType',
  fields: {
    firstName: { type: new GraphQLNonNull(GraphQLString) },
    lastName: { type: new GraphQLNonNull(GraphQLString) },
    email: { type: new GraphQLNonNull(GraphQLString) },
  },
});

export const UpdateUserInputType = new GraphQLInputObjectType({
  name: 'UpdateUserInputType',
  fields: {
    id: { type: new GraphQLNonNull(GraphQLID) },
    firstName: { type: GraphQLString },
    lastName: { type: GraphQLString },
    email: { type: GraphQLString },
  },
});

export const NewPostType = new GraphQLInputObjectType({
  name: 'NewPostType',
  fields: {
    title: { type: new GraphQLNonNull(GraphQLString) },
    content: { type: new GraphQLNonNull(GraphQLString) },
    userId: { type: new GraphQLNonNull(GraphQLString) },
  },
});

export const NewProfileType = new GraphQLInputObjectType({
  name: 'NewProfileType',
  fields: {
    avatar: { type: GraphQLString },
    sex: { type: GraphQLString },
    birthday: { type: GraphQLFloat },
    country: { type: GraphQLString },
    city: { type: GraphQLString },
    street: { type: GraphQLString },
    memberTypeId: { type: new GraphQLNonNull(GraphQLString) },
    userId: { type: new GraphQLNonNull(GraphQLString) },
  },
});
export const UpdateMemberType = new GraphQLInputObjectType({
  name: 'UpdateMemberType',
  fields: {
    id: { type: new GraphQLNonNull(GraphQLID) },
    discount: { type: GraphQLFloat },
    monthPostsLimit: { type: GraphQLFloat },
  },
});

export const UpdateProfileType = new GraphQLInputObjectType({
  name: 'UpdateProfileType',
  fields: {
    id: { type: new GraphQLNonNull(GraphQLID) },
    avatar: { type: GraphQLString },
    sex: { type: GraphQLString },
    birthday: { type: GraphQLFloat },
    country: { type: GraphQLString },
    city: { type: GraphQLString },
    street: { type: GraphQLString },
    memberTypeId: { type: GraphQLString },
    userId: { type: GraphQLString },
  },
});

export const UpdatePostType = new GraphQLInputObjectType({
  name: 'UpdatePostType',
  fields: {
    id: { type: new GraphQLNonNull(GraphQLID) },
    title: { type: GraphQLString },
    content: { type: GraphQLString },
    userId: { type: GraphQLString },
  },
});

export const SubscribeUserType = new GraphQLInputObjectType({
  name: 'SubscribeUserType',
  fields: {
    id: { type: new GraphQLNonNull(GraphQLID) },
    userId: { type: new GraphQLNonNull(GraphQLID) },
  },
});
