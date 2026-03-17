import { Module } from '@nestjs/common';
import { AnomalyDetectController } from './anomaly-detect.controller';
import { AnomalyDetectService } from './anomaly-detect.service';
import { FirebaseModule } from '../common/firebase/firebase.module';

@Module({
  imports: [FirebaseModule],
  controllers: [AnomalyDetectController],
  providers: [AnomalyDetectService],
})
export class AnomalyDetectModule {}
