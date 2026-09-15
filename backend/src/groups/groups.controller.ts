import { Controller, Post, Get, Patch, Delete, Body, Param, Req, UseGuards } from '@nestjs/common';
import { GroupsService } from './groups.service.js';
import { CreateGroupDto, AddMemberDto, UpdateMemberDto } from './dto/index.js';
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

  @Patch(':id/members/:userId')
  updateMember(
    @Req() req: any,
    @Param('id') groupId: string,
    @Param('userId') targetUserId: string,
    @Body() dto: UpdateMemberDto,
  ) {
    return this.groupsService.updateMember(req.user.sub, groupId, targetUserId, dto);
  }

  @Delete(':id/members/:userId')
  removeMember(
    @Req() req: any,
    @Param('id') groupId: string,
    @Param('userId') targetUserId: string,
  ) {
    return this.groupsService.removeMember(req.user.sub, groupId, targetUserId);
  }

  @Post(':id/join')
  joinGroup(@Req() req: any, @Param('id') groupId: string) {
    return this.groupsService.joinGroup(req.user.sub, groupId);
  }

  @Post(':id/leave')
  leaveGroup(@Req() req: any, @Param('id') groupId: string) {
    return this.groupsService.leaveGroup(req.user.sub, groupId);
  }

  @Delete(':id')
  deleteGroup(@Req() req: any, @Param('id') groupId: string) {
    return this.groupsService.deleteGroup(req.user.sub, groupId);
  }
}

