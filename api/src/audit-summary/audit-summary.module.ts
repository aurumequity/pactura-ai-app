import { Module } from '@nestjs/common';
import { AuditSummaryController } from './audit-summary.controller';
import { AuditSummaryService } from './audit-summary.service';
import { FirebaseModule } from '../common/firebase/firebase.module';

@Module({
  imports: [FirebaseModule],
  controllers: [AuditSummaryController],
  providers: [AuditSummaryService],
})
export class AuditSummaryModule {}
