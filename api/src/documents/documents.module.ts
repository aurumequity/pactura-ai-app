import { Module } from '@nestjs/common';
import { DocumentsService } from './documents.service';
import { DocumentsController } from './documents.controller';
import { FirebaseModule } from '../common/firebase/firebase.module';

@Module({
  imports: [FirebaseModule],
  controllers: [DocumentsController],
  providers: [DocumentsService],
})
export class DocumentsModule {}