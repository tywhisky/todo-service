import { PrismaService } from 'nestjs-prisma';
import {
  Resolver,
  Query,
  Parent,
  Args,
  ResolveField,
  Mutation,
} from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { UserEntity } from 'src/common/decorators/user.decorator';
import { User } from 'src/users/models/user.model';
import { GqlAuthGuard } from 'src/auth/gql-auth.guard';
import { TaskIdArgs } from './args/task-id.args';
import { UserIdArgs } from './args/user-id.args';
import { Task } from './models/task.model';
import { CreateTaskInput } from './dto/createTask.input';
import { UpdateTaskInput } from './dto/updateTask.input';

@Resolver(() => Task)
export class TasksResolver {
  constructor(private prisma: PrismaService) {}

  @UseGuards(GqlAuthGuard)
  @Mutation(() => Task)
  async createTask(
    @UserEntity() user: User,
    @Args('data') data: CreateTaskInput
  ) {
    const newTask = this.prisma.task.create({
      data: {
        title: data.title,
        content: data.content,
        cycleDays: data.cycleDays,
        userId: user.id,
      },
    });
    return newTask;
  }

  @UseGuards(GqlAuthGuard)
  @Mutation(() => Task)
  async updateTask(
    @UserEntity() user: User,
    @Args('id') id: string,
    @Args('data') data: UpdateTaskInput
  ) {
    const task = await this.prisma.task.findUnique({ where: { id } });

    if (!task) {
      throw new Error(`Task with ID ${id} not found`);
    }

    if (task.userId !== user.id) {
      throw new Error(`Task with ID ${id} does not belong to user`);
    }

    const updatedTask = await this.prisma.task.update({
      where: { id },
      data: {
        title: data.title || task.title,
        content: data.content || task.content,
        cycleDays: data.cycleDays || task.cycleDays,
        lastCompletedAt: data.lastCompletedAt || task.lastCompletedAt,
      },
    });

    return updatedTask;
  }

  @UseGuards(GqlAuthGuard)
  @Mutation(() => Task)
  async deleteTask(@UserEntity() user: User, @Args('id') id: string) {
    const task = await this.prisma.task.findUnique({ where: { id } });

    if (!task) {
      throw new Error(`Task with ID ${id} not found`);
    }

    if (task.userId !== user.id) {
      throw new Error(`Task with ID ${id} does not belong to user`);
    }

    const deletedTask = await this.prisma.task.delete({ where: { id } });

    return deletedTask;
  }

  @Query(() => [Task])
  userTasks(@Args() id: UserIdArgs) {
    return this.prisma.user.findUnique({ where: { id: id.userId } });

    // or
    // return this.prisma.tasks.findMany({
    //   where: {
    //     published: true,
    //     user: { id: id.userId }
    //   }
    // });
  }

  @Query(() => Task)
  async task(@Args() id: TaskIdArgs) {
    return this.prisma.task.findUnique({ where: { id: id.taskId } });
  }

  @ResolveField('user', () => User)
  async user(@Parent() task: Task) {
    return this.prisma.task.findUnique({ where: { id: task.id } }).user();
  }
}
