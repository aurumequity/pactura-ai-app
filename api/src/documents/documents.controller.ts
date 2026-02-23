import { Controller, Get, Post, Param, Body } from '@nestjs/common';
import { DocumentsService } from './documents.service';
import { CurrentUser } from '../common/decorators/user.decorator';

@Controller('orgs/:orgId/documents')
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Post()
  create(@Param('orgId') orgId: string, @CurrentUser() user: any, @Body('name') name: string) {
    return this.documentsService.createDocument(orgId, user.uid, name);
  }

  @Get()
  list(@Param('orgId') orgId: string, @CurrentUser() user: any) {
    return this.documentsService.listDocuments(orgId, user.uid);
  }

  @Get(':docId')
  getOne(@Param('orgId') orgId: string, @Param('docId') docId: string, @CurrentUser() user: any) {
    return this.documentsService.getDocument(orgId, user.uid, docId);
  }
}