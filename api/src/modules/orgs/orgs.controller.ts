import { Controller, Get, Post, Body, Param, Req } from '@nestjs/common';
import { OrgsService } from './orgs.service';

@Controller('orgs')
export class OrgsController {
  constructor(private readonly orgsService: OrgsService) {}

  @Get()
  async getOrgs(@Req() req: any) {
    return this.orgsService.getOrgsForUser(req.raw.user.uid);
  }

  @Post(':orgId/support/chat')
  async supportChat(
    @Param('orgId') orgId: string,
    @Req() req: any,
    @Body()
    body: { messages: { role: 'user' | 'assistant'; content: string }[] },
  ) {
    return this.orgsService.supportChat(orgId, req.raw.user.uid, body.messages);
  }
}
