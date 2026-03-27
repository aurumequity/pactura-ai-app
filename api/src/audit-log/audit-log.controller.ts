import { Controller, Get, Param, Query } from '@nestjs/common';
import { AuditLogService } from './audit-log.service';
import { CurrentUser } from '../common/decorators/user.decorator';

@Controller('orgs/:orgId/audit-log')
export class AuditLogController {
  constructor(private readonly auditLogService: AuditLogService) {}

  @Get()
  list(
    @Param('orgId') orgId: string,
    @CurrentUser() user: any,
    @Query('limit') limit?: string,
  ) {
    return this.auditLogService.listAuditLog(
      orgId,
      user.uid,
      limit ? parseInt(limit, 10) : 100,
    );
  }
}
