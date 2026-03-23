import { Controller, Post, Param } from '@nestjs/common';
import { AuditSummaryService } from './audit-summary.service';
import { CurrentUser } from '../common/decorators/user.decorator';

@Controller('orgs/:orgId/documents/:docId/audit-summary')
export class AuditSummaryController {
  constructor(private readonly auditSummaryService: AuditSummaryService) {}

  @Post()
  generate(
    @Param('orgId') orgId: string,
    @Param('docId') docId: string,
    @CurrentUser() user: any,
  ) {
    return this.auditSummaryService.generateAuditSummary(orgId, docId, user.uid);
  }
}
