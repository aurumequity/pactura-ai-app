import { Controller, Post, Param, Body } from '@nestjs/common';
import { GapCheckService } from './gap-check.service';
import { CurrentUser } from '../common/decorators/user.decorator';
import type { GapCheckDto } from './gap-check.types';

@Controller('orgs/:orgId/documents/:docId/gap-check')
export class GapCheckController {
  constructor(private readonly gapCheckService: GapCheckService) {}

  @Post()
  run(
    @Param('orgId') orgId: string,
    @Param('docId') docId: string,
    @CurrentUser() user: any,
    @Body() dto: GapCheckDto,
  ) {
    return this.gapCheckService.runGapCheck(orgId, docId, user.uid, dto);
  }
}
