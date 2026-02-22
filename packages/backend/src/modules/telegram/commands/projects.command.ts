import { Command, Ctx, Update } from 'nestjs-telegraf';
import { UseGuards } from '@nestjs/common';
import { Context } from 'telegraf';
import { ProjectRepository } from '@/database';
import { AuthChatIdGuard } from '../guards/auth-chat-id.guard';
import { InlineKeyboardBuilder } from '../keyboards/inline-keyboard.builder';

@Update()
@UseGuards(AuthChatIdGuard)
export class ProjectsCommand {
  constructor(private readonly projectRepo: ProjectRepository) {}

  @Command('projects')
  async onProjects(@Ctx() ctx: Context) {
    const projects = await this.projectRepo.findAllActive();

    if (projects.length === 0) {
      await ctx.reply('No projects found. Run /sync first.');
      return;
    }

    const list = projects.map((p) => ({ key: p.jiraProjectKey, name: p.name }));
    await ctx.reply(
      `📁 *Projects* (${projects.length}):`,
      {
        parse_mode: 'MarkdownV2',
        ...InlineKeyboardBuilder.projectList(list),
      },
    );
  }
}
