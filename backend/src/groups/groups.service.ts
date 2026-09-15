import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateGroupDto, AddMemberDto, UpdateMemberDto } from './dto/index.js';

@Injectable()
export class GroupsService {
  constructor(private readonly prisma: PrismaService) {}

  async createGroup(userId: string, dto: CreateGroupDto) {
    // Cria o grupo e adiciona o dono como membro administrador de forma transacional
    const group = await this.prisma.group.create({
      data: {
        name: dto.name,
        ownerId: userId,
        members: {
          create: {
            userId: userId,
            isAdmin: true,
          }
        }
      },
      include: {
        members: true
      }
    });

    return group;
  }

  async getMyGroups(userId: string) {
    // Retorna os grupos onde o usuário é membro
    return this.prisma.group.findMany({
      where: {
        members: {
          some: {
            userId: userId
          }
        }
      },
      include: {
        _count: {
          select: { members: true, songs: true, events: true }
        }
      }
    });
  }

  private async verifyMembership(userId: string, groupId: string) {
    const member = await this.prisma.groupMember.findUnique({
      where: { userId_groupId: { userId, groupId } },
    });
    if (!member) {
      throw new ForbiddenException('Você não faz parte deste ministério.');
    }
    return member;
  }

  async getMembers(userId: string, groupId: string) {
    await this.verifyMembership(userId, groupId);

    return this.prisma.groupMember.findMany({
      where: { groupId },
      include: {
        user: { select: { id: true, name: true, email: true, phone: true } },
        role: { select: { id: true, name: true } }
      }
    });
  }

  async addMember(ownerId: string, groupId: string, dto: AddMemberDto) {
    // 1. Verifica se o grupo existe e se quem está adicionando é admin do grupo
    const membership = await this.prisma.groupMember.findUnique({
      where: {
        userId_groupId: {
          userId: ownerId,
          groupId: groupId
        }
      }
    });

    if (!membership || !membership.isAdmin) {
      throw new ForbiddenException('Somente administradores podem adicionar membros.');
    }

    // 2. Procura o usuário pelo email
    const userToAdd = await this.prisma.user.findUnique({
      where: { email: dto.email }
    });

    if (!userToAdd) {
      throw new NotFoundException('Usuário não encontrado com este e-mail. Peça para ele criar uma conta no Worship Flow primeiro.');
    }

    // 3. Verifica se já é membro
    const existingMember = await this.prisma.groupMember.findUnique({
      where: {
        userId_groupId: {
          userId: userToAdd.id,
          groupId: groupId
        }
      }
    });

    if (existingMember) {
      throw new BadRequestException('Este usuário já é membro do grupo.');
    }

    // 4. Adiciona ao grupo
    return this.prisma.groupMember.create({
      data: {
        userId: userToAdd.id,
        groupId: groupId,
        isAdmin: false
      },
      include: {
        user: {
          select: { id: true, name: true, email: true }
        }
      }
    });
  }

  async updateMember(requesterUserId: string, groupId: string, targetUserId: string, dto: UpdateMemberDto) {
    const requester = await this.prisma.groupMember.findUnique({
      where: { userId_groupId: { userId: requesterUserId, groupId } }
    });

    if (!requester || !requester.isAdmin) {
      throw new ForbiddenException('Apenas administradores podem gerenciar membros.');
    }

    const targetMember = await this.prisma.groupMember.findUnique({
      where: { userId_groupId: { userId: targetUserId, groupId } }
    });

    if (!targetMember) {
      throw new NotFoundException('Membro não encontrado neste ministério.');
    }

    const group = await this.prisma.group.findUnique({ where: { id: groupId } });
    const isTargetOwner = group?.ownerId === targetUserId;

    let roleId: string | null | undefined = undefined;
    if (dto.roleName !== undefined) {
      const trimmedRole = dto.roleName.trim();
      if (!trimmedRole) {
        roleId = null;
      } else {
        const role = await this.prisma.role.upsert({
          where: { groupId_name: { groupId, name: trimmedRole } },
          update: {},
          create: { groupId, name: trimmedRole }
        });
        roleId = role.id;
      }
    }

    let isAdmin = dto.isAdmin;
    if (isTargetOwner) {
      isAdmin = true; // Owner is always admin
    }

    return this.prisma.groupMember.update({
      where: { userId_groupId: { userId: targetUserId, groupId } },
      data: {
        ...(roleId !== undefined && { roleId }),
        ...(isAdmin !== undefined && { isAdmin })
      },
      include: {
        user: { select: { id: true, name: true, email: true, phone: true } },
        role: { select: { id: true, name: true } }
      }
    });
  }

  async removeMember(requesterUserId: string, groupId: string, targetUserId: string) {
    const requester = await this.prisma.groupMember.findUnique({
      where: { userId_groupId: { userId: requesterUserId, groupId } }
    });

    if (!requester || !requester.isAdmin) {
      throw new ForbiddenException('Apenas administradores podem remover membros.');
    }

    const group = await this.prisma.group.findUnique({ where: { id: groupId } });
    if (group?.ownerId === targetUserId) {
      throw new BadRequestException('O dono do ministério não pode ser removido.');
    }

    const targetMember = await this.prisma.groupMember.findUnique({
      where: { userId_groupId: { userId: targetUserId, groupId } }
    });

    if (!targetMember) {
      throw new NotFoundException('Membro não encontrado neste ministério.');
    }

    return this.prisma.groupMember.delete({
      where: { userId_groupId: { userId: targetUserId, groupId } }
    });
  }

  async joinGroup(userId: string, groupId: string) {
    const existing = await this.prisma.groupMember.findUnique({
      where: {
        userId_groupId: { userId, groupId }
      }
    });

    if (existing) {
      return existing;
    }

    return this.prisma.groupMember.create({
      data: {
        userId,
        groupId,
        isAdmin: false
      }
    });
  }

  async leaveGroup(userId: string, groupId: string) {
    await this.verifyMembership(userId, groupId);

    const group = await this.prisma.group.findUnique({
      where: { id: groupId }
    });

    if (group?.ownerId === userId) {
      const otherMembers = await this.prisma.groupMember.findMany({
        where: { groupId, NOT: { userId } },
        orderBy: [{ isAdmin: 'desc' }]
      });

      if (otherMembers.length === 0) {
        return this.prisma.group.delete({
          where: { id: groupId }
        });
      } else {
        const nextOwner = otherMembers[0];
        await this.prisma.group.update({
          where: { id: groupId },
          data: { ownerId: nextOwner.userId }
        });
        await this.prisma.groupMember.update({
          where: { userId_groupId: { userId: nextOwner.userId, groupId } },
          data: { isAdmin: true }
        });
      }
    }

    return this.prisma.groupMember.delete({
      where: {
        userId_groupId: { userId, groupId }
      }
    });
  }

  async deleteGroup(userId: string, groupId: string) {
    const group = await this.prisma.group.findUnique({
      where: { id: groupId }
    });

    if (!group) {
      throw new NotFoundException('Ministério não encontrado.');
    }

    if (group.ownerId !== userId) {
      throw new ForbiddenException('Apenas o dono do ministério pode excluí-lo.');
    }

    return this.prisma.group.delete({
      where: { id: groupId }
    });
  }
}

