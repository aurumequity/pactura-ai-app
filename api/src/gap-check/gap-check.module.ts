import { Module } from '@nestjs/common';
import { GapCheckController } from './gap-check.controller';
import { GapCheckService } from './gap-check.service';
import { FirebaseModule } from '../common/firebase/firebase.module';
import { AuditModule } from '../common/audit/audit.module';

@Module({
  imports: [FirebaseModule, AuditModule],
  controllers: [GapCheckController],
  providers: [GapCheckService],
})
export class GapCheckModule {}
