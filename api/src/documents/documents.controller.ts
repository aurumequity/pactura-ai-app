import { Controller, Get, Post, Delete, Param, Body } from '@nestjs/common';
import { DocumentsService } from './documents.service';
import { CurrentUser } from '../common/decorators/user.decorator';
import type { CreateDocumentDto, NewVersionDto } from './documents.types';

@Controller('orgs/:orgId/documents')
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Post()
  create(
    @Param('orgId') orgId: string,
    @CurrentUser() user: any,
    @Body() dto: CreateDocumentDto,
  ) {
    return this.documentsService.createDocument(orgId, user.uid, dto);
  }

  @Get()
  list(@Param('orgId') orgId: string, @CurrentUser() user: any) {
    return this.documentsService.listDocuments(orgId, user.uid);
  }

  @Get(':docId')
  getOne(
    @Param('orgId') orgId: string,
    @Param('docId') docId: string,
    @CurrentUser() user: any,
  ) {
    return this.documentsService.getDocument(orgId, user.uid, docId);
  }

  @Delete(':docId')
  delete(
    @Param('orgId') orgId: string,
    @Param('docId') docId: string,
    @CurrentUser() user: any,
  ) {
    return this.documentsService.deleteDocument(orgId, user.uid, docId);
  }

  @Post(':docId/new-version')
  createNewVersion(
    @Param('orgId') orgId: string,
    @Param('docId') docId: string,
    @CurrentUser() user: any,
    @Body() dto: NewVersionDto,
  ) {
    return this.documentsService.createNewVersion(
      orgId,
      user.uid,
      user.email,
      docId,
      dto,
    );
  }

  @Get(':docId/delta')
  getDelta(
    @Param('orgId') orgId: string,
    @Param('docId') docId: string,
    @CurrentUser() user: any,
  ) {
    return this.documentsService.getDocumentDelta(orgId, user.uid, docId);
  }

  @Post(':docId/analyze')
  analyze(
    @Param('orgId') orgId: string,
    @Param('docId') docId: string,
    @CurrentUser() user: any,
  ) {
    return this.documentsService.analyzeDocument(orgId, user.uid, docId);
  }
}
