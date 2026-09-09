import { Controller, Post, Get, Body, Param, Req, UseGuards } from '@nestjs/common';
import { GroupsService } from './groups.service.js';
import { CreateGroupDto, AddMemberDto } from './dto/index.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';

@UseGuards(JwtAuthGuard)
@Controller('groups')
export class GroupsController {
  constructor(private readonly groupsService: GroupsService) {}

  @Post()
  createGroup(@Req() req: any, @Body() dto: CreateGroupDto) {
    return this.groupsService.createGroup(req.user.sub, dto);
  }

  @Get()
  getMyGroups(@Req() req: any) {
    return this.groupsService.getMyGroups(req.user.sub);
  }

  @Get(':id/members')
  getMembers(@Req() req: any, @Param('id') groupId: string) {
    return this.groupsService.getMembers(req.user.sub, groupId);
  }

  @Post(':id/members')
  addMember(@Req() req: any, @Param('id') groupId: string, @Body() dto: AddMemberDto) {
    return this.groupsService.addMember(req.user.sub, groupId, dto);
  }

  @Post(':id/join')
  joinGroup(@Req() req: any, @Param('id') groupId: string) {
    return this.groupsService.joinGroup(req.user.sub, groupId);
  }
}
