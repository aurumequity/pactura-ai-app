import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import { AuditLogsService } from './audit-logs.service';
import { RolesGuard, RequireAction } from '../common/guards/roles.guard';
import { Actions } from '../common/rbac/actions';
import type { AuditLogPage } from './audit-logs.types';

@Controller('orgs/:orgId/audit-logs')
@UseGuards(RolesGuard)
export class AuditLogsController {
  constructor(private readonly auditLogsService: AuditLogsService) {}

  @Get()
  @RequireAction(Actions.AUDIT_LOG_READ)
  list(
    @Param('orgId') orgId: string,
    @Query('limit', new DefaultValuePipe(50), ParseIntPipe) limit: number,
    @Query('startAfter') startAfter?: string,
  ): Promise<AuditLogPage> {
    return this.auditLogsService.listForOrg(orgId, limit, startAfter);
  }
}
