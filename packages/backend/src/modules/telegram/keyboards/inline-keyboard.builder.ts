import { Markup } from 'telegraf';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type KB = any;

export class InlineKeyboardBuilder {
  static ticketActions(ticketKey: string): KB {
    return Markup.inlineKeyboard([
      [
        Markup.button.callback('🔍 Analyze', `action:analyze:${ticketKey}`),
        Markup.button.callback('✅ Approve', `action:approve:${ticketKey}`),
        Markup.button.callback('❌ Reject', `action:reject:${ticketKey}`),
      ],
      [
        Markup.button.callback('✏️ Edit Approach', `action:edit:${ticketKey}`),
        Markup.button.callback('🔄 Refresh', `ticket:detail:${ticketKey}`),
      ],
      [
        Markup.button.url('🔗 Open Jira', `https://jira.atlassian.net/browse/${ticketKey}`),
      ],
    ]);
  }

  static afterAnalysis(ticketKey: string): KB {
    return Markup.inlineKeyboard([
      [
        Markup.button.callback('✅ Approve Solution', `action:approve:${ticketKey}`),
        Markup.button.callback('❌ Reject', `action:reject:${ticketKey}`),
      ],
      [
        Markup.button.callback('✏️ Edit Approach', `action:edit:${ticketKey}`),
        Markup.button.callback('🔍 Re-analyze', `action:analyze:${ticketKey}`),
      ],
    ]);
  }

  static afterApprove(ticketKey: string, prUrl?: string): KB {
    const buttons: any[][] = [];
    if (prUrl) {
      buttons.push([Markup.button.url('🔗 View PR', prUrl)]);
    }
    buttons.push([
      Markup.button.callback('🔄 Refresh', `ticket:detail:${ticketKey}`),
    ]);
    return Markup.inlineKeyboard(buttons);
  }

  static afterReject(ticketKey: string): KB {
    return Markup.inlineKeyboard([
      [
        Markup.button.callback('↩️ Unreject', `action:unreject:${ticketKey}`),
        Markup.button.callback('🔄 Refresh', `ticket:detail:${ticketKey}`),
      ],
    ]);
  }

  static pagination(prefix: string, currentPage: number, totalPages: number): KB {
    const buttons: any[] = [];
    if (currentPage > 1) {
      buttons.push(Markup.button.callback('⬅️ Prev', `${prefix}:page:${currentPage - 1}`));
    }
    buttons.push(Markup.button.callback(`${currentPage}/${totalPages}`, 'noop'));
    if (currentPage < totalPages) {
      buttons.push(Markup.button.callback('➡️ Next', `${prefix}:page:${currentPage + 1}`));
    }
    return Markup.inlineKeyboard([buttons]);
  }

  static projectList(projects: Array<{ key: string; name: string }>): KB {
    const rows = projects.map((p) =>
      [Markup.button.callback(`📁 ${p.key} - ${p.name}`, `project:detail:${p.key}`)],
    );
    return Markup.inlineKeyboard(rows);
  }

  static sprintList(sprints: Array<{ id: string; name: string; state: string }>): KB {
    const rows = sprints.map((s) => {
      const icon = s.state === 'active' ? '🟢' : s.state === 'closed' ? '🔴' : '⚪';
      return [Markup.button.callback(`${icon} ${s.name}`, `sprint:detail:${s.id}`)];
    });
    return Markup.inlineKeyboard(rows);
  }
}
