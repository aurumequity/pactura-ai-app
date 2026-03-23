import { Module } from '@nestjs/common';
import { DocumentsService } from './documents.service';
import { DocumentsController } from './documents.controller';
import { FirebaseModule } from '../common/firebase/firebase.module';
import { AuditModule } from '../common/audit/audit.module';
import { GapCheckService } from '../gap-check/gap-check.service';

@Module({
  imports: [FirebaseModule, AuditModule],
  controllers: [DocumentsController],
  providers: [DocumentsService, GapCheckService],
})
export class DocumentsModule {}