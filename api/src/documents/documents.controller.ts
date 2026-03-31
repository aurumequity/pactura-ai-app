import { Controller, Get, Post, Delete, Param, Body, Res, StreamableFile } from '@nestjs/common';
import type { FastifyReply } from 'fastify';
import { DocumentsService } from './documents.service';
import { CurrentUser } from '../common/decorators/user.decorator';
import type { CreateDocumentDto, NewVersionDto, ChatDto } from './documents.types';
import { renderEvidencePackagePdf } from './evidence-package.service';

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

  @Post(':docId/chat')
  chat(
    @Param('orgId') orgId: string,
    @Param('docId') docId: string,
    @CurrentUser() user: any,
    @Body() dto: ChatDto,
  ) {
    return this.documentsService.chatDocument(orgId, user.uid, docId, dto);
  }

  @Get(':docId/evidence-package')
  async downloadEvidencePackage(
    @Param('orgId') orgId: string,
    @Param('docId') docId: string,
    @CurrentUser() user: { uid: string; email: string },
    @Res({ passthrough: true }) res: FastifyReply,
  ): Promise<StreamableFile> {
    const pkg = await this.documentsService.generateEvidencePackage(
      orgId,
      user.uid,
      user.email,
      docId,
    );
    const pdfBuffer = await renderEvidencePackagePdf(pkg);
    res.headers({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="evidence-package-${docId}.pdf"`,
      'Content-Length': pdfBuffer.length,
    });
    return new StreamableFile(pdfBuffer);
  }


  @Get(':docId/audit-logs')
  getAuditLogs(
    @Param('orgId') orgId: string,
    @Param('docId') docId: string,
    @CurrentUser() user: any,
  ) {
    return this.documentsService.getDocumentAuditLogs(orgId, user.uid, docId);
  }
}
