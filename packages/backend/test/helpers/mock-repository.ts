export function createMockRepository() {
  return {
    find: jest.fn(),
    findOne: jest.fn(),
    save: jest.fn(),
    create: jest.fn().mockImplementation((dto) => dto),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
    // Custom repository methods (mocked generically)
    findAllActive: jest.fn(),
    findBySlug: jest.fn(),
    findByKey: jest.fn(),
    findByKeySimple: jest.fn(),
    findByInstanceId: jest.fn(),
    findByProjectId: jest.fn(),
    findActive: jest.fn(),
    findSyncEnabled: jest.fn(),
    findWithFilters: jest.fn(),
    findByTicketId: jest.fn(),
    findLatestByTicketId: jest.fn(),
    findUnread: jest.fn(),
    findRecent: jest.fn(),
    markAsRead: jest.fn(),
    markAllAsRead: jest.fn(),
    createLog: jest.fn(),
    markRunning: jest.fn(),
    markCompleted: jest.fn(),
    markFailed: jest.fn(),
    findByInstanceId2: jest.fn(),
    manager: {
      createQueryBuilder: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        innerJoin: jest.fn().mockReturnThis(),
        leftJoin: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        addGroupBy: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        getRawOne: jest.fn(),
        getRawMany: jest.fn(),
      }),
      getRepository: jest.fn().mockReturnValue({
        find: jest.fn(),
        findOne: jest.fn(),
      }),
    },
  };
}

export function createMockConfigService(overrides: Record<string, any> = {}) {
  return {
    get: jest.fn().mockImplementation((key: string) => overrides[key]),
  };
}

export function createMockQueueService() {
  return {
    addSyncAllJob: jest.fn(),
    addSyncProjectsJob: jest.fn(),
    addSyncSprintsJob: jest.fn(),
    addSyncVersionsJob: jest.fn(),
    addSyncTicketsJob: jest.fn(),
    addAnalyzeTicketJob: jest.fn(),
    addApplyCodeJob: jest.fn(),
    addFullApproveFlowJob: jest.fn(),
    addTelegramNotification: jest.fn(),
  };
}
