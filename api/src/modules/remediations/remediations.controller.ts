import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  Req,
} from '@nestjs/common';
import { RemediationsService } from './remediations.service';
import {
  CreateRemediationDto,
  UpdateRemediationDto,
  BulkCreateRemediationsDto,
  ListRemediationsQuery,
} from './remediations.types';

@Controller('orgs/:orgId')
export class RemediationsController {
  constructor(private readonly remediations: RemediationsService) {}

  // POST /orgs/:orgId/remediations
  @Post('remediations')
  create(
    @Param('orgId') orgId: string,
    @Body() dto: CreateRemediationDto,
    @Req() req: any,
  ) {
    return this.remediations.create(
      orgId,
      dto,
      req.raw?.user?.uid,
      req.raw?.user?.email ?? '',
    );
  }

  // GET /orgs/:orgId/remediations?status=&framework=&documentId=
  @Get('remediations')
  list(
    @Param('orgId') orgId: string,
    @Query() query: ListRemediationsQuery,
  ) {
    return this.remediations.list(orgId, query);
  }

  // PATCH /orgs/:orgId/remediations/:remediationId
  @Patch('remediations/:remediationId')
  update(
    @Param('orgId') orgId: string,
    @Param('remediationId') remediationId: string,
    @Body() dto: UpdateRemediationDto,
    @Req() req: any,
  ) {
    return this.remediations.update(
      orgId,
      remediationId,
      dto,
      req.raw?.user?.uid,
      req.raw?.user?.email ?? '',
    );
  }

  // POST /orgs/:orgId/documents/:docId/remediations/bulk-create
  @Post('documents/:docId/remediations/bulk-create')
  bulkCreate(
    @Param('orgId') orgId: string,
    @Param('docId') docId: string,
    @Body() dto: BulkCreateRemediationsDto,
    @Req() req: any,
  ) {
    return this.remediations.bulkCreate(
      orgId,
      docId,
      dto,
      req.raw?.user?.uid,
      req.raw?.user?.email ?? '',
    );
  }
}