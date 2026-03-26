import { Module } from '@nestjs/common';
import { AuditLogsController } from './audit-logs.controller';
import { AuditLogsService } from './audit-logs.service';
import { RolesGuard } from '../common/guards/roles.guard';
import { FirebaseModule } from '../common/firebase/firebase.module';

@Module({
  imports: [FirebaseModule],
  controllers: [AuditLogsController],
  providers: [AuditLogsService, RolesGuard],
})
export class AuditLogsModule {}
