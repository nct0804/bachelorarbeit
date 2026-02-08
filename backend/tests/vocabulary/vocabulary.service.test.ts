import * as vocabularyService from '../../src/modules/vocabulary/vocabulary.service';
import { PrismaClient, SoundType } from '@prisma/client';
import { NotFoundError } from '../../src/utils/errors';

jest.mock('@prisma/client', () => {
    const mockPrismaClient: any = {};
    mockPrismaClient.soundGroup= {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn()
    };
    mockPrismaClient.germanSound= {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn()
    };
    mockPrismaClient.soundGroupSound= {
      findFirst: jest.fn(),
      create: jest.fn(),
      deleteMany: jest.fn(),
    delete: jest.fn()
    };
    mockPrismaClient.$transaction = jest.fn((callback: any) => callback(mockPrismaClient));
  
  return {
    PrismaClient: jest.fn(() => mockPrismaClient),
    SoundType: {
      VOWEL: 'VOWEL',
      CONSONANT: 'CONSONANT',
      DIPHTHONG: 'DIPHTHONG',
      UMLAUT: 'UMLAUT'
    }
  };
});

describe('Vocabulary Service', () => {
  const mockPrisma = new PrismaClient();
  
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  describe('getAllSoundGroups', () => {
    it('should return all sound groups with their sounds', async () => {
      // Arrange
      const mockSoundGroups = [
        {
          id: 1,
          name: 'Vowels',
          order: 1,
          createdAt: new Date(),
          sounds: [
            {
              id: 1,
              soundId: 1,
              groupId: 1,
              sound: {
                id: 1,
                symbol: 'a',
                exampleWord: 'Mann',
                audioSrc: '/assets/sounds/a-Mann.mp3',
                type: 'VOWEL',
                createdAt: new Date()
              }
            }
          ]
        }
      ];
      
      (mockPrisma.soundGroup.findMany as jest.Mock).mockResolvedValue(mockSoundGroups);
      
      // Act
      const result = await vocabularyService.getAllSoundGroups();
      
      // Assert
      expect(mockPrisma.soundGroup.findMany).toHaveBeenCalledWith({
        orderBy: { order: 'asc' },
        include: {
          sounds: {
            include: {
              sound: true
            }
          }
        }
      });
      
      expect(result).toEqual(mockSoundGroups);
    });
  });
  
  describe('getSoundGroupById', () => {
    it('should return a sound group by ID with its sounds', async () => {
      // Arrange
      const groupId = 1;
      const mockSoundGroup = {
        id: groupId,
        name: 'Vowels',
        order: 1,
        createdAt: new Date(),
        sounds: [
          {
            id: 1,
            soundId: 1,
            groupId: 1,
            sound: {
              id: 1,
              symbol: 'a',
              exampleWord: 'Mann',
              audioSrc: '/assets/sounds/a-Mann.mp3',
              type: 'VOWEL',
              createdAt: new Date()
            }
          }
        ]
      };
      
      (mockPrisma.soundGroup.findUnique as jest.Mock).mockResolvedValue(mockSoundGroup);
      
      // Act
      const result = await vocabularyService.getSoundGroupById(groupId);
      
      // Assert
      expect(mockPrisma.soundGroup.findUnique).toHaveBeenCalledWith({
        where: { id: groupId },
        include: {
          sounds: {
            include: {
              sound: true
            }
          }
        }
      });
      
      expect(result).toEqual(mockSoundGroup);
    });
    
    it('should throw NotFoundError if sound group does not exist', async () => {
      // Arrange
      const groupId = 999;
      (mockPrisma.soundGroup.findUnique as jest.Mock).mockResolvedValue(null);
      
      // Act & Assert
      await expect(vocabularyService.getSoundGroupById(groupId))
        .rejects
        .toThrow(NotFoundError);
    });
  });
  
  describe('getAllSounds', () => {
    it('should return all sounds without filtering when no type provided', async () => {
      // Arrange
      const mockSounds = [
        {
          id: 1,
          symbol: 'a',
          exampleWord: 'Mann',
          audioSrc: '/assets/sounds/a-Mann.mp3',
          type: 'VOWEL',
          createdAt: new Date(),
          soundGroups: []
        },
        {
          id: 2,
          symbol: 'ä',
          exampleWord: 'Mädchen',
          audioSrc: '/assets/sounds/ä-Mädchen.mp3',
          type: 'UMLAUT',
          createdAt: new Date(),
          soundGroups: []
        }
      ];
      
      (mockPrisma.germanSound.findMany as jest.Mock).mockResolvedValue(mockSounds);
      
      // Act
      const result = await vocabularyService.getAllSounds();
      
      // Assert
      expect(mockPrisma.germanSound.findMany).toHaveBeenCalledWith({
        where: {},
        include: {
          soundGroups: {
            include: {
              group: true
            }
          }
        }
      });
      
      expect(result).toEqual(mockSounds);
    });
    
    it('should filter sounds by type when provided', async () => {
      // Arrange
      const soundType = SoundType.VOWEL;
      const mockSounds = [
        {
          id: 1,
          symbol: 'a',
          exampleWord: 'Mann',
          audioSrc: '/assets/sounds/a-Mann.mp3',
          type: 'VOWEL',
          createdAt: new Date(),
          soundGroups: []
        }
      ];
      
      (mockPrisma.germanSound.findMany as jest.Mock).mockResolvedValue(mockSounds);
      
      // Act
      const result = await vocabularyService.getAllSounds(soundType);
      
      // Assert
      expect(mockPrisma.germanSound.findMany).toHaveBeenCalledWith({
        where: { type: soundType },
        include: {
          soundGroups: {
            include: {
              group: true
            }
          }
        }
      });
      
      expect(result).toEqual(mockSounds);
    });
  });
  
  describe('getSoundById', () => {
    it('should return a sound by ID with its groups', async () => {
      // Arrange
      const soundId = 1;
      const mockSound = {
        id: soundId,
        symbol: 'a',
        exampleWord: 'Mann',
        audioSrc: '/assets/sounds/a-Mann.mp3',
        type: 'VOWEL',
        createdAt: new Date(),
        soundGroups: []
      };
      
      (mockPrisma.germanSound.findUnique as jest.Mock).mockResolvedValue(mockSound);
      
      // Act
      const result = await vocabularyService.getSoundById(soundId);
      
      // Assert
      expect(mockPrisma.germanSound.findUnique).toHaveBeenCalledWith({
        where: { id: soundId },
        include: {
          soundGroups: {
            include: {
              group: true
            }
          }
        }
      });
      
      expect(result).toEqual(mockSound);
    });
    
    it('should throw NotFoundError if sound does not exist', async () => {
      // Arrange
      const soundId = 999;
      (mockPrisma.germanSound.findUnique as jest.Mock).mockResolvedValue(null);
      
      // Act & Assert
      await expect(vocabularyService.getSoundById(soundId))
        .rejects
        .toThrow(NotFoundError);
    });
  });
  
  describe('createSoundGroup', () => {
    it('should create a new sound group', async () => {
      // Arrange
      const groupData = {
        name: 'Diphthongs',
        order: 3
      };
      
      const mockCreatedGroup = {
        id: 3,
        ...groupData,
        createdAt: new Date()
      };
      
      (mockPrisma.soundGroup.create as jest.Mock).mockResolvedValue(mockCreatedGroup);
      
      // Act
      const result = await vocabularyService.createSoundGroup(groupData);
      
      // Assert
      expect(mockPrisma.soundGroup.create).toHaveBeenCalledWith({
        data: groupData
      });
      
      expect(result).toEqual(mockCreatedGroup);
    });
  });
  
  describe('createSound', () => {
    it('should create a sound and associate it with groups', async () => {
      // Arrange
      const soundData = {
        symbol: 'ei',
        exampleWord: 'mein',
        type: SoundType.DIPHTHONG,
        audioSrc: '/assets/sounds/ei-mein.mp3',
        groupIds: [3] // Associate with Diphthongs group
      };
      
      const mockCreatedSound = {
        id: 10,
        symbol: soundData.symbol,
        exampleWord: soundData.exampleWord,
        type: soundData.type,
        audioSrc: soundData.audioSrc,
        createdAt: new Date()
      };
      
      // Mock the chain of function calls within the transaction
      (mockPrisma.germanSound.create as jest.Mock).mockResolvedValue(mockCreatedSound);
      (mockPrisma.soundGroupSound.create as jest.Mock).mockResolvedValue({
        id: 1,
        soundId: 10,
        groupId: 3
      });
      (mockPrisma.germanSound.findUnique as jest.Mock).mockResolvedValue({
        ...mockCreatedSound,
        soundGroups: [
          {
            id: 1,
            soundId: 10,
            groupId: 3,
            group: {
              id: 3,
              name: 'Diphthongs',
              order: 3
            }
          }
        ]
      });
      
      // Act
      const result = await vocabularyService.createSound(soundData);
      
      // Assert
      expect(mockPrisma.germanSound.create).toHaveBeenCalledWith({
        data: {
          symbol: soundData.symbol,
          exampleWord: soundData.exampleWord,
          type: soundData.type,
          audioSrc: soundData.audioSrc
        }
      });
      
      expect(mockPrisma.soundGroupSound.create).toHaveBeenCalledWith({
        data: {
          soundId: mockCreatedSound.id,
          groupId: soundData.groupIds[0]
        }
      });
      
      expect(result).toHaveProperty('soundGroups');
    });
  });
  
  // You can continue with the rest of the tests following this pattern
  // Tests for updateSound, deleteSound, updateSoundGroup, deleteSoundGroup, etc.
});