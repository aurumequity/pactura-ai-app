import { Module } from '@nestjs/common';
import { GapCheckController } from './gap-check.controller';
import { GapCheckService } from './gap-check.service';
import { FirebaseModule } from '../common/firebase/firebase.module';

@Module({
  imports: [FirebaseModule],
  controllers: [GapCheckController],
  providers: [GapCheckService],
})
export class GapCheckModule {}
