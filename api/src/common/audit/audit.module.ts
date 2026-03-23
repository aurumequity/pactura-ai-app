import { Module } from '@nestjs/common';
import { FirebaseModule } from '../firebase/firebase.module';
import { AuditService } from './audit.service';

@Module({
  imports: [FirebaseModule],
  providers: [AuditService],
  exports: [AuditService],
})
export class AuditModule {}
