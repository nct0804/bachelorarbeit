import { PrismaClient, SoundType } from '@prisma/client';
import { NotFoundError } from '../../utils/errors';

const prisma = new PrismaClient();

export const getAllSoundGroups = async () => {
  return prisma.soundGroup.findMany({
    orderBy: {
      order: 'asc'
    },
    include: {
      sounds: {
        include: {
          sound: true
        }
      }
    }
  });
};

export const getSoundGroupById = async (id: number) => {
  const soundGroup = await prisma.soundGroup.findUnique({
    where: { id },
    include: {
      sounds: {
        include: {
          sound: true
        }
      }
    }
  });

  if (!soundGroup) {
    throw new NotFoundError(`Sound group with ID ${id} not found`);
  }

  return soundGroup;
};

export const getAllSounds = async (type?: SoundType) => {
  const where = type ? { type } : {};
  
  return prisma.germanSound.findMany({
    where,
    include: {
      soundGroups: {
        include: {
          group: true
        }
      }
    }
  });
};

export const getSoundById = async (id: number) => {
  const sound = await prisma.germanSound.findUnique({
    where: { id },
    include: {
      soundGroups: {
        include: {
          group: true
        }
      }
    }
  });

  if (!sound) {
    throw new NotFoundError(`Sound with ID ${id} not found`);
  }

  return sound;
};

export const createSoundGroup = async (data: {
  name: string;
  order: number;
}) => {
  return prisma.soundGroup.create({
    data
  });
};

export const createSound = async (data: {
  symbol: string;
  exampleWord: string;
  type: SoundType;
  audioSrc: string;
  groupIds?: number[];
}) => {
  const { symbol, exampleWord, type, audioSrc, groupIds } = data;

  return prisma.$transaction(async (prisma) => {
    // Create the sound
    const sound = await prisma.germanSound.create({
      data: {
        symbol,
        exampleWord,
        type,
        audioSrc
      }
    });

    // If group IDs are provided, associate the sound with those groups
    if (groupIds && groupIds.length > 0) {
      await Promise.all(
        groupIds.map(groupId =>
          prisma.soundGroupSound.create({
            data: {
              soundId: sound.id,
              groupId
            }
          })
        )
      );
    }

    // Return the created sound with its groups
    return prisma.germanSound.findUnique({
      where: { id: sound.id },
      include: {
        soundGroups: {
          include: {
            group: true
          }
        }
      }
    });
  });
};

export const updateSound = async (
  id: number,
  data: {
    symbol?: string;
    exampleWord?: string;
    type?: SoundType;
    audioSrc?: string;
    groupIds?: number[];
  }
) => {
  const { symbol, exampleWord, type, audioSrc, groupIds } = data;
  
  // Check if the sound exists
  const existingSound = await prisma.germanSound.findUnique({
    where: { id }
  });

  if (!existingSound) {
    throw new NotFoundError(`Sound with ID ${id} not found`);
  }

  return prisma.$transaction(async (prisma) => {
    // Update the sound basic info
    const updatedSound = await prisma.germanSound.update({
      where: { id },
      data: {
        symbol,
        exampleWord,
        type,
        audioSrc
      }
    });

    // If group IDs are provided, update the group associations
    if (groupIds) {
      // Delete existing associations
      await prisma.soundGroupSound.deleteMany({
        where: { soundId: id }
      });

      // Create new associations
      await Promise.all(
        groupIds.map(groupId =>
          prisma.soundGroupSound.create({
            data: {
              soundId: id,
              groupId
            }
          })
        )
      );
    }

    // Return the updated sound with its groups
    return prisma.germanSound.findUnique({
      where: { id },
      include: {
        soundGroups: {
          include: {
            group: true
          }
        }
      }
    });
  });
};

export const deleteSound = async (id: number) => {
  // Check if the sound exists
  const existingSound = await prisma.germanSound.findUnique({
    where: { id }
  });

  if (!existingSound) {
    throw new NotFoundError(`Sound with ID ${id} not found`);
  }

  return prisma.germanSound.delete({
    where: { id }
  });
};

export const updateSoundGroup = async (
  id: number,
  data: {
    name?: string;
    order?: number;
  }
) => {
  // Check if the group exists
  const existingGroup = await prisma.soundGroup.findUnique({
    where: { id }
  });

  if (!existingGroup) {
    throw new NotFoundError(`Sound group with ID ${id} not found`);
  }

  return prisma.soundGroup.update({
    where: { id },
    data,
    include: {
      sounds: {
        include: {
          sound: true
        }
      }
    }
  });
};

export const deleteSoundGroup = async (id: number) => {
  // Check if the group exists
  const existingGroup = await prisma.soundGroup.findUnique({
    where: { id }
  });

  if (!existingGroup) {
    throw new NotFoundError(`Sound group with ID ${id} not found`);
  }

  return prisma.soundGroup.delete({
    where: { id }
  });
};


export const addSoundToGroup = async (soundId: number, groupId: number) => {
  // Check if both sound and group exist
  const sound = await prisma.germanSound.findUnique({
    where: { id: soundId }
  });

  const group = await prisma.soundGroup.findUnique({
    where: { id: groupId }
  });

  if (!sound) {
    throw new NotFoundError(`Sound with ID ${soundId} not found`);
  }

  if (!group) {
    throw new NotFoundError(`Sound group with ID ${groupId} not found`);
  }

  // Check if the association already exists
  const existingAssociation = await prisma.soundGroupSound.findFirst({
    where: {
      soundId,
      groupId
    }
  });

  if (existingAssociation) {
    return existingAssociation; // Already exists, just return it
  }

  // Create the association
  return prisma.soundGroupSound.create({
    data: {
      soundId,
      groupId
    }
  });
};


export const removeSoundFromGroup = async (soundId: number, groupId: number) => {
  // Check if the association exists
  const existingAssociation = await prisma.soundGroupSound.findFirst({
    where: {
      soundId,
      groupId
    }
  });

  if (!existingAssociation) {
    throw new NotFoundError(`Sound ${soundId} is not associated with group ${groupId}`);
  }

  return prisma.soundGroupSound.delete({
    where: { id: existingAssociation.id }
  });
};