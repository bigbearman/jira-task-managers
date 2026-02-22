import { Command, Ctx, Update } from 'nestjs-telegraf';
import { UseGuards } from '@nestjs/common';
import { Context } from 'telegraf';
import { VersionRepository } from '@/database';
import { AuthChatIdGuard } from '../guards/auth-chat-id.guard';
import { escapeMarkdownV2 } from '@/shared/utils/telegram-formatter';

@Update()
@UseGuards(AuthChatIdGuard)
export class VersionsCommand {
  constructor(private readonly versionRepo: VersionRepository) {}

  @Command('versions')
  async onVersions(@Ctx() ctx: Context) {
    const message = ctx.message;
    if (!message || !('text' in message)) return;

    const args = message.text.split(' ').slice(1);
    const projectKey = args[0]?.toUpperCase();

    let versions;
    if (projectKey) {
      const project = await this.versionRepo.manager
        .createQueryBuilder()
        .select('jira_project_id')
        .from('jira_projects', 'p')
        .where('p.jira_project_key = :key', { key: projectKey })
        .getRawOne();
      versions = project
        ? await this.versionRepo.findByProjectId(project.jira_project_id)
        : [];
    } else {
      versions = await this.versionRepo.findUnreleased();
    }

    if (versions.length === 0) {
      await ctx.reply(
        projectKey
          ? `No versions found for project ${projectKey}.`
          : 'No unreleased versions found.',
      );
      return;
    }

    const lines = [
      projectKey
        ? `📦 *Versions for ${escapeMarkdownV2(projectKey)}:*`
        : `📦 *Unreleased Versions:*`,
      '',
    ];

    for (const v of versions) {
      const icon = v.isReleased ? '✅' : v.isArchived ? '📁' : '🔵';
      const name = escapeMarkdownV2(v.name);
      const released = v.releaseDate
        ? ` \\(${escapeMarkdownV2(new Date(v.releaseDate).toLocaleDateString('vi-VN'))}\\)`
        : '';
      lines.push(`${icon} ${name}${released}`);
    }

    await ctx.replyWithMarkdownV2(lines.join('\n'));
  }
}
