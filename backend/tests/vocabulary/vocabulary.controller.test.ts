import { Request, Response } from 'express';
import * as vocabularyService from '../../src/modules/vocabulary/vocabulary.service';
import * as vocabularyController from '../../src/modules/vocabulary/vocabulary.controller';
import { BadRequestError, NotFoundError } from '../../src/utils/errors';
import { SoundType } from '@prisma/client';

jest.mock('../../src/modules/vocabulary/vocabulary.service');

describe('Vocabulary Controller', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  
  beforeEach(() => {
    mockRequest = {
      params: {},
      query: {},
      body: {}
    };
    
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    
    jest.clearAllMocks();
  });
  
  describe('getAllSoundGroups', () => {
    it('should return all sound groups', async () => {
      // Arrange
      const mockSoundGroups = [
        { 
          id: 1, 
          name: 'Vowels', 
          order: 1,
          sounds: [{ id: 1, soundId: 1, groupId: 1, sound: { symbol: 'a' } }]
        },
        {
          id: 2,
          name: 'Umlauts',
          order: 2,
          sounds: [{ id: 2, soundId: 2, groupId: 2, sound: { symbol: 'ä' } }]
        }
      ];
      
      (vocabularyService.getAllSoundGroups as jest.Mock).mockResolvedValue(mockSoundGroups);
      
      // Act
      await vocabularyController.getAllSoundGroups(mockRequest as Request, mockResponse as Response);
      
      // Assert
      expect(vocabularyService.getAllSoundGroups).toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: mockSoundGroups
      });
    });
  });
  
  describe('getSoundGroupById', () => {
    it('should return a specific sound group by ID', async () => {
      // Arrange
      const groupId = '1';
      mockRequest.params = { id: groupId };
      
      const mockSoundGroup = { 
        id: 1, 
        name: 'Vowels', 
        order: 1,
        sounds: [{ id: 1, soundId: 1, groupId: 1, sound: { symbol: 'a' } }]
      };
      
      (vocabularyService.getSoundGroupById as jest.Mock).mockResolvedValue(mockSoundGroup);
      
      // Act
      await vocabularyController.getSoundGroupById(mockRequest as Request, mockResponse as Response);
      
      // Assert
      expect(vocabularyService.getSoundGroupById).toHaveBeenCalledWith(1);
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: mockSoundGroup
      });
    });
    
    it('should handle invalid sound group ID', async () => {
      // Arrange
      mockRequest.params = { id: 'invalid' };
      
      // Act & Assert
      await expect(
        vocabularyController.getSoundGroupById(mockRequest as Request, mockResponse as Response)
      ).rejects.toThrow(BadRequestError);
    });
    
    it('should handle sound group not found', async () => {
      // Arrange
      mockRequest.params = { id: '999' };
      
      (vocabularyService.getSoundGroupById as jest.Mock).mockImplementation(() => {
        throw new NotFoundError('Sound group not found');
      });
      
      // Act & Assert
      await expect(
        vocabularyController.getSoundGroupById(mockRequest as Request, mockResponse as Response)
      ).rejects.toThrow(NotFoundError);
    });
  });
  
  describe('getAllSounds', () => {
    it('should return all sounds without filtering', async () => {
      // Arrange
      const mockSounds = [
        { 
          id: 1, 
          symbol: 'a', 
          exampleWord: 'Mann',
          type: 'VOWEL',
          soundGroups: []
        },
        {
          id: 2,
          symbol: 'ä',
          exampleWord: 'Mädchen',
          type: 'UMLAUT',
          soundGroups: []
        }
      ];
      
      (vocabularyService.getAllSounds as jest.Mock).mockResolvedValue(mockSounds);
      
      // Act
      await vocabularyController.getAllSounds(mockRequest as Request, mockResponse as Response);
      
      // Assert
      expect(vocabularyService.getAllSounds).toHaveBeenCalledWith(undefined);
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: mockSounds
      });
    });
    
    it('should filter sounds by type when query parameter is provided', async () => {
      // Arrange
      mockRequest.query = { type: 'VOWEL' };
      
      const mockSounds = [
        { 
          id: 1, 
          symbol: 'a', 
          exampleWord: 'Mann',
          type: 'VOWEL',
          soundGroups: []
        }
      ];
      
      (vocabularyService.getAllSounds as jest.Mock).mockResolvedValue(mockSounds);
      
      // Act
      await vocabularyController.getAllSounds(mockRequest as Request, mockResponse as Response);
      
      // Assert
      expect(vocabularyService.getAllSounds).toHaveBeenCalledWith('VOWEL');
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: mockSounds
      });
    });
  });
  
  // You can continue with the rest of the controller tests following this pattern
  // Tests for getSoundById, createSoundGroup, createSound, etc.
});