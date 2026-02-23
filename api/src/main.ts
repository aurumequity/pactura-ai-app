import 'dotenv/config'

import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify'

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter()
  )

  const port = Number(process.env.PORT ?? 8081)
  await app.listen(port, '0.0.0.0')
}
bootstrap()