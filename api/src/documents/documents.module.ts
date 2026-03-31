import { Module } from '@nestjs/common';
import { DocumentsService } from './documents.service';
import { DocumentsController } from './documents.controller';
import { FirebaseModule } from '../common/firebase/firebase.module';
import { AuditModule } from '../common/audit/audit.module';
import { GapCheckService } from '../gap-check/gap-check.service';
import { RemediationsService } from '../modules/remediations/remediations.service';

@Module({
  imports: [FirebaseModule, AuditModule],
  controllers: [DocumentsController],
  providers: [DocumentsService, GapCheckService, RemediationsService],
})
export class DocumentsModule {}